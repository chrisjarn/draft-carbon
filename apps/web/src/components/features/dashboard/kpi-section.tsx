import { KpiCard } from "@/components/molecules/kpi-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { fmtDollar } from "@/lib/format";
import type { EntitySummary } from "./entity-card";
import type { DashboardStats } from "./types";

/* ─── KPI Section ──────────────────────────────────────────────────────── */

interface KpiSectionProps {
	stats: DashboardStats | null;
	entities: EntitySummary[] | undefined;
	loading: boolean;
	revenueActual: number;
	revenueTarget: number;
}

export function KpiSection({
	stats,
	entities,
	loading,
	revenueActual,
	revenueTarget,
}: KpiSectionProps) {
	const entityCount = entities?.length ?? 0;
	const totalPayroll = entities?.reduce((s, e) => s + e.totalSalary, 0) ?? 0;

	const payrollPct =
		revenueActual > 0 ? (totalPayroll / revenueActual) * 100 : 0;
	const revenuePct = stats?.revenuePct ?? 0;

	// Revenue attainment colour thresholds
	const revenueValueClass =
		revenuePct >= 90
			? "text-emerald-700"
			: revenuePct >= 75
				? "text-yellow-600"
				: "text-red-600";
	const revenueProgressVariant =
		revenuePct >= 90
			? ("success" as const)
			: revenuePct >= 75
				? ("warning" as const)
				: ("error" as const);

	// Payroll ratio colour thresholds
	const payrollValueClass =
		payrollPct > 40
			? "text-red-600"
			: payrollPct > 35
				? "text-yellow-600"
				: "text-text-strong-950";
	const payrollStatusText =
		payrollPct > 40
			? "Above threshold"
			: payrollPct > 35
				? "Approaching threshold"
				: "Within target range";
	const payrollStatusColor =
		payrollPct > 40
			? "text-red-600"
			: payrollPct > 35
				? "text-yellow-600"
				: "text-text-soft-400";

	return (
		<dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<KpiCard
				title="Total Carbonites"
				value={stats?.totalCarbonites ?? 0}
				valueClass="text-emerald-700"
				loading={loading}
			>
				<p className="text-text-soft-400 text-xs">
					{entityCount} entities nationwide
				</p>
			</KpiCard>

			<KpiCard
				title="Revenue Attainment"
				value={<span className="tabular-nums">{revenuePct}%</span>}
				valueClass={revenueValueClass}
				loading={loading}
			>
				<ProgressBar value={revenuePct} variant={revenueProgressVariant} />
				<p className="mt-1 text-text-soft-400 text-xs tabular-nums">
					{fmtDollar(revenueActual)} of {fmtDollar(revenueTarget)}
				</p>
			</KpiCard>

			<KpiCard
				title="Total Payroll"
				value={fmtDollar(totalPayroll)}
				valueClass="text-text-strong-950"
				loading={loading}
			>
				<p className="text-text-soft-400 text-xs">Live from pod salaries</p>
			</KpiCard>

			<KpiCard
				title="Payroll Ratio"
				value={<span className="tabular-nums">{payrollPct.toFixed(1)}%</span>}
				valueClass={payrollValueClass}
				loading={loading}
			>
				<p className={`text-xs tabular-nums ${payrollStatusColor}`}>
					{payrollStatusText}
				</p>
			</KpiCard>
		</dl>
	);
}
