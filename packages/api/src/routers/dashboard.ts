import { carbonites, db, entities, hiringNeeds } from "@carbon-wfp/db";
import { and, count, eq, lt, ne, sql } from "drizzle-orm";

import { protectedProcedure, router } from "../index";
import {
	carboniteRoleWhere,
	entityRoleWhere,
	getRoleFilter,
} from "../lib/rbac";

export const dashboardRouter = router({
	stats: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const cbWhere = carboniteRoleWhere(rf);
		const entWhere = entityRoleWhere(rf);

		const [
			[carboniteCount],
			[entityCount],
			[openRolesResult],
			[uniqueOffices],
		] = await Promise.all([
			db
				.select({ value: count() })
				.from(carbonites)
				.where(and(eq(carbonites.isActive, true), cbWhere)),
			db.select({ value: count() }).from(entities).where(entWhere),
			db
				.select({ value: count() })
				.from(hiringNeeds)
				.where(sql`${hiringNeeds.status} != 'closed'`),
			db
				.select({
					value: sql<number>`count(distinct ${entities.officeId})`,
				})
				.from(entities)
				.where(entWhere),
		]);

		return {
			totalCarbonites: carboniteCount?.value ?? 0,
			totalEntities: entityCount?.value ?? 0,
			openRoles: openRolesResult?.value ?? 0,
			offices: Number(uniqueOffices?.value ?? 0),
		};
	}),

	entitySummaries: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const cbWhere = carboniteRoleWhere(rf);
		const entWhere = entityRoleWhere(rf);

		// Get all entities (filtered by role)
		const allEntities = await db
			.select({
				id: entities.id,
				biz: entities.biz,
				state: entities.state,
				officeId: entities.officeId,
				sl: entities.sl,
			})
			.from(entities)
			.where(entWhere);

		// Get headcount and salary per entity (active only, filtered by role)
		const staffAgg = await db
			.select({
				entity: carbonites.entity,
				headcount: count(),
				totalSalary: sql<number>`coalesce(sum(${carbonites.salary}), 0)`.as(
					"total_salary",
				),
			})
			.from(carbonites)
			.where(and(eq(carbonites.isActive, true), cbWhere))
			.groupBy(carbonites.entity);

		// Get distinct SLs per entity (active only, filtered by role)
		const slPerEntity = await db
			.select({
				entity: carbonites.entity,
				sl: carbonites.sl,
			})
			.from(carbonites)
			.where(
				and(
					sql`${carbonites.sl} is not null`,
					eq(carbonites.isActive, true),
					cbWhere,
				),
			)
			.groupBy(carbonites.entity, carbonites.sl);

		// Build a lookup map for staff aggregates
		const staffMap = new Map(
			staffAgg.map((row) => [
				row.entity,
				{ headcount: row.headcount, totalSalary: Number(row.totalSalary) },
			]),
		);

		// Build a lookup map for SLs per entity
		const slMap = new Map<string, string[]>();
		for (const row of slPerEntity) {
			if (!row.entity || !row.sl) continue;
			const existing = slMap.get(row.entity) ?? [];
			existing.push(row.sl);
			slMap.set(row.entity, existing);
		}

		return allEntities.map((ent) => ({
			id: ent.id,
			biz: ent.biz,
			state: ent.state,
			officeId: ent.officeId,
			headcount: staffMap.get(ent.id)?.headcount ?? 0,
			totalSalary: staffMap.get(ent.id)?.totalSalary ?? 0,
			sls: slMap.get(ent.id) ?? (ent.sl as string[]) ?? [],
		}));
	}),

	slBreakdown: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const cbWhere = carboniteRoleWhere(rf);

		const rows = await db
			.select({
				sl: carbonites.sl,
				headcount: count(),
				totalSalary: sql<number>`coalesce(sum(${carbonites.salary}), 0)`.as(
					"total_salary",
				),
			})
			.from(carbonites)
			.where(and(eq(carbonites.isActive, true), cbWhere))
			.groupBy(carbonites.sl);

		const totalHeadcount = rows.reduce((sum, r) => sum + r.headcount, 0);

		return rows.map((row) => ({
			sl: row.sl ?? "Unknown",
			headcount: row.headcount,
			totalSalary: Number(row.totalSalary),
			pctOfFirm:
				totalHeadcount > 0
					? Math.round((row.headcount / totalHeadcount) * 100)
					: 0,
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
