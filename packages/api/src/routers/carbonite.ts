import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db";
import { asc } from "drizzle-orm";

import { publicProcedure, router } from "../index";

export const carboniteRouter = router({
	getAll: publicProcedure.query(async () => {
		return await db
			.select()
			.from(carbonites)
			.orderBy(asc(carbonites.state), asc(carbonites.office), asc(carbonites.name));
	}),
});
