import { useMemo } from "react";
import {
	Bar,
	CartesianGrid,
	Cell,
	ComposedChart,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { DEFAULT_BILLING_MULT } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { MetricCell } from "./metric-cell";
import type { ScenarioImpact } from "./scenario-card";
import type { ScenarioRoleValues } from "./wizard-types";

// ── Types ───────────────────────────────────────────────────────────────────

type Props = {
	impact: ScenarioImpact;
	baseHeadcount: number;
	basePayroll: number;
	baseBillingCapacity: number;
	baseMultiple: number;
	baseRevGap: number;
	revenueTarget: number;
	hires: ScenarioRoleValues[];
	billingMultiplier: string | null;
};

// ── Chart config ─────────────────────────────────────────────────────────────

const chartConfig = {
	value: { label: "Amount" },
} satisfies ChartConfig;

// ── Component ────────────────────────────────────────────────────────────────

export function ScenarioOutcomePanel({
	impact,
	baseHeadcount,
	basePayroll,
	baseBillingCapacity,
	baseMultiple,
	baseRevGap,
	revenueTarget,
	hires,
	billingMultiplier,
}: Props) {
	const multiplier = Number(billingMultiplier) || DEFAULT_BILLING_MULT;

	// Waterfall data
	const waterfallData = useMemo(() => {
		const rows: { name: string; value: number; fill: string }[] = [];

		rows.push({
			name: "Current Gap",
			value: baseRevGap,
			fill:
				baseRevGap <= 0
					? "var(--color-emerald-500, #10b981)"
					: "var(--color-red-400, #f87171)",
		});

		for (const hire of hires) {
			const salary = Number(hire.salary) || 0;
			const count = Number(hire.count) || 1;
			if (!hire.roleTitle || !salary) continue;
			const hireBilling = Math.round(salary * multiplier) * count;
			rows.push({
				name: hire.roleTitle,
				value: -hireBilling,
				fill: "var(--color-emerald-500, #10b981)",
			});
		}

		rows.push({
			name: "Net Position",
			value: impact.revisedRevGap,
			fill:
				impact.revisedRevGap <= 0
					? "var(--color-emerald-500, #10b981)"
					: "var(--color-amber-400, #fbbf24)",
		});

		return rows;
	}, [baseRevGap, hires, impact.revisedRevGap, multiplier]);

	const isSurplus = impact.revisedRevGap <= 0;
	const targetMultiple = basePayroll > 0 ? revenueTarget / basePayroll : 0;
	const multipleColor =
		impact.revisedMultiple >= targetMultiple
			? "text-emerald-400"
			: "text-amber-400";

	// Risk flags
	const risks: string[] = [];
	const hasUnallocated = hires.some((h) => h.roleTitle && h.salary && !h.sl);
	if (impact.headcount > 0 && hasUnallocated) {
		risks.push(
			"Unallocated hires may not be assigned to a pod — confirm service line before activating.",
		);
	}
	const payrollRatio =
		impact.revisedBillingCap > 0
			? impact.revisedPayroll / impact.revisedBillingCap
			: 0;
	if (payrollRatio > 0.4) {
		risks.push(
			"Payroll ratio exceeds 40% of billing capacity — review before activating.",
		);
	}

	return (
		<div className="space-y-6 overflow-y-auto bg-bg-weak-50 p-6">
			{/* Headline metrics */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Scenario Impact</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-2 gap-4">
					<MetricCell
						label="Headcount"
						value={`${baseHeadcount} → ${baseHeadcount + impact.headcount}`}
					/>
					<MetricCell
						label="Annual Payroll"
						value={`${fmtDollar(basePayroll)} → ${fmtDollar(impact.revisedPayroll)}`}
					/>
					<MetricCell
						label="Billing Capacity"
						value={`${fmtDollar(baseBillingCapacity)} → ${fmtDollar(impact.revisedBillingCap)}`}
					/>
					<MetricCell
						label="Billing Multiple"
						value={`${baseMultiple.toFixed(2)}× → ${impact.revisedMultiple.toFixed(2)}×`}
						valueClass={multipleColor}
					/>
				</CardContent>
			</Card>

			{/* Revenue Gap card */}
			<div
				className={`rounded-xl border p-6 text-center ${
					isSurplus
						? "border-green-200 bg-green-50"
						: "border-red-200 bg-red-50"
				}`}
			>
				<p className="mb-1 text-text-soft-400 text-xs">Revenue Gap</p>
				{isSurplus ? (
					<p className="font-bold text-4xl text-green-600">SURPLUS</p>
				) : (
					<p className="font-bold text-4xl text-red-500">
						{fmtDollar(impact.revisedRevGap)}
					</p>
				)}
				{impact.revisedRevGap !== 0 && (
					<p className="mt-1 text-text-soft-400 text-xs">
						{isSurplus
							? `${fmtDollar(Math.abs(impact.revisedRevGap))} above target`
							: "shortfall remaining"}
					</p>
				)}
			</div>

			{/* Waterfall chart */}
			{waterfallData.length > 0 && (
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Impact Waterfall</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-48 w-full">
							<ComposedChart data={waterfallData}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis
									dataKey="name"
									tick={{ fontSize: 10 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									tickFormatter={(v: number) => fmtDollar(v)}
									tick={{ fontSize: 10 }}
									tickLine={false}
									axisLine={false}
									width={55}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											formatter={(v) => fmtDollar(Number(v))}
										/>
									}
								/>
								<ReferenceLine
									y={0}
									stroke="currentColor"
									strokeOpacity={0.2}
								/>
								<Bar
									dataKey="value"
									radius={[2, 2, 0, 0]}
									isAnimationActive={false}
								>
									{waterfallData.map((entry) => (
										<Cell key={entry.name} fill={entry.fill} />
									))}
								</Bar>
							</ComposedChart>
						</ChartContainer>
					</CardContent>
				</Card>
			)}

			{/* Payroll runway narrative */}
			{impact.revisedPayroll > 0 && (
				<p className="text-pretty text-sm text-text-soft-400">
					At this payroll level, the entity needs{" "}
					<span className="text-text-strong-950">
						{fmtDollar(impact.revisedPayroll)}
					</span>{" "}
					in salary to generate{" "}
					<span className="text-text-strong-950">
						{fmtDollar(impact.revisedBillingCap)}
					</span>{" "}
					billing capacity — a{" "}
					<span className={multipleColor}>
						{impact.revisedMultiple.toFixed(1)}×
					</span>{" "}
					billing multiple.
				</p>
			)}

			{/* Risk flags */}
			{risks.length > 0 && (
				<div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
					<p className="mb-1.5 font-medium text-amber-700 text-xs">
						Risk Flags
					</p>
					<ul className="list-inside list-disc space-y-1 text-amber-700 text-xs">
						{risks.map((r) => (
							<li key={r}>{r}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
