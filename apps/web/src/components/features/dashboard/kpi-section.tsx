import {
	KpiCard,
	KpiLegend,
	KpiLegendItem,
} from "@/components/molecules/kpi-card";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { fmtDollar } from "@/lib/format";
import type { DashboardStats } from "./types";

/* ─── Revenue color helpers ────────────────────────────────────────────── */

function revTextColor(pct: number): string {
	if (pct >= 95) return "text-emerald-500";
	if (pct >= 80) return "text-amber-500";
	return "text-red-500";
}

/* ─── KPI Section ──────────────────────────────────────────────────────── */

interface KpiSectionProps {
	stats: DashboardStats | null;
	loading: boolean;
	activeFy: string;
}

export function KpiSection({ stats, loading, activeFy }: KpiSectionProps) {
	return (
		<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<KpiCard
				title="Carbonites"
				value={stats?.totalCarbonites ?? 0}
				loading={loading}
			>
				<KpiLegend>
					<KpiLegendItem
						color="bg-primary"
						label="Active staff"
						value={stats?.totalCarbonites ?? 0}
					/>
					<KpiLegendItem
						color="bg-muted-foreground"
						label="FTE"
						value={stats?.totalFte ?? 0}
					/>
				</KpiLegend>
			</KpiCard>

			<KpiCard
				title="Revenue Target"
				value={fmtDollar(stats?.revenueTarget)}
				loading={loading}
			>
				<KpiLegend>
					<KpiLegendItem
						color="bg-emerald-500"
						label="Actual"
						value={fmtDollar(stats?.revenueActual)}
					/>
					<KpiLegendItem color="bg-muted-foreground" label={activeFy} />
				</KpiLegend>
			</KpiCard>

			<KpiCard
				title="Revenue Attainment"
				value={stats ? `${stats.revenuePct}%` : "—"}
				valueClass={stats ? revTextColor(stats.revenuePct) : undefined}
				loading={loading}
			>
				<div className="flex items-center justify-between gap-4">
					<KpiLegend>
						<KpiLegendItem
							color={
								stats && stats.revenuePct >= 95
									? "bg-emerald-500"
									: stats && stats.revenuePct >= 80
										? "bg-amber-500"
										: "bg-red-500"
							}
							label="to target"
						/>
					</KpiLegend>
					<ProgressCircle
						value={stats?.revenuePct ?? 0}
						radius={32}
						strokeWidth={5}
						variant={
							stats && stats.revenuePct >= 95
								? "success"
								: stats && stats.revenuePct >= 80
									? undefined
									: "error"
						}
					>
						<span className="font-semibold text-xs tabular-nums">
							{stats?.revenuePct ?? 0}%
						</span>
					</ProgressCircle>
				</div>
			</KpiCard>
		</dl>
	);
}
