import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/sidebar-02/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
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
		<TooltipProvider>
			<SidebarProvider>
				<div className="relative flex h-dvh w-full">
					<AppSidebar />
					<SidebarInset className="flex flex-col overflow-auto">
						<Outlet />
					</SidebarInset>
				</div>
			</SidebarProvider>
		</TooltipProvider>
	);
}
