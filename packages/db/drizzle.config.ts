import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit transpiles to CJS, so import.meta is unavailable.
// Use process.cwd() which is packages/db when run via turbo.
config({ path: path.resolve(process.cwd(), "../../apps/server/.env") });
config();

if (!process.env["DATABASE_URL"]) {
	throw new Error(
		"DATABASE_URL is not set. Add it to apps/server/.env or export it before running db commands.",
	);
}

export default defineConfig({
	schema: "./src/schema/index.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env["DATABASE_URL"],
	},
});
