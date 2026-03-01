import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export type NavItem = {
	to: string;
	label: string;
	icon: IconSvgElement;
	minRank: number;
};

export function NavMain({ items }: { items: NavItem[] }) {
	const router = useRouterState();
	const pathname = router.location.pathname;

	return (
		<SidebarMenu>
			{items.map((item) => {
				const isActive =
					item.to === "/dashboard"
						? pathname === "/dashboard"
						: pathname.startsWith(item.to);

				return (
					<SidebarMenuItem key={item.to}>
						<SidebarMenuButton
							isActive={isActive}
							render={<Link to={item.to} />}
						>
							<HugeiconsIcon icon={item.icon} />
							<span>{item.label}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}
