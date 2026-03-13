import {
	Briefcase01Icon,
	Calendar01Icon,
	Cancel01Icon,
	ChartLineData02Icon,
	DashboardSquare01Icon,
	FlowSquareIcon,
	Search01Icon,
	Settings01Icon,
	SidebarLeft01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { getRank, getUserRole } from "@/lib/rbac";
import { CarbonLogo } from "./logo";
import { type NavItem, NavMain } from "./nav-main";
import { useRecentViews } from "./use-recent-views";
import { UserFooter } from "./user-footer";

const NAV_ITEMS: NavItem[] = [
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: DashboardSquare01Icon,
		minRank: 10,
	},
	{
		to: "/capacity-plan",
		label: "Capacity Plan",
		icon: ChartLineData02Icon,
		minRank: 10,
	},
	{ to: "/carbonites", label: "Carbonites", icon: UserGroupIcon, minRank: 10 },
	{ to: "/hiring", label: "Hiring", icon: Briefcase01Icon, minRank: 10 },
	{
		to: "/scenarios",
		label: "Scenarios",
		icon: FlowSquareIcon,
		minRank: 10,
	},
	{
		to: "/fy-planning",
		label: "FY Report",
		icon: Calendar01Icon,
		minRank: 10,
	},
];

const ADMIN_ITEMS: NavItem[] = [
	{ to: "/admin", label: "Settings", icon: Settings01Icon, minRank: 100 },
];

const NAV_ICON_MAP: Record<string, typeof DashboardSquare01Icon> = {
	"/dashboard": DashboardSquare01Icon,
	"/capacity-plan": ChartLineData02Icon,
	"/carbonites": UserGroupIcon,
	"/hiring": Briefcase01Icon,
	"/scenarios": FlowSquareIcon,
	"/fy-planning": Calendar01Icon,
	"/admin": Settings01Icon,
};

function openCommandPalette() {
	document.dispatchEvent(
		new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
	);
}

interface AppSidebarProps {
	isCollapsed: boolean;
	toggle: () => void;
	isMobileOpen: boolean;
	setMobileOpen: (open: boolean) => void;
}

export function AppSidebar({
	isCollapsed,
	toggle,
	isMobileOpen,
	setMobileOpen,
}: AppSidebarProps) {
	const recentViews = useRecentViews();
	const navigate = useNavigate();

	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const userRank = getRank(userRole);

	const visibleNav = NAV_ITEMS.filter((item) => userRank >= item.minRank);
	const visibleAdmin = ADMIN_ITEMS.filter((item) => userRank >= item.minRank);

	// On mobile overlay, always render expanded regardless of persisted collapse state
	const effectiveCollapsed = isCollapsed && !isMobileOpen;

	const sidebarWidth = effectiveCollapsed ? "w-[72px]" : "w-[272px]";

	return (
		<>
			{/* Mobile backdrop */}
			{isMobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/40 md:hidden"
					onClick={() => setMobileOpen(false)}
					aria-hidden="true"
				/>
			)}

			<div
				className={[
					"h-dvh shrink-0 flex-col border-stroke-soft-200 border-r bg-bg-white-0 transition-all duration-200",
					sidebarWidth,
					isMobileOpen ? "fixed inset-y-0 left-0 z-50 flex" : "hidden md:flex",
				].join(" ")}
			>
				{/* Header */}
				<div className="flex shrink-0 items-center gap-2 px-4 py-4">
					<CarbonLogo className="size-7 shrink-0 text-green-600" />
					{!effectiveCollapsed && (
						<div className="flex flex-1 flex-col overflow-hidden">
							<span className="font-extrabold text-base text-text-strong-950 leading-tight tracking-tight">
								Carbon Group
							</span>
							<span className="font-medium text-[10px] text-text-soft-400 leading-tight">
								Workforce Planner
							</span>
						</div>
					)}
					{/* Desktop collapse toggle */}
					<button
						type="button"
						onClick={toggle}
						className="hidden size-7 shrink-0 items-center justify-center rounded-md text-text-soft-400 transition-colors hover:bg-bg-weak-50 md:flex"
						aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						<HugeiconsIcon icon={SidebarLeft01Icon} className="size-4" />
					</button>
					{/* Mobile close button */}
					<button
						type="button"
						onClick={() => setMobileOpen(false)}
						className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-soft-400 transition-colors hover:bg-bg-weak-50 md:hidden"
						aria-label="Close sidebar"
					>
						<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
					</button>
				</div>

				{/* Search — hidden in collapsed mode */}
				{!effectiveCollapsed && (
					<div className="shrink-0 px-3 pb-2">
						<button
							type="button"
							onClick={openCommandPalette}
							className="flex w-full items-center gap-2 rounded-lg bg-bg-weak-50 px-3 py-2 text-sm text-text-soft-400 transition-colors hover:bg-bg-weak-50/80"
						>
							<HugeiconsIcon icon={Search01Icon} className="size-4 shrink-0" />
							<span className="flex-1 text-left">Search or jump to...</span>
							<kbd className="rounded border border-stroke-soft-200 bg-bg-white-0 px-1 font-sans text-xs">
								⌘K
							</kbd>
						</button>
					</div>
				)}

				{/* Nav — scrollable */}
				<div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-2">
					{/* Main nav */}
					<NavMain items={visibleNav} isCollapsed={effectiveCollapsed} />

					{/* Admin nav */}
					{visibleAdmin.length > 0 && (
						<>
							<div className="my-1 border-stroke-soft-200 border-t" />
							<NavMain items={visibleAdmin} isCollapsed={effectiveCollapsed} />
						</>
					)}


					{/* Recent views — hidden in collapsed mode */}
					{!effectiveCollapsed && recentViews.length > 0 && (
						<>
							<div className="my-1 border-stroke-soft-200 border-t" />
							<span className="section-label px-3">Recent</span>
							<ul className="flex flex-col gap-0.5">
								{recentViews.map((view) => {
									const icon = NAV_ICON_MAP[view.to] ?? DashboardSquare01Icon;
									return (
										<li key={view.to}>
											<button
												type="button"
												onClick={() => navigate({ to: view.to })}
												className="flex w-full items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm text-text-sub-600 transition-colors hover:bg-bg-weak-50"
											>
												<HugeiconsIcon
													icon={icon}
													className="size-5 shrink-0"
												/>
												<span className="truncate">{view.label}</span>
											</button>
										</li>
									);
								})}
							</ul>
						</>
					)}
				</div>

				{/* Footer */}
				<div className="shrink-0 border-stroke-soft-200 border-t px-3 py-3">
					{session?.user && (
						<UserFooter
							name={session.user.name}
							role={userRole}
							isCollapsed={effectiveCollapsed}
						/>
					)}
				</div>
			</div>
		</>
	);
}
