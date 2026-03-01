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
		description: "Staff directory — search, filter, and manage team members.",
	},
	"/hiring": {
		title: "Hiring",
		description:
			"Recruitment pipeline — open roles, offers, and closed positions.",
	},
	"/capacity": {
		title: "Capacity Plan",
		description: "Pod headcount vs budget across states and offices.",
	},
	"/wfp": {
		title: "Workforce Planning",
		description:
			"Firm KPIs, entity detail, staff meta, and scenario workbench.",
	},
	"/fy-planning": {
		title: "FY Reports",
		description: "Revenue targets vs actuals by entity and financial year.",
	},
	"/admin": {
		title: "Admin",
		description: "User accounts and role management.",
	},
	"/todos": {
		title: "Todos",
		description: "Task management scratch pad.",
	},
};
