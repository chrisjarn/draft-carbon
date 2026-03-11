/** Static metadata for each app route. */
export const ROUTE_CONFIG: Record<
	string,
	{ title: string; description: string }
> = {
	"/dashboard": {
		title: "Dashboard",
		description:
			"Firm-wide overview of headcount, entities, and service lines.",
	},
	"/carbonites": {
		title: "Carbonites",
		description: "Staff directory - search, filter, and manage team members.",
	},
	"/hiring": {
		title: "Hiring",
		description:
			"Recruitment pipeline — open roles, offers, and closed positions.",
	},
	"/capacity-plan": {
		title: "Capacity Plan",
		description:
			"Workforce planning — entity KPIs, staff meta, pod budgets, and scenarios.",
	},
	"/scenarios": {
		title: "Scenarios",
		description: "What-if planning scenarios for workforce and capacity.",
	},
	"/fy-planning": {
		title: "FY Report",
		description: "Revenue targets vs actuals by entity and financial year.",
	},
	"/admin": {
		title: "Settings",
		description: "User accounts and role management.",
	},
	"/todos": {
		title: "Todos",
		description: "Task management scratch pad.",
	},
};
