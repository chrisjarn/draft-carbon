// ── Shared types for the Capacity Plan page ──────────────────────────────────

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
	} | null;
};

export type MetaForm = {
	perfRating: string;
	promoFlag: string;
	promoEta: string;
	staffRole: string;
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
	}[];
	openHiringCount: number;
};
