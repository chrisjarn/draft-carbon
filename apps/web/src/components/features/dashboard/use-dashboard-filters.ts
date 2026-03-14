import { useMemo } from "react";
import type { EntitySummary } from "./entity-card";
import type {
	BudgetBySlRaw,
	DashboardStats,
	PartnerByStateRow,
	RevenueByEntityRow,
	RevenueEntry,
	SlBreakdownRaw,
	SlRow,
	StaffByStateRow,
} from "./types";

/* ─── Filtered Stats (KPI totals) ──────────────────────────────────────── */

export function useFilteredStats(
	raw:
		| {
				staffByState: StaffByStateRow[];
				partnerByState: PartnerByStateRow[];
				revenueByEntity: RevenueByEntityRow[];
		  }
		| undefined,
	stateFilter: string | null,
	slFilter: string | null,
): DashboardStats | null {
	return useMemo(() => {
		if (!raw) return null;

		let staff = raw.staffByState;
		if (stateFilter) staff = staff.filter((r) => r.state === stateFilter);
		if (slFilter) staff = staff.filter((r) => r.sl === slFilter);

		let partners = raw.partnerByState;
		if (stateFilter) partners = partners.filter((r) => r.state === stateFilter);
		if (slFilter) partners = partners.filter((r) => r.sl === slFilter);
		const totalPartners = partners.reduce((s, r) => s + r.partnerCount, 0);

		let rev = raw.revenueByEntity;
		if (stateFilter) rev = rev.filter((r) => r.state === stateFilter);
		if (slFilter) rev = rev.filter((r) => r.sls.includes(slFilter));

		const totalCarbonites = staff.reduce((s, r) => s + r.headcount, 0);
		const totalFte = Number(staff.reduce((s, r) => s + r.fte, 0).toFixed(1));
		const revenueTarget = rev.reduce((s, r) => s + r.target, 0);
		const revenueActual = rev.reduce((s, r) => s + r.actual, 0);
		const revenuePct =
			revenueTarget > 0 ? Math.round((revenueActual / revenueTarget) * 100) : 0;

		return {
			totalCarbonites,
			totalFte,
			totalPartners,
			revenueTarget,
			revenueActual,
			revenuePct,
		};
	}, [raw, stateFilter, slFilter]);
}

/* ─── Filtered Entities ────────────────────────────────────────────────── */

export function useFilteredEntities(
	data: EntitySummary[] | undefined,
	stateFilter: string | null,
	slFilter: string | null,
): EntitySummary[] | undefined {
	return useMemo(() => {
		if (!data) return undefined;
		let filtered = data;
		if (stateFilter) filtered = filtered.filter((e) => e.state === stateFilter);
		if (slFilter) filtered = filtered.filter((e) => e.sls.includes(slFilter));
		return filtered;
	}, [data, stateFilter, slFilter]);
}

/* ─── Filtered Revenue ─────────────────────────────────────────────────── */

export function useFilteredRevenue(
	data: RevenueEntry[] | undefined,
	stateFilter: string | null,
	slFilter: string | null,
	entities: EntitySummary[] | undefined,
): RevenueEntry[] | undefined {
	return useMemo(() => {
		if (!data) return undefined;
		let filtered = data;
		if (stateFilter) filtered = filtered.filter((e) => e.state === stateFilter);
		if (slFilter && entities) {
			const slEntityIds = new Set(
				entities.filter((e) => e.sls.includes(slFilter)).map((e) => e.id),
			);
			filtered = filtered.filter((e) => slEntityIds.has(e.id));
		}
		return filtered;
	}, [data, stateFilter, slFilter, entities]);
}

/* ─── Filtered SL Breakdown ────────────────────────────────────────────── */

export function useFilteredSlBreakdown(
	raw: SlBreakdownRaw[] | undefined,
	stateFilter: string | null,
	slFilter: string | null,
): SlRow[] | undefined {
	return useMemo(() => {
		if (!raw) return undefined;

		let filtered = raw;
		if (stateFilter) filtered = filtered.filter((r) => r.state === stateFilter);
		if (slFilter) filtered = filtered.filter((r) => r.sl === slFilter);

		// Aggregate by SL (server returns per-state rows)
		const map = new Map<string, { headcount: number; totalSalary: number }>();
		for (const row of filtered) {
			const existing = map.get(row.sl) ?? { headcount: 0, totalSalary: 0 };
			existing.headcount += row.headcount;
			existing.totalSalary += row.totalSalary;
			map.set(row.sl, existing);
		}

		const totalHeadcount = [...map.values()].reduce(
			(s, r) => s + r.headcount,
			0,
		);

		return [...map.entries()]
			.map(([sl, agg]) => ({
				sl,
				headcount: agg.headcount,
				totalSalary: agg.totalSalary,
				pctOfFirm:
					totalHeadcount > 0
						? Math.round((agg.headcount / totalHeadcount) * 100)
						: 0,
			}))
			.sort((a, b) => b.headcount - a.headcount);
	}, [raw, stateFilter, slFilter]);
}

/* ─── Filtered Budget by SL ────────────────────────────────────────────── */

export function useFilteredBudgetBySl(
	raw: BudgetBySlRaw[] | undefined,
	stateFilter: string | null,
	slFilter: string | null,
): Map<string, number> {
	return useMemo(() => {
		const map = new Map<string, number>();
		if (!raw) return map;

		let filtered = raw;
		if (stateFilter) filtered = filtered.filter((r) => r.state === stateFilter);
		if (slFilter) filtered = filtered.filter((r) => r.sl === slFilter);

		for (const row of filtered) {
			map.set(row.sl, (map.get(row.sl) ?? 0) + row.totalBudget);
		}
		return map;
	}, [raw, stateFilter, slFilter]);
}
