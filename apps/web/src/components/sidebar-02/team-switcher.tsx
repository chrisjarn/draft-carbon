import {
	ArrowUpDownIcon,
	Logout01Icon,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { ROLE_LABELS } from "@/lib/rbac";

export function UserDropdown({ name, role }: { name: string; role: string }) {
	const { isMobile } = useSidebar();
	const navigate = useNavigate();

	const initials = name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	async function handleSignOut() {
		await authClient.signOut();
		// Force full page reload to clear all in-memory state (TanStack Query cache,
		// route context, etc.) so the next login starts fresh
		window.location.href = "/login";
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton>
							{initials}
							<div className="grid flex-1 text-left text-base leading-tight">
								<span className="truncate font-semibold">{name}</span>
								<span className="truncate text-sidebar-foreground/50 text-sm">
									{ROLE_LABELS[role] ?? role}
								</span>
							</div>
							<HugeiconsIcon icon={ArrowUpDownIcon} />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
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
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
