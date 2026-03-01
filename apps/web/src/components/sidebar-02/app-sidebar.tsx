import {
	Briefcase01Icon,
	Calendar01Icon,
	ChartLineData02Icon,
	DashboardSquare01Icon,
	Settings01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarSeparator,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { getRank, getUserRole } from "@/lib/rbac";
import { CarbonLogo } from "./logo";
import { type NavItem, NavMain } from "./nav-main";
import { UserDropdown } from "./team-switcher";

const NAV_ITEMS: NavItem[] = [
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: DashboardSquare01Icon,
		minRank: 10,
	},
	{ to: "/carbonites", label: "Carbonites", icon: UserGroupIcon, minRank: 10 },
	{ to: "/hiring", label: "Hiring", icon: Briefcase01Icon, minRank: 10 },
	{
		to: "/capacity-plan",
		label: "Capacity Plan",
		icon: ChartLineData02Icon,
		minRank: 50,
	},
	{
		to: "/fy-planning",
		label: "FY Reports",
		icon: Calendar01Icon,
		minRank: 80,
	},
];

const ADMIN_ITEMS: NavItem[] = [
	{ to: "/admin", label: "Admin", icon: Settings01Icon, minRank: 100 },
];

export function AppSidebar() {
	const { data: session } = authClient.useSession();

	const userRole = getUserRole(session?.user);
	const userRank = getRank(userRole);

	const visibleNav = NAV_ITEMS.filter((item) => userRank >= item.minRank);
	const visibleAdmin = ADMIN_ITEMS.filter((item) => userRank >= item.minRank);

	return (
		<Sidebar variant="floating" collapsible="icon">
			<SidebarHeader className="flex flex-row items-center justify-between md:pt-3.5">
				<div className="flex items-center gap-2">
					<CarbonLogo className="size-7 shrink-0 text-sidebar-primary" />
					<div className="flex flex-col group-data-[collapsible=icon]:hidden">
						<span className="font-extrabold text-sidebar-foreground text-sm tracking-tight">
							Carbon Group
						</span>
						<span className="font-medium text-[10px] text-sidebar-foreground/50">
							Workforce Planner
						</span>
					</div>
				</div>
				<SidebarTrigger />
			</SidebarHeader>

			<SidebarContent className="px-2 py-4">
				<NavMain items={visibleNav} />
				{visibleAdmin.length > 0 && (
					<>
						<SidebarSeparator />
						<NavMain items={visibleAdmin} />
					</>
				)}
			</SidebarContent>

			<SidebarFooter className="px-2">
				{session?.user && (
					<UserDropdown name={session.user.name} role={userRole} />
				)}
			</SidebarFooter>
		</Sidebar>
	);
}
