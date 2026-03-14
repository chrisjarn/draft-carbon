import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export type NavItem = {
	to: string;
	label: string;
	icon: IconSvgElement;
	minRank: number;
};

export function NavMain({
	items,
	isCollapsed,
}: {
	items: NavItem[];
	isCollapsed: boolean;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<nav>
			<ul className="flex flex-col gap-0.5">
				{items.map((item) => {
					const isActive =
						item.to === "/dashboard"
							? pathname === "/dashboard"
							: pathname.startsWith(item.to);

					const linkClass = [
						"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
						isActive
							? "bg-green-alpha-10 text-green-600"
							: "text-text-sub-600 hover:bg-bg-weak-50",
					].join(" ");

					return (
						<li key={item.to}>
							{isCollapsed ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<Link to={item.to} className={linkClass}>
											<HugeiconsIcon
												icon={item.icon}
												className="size-5 shrink-0"
											/>
										</Link>
									</TooltipTrigger>
									<TooltipContent side="right">{item.label}</TooltipContent>
								</Tooltip>
							) : (
								<Link to={item.to} className={linkClass}>
									<HugeiconsIcon icon={item.icon} className="size-5 shrink-0" />
									<span>{item.label}</span>
								</Link>
							)}
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
