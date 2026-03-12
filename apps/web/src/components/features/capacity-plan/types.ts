// ── Shared types for the Capacity Plan page ──────────────────────────────────

// ── Pod Budget types ──────────────────────────────────────────────────────────

export type Carbonite = {
	id: string;
	name: string | null;
	role: string | null;
	salary: number | null;
	sl: string | null;
	state: string | null;
	office: string | null;
	pod: string | null;
	isPartner: boolean | null;
	reportsTo: string | null;
};

export type PodBudget = {
	state: string;
	office: string;
	podName: string;
	budget: number;
};

export type PodRow = {
	podName: string;
	budget: number;
	actual: number;
	dominantSl: string | null;
	totalSalary: number;
	/** True when budget was explicitly set in pod_budgets table (not a fallback) */
	hasBudgetSet: boolean;
};

export type OfficeGroup = {
	office: string;
	pods: PodRow[];
	totalBudget: number;
	totalActual: number;
	totalSalary: number;
};

export type StateGroup = {
	state: string;
	offices: OfficeGroup[];
	totalBudget: number;
	totalActual: number;
	totalSalary: number;
};

export type SelectedPod = {
	state: string;
	office: string;
	podName: string;
};

export type PodTableRow = {
	stateGroup: string;
	officeGroup: string;
	podName: string;
	budget: number;
	totalSalary: number;
	actual: number;
	hasBudgetSet: boolean;
	dominantSl: string | null;
	variance: number;
	utilisation: number;
	/** Sentinel flag — when true, the row renders an "Add Pod" button instead of data */
	isAddPodRow?: boolean;
};

// ── Risk types ────────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high";

export const RISK_STYLES: Record<string, string> = {
	low: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	medium: "border-amber-500/40 bg-amber-500/10 text-amber-400",
	high: "border-red-500/40 bg-red-500/10 text-red-400",
};

export type StaffWithMeta = {
	id: string;
	name: string;
	role: string | null;
	sl: string | null;
	state: string | null;
	office: string | null;
	pod: string | null;
	salary: number | null;
	seniority: number | null;
	meta: {
		cbId: string;
		billingTarget: string | null;
		billingActual: string | null;
		perfRating: string | null;
		promoFlag: string | null;
		promoEta: string | null;
		staffRole: string | null;
		roleTag: string | null;
	} | null;
};

export type MetaForm = {
	perfRating: string;
	promoFlag: string;
	promoEta: string;
	staffRole: string;
	roleTag: string;
	billingTarget: string;
	billingActual: string;
};

export type EntityDetailData = {
	entity: {
		id: string;
		biz: string;
		state: string | null;
		officeId: string | null;
	};
	settings: {
		billingMultiplier: string | null;
		fy: string | null;
	} | null;
	revenue: {
		target: string | null;
		actual: string | null;
		fy: string;
	} | null;
	totalPayroll: number;
	billingCapacity: number;
	revenueGap: number;
	pods: { name: string; headcount: number; totalSalary: number }[];
	staff: {
		id: string;
		name: string;
		role: string | null;
		sl: string | null;
		state: string | null;
		office: string | null;
		pod: string | null;
		salary: number | null;
		entity: string | null;
		meta: {
			cbId: string;
			billingTarget: string | null;
			billingActual: string | null;
			perfRating: string | null;
			promoFlag: string | null;
			promoEta: string | null;
			staffRole: string | null;
			roleTag: string | null;
		} | null;
	}[];
	openHiringCount: number;
};
