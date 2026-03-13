import { BarChartIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
} from "@/components/ui/chart";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDollar } from "@/lib/format";
import type { RevenueEntry } from "./types";

/* ─── Attainment colour util ───────────────────────────────────────────── */

function getAttainmentColor(actual: number, target: number): string {
	if (target === 0) return "var(--color-green-500)";
	const ratio = actual / target;
	if (ratio >= 0.95) return "var(--color-green-500)";
	if (ratio >= 0.8) return "var(--color-yellow-500)";
	if (ratio >= 0.7) return "var(--color-orange-500)";
	return "var(--color-red-500)";
}

/* ─── Chart config ─────────────────────────────────────────────────────── */

const revenueChartConfig = {
	target: {
		label: "Target",
		color: "#e4e4e7",
	},
	actual: {
		label: "Actual",
		color: "#16a34a",
	},
} satisfies ChartConfig;

/* ─── Revenue Chart ────────────────────────────────────────────────────── */

interface RevenueChartProps {
	data: RevenueEntry[] | undefined;
	loading: boolean;
	fy: string;
}

export function RevenueChart({ data, loading, fy }: RevenueChartProps) {
	const navigate = useNavigate();

	const chartData = React.useMemo(
		() =>
			(data ?? []).map((d) => ({
				...d,
				name: d.biz.length > 14 ? `${d.biz.slice(0, 12)}…` : d.biz,
				target: d.target,
				actual: d.actual,
			})),
		[data],
	);

	if (loading) {
		return <Skeleton className="h-full min-h-[200px] w-full" />;
	}

	if (!data || data.length === 0) {
		return (
			<Card className="flex h-full min-h-[280px] flex-col">
				<CardContent className="flex flex-1 items-center justify-center">
					<Empty className="py-0 md:py-0">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<HugeiconsIcon icon={BarChartIcon} />
							</EmptyMedia>
							<EmptyTitle>No revenue data</EmptyTitle>
							<EmptyDescription>
								No revenue entries for {fy}. Add revenue targets to see the
								chart.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</CardContent>
			</Card>
		);
	}

	const totals = {
		target: data.reduce((s, d) => s + d.target, 0),
		actual: data.reduce((s, d) => s + d.actual, 0),
	};
	const attainment =
		totals.target > 0 ? Math.round((totals.actual / totals.target) * 100) : 0;

	return (
		<Card className="flex h-full flex-col">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex flex-col gap-1">
						<CardTitle className="font-semibold text-sm">
							Revenue by Entity
						</CardTitle>
						<CardDescription className="text-xs">
							{fy} &middot; {fmtDollar(totals.actual)} of{" "}
							{fmtDollar(totals.target)} ({attainment}%)
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="min-h-[280px] flex-1">
				<ChartContainer
					config={revenueChartConfig}
					className="h-full min-h-[280px] w-full"
				>
					<BarChart
						accessibilityLayer
						data={chartData}
						margin={{ left: 0, right: 4, top: 4, bottom: 4 }}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="name"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={24}
							fontSize={11}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickFormatter={(v: number) => fmtDollar(v)}
							width={60}
							fontSize={11}
						/>
						<ChartTooltip
							content={({ active, payload }) => {
								if (!active || !payload?.length) return null;
								const d = payload[0]?.payload as (typeof chartData)[number];
								if (!d) return null;
								const color = getAttainmentColor(d.actual, d.target);
								const delta = d.actual - d.target;
								return (
									<div className="rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-3 py-2 text-sm shadow-md">
										<p className="mb-1 font-medium">{d.biz}</p>
										<div className="space-y-0.5 text-xs">
											<div className="flex justify-between gap-4 tabular-nums">
												<span className="text-text-soft-400">Target</span>
												<span>{fmtDollar(d.target)}</span>
											</div>
											<div className="flex justify-between gap-4 tabular-nums">
												<span className="text-text-soft-400">Actual</span>
												<span style={{ color }}>{fmtDollar(d.actual)}</span>
											</div>
											<div className="flex justify-between gap-4 tabular-nums">
												<span className="text-text-soft-400">
													Attainment
												</span>
												<span style={{ color }}>{d.pct}%</span>
											</div>
											<div className="flex justify-between gap-4 tabular-nums">
												<span className="text-text-soft-400">Delta</span>
												<span
													style={{
														color:
															delta >= 0
																? "var(--color-green-500)"
																: "var(--color-red-500)",
													}}
												>
													{delta >= 0 ? "+" : "−"}
													{fmtDollar(Math.abs(delta))}
												</span>
											</div>
										</div>
									</div>
								);
							}}
						/>
						<ChartLegend content={<ChartLegendContent />} />
						<Bar
							dataKey="target"
							fill="var(--color-target)"
							radius={[4, 4, 0, 0]}
							cursor="pointer"
							onClick={(_data: unknown, index: number) => {
								const entry = chartData[index];
								if (entry) {
									navigate({
										to: "/capacity-plan",
										search: { entity: entry.id, fy },
									});
								}
							}}
						/>
						<Bar
							dataKey="actual"
							radius={[4, 4, 0, 0]}
							cursor="pointer"
							onClick={(_data: unknown, index: number) => {
								const entry = chartData[index];
								if (entry) {
									navigate({
										to: "/capacity-plan",
										search: { entity: entry.id, fy },
									});
								}
							}}
						>
							{chartData.map((entry) => (
								<Cell
									key={entry.id}
									fill={getAttainmentColor(entry.actual, entry.target)}
								/>
							))}
						</Bar>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
