// -- Shared types for FY Planning feature -----------------------------------

export type EntityWithRevenue = {
	id: string;
	biz: string;
	state: string | null;
	officeId: string | null;
	revenue: { target: string | null; actual: string | null } | null;
};

/** Flat row type for TanStack Table (normalized state) */
export type RevenueRow = EntityWithRevenue & { stateGroup: string };

export type CsvRow = {
	state: string;
	office: string;
	podName: string;
	budget: number;
};

export type PodBudgetRow = {
	state: string;
	office: string;
	podName: string;
	budget: number;
};

export type PriorYearRow = {
	state: string;
	office: string;
	podName: string;
	year: string;
	budget: number | null;
	headcount: number | null;
};

export type ComparisonRow = {
	state: string;
	office: string;
	podName: string;
	currentBudget: number;
	priorBudget: number | null;
	yoyChange: number | null;
	yoyPct: number | null;
};

export type PodStaffAgg = { headcount: number; staffCost: number };

// -- Helpers ------------------------------------------------------------------

export function fmt(v: string | null | undefined): string {
	const n = Number(v);
	if (!v || Number.isNaN(n) || n === 0) return "\u2014";
	if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}m`;
	if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
	return `$${n}`;
}

export function variance(
	target: string | null,
	actual: string | null,
): { val: string; positive: boolean | null } {
	const t = Number(target);
	const a = Number(actual);
	if (!t || !a) return { val: "\u2014", positive: null };
	const diff = a - t;
	const positive = diff >= 0;
	const abs = Math.abs(diff);
	const label =
		abs >= 1_000_000
			? `${(abs / 1_000_000).toFixed(2)}m`
			: abs >= 1_000
				? `${Math.round(abs / 1_000)}k`
				: String(abs);
	return { val: `${positive ? "+" : "-"}$${label}`, positive };
}

export function attainmentPct(
	target: string | null,
	actual: string | null,
): number | null {
	const t = Number(target);
	const a = Number(actual);
	if (!t || !a) return null;
	return Math.round((a / t) * 100);
}

export function derivePriorFy(fy: string): string {
	const match = fy.match(/^FY(\d{2})-(\d{2})$/);
	if (!match) return fy;
	const start = Number(match[1]) - 1;
	const end = Number(match[2]) - 1;
	return `FY${String(start).padStart(2, "0")}-${String(end).padStart(2, "0")}`;
}

export function exportRevenueCsv(rows: EntityWithRevenue[], fy: string): void {
	const header = "entity,state,target,actual,variance,attainment%";
	const lines = rows.map((r) => {
		const target = r.revenue?.target ?? "";
		const actual = r.revenue?.actual ?? "";
		const t = Number(target);
		const a = Number(actual);
		const diff = t && a ? a - t : 0;
		const pct = t ? Math.round((a / t) * 100) : 0;
		return `"${r.biz}","${r.state ?? ""}",${target},${actual},${diff},${pct}`;
	});

	const csv = [header, ...lines].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `fy-${fy}-revenue.csv`;
	link.click();
	URL.revokeObjectURL(url);
}

export function parseCsvRows(raw: string): CsvRow[] {
	const lines = raw
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0);

	if (lines.length === 0) return [];

	const rows: CsvRow[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const parts = line.split(",").map((p) => p.trim());
		if (parts.length < 4) continue;

		const budgetVal = Number(parts[3]);
		if (Number.isNaN(budgetVal)) continue;

		rows.push({
			state: parts[0] ?? "",
			office: parts[1] ?? "",
			podName: parts[2] ?? "",
			budget: Math.round(budgetVal),
		});
	}

	return rows;
}
