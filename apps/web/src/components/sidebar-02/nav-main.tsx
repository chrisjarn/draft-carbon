import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export type NavItem = {
	to: string;
	label: string;
	icon: LucideIcon;
	minRank: number;
};

export function NavMain({ items }: { items: NavItem[] }) {
	const router = useRouterState();
	const pathname = router.location.pathname;

	return (
		<SidebarMenu>
			{items.map((item) => {
				const Icon = item.icon;
				const isActive =
					item.to === "/dashboard"
						? pathname === "/dashboard"
						: pathname.startsWith(item.to);

				return (
					<SidebarMenuItem key={item.to}>
						<SidebarMenuButton
							isActive={isActive}
							render={<Link to={item.to} />}
							className="h-auto rounded-sm px-3 py-2 font-bold text-sm text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active]:bg-sidebar-primary data-[active]:text-sidebar-primary-foreground data-[active]:hover:bg-sidebar-primary data-[active]:hover:text-sidebar-primary-foreground"
						>
							<Icon className="size-4" />
							<span>{item.label}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}
