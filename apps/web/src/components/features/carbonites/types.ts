import { getSubgroupsForSL, SERVICE_LINES, STATES } from "@/lib/constants";
import type { RouterOutputs } from "@/utils/trpc";

// ── Carbonite type (derived from API) ────────────────────────────────────────

export type Carbonite = RouterOutputs["carbonites"]["getAll"][number];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function seniorityLabel(s: number | null) {
	if (!s) return "—";
	if (s >= 9) return "Principal";
	if (s >= 7) return "Senior";
	if (s >= 5) return "Mid";
	if (s >= 3) return "Junior";
	return "Graduate";
}

export function slColor(slId: string | null): string {
	if (!slId) return "#9E9E9E";
	return SERVICE_LINES.find((s) => s.id === slId)?.color ?? "#9E9E9E";
}

export function slLabel(
	slId: string | null,
	mode: "full" | "short" = "full",
): string {
	if (!slId) return "—";
	const sl = SERVICE_LINES.find((s) => s.id === slId);
	if (!sl) return slId;
	return mode === "short" ? sl.short : sl.name;
}

export function slName(slId: string | null): string {
	if (!slId) return "—";
	return SERVICE_LINES.find((s) => s.id === slId)?.name ?? slId;
}

export function stateLabel(stateId: string | null): string {
	if (!stateId) return "—";
	return STATES.find((s) => s.id === stateId)?.abbr ?? stateId.toUpperCase();
}

export function stateName(stateId: string | null): string {
	if (!stateId) return "—";
	return STATES.find((s) => s.id === stateId)?.name ?? stateId;
}

export function officeLabel(officeId: string | null): string {
	if (!officeId) return "—";
	for (const state of STATES) {
		const office = state.offices.find((o) => o.id === officeId);
		if (office) return office.name;
	}
	return officeId;
}

export function sgLabel(slId: string | null, sgId: string | null): string {
	if (!sgId) return "—";
	if (slId) {
		const found = getSubgroupsForSL(slId).find((s) => s.id === sgId);
		if (found) return found.name;
	}
	// fallback: search all SLs
	for (const sl of SERVICE_LINES) {
		const found = sl.subgroups.find((s) => s.id === sgId);
		if (found) return found.name;
	}
	return sgId;
}

export function unique(items: Carbonite[], key: keyof Carbonite): string[] {
	const vals = items
		.map((i) => i[key] as string | null)
		.filter((v): v is string => !!v);
	return [...new Set(vals)].sort();
}

// ── Filter types ─────────────────────────────────────────────────────────────

export type Filters = {
	search: string;
	state: string;
	sl: string;
	office: string;
	type: string;
};

export const EMPTY_FILTERS: Filters = {
	search: "",
	state: "",
	sl: "",
	office: "",
	type: "",
};

// ── Form types ───────────────────────────────────────────────────────────────

export type FormState = {
	name: string;
	role: string;
	sl: string;
	sg: string;
	state: string;
	office: string;
	pod: string;
	salary: string;
	type: "FT" | "PT";
	seniority: string;
	location: string;
	hours: string;
	isPartner: boolean;
	entity: string;
	reportsTo: string;
};

export function emptyForm(): FormState {
	return {
		name: "",
		role: "",
		sl: "",
		sg: "",
		state: "",
		office: "",
		pod: "",
		salary: "",
		type: "FT",
		seniority: "5",
		location: "",
		hours: "",
		isPartner: false,
		entity: "",
		reportsTo: "",
	};
}

export function carboniteToForm(c: Carbonite): FormState {
	return {
		name: c.name,
		role: c.role ?? "",
		sl: c.sl ?? "",
		sg: c.sg ?? "",
		state: c.state ?? "",
		office: c.office ?? "",
		pod: c.pod ?? "",
		salary: c.salary?.toString() ?? "",
		type: (c.type as "FT" | "PT") ?? "FT",
		seniority: c.seniority?.toString() ?? "5",
		location: c.location ?? "",
		hours: c.hours?.toString() ?? "",
		isPartner: c.isPartner ?? false,
		entity: c.entity ?? "",
		reportsTo: c.reportsTo ?? "",
	};
}
