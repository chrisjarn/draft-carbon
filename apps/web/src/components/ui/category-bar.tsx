// CategoryBar — ported from Tremor template, restyled for zinc/emerald theme
// Uses cn() instead of tailwind-variants, app Tooltip instead of Tremor's

import { useMemo } from "react";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	type ChartColorKey,
	chartColorKeys,
	getColorClassName,
} from "@/lib/chart-utils";
import { cn } from "@/lib/utils";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getMarkerBgColor(
	marker: number | undefined,
	values: number[],
	colors: ChartColorKey[],
): string {
	if (marker === undefined) return "";
	if (marker === 0) {
		for (let index = 0; index < values.length; index++) {
			const v = values[index];
			const c = colors[index];
			if (v !== undefined && v > 0 && c !== undefined) {
				return getColorClassName(c, "bg");
			}
		}
	}
	let prefixSum = 0;
	for (let index = 0; index < values.length; index++) {
		const v = values[index] ?? 0;
		const c = colors[index];
		prefixSum += v;
		if (prefixSum >= marker && c !== undefined) {
			return getColorClassName(c, "bg");
		}
	}
	const lastColor = colors[values.length - 1] ?? "gray";
	return getColorClassName(lastColor, "bg");
}

function getPositionLeft(value: number | undefined, maxValue: number): number {
	return value ? (value / maxValue) * 100 : 0;
}

function sumNumericArray(arr: number[]) {
	return arr.reduce((sum, num) => sum + num, 0);
}

function formatNumber(num: number): string {
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(1);
}

// ── Bar Labels ──────────────────────────────────────────────────────────────

function BarLabels({ values }: { values: number[] }) {
	const sumValues = useMemo(() => sumNumericArray(values), [values]);
	let prefixSum = 0;
	let sumConsecutiveHiddenLabels = 0;

	return (
		<div className="relative mb-2 flex h-5 w-full font-medium text-sm text-zinc-600 dark:text-zinc-400">
			{values.map((widthPercentage, index) => {
				prefixSum += widthPercentage;

				const showLabel =
					(widthPercentage >= 0.1 * sumValues ||
						sumConsecutiveHiddenLabels >= 0.09 * sumValues) &&
					sumValues - prefixSum >= 0.1 * sumValues &&
					prefixSum >= 0.1 * sumValues &&
					prefixSum < 0.9 * sumValues;

				if (showLabel) {
					sumConsecutiveHiddenLabels = 0;
				} else {
					sumConsecutiveHiddenLabels += widthPercentage;
				}

				const widthPositionLeft = getPositionLeft(widthPercentage, sumValues);

				const segmentKey = `${widthPercentage}-${prefixSum}`;
				return (
					<div
						key={segmentKey}
						className="flex items-center justify-end pr-0.5"
						style={{ width: `${widthPositionLeft}%` }}
					>
						<span
							className={cn(
								showLabel ? "block" : "hidden",
								"translate-x-1/2 text-sm tabular-nums",
							)}
						>
							{formatNumber(prefixSum)}
						</span>
					</div>
				);
			})}
			<div className="absolute bottom-0 left-0 flex items-center">0</div>
			<div className="absolute right-0 bottom-0 flex items-center">
				{formatNumber(sumValues)}
			</div>
		</div>
	);
}

// ── CategoryBar ─────────────────────────────────────────────────────────────

interface CategoryBarProps extends React.HTMLAttributes<HTMLDivElement> {
	values: number[];
	colors?: ChartColorKey[];
	marker?: { value: number; tooltip?: string; showAnimation?: boolean };
	showLabels?: boolean;
	ref?: React.Ref<HTMLDivElement>;
}

function CategoryBar({
	values = [],
	colors = chartColorKeys,
	marker,
	showLabels = true,
	className,
	ref,
	...props
}: CategoryBarProps) {
	const markerBgColor = useMemo(
		() => getMarkerBgColor(marker?.value, values, colors),
		[marker, values, colors],
	);

	const maxValue = useMemo(() => sumNumericArray(values), [values]);

	const adjustedMarkerValue = useMemo(() => {
		if (marker === undefined) return undefined;
		if (marker.value < 0) return 0;
		if (marker.value > maxValue) return maxValue;
		return marker.value;
	}, [marker, maxValue]);

	const markerPositionLeft = useMemo(
		() => getPositionLeft(adjustedMarkerValue, maxValue),
		[adjustedMarkerValue, maxValue],
	);

	return (
		<div
			ref={ref}
			role="img"
			className={cn(className)}
			aria-label="category bar"
			{...props}
		>
			{showLabels ? <BarLabels values={values} /> : null}
			<div className="relative flex h-2 w-full items-center">
				<div className="flex h-full flex-1 items-center gap-0.5 overflow-hidden rounded-full">
					{values.map((value, index) => {
						const barColor = colors[index] ?? "gray";
						const percentage = (value / maxValue) * 100;
						const barKey = `${barColor}-${value}`;
						return (
							<div
								key={barKey}
								className={cn(
									"h-full",
									getColorClassName(barColor, "bg"),
									percentage === 0 && "hidden",
								)}
								style={{ width: `${percentage}%` }}
							/>
						);
					})}
				</div>

				{marker !== undefined ? (
					<div
						className={cn(
							"absolute w-2 -translate-x-1/2",
							marker.showAnimation &&
								"transform-gpu transition-all duration-300 ease-in-out",
						)}
						style={{ left: `${markerPositionLeft}%` }}
					>
						{marker.tooltip ? (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<div
											aria-hidden="true"
											className={cn(
												"relative mx-auto h-4 w-1 rounded-full ring-2",
												"ring-white dark:ring-zinc-950",
												markerBgColor,
											)}
										>
											<div
												aria-hidden
												className="absolute size-7 -translate-x-[45%] -translate-y-[15%]"
											/>
										</div>
									</TooltipTrigger>
									<TooltipContent>{marker.tooltip}</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						) : (
							<div
								className={cn(
									"mx-auto h-4 w-1 rounded-full ring-2",
									"ring-white dark:ring-zinc-950",
									markerBgColor,
								)}
							/>
						)}
					</div>
				) : null}
			</div>
		</div>
	);
}

export { CategoryBar, type CategoryBarProps };
