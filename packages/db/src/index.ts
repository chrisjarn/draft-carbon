import { env } from "@carbon-wfp/env/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.js";

const client = postgres(env.DATABASE_URL, {
	ssl: "require",
});

export const db = drizzle(client, { schema });

export * from "./schema/index.js";
