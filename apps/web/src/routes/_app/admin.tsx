import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app/admin")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		const role = (session.data?.user as { role?: string })?.role;
		if (role !== "admin") throw redirect({ to: "/dashboard" });
	},
});
