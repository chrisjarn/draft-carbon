import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			throw redirect({ to: "/login" });
		}
		return { session: session.data };
	},
	component: AppLayout,
});

function AppLayout() {
	return (
		<div className="flex h-svh overflow-hidden">
			<AppSidebar />
			<main className="flex min-w-0 flex-1 flex-col overflow-auto">
				<Outlet />
			</main>
		</div>
	);
}
