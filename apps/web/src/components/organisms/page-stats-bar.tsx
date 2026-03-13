import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface PageStat {
	label: string;
	value: ReactNode;
	/** Optional colour class applied to the value (e.g. "text-emerald-500") */
	valueClass?: string;
	loading?: boolean;
	/**
	 * Optional 0–1 ratio that renders a 3-bar indicator widget (Planner-style).
	 * < 0.3 → red, 0.3–0.7 → orange, ≥ 0.7 → emerald.
	 */
	indicator?: number;
	/**
	 * Optional fraction string shown alongside the value (e.g. "450/752").
	 * Only rendered when `indicator` is also set.
	 */
	fraction?: string;
}

interface PageStatsBarProps {
	stats:
		| [PageStat, PageStat, PageStat]
		| [PageStat, PageStat, PageStat, PageStat];
	/** Optional tabs / controls rendered flush-right */
	children?: ReactNode;
	className?: string;
}

type IndicatorCategory = "red" | "orange" | "emerald";

function getIndicatorCategory(value: number): IndicatorCategory {
	if (value < 0.3) return "red";
	if (value < 0.7) return "orange";
	return "emerald";
}

const INDICATOR_ACTIVE: Record<IndicatorCategory, string> = {
	red: "bg-red-500",
	orange: "bg-orange-500",
	emerald: "bg-emerald-500",
};

const INDICATOR_BARS: Record<IndicatorCategory, number> = {
	red: 1,
	orange: 2,
	emerald: 3,
};

function StatIndicator({ value }: { value: number }) {
	const category = getIndicatorCategory(value);
	const activeClass = INDICATOR_ACTIVE[category];
	const activeBars = INDICATOR_BARS[category];

	return (
		<div className="flex gap-0.5" aria-hidden="true">
			{[0, 1, 2].map((i) => (
				<div
					key={i}
					className={cn(
						"h-3.5 w-1 rounded-sm",
						i < activeBars ? activeClass : "bg-stroke-soft-200",
					)}
				/>
			))}
		</div>
	);
}

/**
 * Planner-style horizontal stat strip.
 * Always shows exactly 3 stats on the left.
 * Pass tab controls as `children` — they render flush-right.
 *
 * Each stat optionally accepts:
 * - `indicator` (0–1) → renders a 3-bar colour widget
 * - `fraction` → shown as a muted sub-label alongside the value
 *
 * Sits between PageHeader and PageToolbar (or PageBody if no toolbar).
 */
export function PageStatsBar({
	stats,
	children,
	className,
}: PageStatsBarProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-6 border-b border-stroke-soft-200 bg-bg-white-0 px-6 py-2.5",
				className,
			)}
		>
			{/* Stats — left side */}
			<div className="flex items-center divide-x">
				{stats.map((stat, i) => (
					<div
						key={`${stat.label}-${i}`}
						className="flex flex-col gap-0.5 pr-10 pl-10 first:pl-0"
					>
						<span className="font-medium text-[10px] text-text-soft-400 uppercase tracking-widest">
							{stat.label}
						</span>
						{stat.loading ? (
							<Skeleton className="h-5 w-14" />
						) : (
							<div className="flex items-center gap-1.5">
								{stat.indicator !== undefined && (
									<StatIndicator value={stat.indicator} />
								)}
								<span
									className={cn(
										"font-semibold text-base tabular-nums tracking-tight",
										stat.valueClass,
									)}
								>
									{stat.value}
								</span>
								{stat.fraction && (
									<span className="text-text-soft-400 text-xs tabular-nums">
										{stat.fraction}
									</span>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{/* Right side — tabs or other controls */}
			{children && <div className="flex items-center gap-2">{children}</div>}
		</div>
	);
}
