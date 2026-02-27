import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load env from apps/server/.env when running from packages/db via turbo
config({ path: path.resolve(import.meta.dirname, "../../apps/server/.env") });
// Also try CWD fallback (root .env if someone has one)
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
