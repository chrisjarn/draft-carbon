import { KpiCard } from "@/components/molecules/kpi-card";
import { fmtDollar } from "@/lib/format";
import type { EntitySummary } from "./entity-card";
import type { DashboardStats } from "./types";

/* ─── KPI Section ──────────────────────────────────────────────────────── */

interface KpiSectionProps {
	stats: DashboardStats | null;
	entities: EntitySummary[] | undefined;
	loading: boolean;
}

export function KpiSection({ stats, entities, loading }: KpiSectionProps) {
	const entityCount = entities?.length ?? 0;
	const totalPayroll = entities?.reduce((s, e) => s + e.totalSalary, 0) ?? 0;
	const podCount = entities?.reduce((s, e) => s + e.podCount, 0) ?? 0;
	const staffWithSalary =
		entities?.reduce(
			(s, e) => s + (e.totalSalary > 0 ? e.headcount : 0),
			0,
		) ?? 0;

	return (
		<dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<KpiCard
				title="Total Carbonites"
				value={stats?.totalCarbonites ?? 0}
				loading={loading}
			>
				<p className="text-muted-foreground text-xs">
					{entityCount} entities nationwide
				</p>
			</KpiCard>

			<KpiCard
				title="Total Partners"
				value={stats?.totalPartners ?? 0}
				loading={loading}
			>
				<p className="text-muted-foreground text-xs">
					Across all entities
				</p>
			</KpiCard>

			<KpiCard
				title="Total Payroll"
				value={fmtDollar(totalPayroll)}
				loading={loading}
			>
				<p className="text-muted-foreground text-xs">
					Live from pod salaries
				</p>
			</KpiCard>

			<KpiCard
				title="Active Pods"
				value={podCount}
				loading={loading}
			>
				<p className="text-muted-foreground text-xs">
					{staffWithSalary} staff with salary set
				</p>
			</KpiCard>
		</dl>
	);
}
