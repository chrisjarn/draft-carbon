import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { entities } from "@carbon-wfp/db/schema/entities";
import type { STATE_VALUES } from "@carbon-wfp/db/schema/enums";
import { hiringNeeds } from "@carbon-wfp/db/schema/hiring-needs";
import {
	wfpEntitySettings,
	wfpRevenue,
	wfpStaffMeta,
} from "@carbon-wfp/db/schema/wfp";
import { attritionRisks } from "@carbon-wfp/db/schema/wfp-extended";
import { TRPCError } from "@trpc/server";
import { and, asc, avg, count, eq, inArray, ne, sql, sum } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import {
	type BillingTargetInput,
	calcEntityBillingCapacity,
	calcRevenueGap,
} from "../lib/calculations";
import {
	ADMIN_WRITE_ROLES,
	assertEntityScope,
	assertResourceScope,
	assertWriter,
	carboniteRoleWhere,
	entityRoleWhere,
	getRoleFilter,
} from "../lib/rbac";

/** Zod refinement: string must represent a finite number */
const numericString = z
	.string()
	.refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number.isFinite(Number(v))), {
		message: "Must be a valid numeric value",
	});

export const wfpRouter = router({
	// ── Firm-wide KPIs ──────────────────────────────────────────────────────────

	firmKPIs: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const cbWhere = carboniteRoleWhere(rf);
		// Scope attrition risk count to visible carbonites
		const visibleStaffIds = cbWhere
			? db
					.select({ id: carbonites.id })
					.from(carbonites)
					.where(and(eq(carbonites.isActive, true), cbWhere))
			: null;

		const [[row], [riskRow]] = await Promise.all([
			db
				.select({
					headcount: count(),
					totalPayroll: sum(carbonites.salary),
					avgSalary: avg(carbonites.salary),
				})
				.from(carbonites)
				.where(and(eq(carbonites.isActive, true), cbWhere)),
			visibleStaffIds
				? db
						.select({ value: count() })
						.from(attritionRisks)
						.where(inArray(attritionRisks.carboniteId, visibleStaffIds))
				: db.select({ value: count() }).from(attritionRisks),
		]);
		return {
			headcount: row?.headcount ?? 0,
			totalPayroll: Number(row?.totalPayroll ?? 0),
			avgSalary: Math.round(Number(row?.avgSalary ?? 0)),
			atRiskCount: riskRow?.value ?? 0,
		};
	}),

	// ── Entity overview ─────────────────────────────────────────────────────────

	entityOverview: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const entWhere = entityRoleWhere(rf);
		const cbWhere = carboniteRoleWhere(rf);

		const ents = await db
			.select()
			.from(entities)
			.where(entWhere)
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
			.where(and(eq(carbonites.isActive, true), cbWhere))
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
		.query(async ({ ctx, input }) => {
			const rf = getRoleFilter(ctx.session.user);
			const entWhere = entityRoleWhere(rf);

			// Entity info — also apply role filter
			const [entity] = await db
				.select()
				.from(entities)
				.where(and(eq(entities.id, input.entityId), entWhere));
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

			// All active carbonites in this entity (role-scoped)
			const cbWhere = carboniteRoleWhere(rf);
			const staff = await db
				.select()
				.from(carbonites)
				.where(
					and(
						eq(carbonites.entity, input.entityId),
						eq(carbonites.isActive, true),
						cbWhere,
					),
				)
				.orderBy(asc(carbonites.pod), asc(carbonites.name));

			// Staff meta — only fetch rows for staff in this entity
			const staffIds = staff.map((s) => s.id);
			let metaMap = new Map<
				string,
				{
					cbId: string;
					billingTarget: string | null;
					billingActual: string | null;
					perfRating: string | null;
					promoFlag: string | null;
					promoEta: string | null;
					staffRole: string | null;
					roleTag: string | null;
				}
			>();
			if (staffIds.length > 0) {
				const meta = await db
					.select()
					.from(wfpStaffMeta)
					.where(inArray(wfpStaffMeta.cbId, staffIds));
				metaMap = new Map(meta.map((m) => [m.cbId, m]));
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
						eq(
							hiringNeeds.state,
							(entity.state ?? "") as (typeof STATE_VALUES)[number],
						),
						ne(hiringNeeds.status, "closed"),
					),
				);

			const totalPayroll = staff.reduce((acc, s) => acc + (s.salary ?? 0), 0);

			// Compute billing capacity and revenue gap
			const entityMultiplier = settings?.billingMultiplier ?? null;
			const billingStaff: BillingTargetInput[] = staff.map((s) => {
				const meta = metaMap.get(s.id);
				return {
					salary: s.salary ?? 0,
					hoursPerWeek: s.hours,
					type: s.type,
					stateId: s.state,
					entityId: s.entity,
					roleTag: meta?.roleTag ?? null,
					manualBillingTarget: meta?.billingTarget ?? null,
				};
			});
			const billingCapacity = calcEntityBillingCapacity(
				billingStaff,
				entityMultiplier,
			);
			const revenueTarget = Number(revenue?.target) || 0;
			const revenueActual = Number(revenue?.actual) || 0;
			const revenueGap = calcRevenueGap(
				revenueTarget,
				revenueActual,
				billingCapacity,
			);

			return {
				entity,
				settings: settings ?? null,
				revenue,
				totalPayroll,
				billingCapacity,
				revenueGap,
				pods,
				staff: staff.map((s) => ({
					...s,
					meta: metaMap.get(s.id) ?? null,
				})),
				openHiringCount: hiringRow?.openCount ?? 0,
			};
		}),
	// ── Staff meta ──────────────────────────────────────────────────────────────

	getStaffWithMeta: protectedProcedure
		.input(z.object({ entityId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const rf = getRoleFilter(ctx.session.user);
			const cbWhere = carboniteRoleWhere(rf);
			const filters = [eq(carbonites.isActive, true)];
			if (input?.entityId) {
				filters.push(eq(carbonites.entity, input.entityId));
			}
			const staff = await db
				.select()
				.from(carbonites)
				.where(and(...filters, cbWhere))
				.orderBy(
					asc(carbonites.state),
					asc(carbonites.office),
					asc(carbonites.name),
				);
			const staffIds = staff.map((s) => s.id);
			const meta =
				staffIds.length > 0
					? await db
							.select()
							.from(wfpStaffMeta)
							.where(inArray(wfpStaffMeta.cbId, staffIds))
					: [];
			const metaMap = new Map(meta.map((m) => [m.cbId, m]));
			return staff.map((s) => ({ ...s, meta: metaMap.get(s.id) ?? null }));
		}),

	upsertStaffMeta: protectedProcedure
		.input(
			z.object({
				cbId: z.string(),
				billingTarget: numericString.optional(),
				billingActual: numericString.optional(),
				perfRating: z.string().optional(),
				promoFlag: z.enum(["yes", "maybe", "no"]).optional(),
				promoEta: z.string().optional(),
				staffRole: z.string().optional(),
				roleTag: z.enum(["doer", "reviewer", "bd"]).nullish(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			// Verify carbonite exists and is in scope
			const [cb] = await db
				.select({
					id: carbonites.id,
					state: carbonites.state,
					sl: carbonites.sl,
				})
				.from(carbonites)
				.where(eq(carbonites.id, input.cbId));
			if (!cb)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Carbonite not found: ${input.cbId}`,
				});
			assertResourceScope(ctx.session.user, {
				state: cb.state,
				sl: cb.sl,
			});
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

	getEntitySettings: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const entWhere = entityRoleWhere(rf);
		const ents = await db
			.select()
			.from(entities)
			.where(entWhere)
			.orderBy(asc(entities.state), asc(entities.biz));
		const entIds = ents.map((e) => e.id);
		const settings =
			entIds.length > 0
				? await db
						.select()
						.from(wfpEntitySettings)
						.where(inArray(wfpEntitySettings.entId, entIds))
				: [];
		const settingsMap = new Map(settings.map((s) => [s.entId, s]));
		return ents.map((e) => ({ ...e, settings: settingsMap.get(e.id) ?? null }));
	}),

	upsertEntitySettings: protectedProcedure
		.input(
			z.object({
				entId: z.string(),
				billingMultiplier: numericString.optional(),
				fy: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user, ADMIN_WRITE_ROLES);
			// Verify entity exists and is in scope
			const [ent] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, input.entId));
			if (!ent)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Entity not found: ${input.entId}`,
				});
			assertEntityScope(ctx.session.user, {
				state: ent.state,
				sl: ent.sl,
			});
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
		.query(async ({ ctx, input }) => {
			const rf = getRoleFilter(ctx.session.user);
			const entWhere = entityRoleWhere(rf);
			const ents = await db
				.select()
				.from(entities)
				.where(entWhere)
				.orderBy(asc(entities.state), asc(entities.biz));
			const entIds = ents.map((e) => e.id);
			const revenue =
				entIds.length > 0
					? await db
							.select()
							.from(wfpRevenue)
							.where(
								and(
									eq(wfpRevenue.fy, input.fy),
									inArray(wfpRevenue.entId, entIds),
								),
							)
					: [];
			const revenueMap = new Map(revenue.map((r) => [r.entId, r]));
			return ents.map((e) => ({ ...e, revenue: revenueMap.get(e.id) ?? null }));
		}),

	upsertRevenue: protectedProcedure
		.input(
			z.object({
				entId: z.string(),
				fy: z.string(),
				target: numericString.optional(),
				actual: numericString.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user, ADMIN_WRITE_ROLES);
			// Verify entity exists and is in scope
			const [ent] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, input.entId));
			if (!ent)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Entity not found: ${input.entId}`,
				});
			assertEntityScope(ctx.session.user, {
				state: ent.state,
				sl: ent.sl,
			});
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
