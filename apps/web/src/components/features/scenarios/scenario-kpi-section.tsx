import {
	KpiCard,
	KpiLegend,
	KpiLegendItem,
} from "@/components/molecules/kpi-card";
import { CategoryBar } from "@/components/ui/category-bar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { fmtDollar } from "@/lib/format";

type ScenarioKpiSectionProps = {
	baseBillingCapacity: number;
	basePayroll: number;
	baseMultiple: number;
	baseRevGap: number;
	revenueTarget: number;
	revenueActual: number;
	scenarioCount: number;
	loading: boolean;
};

export function ScenarioKpiSection({
	baseBillingCapacity,
	basePayroll,
	baseMultiple,
	baseRevGap,
	revenueTarget,
	revenueActual,
	scenarioCount,
	loading,
}: ScenarioKpiSectionProps) {
	// Revenue utilisation for ProgressCircle
	const revUtilisation =
		revenueTarget > 0 ? Math.round((revenueActual / revenueTarget) * 100) : 0;

	// Payroll vs billing breakdown for CategoryBar
	const payrollPct =
		baseBillingCapacity > 0
			? Math.round((basePayroll / baseBillingCapacity) * 100)
			: 0;
	const capacityPct = Math.max(0, 100 - payrollPct);

	return (
		<dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{/* Card 1: Billing Capacity with CategoryBar */}
			<KpiCard
				title="Billing Capacity"
				value={fmtDollar(baseBillingCapacity)}
				loading={loading}
			>
				<CategoryBar
					values={[payrollPct, capacityPct]}
					colors={["emerald", "gray"]}
					showLabels={false}
				/>
				<KpiLegend className="mt-3">
					<KpiLegendItem
						color="bg-emerald-500"
						label="Payroll"
						value={fmtDollar(basePayroll)}
					/>
					<KpiLegendItem
						color="bg-gray-400 dark:bg-gray-600"
						label="Available"
						value={fmtDollar(Math.max(0, baseBillingCapacity - basePayroll))}
					/>
				</KpiLegend>
			</KpiCard>

			{/* Card 2: Revenue with ProgressCircle */}
			<KpiCard
				title="Revenue Performance"
				value={fmtDollar(revenueActual)}
				loading={loading}
			>
				<div className="flex items-center justify-between gap-4">
					<div className="space-y-2">
						<div>
							<div className="flex items-center gap-2">
								<span
									className="size-2.5 shrink-0 rounded-sm bg-emerald-500"
									aria-hidden="true"
								/>
								<span className="text-text-soft-400 text-sm">Actual</span>
							</div>
							<span className="mt-0.5 block font-semibold text-xl tabular-nums">
								{fmtDollar(revenueActual)}
							</span>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span
									className="size-2.5 shrink-0 rounded-sm bg-blue-500"
									aria-hidden="true"
								/>
								<span className="text-text-soft-400 text-sm">Target</span>
							</div>
							<span className="mt-0.5 block font-semibold text-xl tabular-nums">
								{fmtDollar(revenueTarget)}
							</span>
						</div>
					</div>
					<ProgressCircle
						value={Math.min(revUtilisation, 100)}
						radius={42}
						strokeWidth={6}
						variant={
							revUtilisation >= 90
								? "success"
								: revUtilisation >= 70
									? "default"
									: "warning"
						}
					>
						<span className="font-semibold text-sm tabular-nums">
							{revUtilisation}%
						</span>
					</ProgressCircle>
				</div>
			</KpiCard>

			{/* Card 3: Multiple & Revenue Gap */}
			<KpiCard
				title="Billing Multiple"
				value={`${baseMultiple.toFixed(2)}\u00D7`}
				loading={loading}
			>
				<div className="space-y-3">
					<div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-text-soft-400">Revenue Gap</span>
							<span
								className={
									baseRevGap > 0
										? "font-medium text-red-500 tabular-nums"
										: baseRevGap < 0
											? "font-medium text-emerald-500 tabular-nums"
											: "font-medium tabular-nums"
								}
							>
								{baseRevGap > 0
									? `${fmtDollar(baseRevGap)} shortfall`
									: baseRevGap < 0
										? `${fmtDollar(Math.abs(baseRevGap))} surplus`
										: "On target"}
							</span>
						</div>
						<ProgressBar
							value={Math.min(
								Math.abs(baseRevGap) > 0
									? Math.round(
											(Math.min(revenueActual, revenueTarget) /
												Math.max(revenueTarget, 1)) *
												100,
										)
									: 100,
								100,
							)}
							variant={
								baseRevGap > 0
									? "error"
									: baseRevGap < 0
										? "success"
										: "default"
							}
							className="mt-2"
						/>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-text-soft-400">Scenarios</span>
						<span className="font-semibold tabular-nums">{scenarioCount}</span>
					</div>
				</div>
			</KpiCard>
		</dl>
	);
}
