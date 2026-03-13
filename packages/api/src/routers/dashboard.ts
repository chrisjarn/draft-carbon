import {
	carbonites,
	db,
	entities,
	hiringNeeds,
	podBudgets,
	wfpRevenue,
} from "@carbon-wfp/db";
import { attritionRisks } from "@carbon-wfp/db/schema/wfp-extended";
import { and, count, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
	carboniteRoleWhere,
	entityRoleWhere,
	getRoleFilter,
	hiringRoleWhere,
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

			// Per-state-sl headcount + FTE (frontend slices by state and/or SL)
			const staffByState = await db
				.select({
					state: carbonites.state,
					sl: carbonites.sl,
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
				.groupBy(carbonites.state, carbonites.sl);

			// Per-state-sl partner count
			const partnerByState = await db
				.select({
					state: carbonites.state,
					sl: carbonites.sl,
					partnerCount: count(),
				})
				.from(carbonites)
				.where(and(...cbConditions, eq(carbonites.isPartner, true)))
				.groupBy(carbonites.state, carbonites.sl);

			// RBAC-scoped entity IDs (for revenue lookup)
			const entConditions: ReturnType<typeof eq>[] = [];
			const rbacEnt = entityRoleWhere(rf);
			if (rbacEnt) entConditions.push(rbacEnt);
			const entWhere =
				entConditions.length > 0 ? and(...entConditions) : undefined;

			const entRows = await db
				.select({ id: entities.id, state: entities.state, sl: entities.sl })
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

			// Build entity lookups
			const entStateMap = new Map(entRows.map((e) => [e.id, e.state]));
			const entSlMap = new Map(
				entRows.map((e) => [e.id, (e.sl as string[] | null) ?? []]),
			);

			return {
				staffByState: staffByState.map((r) => ({
					state: r.state,
					sl: r.sl,
					headcount: r.headcount,
					fte: Number(Number(r.fte).toFixed(1)),
				})),
				partnerByState: partnerByState.map((r) => ({
					state: r.state,
					sl: r.sl,
					partnerCount: r.partnerCount,
				})),
				revenueByEntity: revenueByEntity.map((r) => ({
					...r,
					state: entStateMap.get(r.entId) ?? null,
					sls: entSlMap.get(r.entId) ?? [],
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

		// Budget totals per office+state from pod budgets
		const allPodBudgets = await db
			.select({
				state: podBudgets.state,
				office: podBudgets.office,
				budget: podBudgets.budget,
			})
			.from(podBudgets);

		const budgetMap = new Map<string, number>();
		for (const pb of allPodBudgets) {
			const key = `${pb.state}||${pb.office}`;
			budgetMap.set(key, (budgetMap.get(key) ?? 0) + pb.budget);
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
		const namesMap = new Map<string, string[]>();
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
			const names = namesMap.get(row.entity) ?? [];
			names.push(row.name.trim());
			namesMap.set(row.entity, names);
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
			totalBudget:
				ent.state && ent.officeId
					? (budgetMap.get(`${ent.state}||${ent.officeId}`) ?? 0)
					: 0,
			sls: slMap.get(ent.id) ?? (ent.sl as string[]) ?? [],
			staffInitials: initialsMap.get(ent.id) ?? [],
			staffNames: namesMap.get(ent.id) ?? [],
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

	/**
	 * Pod budgets aggregated by service line.
	 * Resolves pod → SL via carbonites table, returns per-state rows
	 * so the frontend can client-side filter (same pattern as slBreakdown).
	 */
	budgetBySl: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);

		// Fetch all pod budgets
		const allBudgets = await db
			.select({
				state: podBudgets.state,
				office: podBudgets.office,
				podName: podBudgets.podName,
				budget: podBudgets.budget,
			})
			.from(podBudgets);

		// Resolve pod → SL via carbonites (distinct pod+state+sl combos)
		const cbConditions = [eq(carbonites.isActive, true)];
		const rbacCb = carboniteRoleWhere(rf);
		if (rbacCb) cbConditions.push(rbacCb);

		const podSlRows = await db
			.select({
				state: carbonites.state,
				pod: carbonites.pod,
				sl: carbonites.sl,
			})
			.from(carbonites)
			.where(
				and(
					sql`${carbonites.pod} is not null`,
					sql`${carbonites.sl} is not null`,
					...cbConditions,
				),
			)
			.groupBy(carbonites.state, carbonites.pod, carbonites.sl);

		// Build lookup: "state||pod" → sl (use first match if ambiguous)
		const podToSl = new Map<string, string>();
		for (const row of podSlRows) {
			if (!row.pod || !row.sl) continue;
			const key = `${row.state}||${row.pod}`;
			if (!podToSl.has(key)) podToSl.set(key, row.sl);
		}

		// Aggregate budgets by (sl, state)
		const agg = new Map<string, number>();
		for (const pb of allBudgets) {
			const key = `${pb.state}||${pb.podName}`;
			const sl = podToSl.get(key);
			if (!sl) continue; // skip pods with no carbonites / no SL match
			const aggKey = `${sl}||${pb.state}`;
			agg.set(aggKey, (agg.get(aggKey) ?? 0) + pb.budget);
		}

		return [...agg.entries()].map(([aggKey, totalBudget]) => {
			const [sl, state] = aggKey.split("||");
			return { sl: sl ?? "Unknown", state: state ?? null, totalBudget };
		});
	}),

	alerts: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const ninetyDaysAgo = new Date();
		ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

		const hiringRbac = hiringRoleWhere(rf);
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
					hiringRbac,
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

		// High attrition risks — scoped to visible carbonites
		const rbacCbAlerts = carboniteRoleWhere(rf);
		const visibleCbIds = rbacCbAlerts
			? db
					.select({ id: carbonites.id })
					.from(carbonites)
					.where(and(eq(carbonites.isActive, true), rbacCbAlerts))
			: null;
		const highRisks = await db
			.select({ value: count() })
			.from(attritionRisks)
			.where(
				and(
					eq(attritionRisks.riskLevel, "high"),
					visibleCbIds
						? inArray(attritionRisks.carboniteId, visibleCbIds)
						: undefined,
				),
			);
		const highRiskCount = highRisks[0]?.value ?? 0;
		if (highRiskCount > 0) {
			alerts.push({
				type: "attrition_risk",
				severity: "error",
				title: `${highRiskCount} staff at high attrition risk`,
				message:
					"Review attrition risks and action plans in the Carbonites view",
				link: "/carbonites",
			});
		}

		// Under-target entities (< 70% revenue attainment)
		const entConditions: ReturnType<typeof eq>[] = [];
		const rbacEnt = entityRoleWhere(rf);
		if (rbacEnt) entConditions.push(rbacEnt);
		const entWhere =
			entConditions.length > 0 ? and(...entConditions) : undefined;
		const allEntities = await db
			.select({ id: entities.id, biz: entities.biz })
			.from(entities)
			.where(entWhere);
		const entIds = allEntities.map((e) => e.id);
		if (entIds.length > 0) {
			const revRows = await db
				.select({
					entId: wfpRevenue.entId,
					target: wfpRevenue.target,
					actual: wfpRevenue.actual,
				})
				.from(wfpRevenue)
				.where(
					and(eq(wfpRevenue.fy, "FY25-26"), inArray(wfpRevenue.entId, entIds)),
				);
			const underTarget = revRows.filter((r) => {
				const t = Number(r.target ?? 0);
				const a = Number(r.actual ?? 0);
				return t > 0 && a / t < 0.7;
			});
			if (underTarget.length > 0) {
				alerts.push({
					type: "under_target",
					severity: "warning",
					title: `${underTarget.length} entities below 70% revenue target`,
					message:
						"These entities are significantly behind on revenue attainment",
					link: "/fy-planning",
				});
			}
		}

		return alerts;
	}),
});
