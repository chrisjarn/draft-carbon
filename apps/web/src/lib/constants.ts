// ── Service Lines ─────────────────────────────────────────────────────────────

export type ServiceLine = {
	id: string;
	name: string;
	color: string;
	short: string;
	subgroups: { id: string; name: string }[];
};

export const SERVICE_LINES: ServiceLine[] = [
	{
		id: "acc",
		name: "Accounting & Tax",
		color: "#4CAF50",
		short: "Acc & Tax",
		subgroups: [
			{ id: "acc-main", name: "Accounting & Tax" },
			{ id: "acc-smsf", name: "SMSF" },
		],
	},
	{
		id: "bkcfo",
		name: "Bookkeeping & CFO Services",
		color: "#2196F3",
		short: "Bkpng & CFO",
		subgroups: [
			{ id: "bkcfo-bk", name: "Bookkeeping" },
			{ id: "bkcfo-pay", name: "Payroll" },
			{ id: "bkcfo-cfo", name: "CFO Services" },
			{ id: "bkcfo-con", name: "Concierge" },
		],
	},
	{
		id: "fin",
		name: "Finance & Lending",
		color: "#FF8C00",
		short: "Finance",
		subgroups: [],
	},
	{
		id: "wm",
		name: "Wealth Management",
		color: "#7B2FBE",
		short: "Wealth",
		subgroups: [],
	},
	{
		id: "rd",
		name: "R&D Tax & Grants",
		color: "#F76707",
		short: "R&D",
		subgroups: [],
	},
	{
		id: "ins",
		name: "Insurance",
		color: "#F5C518",
		short: "Insurance",
		subgroups: [],
	},
];

// ── States & Offices ─────────────────────────────────────────────────────────

export type StateConfig = {
	id: string;
	name: string;
	abbr: string;
	color: string;
	offices: { id: string; name: string }[];
};

export const STATES: StateConfig[] = [
	{
		id: "nsw",
		name: "New South Wales",
		abbr: "NSW",
		color: "#4A90D9",
		offices: [
			{ id: "parramatta", name: "Parramatta" },
			{ id: "st-leonards", name: "St Leonards" },
		],
	},
	{
		id: "vic",
		name: "Victoria",
		abbr: "VIC",
		color: "#5C7CFA",
		offices: [
			{ id: "elsternwick", name: "Elsternwick" },
			{ id: "monash", name: "Monash" },
			{ id: "mornington", name: "Mornington Peninsula" },
			{ id: "mount-waverley", name: "Mount Waverley" },
		],
	},
	{
		id: "qld",
		name: "Queensland",
		abbr: "QLD",
		color: "#12B886",
		offices: [
			{ id: "brisbane", name: "Brisbane" },
			{ id: "bundaberg", name: "Bundaberg" },
			{ id: "fraser-coast", name: "Fraser Coast" },
			{ id: "gympie", name: "Gympie" },
			{ id: "ipswich", name: "Ipswich" },
			{ id: "toowoomba", name: "Toowoomba" },
		],
	},
	{
		id: "wa",
		name: "Western Australia",
		abbr: "WA",
		color: "#A855F7",
		offices: [
			{ id: "osborne-park", name: "Osborne Park" },
			{ id: "swan-valley", name: "Swan Valley" },
		],
	},
	{
		id: "sa",
		name: "South Australia",
		abbr: "SA",
		color: "#e84040",
		offices: [
			{ id: "adelaide", name: "Adelaide" },
			{ id: "barossa", name: "Barossa" },
			{ id: "gawler", name: "Gawler" },
			{ id: "parafield", name: "Parafield" },
		],
	},
];

// ── Role Catalogue ───────────────────────────────────────────────────────────

export type RoleEntry = { level: number; title: string };

export const ROLE_CATALOGUE: Record<string, RoleEntry[]> = {
	acc: [
		{ level: 1, title: "Undergraduate Accountant" },
		{ level: 2, title: "Graduate Accountant" },
		{ level: 3, title: "Accountant" },
		{ level: 4, title: "Senior Accountant" },
		{ level: 5, title: "Client Manager / Tax Manager" },
		{ level: 6, title: "Senior Auditor" },
		{ level: 6, title: "Taxation Specialist" },
		{ level: 7, title: "Senior Manager (ACC)" },
		{ level: 8, title: "Associate Director" },
	],
	"acc-smsf": [{ level: 1, title: "SMSF Manager" }],
	"acc-admin": [
		{ level: 1, title: "Team Administrator" },
		{ level: 2, title: "Senior Team Administrator" },
		{ level: 3, title: "Practice Manager (ACC)" },
	],
	"admin-gen": [
		{ level: 1, title: "Receptionist" },
		{ level: 1, title: "Administration Assistant" },
		{ level: 2, title: "Office Administrator" },
		{ level: 3, title: "Senior Office Administrator" },
		{ level: 4, title: "Office Manager" },
	],
	"admin-pa": [
		{ level: 1, title: "Personal Assistant" },
		{ level: 2, title: "Executive Assistant" },
	],
	bkcfo: [
		{ level: 1, title: "Client Success Specialist (BKK)" },
		{ level: 1, title: "Company Secretary (BKK)" },
		{ level: 1, title: "Junior Bookkeeper" },
		{ level: 2, title: "Bookkeeper" },
		{ level: 3, title: "Senior Bookkeeper" },
		{ level: 4, title: "Client Manager (BKK)" },
		{ level: 5, title: "Senior Client Manager (BKK)" },
		{ level: 6, title: "Senior Manager (BKK)" },
		{ level: 7, title: "Director" },
	],
	"bkcfo-pay": [
		{ level: 1, title: "Payroll Assistant" },
		{ level: 2, title: "Payroll Specialist" },
		{ level: 3, title: "Senior Payroll Officer" },
		{ level: 4, title: "Payroll Manager" },
	],
	wm: [
		{ level: 1, title: "Client Services Assistant" },
		{ level: 2, title: "Client Services Officer" },
		{ level: 3, title: "Client Services Manager" },
		{ level: 1, title: "Paraplanner" },
		{ level: 1, title: "Financial Planner" },
		{ level: 2, title: "Senior Financial Planner" },
		{ level: 3, title: "Financial Planning Manager" },
		{ level: 4, title: "Director (WEA)" },
	],
	fin: [{ level: 1, title: "Loan Administrator" }],
	ins: [
		{ level: 1, title: "Broker Assistant (INS)" },
		{ level: 2, title: "Assistant Client Manager (INS)" },
		{ level: 3, title: "Account Manager (INS)" },
	],
	rd: [
		{ level: 1, title: "R&D Specialist" },
		{ level: 2, title: "R&D Senior Specialist" },
		{ level: 3, title: "R&D Manager" },
	],
};

// ── WFP Constants ────────────────────────────────────────────────────────────

export const STAFF_ROLES = ["Doer", "Reviewer", "BD"] as const;

export const BILLING_ROLE_MODIFIER: Record<string, number> = {
	Doer: 1.0,
	Reviewer: 0.7,
	BD: 0.5,
};

export const PERF_RATING_PRESETS = [50, 75, 90, 100, 110, 125, 150] as const;

export const PROMO_FLAGS = ["No", "Maybe", "Yes"] as const;

export const DEFAULT_BILLING_MULT = 3.5;

// ── FT Hours ─────────────────────────────────────────────────────────────────

export const STATE_FT_HOURS: Record<string, number> = {
	nsw: 37.5,
	vic: 38,
	qld: 37.5,
	wa: 37.5,
	sa: 37.5,
};

export const ENTITY_FT_HOURS: Record<string, number> = {
	"ent-bne": 38,
	"ent-bun": 38,
	"ent-gym": 38,
	"ent-too": 38,
	"ent-frc": 38,
	"ent-ips": 38,
};

export const DEFAULT_FT_HOURS = 37.5;

// ── Hiring Enums ─────────────────────────────────────────────────────────────

export const HIRING_STATUS = ["open", "active", "offer", "closed"] as const;
export const HIRING_PRIORITY = ["urgent", "high", "planned"] as const;
export const HIRING_TYPE = [
	"backfill",
	"growth",
	"succession",
	"new-capability",
] as const;
export const CLOSED_HOW = [
	"internal",
	"external",
	"referral",
	"cancelled",
] as const;

// ── Time to Hire ─────────────────────────────────────────────────────────────

export type TimeToHireEntry = {
	role: string;
	hireWeeks: [number, number];
	noticeWeeks: [number, number];
};

export const TIME_TO_HIRE: Record<string, TimeToHireEntry[]> = {
	acc: [
		{ role: "Junior Accountant", hireWeeks: [3, 5], noticeWeeks: [2, 4] },
		{
			role: "Intermediate Accountant",
			hireWeeks: [4, 6],
			noticeWeeks: [4, 4],
		},
		{ role: "Senior Accountant", hireWeeks: [4, 7], noticeWeeks: [4, 4] },
		{
			role: "Manager / Client Manager",
			hireWeeks: [6, 10],
			noticeWeeks: [4, 4],
		},
		{ role: "Senior Manager", hireWeeks: [8, 12], noticeWeeks: [8, 8] },
		{
			role: "Associate Director",
			hireWeeks: [10, 14],
			noticeWeeks: [8, 12],
		},
		{
			role: "Director / Partner",
			hireWeeks: [24, 52],
			noticeWeeks: [12, 16],
		},
	],
	bkcfo: [
		{ role: "Junior Bookkeeper", hireWeeks: [2, 4], noticeWeeks: [2, 4] },
		{
			role: "Experienced Bookkeeper",
			hireWeeks: [3, 6],
			noticeWeeks: [4, 4],
		},
		{
			role: "Senior Bookkeeper / Client Mgr",
			hireWeeks: [4, 7],
			noticeWeeks: [4, 4],
		},
		{
			role: "Bookkeeping Manager",
			hireWeeks: [5, 8],
			noticeWeeks: [4, 4],
		},
		{
			role: "Senior Manager (BKK)",
			hireWeeks: [7, 11],
			noticeWeeks: [8, 8],
		},
		{ role: "Director (BKK)", hireWeeks: [10, 14], noticeWeeks: [12, 12] },
	],
};

export const TTH_SUMMARY = {
	avgHireWeeks: 6,
	avgNoticeWeeks: 4,
} as const;

export const NOTICE_CONTEXT = {
	standard: 4,
	senior: 8,
	executive: 12,
} as const;

// ── Color Maps ───────────────────────────────────────────────────────────────

export const SL_COLOR_MAP: Record<string, string> = {
	acc: "#4CAF50",
	bkcfo: "#2196F3",
	wm: "#7B2FBE",
	fin: "#FF8C00",
	ins: "#F5C518",
	rd: "#F76707",
	admin: "#9E9E9E",
};

export const STATE_COLOR_MAP: Record<string, string> = {
	nsw: "#4A90D9",
	qld: "#12B886",
	sa: "#e84040",
	vic: "#5C7CFA",
	wa: "#A855F7",
};

// ── FY Options ───────────────────────────────────────────────────────────────

export const FY_OPTIONS = ["FY25-26", "FY24-25", "FY23-24", "FY26-27"] as const;

// ── Helper Lookups ───────────────────────────────────────────────────────────

export function getSL(id: string): ServiceLine | undefined {
	return SERVICE_LINES.find((sl) => sl.id === id);
}

export function getState(id: string): StateConfig | undefined {
	return STATES.find((s) => s.id === id);
}

export function getOfficesForState(
	stateId: string,
): { id: string; name: string }[] {
	return getState(stateId)?.offices ?? [];
}

export function getSubgroupsForSL(
	slId: string,
): { id: string; name: string }[] {
	return getSL(slId)?.subgroups ?? [];
}

export function getFTHours(
	stateId?: string | null,
	entityId?: string | null,
): number {
	if (entityId && entityId in ENTITY_FT_HOURS) {
		return ENTITY_FT_HOURS[entityId] ?? DEFAULT_FT_HOURS;
	}
	if (stateId && stateId in STATE_FT_HOURS) {
		return STATE_FT_HOURS[stateId] ?? DEFAULT_FT_HOURS;
	}
	return DEFAULT_FT_HOURS;
}
