import { db } from "@carbon-wfp/db";
import { salaryBrackets } from "@carbon-wfp/db/schema/salary-brackets";
import { asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const salaryBracketsRouter = router({
	getAll: protectedProcedure.query(async () => {
		return await db
			.select()
			.from(salaryBrackets)
			.orderBy(asc(salaryBrackets.sl), asc(salaryBrackets.prog));
	}),

	getBySl: protectedProcedure
		.input(z.object({ sl: z.string() }))
		.query(async ({ input }) => {
			return await db
				.select()
				.from(salaryBrackets)
				.where(eq(salaryBrackets.sl, input.sl))
				.orderBy(asc(salaryBrackets.prog));
		}),
});
