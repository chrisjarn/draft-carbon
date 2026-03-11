import {
	Alert02Icon,
	Logout01Icon,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { SearchBarTrigger } from "@/components/organisms/command-palette";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { FY_OPTIONS } from "@/lib/constants";
import { getUserRole, ROLE_LABELS } from "@/lib/rbac";
import { ROUTE_CONFIG } from "@/lib/route-config";

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function AppTopBar() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const router = useRouterState();

	const userName = session?.user?.name ?? "";
	const userRole = getUserRole(session?.user);
	const initials = userName ? getInitials(userName) : "?";

	// Current FY from search params
	const currentFy =
		(router.location.search as Record<string, string>).fy ?? FY_OPTIONS[0];

	// Derive breadcrumb label from current pathname
	const pathname = router.location.pathname;
	const routeKey = pathname.replace(/^\/_app/, "").replace(/\?.*$/, "");
	const routeConfig = ROUTE_CONFIG[routeKey];
	const breadcrumbLabel = routeConfig?.title ?? null;

	async function handleSignOut() {
		await authClient.signOut();
		navigate({ to: "/login" });
	}

	return (
		<div className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
			{/* Left — sidebar trigger + breadcrumb */}
			<div className="flex flex-1 items-center gap-2">
				<SidebarTrigger className="-ml-1" />
				{breadcrumbLabel && (
					<>
						<div className="h-4 w-px bg-border" />
						<span className="font-medium text-foreground text-sm">
							{breadcrumbLabel}
						</span>
					</>
				)}
			</div>

			{/* Center — search trigger */}
			<SearchBarTrigger className="max-w-[500px] flex-1" />

			{/* Right — FY selector + icon buttons */}
			<div className="flex flex-1 items-center justify-end gap-2">
				{/* FY selector */}
				<Select
					value={currentFy}
					onValueChange={(v) => {
						if (!v) return;
						const url = new URL(window.location.href);
						url.searchParams.set("fy", v);
						navigate({ to: url.pathname + url.search });
					}}
				>
					<SelectTrigger size="sm" className="w-28 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{FY_OPTIONS.map((fy) => (
							<SelectItem key={fy} value={fy} label={fy} className="text-xs">
								{fy}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Notifications */}
				<DropdownMenu>
					<DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200">
						<HugeiconsIcon icon={Alert02Icon} className="size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[340px]">
						<DropdownMenuLabel className="font-semibold text-sm">
							Notifications
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<div className="px-3 py-6 text-center text-muted-foreground text-xs">
							No new notifications
						</div>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Profile */}
				<DropdownMenu>
					<DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-full bg-zinc-100 font-semibold text-xs text-zinc-600 transition-colors hover:bg-zinc-200">
						{initials}
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="min-w-[200px]">
						<div className="px-2 py-1.5">
							<p className="font-semibold text-sm">{userName}</p>
							<p className="text-muted-foreground text-xs">
								{ROLE_LABELS[userRole] ?? userRole}
							</p>
						</div>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={() => navigate({ to: "/admin" })}>
							<HugeiconsIcon icon={Settings01Icon} className="mr-2 size-4" />
							Settings
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={handleSignOut}>
							<HugeiconsIcon icon={Logout01Icon} className="mr-2 size-4" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
