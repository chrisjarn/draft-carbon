import { defineConfig } from "drizzle-kit";

if (!process.env["DATABASE_URL"]) {
	throw new Error(
		"DATABASE_URL is not set. Add it to apps/server/.env or export it before running db commands.",
	);
}

export default defineConfig({
	schema: [
		"./src/schema/auth.ts",
		"./src/schema/todo.ts",
		"./src/schema/carbonites.ts",
		"./src/schema/entities.ts",
		"./src/schema/pod-budgets.ts",
		"./src/schema/hiring-needs.ts",
		"./src/schema/salary-brackets.ts",
		"./src/schema/wfp.ts",
		"./src/schema/app-settings.ts",
	],
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env["DATABASE_URL"],
	},
});
