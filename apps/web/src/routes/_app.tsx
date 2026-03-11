import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppTopBar } from "@/components/organisms/app-top-bar";
import { CommandPalette } from "@/components/organisms/command-palette";
import { AppSidebar } from "@/components/sidebar-02/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app")({
	beforeLoad: async () => {
		// Always fetch fresh session — no module-level cache
		const result = await authClient.getSession();
		const session = result.data;
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
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
						{/* <AppTopBar /> */}
						<Outlet />
					</SidebarInset>
					<CommandPalette />
				</div>
			</SidebarProvider>
		</TooltipProvider>
	);
}
