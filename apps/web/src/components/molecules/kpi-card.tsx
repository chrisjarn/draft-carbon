/**
 * KpiCard — Tremor-style stat card.
 *
 * Renders a bordered card with:
 *   - Title (dt, text-sm font-medium)
 *   - Value (dd, text-3xl font-semibold) — or loading skeleton
 *   - Optional `children` below the value (CategoryBar, ProgressCircle, legend, etc.)
 *
 * Usage:
 *   <KpiCard title="Current Tickets" value="247">
 *     <CategoryBar values={[82, 13, 5]} ... />
 *   </KpiCard>
 *
 * Follows the Tremor Support Dashboard pattern:
 *   dl > Card > dt (title) + dd (value) + children
 */

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
	title: string;
	value: ReactNode;
	/** Extra class applied to the value (e.g. colour). */
	valueClass?: string;
	loading?: boolean;
	children?: ReactNode;
	className?: string;
}

export function KpiCard({
	title,
	value,
	valueClass,
	loading = false,
	children,
	className,
}: KpiCardProps) {
	return (
		<div
			className={cn(
				"relative w-full overflow-hidden bg-bg-white-0 shadow-custom-input rounded-20 p-5 hover:bg-bg-weak-50 hover:shadow-none transition-all duration-200 text-left",
				className,
			)}
		>
			<dt className="font-medium text-text-soft-400 text-xs uppercase">
				{title}
			</dt>
			{loading ? (
				<Skeleton className="mt-3 h-8 w-24" />
			) : (
				<dd
					className={cn(
						"mt-2 font-semibold text-2xl tabular-nums tracking-tight",
						valueClass,
					)}
				>
					{value}
				</dd>
			)}
			{children && (
				<div className="mt-4 border-t border-stroke-soft-200/60 pt-3">{children}</div>
			)}
		</div>
	);
}

/**
 * KpiLegendItem — coloured dot + label + optional value.
 *
 * Used inside KpiCard to build legends beneath CategoryBar / ProgressCircle.
 *
 *   <KpiLegendItem color="bg-blue-500" label="Resolved" value="82%" />
 */

interface KpiLegendItemProps {
	/** Tailwind bg class for the colour dot, e.g. "bg-blue-500" */
	color: string;
	label: string;
	value?: ReactNode;
}

export function KpiLegendItem({ color, label, value }: KpiLegendItemProps) {
	return (
		<li className="flex flex-col gap-0.5">
			{value !== undefined && (
				<span className="font-semibold text-sm tabular-nums">{value}</span>
			)}
			<div className="flex items-center gap-1.5">
				<span
					className={cn("size-2 shrink-0 rounded-sm", color)}
					aria-hidden="true"
				/>
				<span className="text-text-soft-400 text-xs">{label}</span>
			</div>
		</li>
	);
}

/**
 * KpiLegend — wrapper for a horizontal list of KpiLegendItems.
 */
export function KpiLegend({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<ul className={cn("flex flex-wrap gap-x-6 gap-y-2", className)}>
			{children}
		</ul>
	);
}
