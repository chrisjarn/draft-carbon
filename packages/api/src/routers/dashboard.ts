import {
	carbonites,
	db,
	entities,
	hiringNeeds,
	wfpRevenue,
} from "@carbon-wfp/db";
import { and, count, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
	carboniteRoleWhere,
	entityRoleWhere,
	getRoleFilter,
} from "../lib/rbac";

export const dashboardRouter = router({
	/**
	 * Headline stats — returns per-carbonite rows so the frontend can
	 * aggregate and filter by state client-side without a re-fetch.
	 */
	stats: protectedProcedure
		.input(
			z
				.object({
					fy: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const rf = getRoleFilter(ctx.session.user);
			const fyFilter = input?.fy ?? "FY25-26";

			// RBAC-scoped carbonite conditions (no state filter — that's client-side)
			const cbConditions = [eq(carbonites.isActive, true)];
			const rbacCb = carboniteRoleWhere(rf);
			if (rbacCb) cbConditions.push(rbacCb);
			const cbWhere = and(...cbConditions);

			// Per-state headcount + FTE
			const staffByState = await db
				.select({
					state: carbonites.state,
					headcount: count(),
					fte: sql<number>`coalesce(sum(
						CASE
							WHEN ${carbonites.type} = 'PT' AND ${carbonites.hours} IS NOT NULL
							THEN ${carbonites.hours}::numeric / 37.5
							ELSE 1.0
						END
					), 0)`,
				})
				.from(carbonites)
				.where(cbWhere)
				.groupBy(carbonites.state);

			// RBAC-scoped entity IDs (for revenue lookup)
			const entConditions: ReturnType<typeof eq>[] = [];
			const rbacEnt = entityRoleWhere(rf);
			if (rbacEnt) entConditions.push(rbacEnt);
			const entWhere =
				entConditions.length > 0 ? and(...entConditions) : undefined;

			const entRows = await db
				.select({ id: entities.id, state: entities.state })
				.from(entities)
				.where(entWhere);
			const entIds = entRows.map((e) => e.id);

			// Revenue per entity for the selected FY
			let revenueByEntity: {
				entId: string;
				target: number;
				actual: number;
			}[] = [];
			if (entIds.length > 0) {
				const revRows = await db
					.select({
						entId: wfpRevenue.entId,
						target: wfpRevenue.target,
						actual: wfpRevenue.actual,
					})
					.from(wfpRevenue)
					.where(
						and(eq(wfpRevenue.fy, fyFilter), inArray(wfpRevenue.entId, entIds)),
					);
				revenueByEntity = revRows.map((r) => ({
					entId: r.entId,
					target: Number(r.target ?? 0),
					actual: Number(r.actual ?? 0),
				}));
			}

			// Build entity → state lookup
			const entStateMap = new Map(entRows.map((e) => [e.id, e.state]));

			return {
				staffByState: staffByState.map((r) => ({
					state: r.state,
					headcount: r.headcount,
					fte: Number(Number(r.fte).toFixed(1)),
				})),
				revenueByEntity: revenueByEntity.map((r) => ({
					...r,
					state: entStateMap.get(r.entId) ?? null,
				})),
			};
		}),

	entitySummaries: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);

		// RBAC-scoped — no state param, client filters
		const entConditions: ReturnType<typeof eq>[] = [];
		const rbacEnt = entityRoleWhere(rf);
		if (rbacEnt) entConditions.push(rbacEnt);
		const entWhere =
			entConditions.length > 0 ? and(...entConditions) : undefined;

		const cbConditions = [eq(carbonites.isActive, true)];
		const rbacCb = carboniteRoleWhere(rf);
		if (rbacCb) cbConditions.push(rbacCb);
		const cbWhere = and(...cbConditions);

		const allEntities = await db
			.select({
				id: entities.id,
				biz: entities.biz,
				state: entities.state,
				officeId: entities.officeId,
				sl: entities.sl,
				legalName: entities.legalName,
				phone: entities.phone,
				address: entities.address,
				email: entities.email,
			})
			.from(entities)
			.where(entWhere);

		const staffAgg = await db
			.select({
				entity: carbonites.entity,
				headcount: count(),
				totalSalary: sql<number>`coalesce(sum(${carbonites.salary}), 0)`.as(
					"total_salary",
				),
			})
			.from(carbonites)
			.where(cbWhere)
			.groupBy(carbonites.entity);

		const slPerEntity = await db
			.select({
				entity: carbonites.entity,
				sl: carbonites.sl,
			})
			.from(carbonites)
			.where(and(sql`${carbonites.sl} is not null`, ...cbConditions))
			.groupBy(carbonites.entity, carbonites.sl);

		const staffMap = new Map(
			staffAgg.map((row) => [
				row.entity,
				{
					headcount: row.headcount,
					totalSalary: Number(row.totalSalary),
				},
			]),
		);

		const slMap = new Map<string, string[]>();
		for (const row of slPerEntity) {
			if (!row.entity || !row.sl) continue;
			const existing = slMap.get(row.entity) ?? [];
			existing.push(row.sl);
			slMap.set(row.entity, existing);
		}

		// Staff names + pods for initials list and pod count
		const staffDetails = await db
			.select({
				entity: carbonites.entity,
				name: carbonites.name,
				pod: carbonites.pod,
			})
			.from(carbonites)
			.where(cbWhere);

		const initialsMap = new Map<string, string[]>();
		const podSets = new Map<string, Set<string>>();
		for (const row of staffDetails) {
			if (!row.entity) continue;
			const parts = row.name.trim().split(/\s+/).filter(Boolean);
			if (parts.length === 0) continue;
			const first = parts[0] ?? "";
			const last = parts[parts.length - 1] ?? "";
			const initials =
				parts.length >= 2
					? `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
					: first.charAt(0).toUpperCase();
			const arr = initialsMap.get(row.entity) ?? [];
			arr.push(initials);
			initialsMap.set(row.entity, arr);
			if (row.pod) {
				const set = podSets.get(row.entity) ?? new Set();
				set.add(row.pod);
				podSets.set(row.entity, set);
			}
		}

		return allEntities.map((ent) => ({
			id: ent.id,
			biz: ent.biz,
			state: ent.state,
			officeId: ent.officeId,
			legalName: ent.legalName,
			phone: ent.phone,
			address: ent.address,
			email: ent.email,
			headcount: staffMap.get(ent.id)?.headcount ?? 0,
			totalSalary: staffMap.get(ent.id)?.totalSalary ?? 0,
			sls: slMap.get(ent.id) ?? (ent.sl as string[]) ?? [],
			staffInitials: initialsMap.get(ent.id) ?? [],
			podCount: podSets.get(ent.id)?.size ?? 0,
		}));
	}),

	revenueByEntity: protectedProcedure
		.input(
			z
				.object({
					fy: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const rf = getRoleFilter(ctx.session.user);
			const fyFilter = input?.fy ?? "FY25-26";

			// RBAC-scoped entities — no state param
			const entConditions: ReturnType<typeof eq>[] = [];
			const rbacEnt = entityRoleWhere(rf);
			if (rbacEnt) entConditions.push(rbacEnt);
			const entWhere =
				entConditions.length > 0 ? and(...entConditions) : undefined;

			const filteredEntities = await db
				.select({
					id: entities.id,
					biz: entities.biz,
					state: entities.state,
				})
				.from(entities)
				.where(entWhere);

			const entIds = filteredEntities.map((e) => e.id);
			if (entIds.length === 0) return [];

			const revenueRows = await db
				.select({
					entId: wfpRevenue.entId,
					target: wfpRevenue.target,
					actual: wfpRevenue.actual,
				})
				.from(wfpRevenue)
				.where(
					and(eq(wfpRevenue.fy, fyFilter), inArray(wfpRevenue.entId, entIds)),
				);

			const revMap = new Map(
				revenueRows.map((r) => [
					r.entId,
					{
						target: Number(r.target ?? 0),
						actual: Number(r.actual ?? 0),
					},
				]),
			);

			return filteredEntities
				.map((ent) => {
					const rev = revMap.get(ent.id) ?? { target: 0, actual: 0 };
					const pct =
						rev.target > 0 ? Math.round((rev.actual / rev.target) * 100) : 0;
					return {
						id: ent.id,
						biz: ent.biz,
						state: ent.state,
						target: rev.target,
						actual: rev.actual,
						pct,
					};
				})
				.filter((e) => e.target > 0 || e.actual > 0)
				.sort((a, b) => b.target - a.target);
		}),

	slBreakdown: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);

		// RBAC-scoped — no state param
		const cbConditions = [eq(carbonites.isActive, true)];
		const rbacCb = carboniteRoleWhere(rf);
		if (rbacCb) cbConditions.push(rbacCb);
		const cbWhere = and(...cbConditions);

		const rows = await db
			.select({
				sl: carbonites.sl,
				state: carbonites.state,
				headcount: count(),
				totalSalary: sql<number>`coalesce(sum(${carbonites.salary}), 0)`.as(
					"total_salary",
				),
			})
			.from(carbonites)
			.where(cbWhere)
			.groupBy(carbonites.sl, carbonites.state);

		return rows.map((row) => ({
			sl: row.sl ?? "Unknown",
			state: row.state,
			headcount: row.headcount,
			totalSalary: Number(row.totalSalary),
		}));
	}),

	alerts: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const ninetyDaysAgo = new Date();
		ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

		const staleHiring = await db
			.select({
				id: hiringNeeds.id,
				role: hiringNeeds.role,
				state: hiringNeeds.state,
				office: hiringNeeds.office,
				createdAt: hiringNeeds.createdAt,
			})
			.from(hiringNeeds)
			.where(
				and(
					ne(hiringNeeds.status, "closed"),
					lt(hiringNeeds.createdAt, ninetyDaysAgo),
					rf.state ? eq(hiringNeeds.state, rf.state) : undefined,
				),
			);

		const alerts: {
			type: string;
			severity: "warning" | "error" | "info";
			title: string;
			message: string;
			link: string;
		}[] = [];

		for (const h of staleHiring) {
			const daysSince = h.createdAt
				? Math.floor(
						(Date.now() - new Date(h.createdAt).getTime()) /
							(1000 * 60 * 60 * 24),
					)
				: 0;
			alerts.push({
				type: "stale_hiring",
				severity: "warning",
				title: `Stale hiring: ${h.role}`,
				message: `Open for ${daysSince} days in ${h.state ?? "unknown"} / ${h.office ?? "unknown"}`,
				link: "/hiring",
			});
		}

		return alerts;
	}),
});
