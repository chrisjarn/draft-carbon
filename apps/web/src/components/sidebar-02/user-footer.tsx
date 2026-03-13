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
import { authClient } from "@/lib/auth-client";
import { ROLE_LABELS } from "@/lib/rbac";

export function UserFooter({
	name,
	role,
	isCollapsed,
}: {
	name: string;
	role: string;
	isCollapsed: boolean;
}) {
	const navigate = useNavigate();

	const initials = name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	async function handleSignOut() {
		await authClient.signOut();
		window.location.href = "/login";
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-bg-weak-50 transition-colors">
				<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-weak-50 text-text-sub-600 font-semibold text-sm">
					{initials}
				</span>
				{!isCollapsed && (
					<div className="grid flex-1 text-left leading-tight overflow-hidden">
						<span className="truncate font-semibold text-text-strong-950">
							{name}
						</span>
						<span className="truncate text-text-soft-400 text-xs">
							{ROLE_LABELS[role] ?? role}
						</span>
					</div>
				)}
				{!isCollapsed && (
					<HugeiconsIcon
						icon={ArrowUpDownIcon}
						className="size-4 text-text-soft-400 shrink-0"
					/>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="min-w-56 rounded-lg"
				align="start"
				side="top"
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
	);
}
