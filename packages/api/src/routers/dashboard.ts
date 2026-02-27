import { db } from "@carbon-wfp/db";
import { carbonites, entities, hiringNeeds } from "@carbon-wfp/db";
import { count, sql } from "drizzle-orm";

import { publicProcedure, router } from "../index";

export const dashboardRouter = router({
	stats: publicProcedure.query(async () => {
		const [[carboniteCount], [entityCount], [openRolesResult], [uniqueOffices]] =
			await Promise.all([
				db.select({ value: count() }).from(carbonites),
				db.select({ value: count() }).from(entities),
				db
					.select({ value: count() })
					.from(hiringNeeds)
					.where(sql`${hiringNeeds.status} != 'closed'`),
				db
					.select({
						value: sql<number>`count(distinct ${entities.officeId})`,
					})
					.from(entities),
			]);

		return {
			totalCarbonites: carboniteCount?.value ?? 0,
			totalEntities: entityCount?.value ?? 0,
			openRoles: openRolesResult?.value ?? 0,
			offices: Number(uniqueOffices?.value ?? 0),
		};
	}),
});
