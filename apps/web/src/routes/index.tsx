import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		// Redirect authenticated users straight to the dashboard
		if (session.data) {
			throw redirect({ to: "/dashboard" });
		}
		// Unauthenticated users go to login
		throw redirect({ to: "/login" });
	},
	component: () => null,
});
