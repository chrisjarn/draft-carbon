import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { CommandPalette } from "@/components/organisms/command-palette";
import { AppSidebar } from "@/components/sidebar-02/app-sidebar";
import { useSidebarState } from "@/components/sidebar-02/use-sidebar-state";
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
	const { isCollapsed, toggle, isMobileOpen, setMobileOpen } =
		useSidebarState();

	return (
		<TooltipProvider>
			<div className="relative flex h-dvh overflow-hidden">
				<AppSidebar
					isCollapsed={isCollapsed}
					toggle={toggle}
					isMobileOpen={isMobileOpen}
					setMobileOpen={setMobileOpen}
				/>
				<main className="flex w-full flex-1 flex-col overflow-hidden">
					{/* Mobile top bar — hamburger only visible on small screens */}
					<div className="flex shrink-0 items-center gap-3 border-stroke-soft-200 border-b bg-bg-white-0 px-4 py-3 md:hidden">
						<button
							type="button"
							onClick={() => setMobileOpen(true)}
							className="flex size-8 items-center justify-center rounded-md text-text-soft-400 transition-colors hover:bg-bg-weak-50"
							aria-label="Open sidebar"
						>
							<HugeiconsIcon icon={Menu01Icon} className="size-5" />
						</button>
					</div>
					<div className="flex h-full flex-col overflow-auto lg:p-1.5 lg:pl-0">
						<Outlet />
					</div>
				</main>
				<CommandPalette />
			</div>
		</TooltipProvider>
	);
}
