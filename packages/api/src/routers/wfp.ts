import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { entities } from "@carbon-wfp/db/schema/entities";
import { hiringNeeds } from "@carbon-wfp/db/schema/hiring-needs";
import {
	wfpEntitySettings,
	wfpRevenue,
	wfpStaffMeta,
} from "@carbon-wfp/db/schema/wfp";
import { attritionRisks } from "@carbon-wfp/db/schema/wfp-extended";
import { and, asc, avg, count, eq, ne, sql, sum } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { assertWriter } from "../lib/rbac";

export const wfpRouter = router({
	// ── Firm-wide KPIs ──────────────────────────────────────────────────────────

	firmKPIs: protectedProcedure.query(async () => {
		const [[row], [riskRow]] = await Promise.all([
			db
				.select({
					headcount: count(),
					totalPayroll: sum(carbonites.salary),
					avgSalary: avg(carbonites.salary),
				})
				.from(carbonites),
			db.select({ value: count() }).from(attritionRisks),
		]);
		return {
			headcount: row?.headcount ?? 0,
			totalPayroll: Number(row?.totalPayroll ?? 0),
			avgSalary: Math.round(Number(row?.avgSalary ?? 0)),
			atRiskCount: riskRow?.value ?? 0,
		};
	}),

	// ── Entity overview ─────────────────────────────────────────────────────────

	entityOverview: protectedProcedure.query(async () => {
		const ents = await db
			.select()
			.from(entities)
			.orderBy(asc(entities.state), asc(entities.biz));

		const staffByEntity = await db
			.select({
				entity: carbonites.entity,
				staffCount: count(),
				totalPayroll: sum(carbonites.salary),
				podCount: sql<number>`count(distinct ${carbonites.pod})`.as(
					"pod_count",
				),
			})
			.from(carbonites)
			.groupBy(carbonites.entity);

		const staffMap = new Map(staffByEntity.map((s) => [s.entity, s]));

		return ents.map((e) => {
			const stats = staffMap.get(e.id);
			return {
				id: e.id,
				biz: e.biz,
				state: e.state,
				officeId: e.officeId,
				staffCount: stats?.staffCount ?? 0,
				totalPayroll: Number(stats?.totalPayroll ?? 0),
				podCount: Number(stats?.podCount ?? 0),
			};
		});
	}),

	// ── Entity detail ───────────────────────────────────────────────────────────

	entityDetail: protectedProcedure
		.input(z.object({ entityId: z.string() }))
		.query(async ({ input }) => {
			// Entity info
			const [entity] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, input.entityId));
			if (!entity) return null;

			// Entity settings
			const [settings] = await db
				.select()
				.from(wfpEntitySettings)
				.where(eq(wfpEntitySettings.entId, input.entityId));

			// Revenue data (use settings FY if available, else latest)
			const revenueRows = await db
				.select()
				.from(wfpRevenue)
				.where(eq(wfpRevenue.entId, input.entityId));
			const fy = settings?.fy ?? "FY25-26";
			const revenue = revenueRows.find((r) => r.fy === fy) ?? null;

			// All carbonites in this entity
			const staff = await db
				.select()
				.from(carbonites)
				.where(eq(carbonites.entity, input.entityId))
				.orderBy(asc(carbonites.pod), asc(carbonites.name));

			// Staff meta
			const staffIds = staff.map((s) => s.id);
			let metaMap = new Map<
				string,
				{
					cbId: string;
					billingTarget: string | null;
					billingActual: string | null;
					perfRating: string | null;
					promoFlag: boolean | null;
					promoEta: string | null;
					staffRole: string | null;
				}
			>();
			if (staffIds.length > 0) {
				const meta = await db.select().from(wfpStaffMeta);
				const idSet = new Set(staffIds);
				metaMap = new Map(
					meta.filter((m) => idSet.has(m.cbId)).map((m) => [m.cbId, m]),
				);
			}

			// Pods grouping
			const podMap = new Map<
				string,
				{ name: string; headcount: number; totalSalary: number }
			>();
			for (const s of staff) {
				const podName = s.pod ?? "Unassigned";
				const existing = podMap.get(podName);
				if (existing) {
					existing.headcount += 1;
					existing.totalSalary += s.salary ?? 0;
				} else {
					podMap.set(podName, {
						name: podName,
						headcount: 1,
						totalSalary: s.salary ?? 0,
					});
				}
			}
			const pods = [...podMap.values()].sort((a, b) =>
				a.name.localeCompare(b.name),
			);

			// Open hiring count (match entity state)
			const [hiringRow] = await db
				.select({ openCount: count() })
				.from(hiringNeeds)
				.where(
					and(
						eq(hiringNeeds.state, entity.state ?? ""),
						ne(hiringNeeds.status, "closed"),
					),
				);

			const totalPayroll = staff.reduce((acc, s) => acc + (s.salary ?? 0), 0);

			return {
				entity,
				settings: settings ?? null,
				revenue,
				totalPayroll,
				pods,
				staff: staff.map((s) => ({
					...s,
					meta: metaMap.get(s.id) ?? null,
				})),
				openHiringCount: hiringRow?.openCount ?? 0,
			};
		}),
	// ── Staff meta ──────────────────────────────────────────────────────────────

	getStaffWithMeta: protectedProcedure.query(async () => {
		const staff = await db
			.select()
			.from(carbonites)
			.orderBy(
				asc(carbonites.state),
				asc(carbonites.office),
				asc(carbonites.name),
			);
		const meta = await db.select().from(wfpStaffMeta);
		const metaMap = new Map(meta.map((m) => [m.cbId, m]));
		return staff.map((s) => ({ ...s, meta: metaMap.get(s.id) ?? null }));
	}),

	upsertStaffMeta: protectedProcedure
		.input(
			z.object({
				cbId: z.string(),
				billingTarget: z.string().optional(),
				billingActual: z.string().optional(),
				perfRating: z.string().optional(),
				promoFlag: z.boolean().optional(),
				promoEta: z.string().optional(),
				staffRole: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			const existing = await db
				.select()
				.from(wfpStaffMeta)
				.where(eq(wfpStaffMeta.cbId, input.cbId));
			if (existing.length > 0) {
				const [row] = await db
					.update(wfpStaffMeta)
					.set({ ...input, updatedAt: new Date() })
					.where(eq(wfpStaffMeta.cbId, input.cbId))
					.returning();
				return row;
			}
			const [row] = await db.insert(wfpStaffMeta).values(input).returning();
			return row;
		}),

	// ── Entity settings ─────────────────────────────────────────────────────────

	getEntitySettings: protectedProcedure.query(async () => {
		const ents = await db
			.select()
			.from(entities)
			.orderBy(asc(entities.state), asc(entities.biz));
		const settings = await db.select().from(wfpEntitySettings);
		const settingsMap = new Map(settings.map((s) => [s.entId, s]));
		return ents.map((e) => ({ ...e, settings: settingsMap.get(e.id) ?? null }));
	}),

	upsertEntitySettings: protectedProcedure
		.input(
			z.object({
				entId: z.string(),
				billingMultiplier: z.string().optional(),
				fy: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			const existing = await db
				.select()
				.from(wfpEntitySettings)
				.where(eq(wfpEntitySettings.entId, input.entId));
			if (existing.length > 0) {
				const [row] = await db
					.update(wfpEntitySettings)
					.set({ ...input, updatedAt: new Date() })
					.where(eq(wfpEntitySettings.entId, input.entId))
					.returning();
				return row;
			}
			const [row] = await db
				.insert(wfpEntitySettings)
				.values(input)
				.returning();
			return row;
		}),

	// ── Revenue ─────────────────────────────────────────────────────────────────

	getRevenue: protectedProcedure
		.input(z.object({ fy: z.string() }))
		.query(async ({ input }) => {
			const ents = await db
				.select()
				.from(entities)
				.orderBy(asc(entities.state), asc(entities.biz));
			const revenue = await db
				.select()
				.from(wfpRevenue)
				.where(eq(wfpRevenue.fy, input.fy));
			const revenueMap = new Map(revenue.map((r) => [r.entId, r]));
			return ents.map((e) => ({ ...e, revenue: revenueMap.get(e.id) ?? null }));
		}),

	upsertRevenue: protectedProcedure
		.input(
			z.object({
				entId: z.string(),
				fy: z.string(),
				target: z.string().optional(),
				actual: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			const existing = await db
				.select()
				.from(wfpRevenue)
				.where(
					and(eq(wfpRevenue.entId, input.entId), eq(wfpRevenue.fy, input.fy)),
				);
			if (existing.length > 0) {
				const [row] = await db
					.update(wfpRevenue)
					.set({ ...input, updatedAt: new Date() })
					.where(
						and(eq(wfpRevenue.entId, input.entId), eq(wfpRevenue.fy, input.fy)),
					)
					.returning();
				return row;
			}
			const [row] = await db.insert(wfpRevenue).values(input).returning();
			return row;
		}),
});
