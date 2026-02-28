import { db } from "@carbon-wfp/db";
import { priorYearData } from "@carbon-wfp/db/schema/wfp-extended";
import { and, asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { assertWriter } from "../lib/rbac";

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
			assertWriter(ctx.session.user);

			const results: (typeof priorYearData.$inferSelect)[] = [];

			for (const row of input.rows) {
				const existing = await db
					.select()
					.from(priorYearData)
					.where(
						and(
							eq(priorYearData.state, row.state),
							eq(priorYearData.office, row.office),
							eq(priorYearData.podName, row.podName),
							eq(priorYearData.year, input.year),
						),
					);

				if (existing.length > 0) {
					const current = existing[0];
					const [updated] = await db
						.update(priorYearData)
						.set({
							budget: row.budget ?? current?.budget ?? 0,
							headcount: row.headcount ?? current?.headcount ?? 0,
						})
						.where(
							and(
								eq(priorYearData.state, row.state),
								eq(priorYearData.office, row.office),
								eq(priorYearData.podName, row.podName),
								eq(priorYearData.year, input.year),
							),
						)
						.returning();
					if (updated) results.push(updated);
				} else {
					const [inserted] = await db
						.insert(priorYearData)
						.values({
							state: row.state,
							office: row.office,
							podName: row.podName,
							year: input.year,
							budget: row.budget ?? 0,
							headcount: row.headcount ?? 0,
						})
						.returning();
					if (inserted) results.push(inserted);
				}
			}

			return results;
		}),
});
