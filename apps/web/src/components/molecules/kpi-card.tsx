/**
 * KpiCard — Linear-style stat card.
 *
 * Renders a clean bordered card with:
 *   - Title (dt, text-xs font-medium uppercase)
 *   - Value (dd, text-xl font-semibold) — or loading skeleton
 *   - Optional `children` below the value (CategoryBar, ProgressCircle, legend, etc.)
 *
 * Usage:
 *   <KpiCard title="Current Tickets" value="247">
 *     <CategoryBar values={[82, 13, 5]} ... />
 *   </KpiCard>
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
	/** Icon component to display */
	icon?: React.ComponentType<{ className?: string }>;
}

export function KpiCard({
	title,
	value,
	valueClass,
	loading = false,
	children,
	className,
	icon: Icon,
}: KpiCardProps) {
	return (
		<div
			className={cn(
				"group relative w-full overflow-hidden rounded-xl border border-stroke-soft-200/80 bg-bg-white-0 p-4 text-left transition-all duration-150",
				"hover:border-stroke-soft-200 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
				"dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between gap-2">
				<dt className="font-medium text-[11px] text-text-soft-400 uppercase tracking-wider">
					{title}
				</dt>
				{Icon && (
					<span className="text-text-soft-400/60">
						<Icon className="size-4" />
					</span>
				)}
			</div>

			{/* Value */}
			{loading ? (
				<Skeleton className="mt-2 h-7 w-24" />
			) : (
				<dd
					className={cn(
						"mt-2 font-semibold text-xl tabular-nums tracking-tight",
						valueClass ?? "text-text-strong-950",
					)}
				>
					{value}
				</dd>
			)}

			{/* Children content */}
			{children && (
				<div className="mt-3 border-stroke-soft-200/60 border-t pt-3 dark:border-neutral-800">
					{children}
				</div>
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
