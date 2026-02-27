import { Link, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	Briefcase,
	CalendarDays,
	LayoutDashboard,
	Settings,
	Target,
	TrendingUp,
	Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

// ── RBAC ─────────────────────────────────────────────────────────────────────

const ROLE_RANKS: Record<string, number> = {
	admin: 100,
	practice_manager: 80,
	sl_lead: 50,
	state_manager: 50,
	readonly: 10,
};

const ROLE_LABELS: Record<string, string> = {
	admin: "Admin",
	practice_manager: "Practice Manager",
	sl_lead: "SL Lead",
	state_manager: "State Manager",
	readonly: "View Only",
};

function getRank(role: string | undefined | null): number {
	return ROLE_RANKS[role ?? "readonly"] ?? 10;
}

// ── Nav config ────────────────────────────────────────────────────────────────

type NavItem = {
	to: string;
	label: string;
	icon: LucideIcon;
	minRank: number;
};

const NAV_ITEMS: NavItem[] = [
	{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minRank: 10 },
	{ to: "/capacity", label: "Capacity Plan", icon: Target, minRank: 10 },
	{ to: "/carbonites", label: "Carbonites", icon: Users, minRank: 10 },
	{ to: "/hiring", label: "Hiring", icon: Briefcase, minRank: 10 },
	{ to: "/wfp", label: "Workforce Planning", icon: TrendingUp, minRank: 50 },
	{ to: "/fy-planning", label: "FY Reports", icon: CalendarDays, minRank: 80 },
];

const ADMIN_ITEMS: NavItem[] = [
	{ to: "/admin", label: "Admin", icon: Settings, minRank: 100 },
];

// ── Components ────────────────────────────────────────────────────────────────

function CarbonLogo() {
	return (
		<div
			className="size-7 shrink-0 bg-sidebar-primary"
			style={{
				clipPath:
					"polygon(20% 0%,100% 0%,100% 22%,44% 22%,44% 78%,100% 78%,100% 100%,20% 100%,0% 80%,0% 20%)",
			}}
			aria-hidden="true"
		/>
	);
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
	const Icon = item.icon;
	return (
		<Link
			to={item.to}
			className={cn(
				"flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-bold transition-all duration-100",
				"text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground",
				isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
			)}
			activeOptions={{ exact: false }}
		>
			<Icon className="size-4 shrink-0" />
			{item.label}
		</Link>
	);
}

function UserCard({
	name,
	email,
	role,
}: { name: string; email: string; role: string }) {
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<div className="flex items-center gap-2.5 rounded-sm bg-sidebar-accent px-3 py-2.5">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
				{initials}
			</div>
			<div className="min-w-0 flex-1 overflow-hidden">
				<div className="truncate text-xs font-bold text-sidebar-foreground">{name}</div>
				<div className="truncate text-[10px] text-sidebar-foreground/40">
					{ROLE_LABELS[role] ?? role}
				</div>
			</div>
		</div>
	);
}

// ── AppSidebar ────────────────────────────────────────────────────────────────

export function AppSidebar() {
	const { data: session } = authClient.useSession();
	const router = useRouterState();
	const pathname = router.location.pathname;

	const userRole = (session?.user as { role?: string })?.role ?? "readonly";
	const userRank = getRank(userRole);

	const visibleNav = NAV_ITEMS.filter((item) => userRank >= item.minRank);
	const visibleAdmin = ADMIN_ITEMS.filter((item) => userRank >= item.minRank);

	return (
		<aside className="flex h-svh w-[248px] shrink-0 flex-col bg-sidebar">
			{/* Logo */}
			<div className="flex flex-col gap-0.5 border-b border-sidebar-border px-4 py-5">
				<div className="flex items-center gap-2.5">
					<CarbonLogo />
					<span className="text-lg font-extrabold tracking-tight text-sidebar-foreground">
						Carbon Group
					</span>
				</div>
				<span
					className="ml-[38px] text-[12.5px] font-medium text-sidebar-primary"
					style={{ fontFamily: "cursive" }}
				>
					Workforce Planner
				</span>
			</div>

			{/* Nav */}
			<nav className="flex-1 overflow-y-auto px-1.5 py-2.5">
				<div className="flex flex-col gap-0.5">
					{visibleNav.map((item) => (
						<NavLink
							key={item.to}
							item={item}
							isActive={
								item.to === "/dashboard"
									? pathname === "/dashboard"
									: pathname.startsWith(item.to)
							}
						/>
					))}
				</div>

				{visibleAdmin.length > 0 && (
					<>
						<div className="mx-2.5 my-3 h-px bg-sidebar-border" />
						<div className="flex flex-col gap-0.5">
							{visibleAdmin.map((item) => (
								<NavLink
									key={item.to}
									item={item}
									isActive={pathname.startsWith(item.to)}
								/>
							))}
						</div>
					</>
				)}
			</nav>

			{/* User card */}
			{session?.user && (
				<div className="border-t border-sidebar-border p-2.5">
					<UserCard
						name={session.user.name}
						email={session.user.email}
						role={userRole}
					/>
				</div>
			)}
		</aside>
	);
}
