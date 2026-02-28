import { createFileRoute, redirect } from "@tanstack/react-router";

import Login04 from "@/components/login-04";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (session.data) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: Login04,
});
