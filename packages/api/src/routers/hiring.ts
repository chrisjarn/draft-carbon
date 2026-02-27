import { db } from "@carbon-wfp/db";
import { hiringNeeds } from "@carbon-wfp/db";
import { asc } from "drizzle-orm";

import { publicProcedure, router } from "../index";

export const hiringRouter = router({
	getAll: publicProcedure.query(async () => {
		return await db
			.select()
			.from(hiringNeeds)
			.orderBy(asc(hiringNeeds.priority), asc(hiringNeeds.status));
	}),
});
