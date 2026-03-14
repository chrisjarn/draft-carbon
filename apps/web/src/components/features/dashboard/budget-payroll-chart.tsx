import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDollar } from "@/lib/format";

/* ─── Types ────────────────────────────────────────────────────────────── */

interface BudgetPayrollChartProps {
	data: {
		sl: string;
		slName: string;
		budget: number;
		payroll: number;
		color: string;
	}[];
	loading?: boolean;
}

/* ─── Chart config ─────────────────────────────────────────────────────── */

const chartConfig = {
	budget: { label: "Budget", color: "#e4e4e7" },
	payroll: { label: "Payroll", color: "#16a34a" },
} satisfies ChartConfig;

/* ─── Component ────────────────────────────────────────────────────────── */

export function BudgetPayrollChart({ data, loading }: BudgetPayrollChartProps) {
	const chartData = useMemo(
		() =>
			data.map((d) => ({
				...d,
				name: d.slName.length > 16 ? `${d.slName.slice(0, 14)}…` : d.slName,
			})),
		[data],
	);

	if (loading || data.length === 0) {
		return (
			<Card className="flex flex-col">
				<CardHeader>
					<CardTitle className="text-sm">
						Budget vs Payroll by Service Line
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1">
					<Skeleton className="h-[280px] w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col">
			<CardHeader>
				<CardTitle className="text-sm">
					Budget vs Payroll by Service Line
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto min-h-[280px] w-full"
				>
					<BarChart
						accessibilityLayer
						data={chartData}
						margin={{ left: 8, right: 8, top: 8, bottom: 4 }}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="name"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={16}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickFormatter={(v: number) => fmtDollar(v)}
							width={56}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value, name) => (
										<span className="tabular-nums">
											{chartConfig[name as keyof typeof chartConfig]?.label ??
												name}
											: {fmtDollar(value as number)}
										</span>
									)}
								/>
							}
						/>
						<ChartLegend content={<ChartLegendContent payload={[]} />} />
						<Bar
							dataKey="budget"
							radius={[4, 4, 0, 0]}
							fill="#e4e4e7"
							animationDuration={300}
							animationEasing="ease-out"
						/>
						<Bar
							dataKey="payroll"
							radius={[4, 4, 0, 0]}
							animationDuration={300}
							animationEasing="ease-out"
						>
							{chartData.map((entry) => (
								<Cell
									key={entry.sl}
									fill={entry.payroll > entry.budget ? "#ef4444" : entry.color}
								/>
							))}
						</Bar>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
