import { db } from "@carbon-wfp/db";
import { priorYearData } from "@carbon-wfp/db/schema/wfp-extended";
import { asc, eq, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { ADMIN_WRITE_ROLES, assertWriter } from "../lib/rbac";

export const priorYearRouter = router({
	getByYear: protectedProcedure
		.input(z.object({ year: z.string() }))
		.query(async ({ input }) => {
			return db
				.select()
				.from(priorYearData)
				.where(eq(priorYearData.year, input.year))
				.orderBy(
					asc(priorYearData.state),
					asc(priorYearData.office),
					asc(priorYearData.podName),
				);
		}),

	batchUpsert: protectedProcedure
		.input(
			z.object({
				year: z.string(),
				rows: z.array(
					z.object({
						state: z.string(),
						office: z.string(),
						podName: z.string(),
						budget: z.number().int().optional(),
						headcount: z.number().int().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user, ADMIN_WRITE_ROLES);

			if (input.rows.length === 0) return [];

			const values = input.rows.map((row) => ({
				state: row.state,
				office: row.office,
				podName: row.podName,
				year: input.year,
				budget: row.budget ?? 0,
				headcount: row.headcount ?? 0,
			}));

			// Bulk upsert using ON CONFLICT DO UPDATE
			return db
				.insert(priorYearData)
				.values(values)
				.onConflictDoUpdate({
					target: [
						priorYearData.state,
						priorYearData.office,
						priorYearData.podName,
						priorYearData.year,
					],
					set: {
						budget: sql`coalesce(excluded.budget, ${priorYearData.budget})`,
						headcount: sql`coalesce(excluded.headcount, ${priorYearData.headcount})`,
					},
				})
				.returning();
		}),
});
