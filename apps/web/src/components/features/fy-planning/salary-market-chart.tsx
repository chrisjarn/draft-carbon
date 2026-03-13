import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SERVICE_LINES, STATES } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";

// -- Types --------------------------------------------------------------------

type StateRange = {
	m: [number, number] | null;
	r: [number, number];
} | null;

type BracketRow = {
	id: string;
	sl: string;
	role: string;
	nsw: StateRange;
	qld: StateRange;
	sa: StateRange;
	vic: StateRange;
	wa: StateRange;
};

// -- Helpers ------------------------------------------------------------------

function getMarketRange(
	bracket: BracketRow,
	state: string | null,
): { min: number; max: number } | null {
	if (!state) return null;
	const stateKey = state.toLowerCase() as keyof Pick<
		BracketRow,
		"nsw" | "qld" | "sa" | "vic" | "wa"
	>;
	const range = bracket[stateKey];
	if (!range) return null;
	if (range.m) return { min: range.m[0], max: range.m[1] };
	return { min: range.r[0], max: range.r[1] };
}

function getEffectiveMarketRange(
	bracket: BracketRow,
	stateFilter: string,
): { min: number; max: number } | null {
	if (stateFilter) return getMarketRange(bracket, stateFilter);
	const states = ["nsw", "qld", "sa", "vic", "wa"];
	const ranges = states
		.map((s) => getMarketRange(bracket, s))
		.filter((r): r is { min: number; max: number } => r !== null);
	if (ranges.length === 0) return null;
	const avgMin = Math.round(
		ranges.reduce((s, r) => s + r.min, 0) / ranges.length,
	);
	const avgMax = Math.round(
		ranges.reduce((s, r) => s + r.max, 0) / ranges.length,
	);
	return { min: avgMin, max: avgMax };
}

function benchmarkColorHex(
	avg: number,
	market: { min: number; max: number } | null,
): string {
	if (!market || avg === 0) return "#a1a1aa";
	if (avg > market.max) return "#f87171";
	if (avg > market.max * 0.9) return "#fbbf24";
	if (avg >= market.min) return "#4ade80";
	return "#60a5fa";
}

function slLabel(slId: string): string {
	return SERVICE_LINES.find((sl) => sl.id === slId)?.short ?? slId;
}

// -- Chart config -------------------------------------------------------------

const chartConfig = {
	marketMin: { label: "Market Min", color: "#e4e4e7" },
	carbonAvg: { label: "Carbon Avg", color: "#4ade80" },
	marketMax: { label: "Market Max", color: "#e4e4e7" },
} satisfies ChartConfig;

// -- Component ----------------------------------------------------------------

interface SalaryMarketChartProps {
	brackets: BracketRow[];
	carbonites: { sl: string | null; salary: number | null }[];
	stateFilter: string;
	onStateFilterChange: (s: string) => void;
}

export function SalaryMarketChart({
	brackets,
	carbonites,
	stateFilter,
	onStateFilterChange,
}: SalaryMarketChartProps) {
	const avgBySl = useMemo(() => {
		const map = new Map<string, { total: number; count: number }>();
		for (const c of carbonites) {
			if (!c.sl || !c.salary) continue;
			const entry = map.get(c.sl) ?? { total: 0, count: 0 };
			entry.total += c.salary;
			entry.count += 1;
			map.set(c.sl, entry);
		}
		const result = new Map<string, number>();
		for (const [sl, { total, count }] of map) {
			result.set(sl, Math.round(total / count));
		}
		return result;
	}, [carbonites]);

	const chartData = useMemo(() => {
		// Aggregate brackets by SL: compute average market min/max across all
		// bracket rows in the SL so we get exactly one datum per service line.
		const slMap = new Map<
			string,
			{ mins: number[]; maxes: number[] }
		>();
		for (const bracket of brackets) {
			const market = getEffectiveMarketRange(bracket, stateFilter);
			if (!market) continue;
			const entry = slMap.get(bracket.sl) ?? { mins: [], maxes: [] };
			entry.mins.push(market.min);
			entry.maxes.push(market.max);
			slMap.set(bracket.sl, entry);
		}

		// Collect unique SL ids preserving first-seen order from brackets array
		const seenSls: string[] = [];
		for (const bracket of brackets) {
			if (!seenSls.includes(bracket.sl)) seenSls.push(bracket.sl);
		}

		return seenSls.map((slId) => {
			const agg = slMap.get(slId);
			const marketMin = agg
				? Math.round(agg.mins.reduce((s, v) => s + v, 0) / agg.mins.length)
				: 0;
			const marketMax = agg
				? Math.round(agg.maxes.reduce((s, v) => s + v, 0) / agg.maxes.length)
				: 0;
			const market =
				agg ? { min: marketMin, max: marketMax } : null;
			const carbonAvg = avgBySl.get(slId) ?? 0;
			return {
				sl: slLabel(slId),
				slId,
				marketMin,
				carbonAvg,
				marketMax,
				market,
			};
		});
	}, [brackets, stateFilter, avgBySl]);

	// Auto-generated interpretation
	const interpretation = useMemo(() => {
		if (chartData.length === 0) return null;

		let maxBelow: { sl: string; pct: number } | null = null;
		let maxAbove: { sl: string; pct: number } | null = null;

		for (const d of chartData) {
			if (!d.market || d.carbonAvg === 0) continue;
			const belowMaxPct = Math.round(
				((d.market.max - d.carbonAvg) / d.market.max) * 100,
			);
			const aboveMinPct = Math.round(
				((d.carbonAvg - d.market.min) / d.market.min) * 100,
			);

			if (belowMaxPct > 0 && (!maxBelow || belowMaxPct > maxBelow.pct)) {
				maxBelow = { sl: d.sl, pct: belowMaxPct };
			}
			if (aboveMinPct > 0 && (!maxAbove || aboveMinPct > maxAbove.pct)) {
				maxAbove = { sl: d.sl, pct: aboveMinPct };
			}
		}

		const parts: string[] = [];
		if (maxBelow) {
			parts.push(
				`${maxBelow.sl} salaries average ${maxBelow.pct}% below market maximum — a potential retention risk.`,
			);
		}
		if (maxAbove) {
			parts.push(
				`${maxAbove.sl} salaries average ${maxAbove.pct}% above market minimum.`,
			);
		}
		return parts.length > 0 ? parts.join(" ") : null;
	}, [chartData]);

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-balance font-bold text-base">
					Salary vs Market Benchmarks
				</h2>
				<Select
					value={stateFilter || "all"}
					onValueChange={(v) => onStateFilterChange(v === "all" ? "" : v)}
				>
					<SelectTrigger className="w-40 text-sm">
						<SelectValue placeholder="All States" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All States</SelectItem>
						{STATES.map((s) => (
							<SelectItem key={s.id} value={s.id}>
								{s.abbr}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{brackets.length === 0 ? (
				<p className="py-8 text-center text-sm text-text-soft-400">
					No salary benchmark data available.
				</p>
			) : (
				<>
					<ChartContainer config={chartConfig} className="h-64 w-full">
						<BarChart
							accessibilityLayer
							data={chartData}
							margin={{ left: 0, right: 4, top: 4, bottom: 4 }}
						>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="sl"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								fontSize={11}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickFormatter={(v: number) => fmtDollar(v)}
								width={60}
								fontSize={11}
								className="tabular-nums"
							/>
							<ChartTooltip
								content={({ active, payload }) => {
									if (!active || !payload?.length) return null;
									const d = payload[0]
										?.payload as (typeof chartData)[number];
									if (!d) return null;
									return (
										<div className="rounded-none border bg-background px-2.5 py-1.5 text-sm shadow-xl">
											<p className="mb-1 font-medium">{d.sl}</p>
											<div className="space-y-0.5 text-xs">
												<div className="flex justify-between gap-4 tabular-nums">
													<span className="text-muted-foreground">
														Market Min
													</span>
													<span>
														{d.marketMin > 0 ? fmtDollar(d.marketMin) : "\u2014"}
													</span>
												</div>
												<div className="flex justify-between gap-4 tabular-nums">
													<span className="text-muted-foreground">
														Carbon Avg
													</span>
													<span>
														{d.carbonAvg > 0 ? fmtDollar(d.carbonAvg) : "\u2014"}
													</span>
												</div>
												<div className="flex justify-between gap-4 tabular-nums">
													<span className="text-muted-foreground">
														Market Max
													</span>
													<span>
														{d.marketMax > 0 ? fmtDollar(d.marketMax) : "\u2014"}
													</span>
												</div>
											</div>
										</div>
									);
								}}
							/>
							<Bar
								dataKey="marketMin"
								fill="#e4e4e7"
								radius={[4, 4, 0, 0]}
							/>
							<Bar dataKey="carbonAvg" radius={[4, 4, 0, 0]}>
								{chartData.map((entry) => (
									<Cell
										key={entry.slId}
										fill={benchmarkColorHex(entry.carbonAvg, entry.market)}
									/>
								))}
							</Bar>
							<Bar
								dataKey="marketMax"
								fill="#e4e4e7"
								radius={[4, 4, 0, 0]}
							/>
						</BarChart>
					</ChartContainer>
					{interpretation && (
						<p className="mt-3 text-pretty text-sm text-text-soft-400">
							{interpretation}
						</p>
					)}
				</>
			)}
		</div>
	);
}
