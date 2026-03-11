import { type ChartColorKey, getColorClassName } from "@/lib/chart-utils";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface TooltipPayloadItem {
	category: string;
	value: number;
	color: ChartColorKey;
}

interface ChartTooltipProps {
	/** Tooltip entries — each gets a colour bar + label + value */
	payload: TooltipPayloadItem[];
	active: boolean;
	/** Format the value for display. Defaults to `String(value)` */
	valueFormatter?: (value: number) => string;
	className?: string;
}

/* ── Component ─────────────────────────────────────────────────────────── */

/**
 * Planner-style chart tooltip with colour indicator bars.
 * Renders a percentage diff badge when exactly 2 payload items are present.
 *
 * Usage with Recharts:
 * ```tsx
 * <Tooltip
 *   content={({ payload, active }) => (
 *     <ChartTooltip
 *       active={!!active}
 *       payload={(payload ?? []).map(p => ({
 *         category: p.name,
 *         value: p.value,
 *         color: colorMap.get(p.name) ?? "gray",
 *       }))}
 *       valueFormatter={fmtDollar}
 *     />
 *   )}
 * />
 * ```
 */
export function ChartTooltip({
	payload,
	active,
	valueFormatter = String,
	className,
}: ChartTooltipProps) {
	if (!active || payload.length === 0) return null;

	const percentageDiff = getPercentageDiff(payload);

	return (
		<div
			className={cn(
				"flex w-56 items-start justify-between rounded-md border bg-popover p-2 text-sm shadow-md",
				className,
			)}
		>
			<div className="space-y-2">
				{payload.map((item) => (
					<div key={item.category} className="flex space-x-2.5">
						<span
							className={cn(getColorClassName(item.color, "bg"), "w-1 rounded")}
							aria-hidden="true"
						/>
						<div className="space-y-0.5">
							<p className="text-muted-foreground text-xs">{item.category}</p>
							<p className="font-medium text-foreground">
								{valueFormatter(item.value)}
							</p>
						</div>
					</div>
				))}
			</div>

			{percentageDiff !== null && (
				<span
					className={cn(
						"rounded px-1.5 py-1 font-medium text-xs",
						Number.parseFloat(percentageDiff) >= 0
							? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
							: "bg-red-500/10 text-red-600 dark:text-red-400",
					)}
				>
					{percentageDiff}
				</span>
			)}
		</div>
	);
}

/* ── Benchmark tooltip variant ─────────────────────────────────────────── */

interface BenchmarkTooltipProps {
	payload: TooltipPayloadItem[];
	active: boolean;
	/** The benchmark value to compare against */
	benchmark: number;
	benchmarkLabel?: string;
	valueFormatter?: (value: number) => string;
	className?: string;
}

/**
 * Tooltip variant that compares a value against a benchmark,
 * showing a ±% diff and a visual range bar.
 */
export function BenchmarkTooltip({
	payload,
	active,
	benchmark,
	benchmarkLabel = "Benchmark",
	valueFormatter = String,
	className,
}: BenchmarkTooltipProps) {
	if (!active || payload.length === 0) return null;

	const firstValue = payload[0]?.value;
	if (firstValue === undefined || firstValue === 0) return null;

	const diff = ((firstValue - benchmark) / benchmark) * 100;
	const formattedDiff = `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;
	const cappedValue = Math.min(Math.max(diff, -100), 100);

	return (
		<div
			className={cn(
				"w-56 rounded-md border bg-popover text-sm shadow-md",
				className,
			)}
		>
			<ul className="grid grid-cols-2 gap-x-4 p-2">
				{payload.map((item) => (
					<li key={item.category} className="flex space-x-2.5">
						<span
							className={cn(getColorClassName(item.color, "bg"), "w-1 rounded")}
							aria-hidden="true"
						/>
						<div className="space-y-0.5">
							<p className="text-muted-foreground text-xs">{item.category}</p>
							<p className="font-medium text-foreground">
								{valueFormatter(item.value)}
							</p>
						</div>
					</li>
				))}
			</ul>
			<div className="border-t p-2">
				<div className="relative mt-0.5 h-1.5 w-full rounded-full bg-muted">
					{/* Center marker = benchmark */}
					<span className="absolute top-1/2 left-1/2 z-30 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-muted-foreground" />
					{diff >= 0 ? (
						<span className="absolute top-1/2 left-1/2 z-10 h-1.5 w-1/2 -translate-y-1/2">
							<span
								style={{ width: `${cappedValue}%` }}
								className="absolute h-1.5 rounded-r-full bg-gradient-to-r from-muted-foreground/60 to-muted-foreground/40 transition-all duration-300"
							/>
						</span>
					) : (
						<span className="absolute top-1/2 right-1/2 z-10 h-1.5 w-1/2 -translate-y-1/2">
							<span
								style={{ width: `${Math.abs(cappedValue)}%` }}
								className="absolute right-0 h-1.5 rounded-l-full bg-gradient-to-l from-muted-foreground/60 to-muted-foreground/40 transition-all duration-300"
							/>
						</span>
					)}
				</div>
				<div className="mt-1 flex items-center justify-between">
					<div className="flex items-center">
						<span
							className="mr-1 h-0.5 w-2.5 rounded-full bg-muted-foreground"
							aria-hidden="true"
						/>
						<span className="text-muted-foreground text-xs">
							{benchmarkLabel}
						</span>
					</div>
					<span className="font-medium text-foreground text-xs">
						{formattedDiff}
					</span>
				</div>
			</div>
		</div>
	);
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function getPercentageDiff(payload: TooltipPayloadItem[]): string | null {
	if (payload.length < 2) return null;
	const base = payload[1]?.value;
	const compare = payload[0]?.value;
	if (
		base === undefined ||
		compare === undefined ||
		Number.isNaN(base) ||
		Number.isNaN(compare) ||
		base === 0
	)
		return null;
	const diff = ((compare - base) / base) * 100;
	const sign = diff > 0 ? "+" : "";
	return `${sign}${diff.toFixed(1)}%`;
}
