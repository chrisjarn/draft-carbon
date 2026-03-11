import { BarChartIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ReferenceLine,
	XAxis,
} from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
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

/* ─── Revenue color helpers ────────────────────────────────────────────── */

function revColor(pct: number): string {
	if (pct >= 95) return "#10b981";
	if (pct >= 80) return "#f59e0b";
	return "#ef4444";
}

/* ─── Reference Label ──────────────────────────────────────────────────── */

const CHART_MARGIN = 40;

interface CustomReferenceLabelProps {
	viewBox?: { x?: number; y?: number };
	value: string;
}

const CustomReferenceLabel: React.FC<CustomReferenceLabelProps> = ({
	viewBox,
	value,
}) => {
	const x = viewBox?.x ?? 0;
	const y = viewBox?.y ?? 0;
	const width = value.length * 7.5 + 12;
	return (
		<>
			<rect
				x={x - CHART_MARGIN}
				y={y - 9}
				width={width}
				height={18}
				fill="var(--foreground)"
				rx={4}
			/>
			<text
				fontWeight={600}
				fontSize={11}
				x={x - CHART_MARGIN + 6}
				y={y + 4}
				fill="var(--background)"
				className="font-mono"
			>
				{value}
			</text>
		</>
	);
};

/* ─── Chart config ─────────────────────────────────────────────────────── */

const revenueChartConfig = {
	target: {
		label: "Target",
		color: "hsl(var(--muted-foreground))",
	},
	actual: {
		label: "Actual",
		color: "var(--color-emerald-500, #10b981)",
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
	const [activeChart, setActiveChart] = React.useState<"target" | "actual">(
		"actual",
	);
	const [activeIndex, setActiveIndex] = React.useState<number | undefined>(
		undefined,
	);

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

	const displayEntry = React.useMemo(() => {
		if (activeIndex !== undefined && chartData[activeIndex])
			return {
				index: activeIndex,
				value: chartData[activeIndex][activeChart],
			};
		return chartData.reduce(
			(max, d, i) =>
				d[activeChart] > max.value ? { index: i, value: d[activeChart] } : max,
			{ index: 0, value: 0 },
		);
	}, [activeIndex, chartData, activeChart]);

	const [animatedValue, setAnimatedValue] = React.useState(displayEntry.value);
	const prevDisplayValue = React.useRef(displayEntry.value);
	React.useEffect(() => {
		if (prevDisplayValue.current !== displayEntry.value) {
			prevDisplayValue.current = displayEntry.value;
			setAnimatedValue(displayEntry.value);
		}
	}, [displayEntry.value]);

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

	return (
		<Card className="flex h-full flex-col py-0">
			<CardHeader className="!p-0 flex flex-col items-stretch border-zinc-100 border-b sm:flex-row">
				<div className="sm:!py-0 flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3">
					<CardTitle className="font-semibold text-sm">
						Revenue by Entity
					</CardTitle>
					<CardDescription className="text-xs">{fy}</CardDescription>
				</div>
				<div className="flex">
					{(["target", "actual"] as const).map((key) => (
						<button
							key={key}
							type="button"
							data-active={activeChart === key}
							className="relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-2.5 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-6 sm:py-3"
							onClick={() => setActiveChart(key)}
						>
							<span className="text-[10px] text-muted-foreground">
								{revenueChartConfig[key].label}
							</span>
							<span className="font-bold text-base tabular-nums leading-none sm:text-lg">
								{fmtDollar(totals[key])}
							</span>
						</button>
					))}
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
						margin={{ left: CHART_MARGIN, right: 4, top: 12, bottom: 4 }}
						onMouseLeave={() => setActiveIndex(undefined)}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="name"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={24}
						/>
						<Bar
							dataKey={activeChart}
							radius={4}
							cursor="pointer"
							animationDuration={300}
							animationEasing="ease-out"
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
							{chartData.map((entry, i) => (
								<Cell
									key={entry.id}
									className="duration-200"
									fill={
										activeChart === "target"
											? "color-mix(in oklch, var(--muted-foreground) 30%, transparent)"
											: revColor(entry.pct)
									}
									opacity={i === displayEntry.index ? 1 : 0.2}
									onMouseEnter={() => setActiveIndex(i)}
								/>
							))}
						</Bar>
						<ReferenceLine
							y={animatedValue}
							stroke="var(--foreground)"
							strokeWidth={1}
							strokeDasharray="3 3"
							opacity={0.4}
							label={
								<CustomReferenceLabel value={fmtDollar(displayEntry.value)} />
							}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
