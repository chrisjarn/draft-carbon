/* ─── Shared Dashboard Types ───────────────────────────────────────────── */

export type RevenueEntry = {
	id: string;
	biz: string;
	state: string | null;
	target: number;
	actual: number;
	pct: number;
};

export type SlRow = {
	sl: string;
	headcount: number;
	totalSalary: number;
	pctOfFirm: number;
};

export type AlertItem = {
	type: string;
	severity: "warning" | "error" | "info";
	title: string;
	message: string;
	link: string;
};

export type DashboardStats = {
	totalCarbonites: number;
	totalFte: number;
	revenueTarget: number;
	revenueActual: number;
	revenuePct: number;
};

export type StaffByStateRow = {
	state: string | null;
	sl: string | null;
	headcount: number;
	fte: number;
};

export type RevenueByEntityRow = {
	entId: string;
	target: number;
	actual: number;
	state: string | null;
	sls: string[];
};

export type SlBreakdownRaw = {
	sl: string;
	state: string | null;
	headcount: number;
	totalSalary: number;
};

export type BudgetBySlRaw = {
	sl: string;
	state: string | null;
	totalBudget: number;
};
