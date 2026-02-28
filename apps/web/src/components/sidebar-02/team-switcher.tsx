import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";

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

export function UserDropdown({
	name,
	role,
}: {
	name: string;
	role: string;
}) {
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
		navigate({ to: "/login" });
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							/>
						}
					>
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
							{initials}
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">{name}</span>
							<span className="truncate text-xs text-sidebar-foreground/50">
								{ROLE_LABELS[role] ?? role}
							</span>
						</div>
						<ChevronsUpDown className="ml-auto" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuItem
							onSelect={() => navigate({ to: "/admin" })}
						>
							<Settings className="mr-2 size-4" />
							Settings
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={handleSignOut}>
							<LogOut className="mr-2 size-4" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
