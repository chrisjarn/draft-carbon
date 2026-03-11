/**
 * Chart colour system — ported from Tremor Planner template.
 * Centralises all chart colour definitions so Dashboard / FY Report / etc.
 * reference a single source instead of hard-coding hex values.
 */

export type ColorUtility = "bg" | "stroke" | "fill" | "text";

export const chartColors = {
	blue: {
		bg: "bg-blue-500 dark:bg-blue-500",
		stroke: "stroke-blue-500 dark:stroke-blue-500",
		fill: "fill-blue-500 dark:fill-blue-500",
		text: "text-blue-500 dark:text-blue-500",
	},
	emerald: {
		bg: "bg-emerald-500 dark:bg-emerald-500",
		stroke: "stroke-emerald-500 dark:stroke-emerald-500",
		fill: "fill-emerald-500 dark:fill-emerald-500",
		text: "text-emerald-500 dark:text-emerald-500",
	},
	violet: {
		bg: "bg-violet-500 dark:bg-violet-500",
		stroke: "stroke-violet-500 dark:stroke-violet-500",
		fill: "fill-violet-500 dark:fill-violet-500",
		text: "text-violet-500 dark:text-violet-500",
	},
	amber: {
		bg: "bg-amber-500 dark:bg-amber-500",
		stroke: "stroke-amber-500 dark:stroke-amber-500",
		fill: "fill-amber-500 dark:fill-amber-500",
		text: "text-amber-500 dark:text-amber-500",
	},
	gray: {
		bg: "bg-gray-400 dark:bg-gray-600",
		stroke: "stroke-gray-400 dark:stroke-gray-600",
		fill: "fill-gray-400 dark:fill-gray-600",
		text: "text-gray-400 dark:text-gray-600",
	},
	rose: {
		bg: "bg-rose-600 dark:bg-rose-500",
		stroke: "stroke-rose-600 dark:stroke-rose-500",
		fill: "fill-rose-600 dark:fill-rose-500",
		text: "text-rose-600 dark:text-rose-500",
	},
	sky: {
		bg: "bg-sky-500 dark:bg-sky-500",
		stroke: "stroke-sky-500 dark:stroke-sky-500",
		fill: "fill-sky-500 dark:fill-sky-500",
		text: "text-sky-500 dark:text-sky-500",
	},
	cyan: {
		bg: "bg-cyan-500 dark:bg-cyan-500",
		stroke: "stroke-cyan-500 dark:stroke-cyan-500",
		fill: "fill-cyan-500 dark:fill-cyan-500",
		text: "text-cyan-500 dark:text-cyan-500",
	},
	indigo: {
		bg: "bg-indigo-600 dark:bg-indigo-500",
		stroke: "stroke-indigo-600 dark:stroke-indigo-500",
		fill: "fill-indigo-600 dark:fill-indigo-500",
		text: "text-indigo-600 dark:text-indigo-500",
	},
	orange: {
		bg: "bg-orange-500 dark:bg-orange-400",
		stroke: "stroke-orange-500 dark:stroke-orange-400",
		fill: "fill-orange-500 dark:fill-orange-400",
		text: "text-orange-500 dark:text-orange-400",
	},
	pink: {
		bg: "bg-pink-500 dark:bg-pink-500",
		stroke: "stroke-pink-500 dark:stroke-pink-500",
		fill: "fill-pink-500 dark:fill-pink-500",
		text: "text-pink-500 dark:text-pink-500",
	},
	red: {
		bg: "bg-red-500 dark:bg-red-500",
		stroke: "stroke-red-500 dark:stroke-red-500",
		fill: "fill-red-500 dark:fill-red-500",
		text: "text-red-500 dark:text-red-500",
	},
} as const satisfies Record<string, Record<ColorUtility, string>>;

export type ChartColorKey = keyof typeof chartColors;

export const chartColorKeys: ChartColorKey[] = Object.keys(
	chartColors,
) as ChartColorKey[];

/** Gradient pairs for area / sparkline fills */
export const chartGradientColors: Record<ChartColorKey, string> = {
	blue: "from-blue-200 to-blue-500 dark:from-blue-200/10 dark:to-blue-400",
	emerald:
		"from-emerald-200 to-emerald-500 dark:from-emerald-200/10 dark:to-emerald-400",
	violet:
		"from-violet-200 to-violet-500 dark:from-violet-200/10 dark:to-violet-400",
	amber: "from-amber-200 to-amber-500 dark:from-amber-200/10 dark:to-amber-400",
	gray: "from-gray-200 to-gray-500 dark:from-gray-200/10 dark:to-gray-400",
	rose: "from-rose-200 to-rose-500 dark:from-rose-200/10 dark:to-rose-400",
	sky: "from-sky-200 to-sky-500 dark:from-sky-200/10 dark:to-sky-400",
	cyan: "from-cyan-200 to-cyan-500 dark:from-cyan-200/10 dark:to-cyan-400",
	indigo:
		"from-indigo-200 to-indigo-500 dark:from-indigo-200/10 dark:to-indigo-400",
	orange:
		"from-orange-200 to-orange-500 dark:from-orange-200/10 dark:to-orange-400",
	pink: "from-pink-200 to-pink-500 dark:from-pink-200/10 dark:to-pink-400",
	red: "from-red-200 to-red-500 dark:from-red-200/10 dark:to-red-400",
};

/* ── Utility functions ─────────────────────────────────────────────────── */

/** Get a Tailwind class for a chart color + utility type */
export function getColorClassName(
	color: ChartColorKey,
	type: ColorUtility,
): string {
	const fallback: Record<ColorUtility, string> = {
		bg: "bg-gray-500",
		stroke: "stroke-gray-500",
		fill: "fill-gray-500",
		text: "text-gray-500",
	};
	return chartColors[color]?.[type] ?? fallback[type];
}

/** Get gradient classes for a chart color */
export function getGradientColorClassName(color: ChartColorKey): string {
	return chartGradientColors[color];
}

/** Map an array of category names to chart colors (round-robin) */
export function constructCategoryColors(
	categories: string[],
	colors: ChartColorKey[] = chartColorKeys,
): Map<string, ChartColorKey> {
	const map = new Map<string, ChartColorKey>();
	for (let i = 0; i < categories.length; i++) {
		const category = categories[i];
		const color = colors[i % colors.length];
		if (category !== undefined && color !== undefined) {
			map.set(category, color);
		}
	}
	return map;
}

/** Y-axis domain helper for auto-scaling charts */
export function getYAxisDomain(
	autoMinValue: boolean,
	minValue?: number,
	maxValue?: number,
): [string | number, string | number] {
	const minDomain = autoMinValue ? "auto" : (minValue ?? 0);
	const maxDomain = maxValue ?? "auto";
	return [minDomain, maxDomain];
}
