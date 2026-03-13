import type { IconSvgElement as IconType } from "@hugeicons/react";
import {
	Briefcase01Icon,
	Calendar01Icon,
	CheckmarkBadge02Icon,
	ChartLineData02Icon,
	DashboardSquare01Icon,
	FlowSquareIcon,
	Settings01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";

/** Static metadata for each app route. */
export const ROUTE_CONFIG: Record<
	string,
	{ title: string; description: string; icon?: IconType }
> = {
	"/dashboard": {
		title: "Dashboard",
		description:
			"Firm-wide overview of headcount, entities, and service lines.",
		icon: DashboardSquare01Icon,
	},
	"/carbonites": {
		title: "Carbonites",
		description: "Staff directory - search, filter, and manage team members.",
		icon: UserGroupIcon,
	},
	"/hiring": {
		title: "Hiring",
		description:
			"Recruitment pipeline — open roles, offers, and closed positions.",
		icon: Briefcase01Icon,
	},
	"/capacity-plan": {
		title: "Capacity Plan",
		description:
			"Workforce planning — entity KPIs, staff meta, pod budgets, and scenarios.",
		icon: ChartLineData02Icon,
	},
	"/scenarios": {
		title: "Scenarios",
		description: "What-if planning scenarios for workforce and capacity.",
		icon: FlowSquareIcon,
	},
	"/fy-planning": {
		title: "FY Report",
		description: "Revenue targets vs actuals by entity and financial year.",
		icon: Calendar01Icon,
	},
	"/admin": {
		title: "Settings",
		description: "User accounts and role management.",
		icon: Settings01Icon,
	},
	"/todos": {
		title: "Todos",
		description: "Task management scratch pad.",
		icon: CheckmarkBadge02Icon,
	},
};
