import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
	{
		test: {
			name: "api",
			root: "packages/api",
			include: ["src/**/__tests__/**/*.test.ts"],
		},
	},
	{
		test: {
			name: "web",
			root: "apps/web",
			include: ["src/**/__tests__/**/*.test.ts"],
		},
	},
]);
