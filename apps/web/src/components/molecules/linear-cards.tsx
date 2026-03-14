/**
 * Linear-inspired card components for a polished, professional dashboard.
 *
 * Design principles:
 * - Minimal visual noise with subtle borders
 * - Clear typography hierarchy
 * - Understated hover states
 * - Consistent 4px/8px spacing rhythm
 * - Dark mode optimized
 */

import { ArrowDown02Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// METRIC CARD — Single KPI display with optional trend
// ═══════════════════════════════════════════════════════════════════════════

interface MetricCardProps {
	label: string;
	value: ReactNode;
	/** Optional trend indicator */
	trend?: {
		value: string;
		direction: "up" | "down";
		/** Whether this direction is positive (default: up = positive) */
		positive?: boolean;
	};
	/** Optional subtitle/context line */
	subtitle?: string;
	/** Optional icon to display */
	icon?: React.ComponentType<{ className?: string }>;
	loading?: boolean;
	className?: string;
	/** Variant affects the value styling */
	variant?: "default" | "success" | "warning" | "error";
}

export function MetricCard({
	label,
	value,
	trend,
	subtitle,
	icon: Icon,
	loading = false,
	className,
	variant = "default",
}: MetricCardProps) {
	const isPositive = trend
		? (trend.positive ?? trend.direction === "up")
		: false;

	const valueColors = {
		default: "text-text-strong-950",
		success: "text-emerald-600 dark:text-emerald-500",
		warning: "text-amber-600 dark:text-amber-500",
		error: "text-red-600 dark:text-red-500",
	};

	return (
		<div
			className={cn(
				"group relative flex flex-col gap-2 rounded-xl border border-stroke-soft-200/80 bg-bg-white-0 p-4 transition-all duration-150",
				"hover:border-stroke-soft-200 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
				"dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between gap-2">
				<span className="font-medium text-[11px] text-text-soft-400 uppercase tracking-wider">
					{label}
				</span>
				{Icon && (
					<span className="text-text-soft-400/60">
						<Icon className="size-4" />
					</span>
				)}
			</div>

			{/* Value */}
			{loading ? (
				<Skeleton className="h-8 w-24" />
			) : (
				<div className="flex items-baseline gap-2">
					<span
						className={cn(
							"font-semibold text-2xl tabular-nums tracking-tight",
							valueColors[variant],
						)}
					>
						{value}
					</span>
					{trend && (
						<span
							className={cn(
								"inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium text-xs tabular-nums",
								isPositive
									? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
									: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
							)}
						>
							<HugeiconsIcon
								icon={trend.direction === "up" ? ArrowUp02Icon : ArrowDown02Icon}
								className="size-3"
							/>
							{trend.value}
						</span>
					)}
				</div>
			)}

			{/* Subtitle */}
			{subtitle && !loading && (
				<span className="text-text-soft-400 text-xs">{subtitle}</span>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY CARD — Business unit/office display
// ═══════════════════════════════════════════════════════════════════════════

interface EntityCardProps {
	/** Primary title (business name) */
	title: string;
	/** Secondary label (legal name, etc.) */
	subtitle?: string;
	/** State abbreviation badge */
	state?: string | null;
	/** Service line tags */
	tags?: Array<{ id: string; label: string; color?: string }>;
	/** Staff avatars/initials */
	staff?: {
		initials: string[];
		count: number;
	};
	/** Footer stats */
	stats?: Array<{
		label: string;
		value: string | number;
	}>;
	/** Budget progress (0-100) */
	budgetProgress?: {
		percent: number;
		status: "healthy" | "warning" | "over";
		label: string;
	};
	/** Attainment badge */
	attainment?: {
		percent: number;
		status: "success" | "warning" | "error";
	};
	onClick?: () => void;
	className?: string;
}

export function EntityCard({
	title,
	subtitle,
	state,
	tags,
	staff,
	stats,
	budgetProgress,
	attainment,
	onClick,
	className,
}: EntityCardProps) {
	const stateColors: Record<string, string> = {
		NSW: "#2563eb",
		VIC: "#7c3aed",
		QLD: "#dc2626",
		WA: "#ca8a04",
		SA: "#dc2626",
		TAS: "#16a34a",
		NT: "#ea580c",
		ACT: "#0891b2",
	};

	const budgetColors = {
		healthy: "bg-emerald-500",
		warning: "bg-amber-500",
		over: "bg-red-500",
	};

	const attainmentColors = {
		success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
		warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
		error: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
	};

	return (
		<div
			role={onClick ? "button" : undefined}
			tabIndex={onClick ? 0 : undefined}
			onClick={onClick}
			onKeyDown={(e) => {
				if (onClick && (e.key === "Enter" || e.key === " ")) {
					e.preventDefault();
					onClick();
				}
			}}
			className={cn(
				"group flex h-full flex-col rounded-xl border border-stroke-soft-200/80 bg-bg-white-0 transition-all duration-150",
				"hover:border-stroke-soft-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
				"dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
				onClick && "cursor-pointer",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3 p-4 pb-3">
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-semibold text-base text-text-strong-950 leading-tight tracking-tight">
						{title}
					</h3>
					{subtitle && (
						<p className="mt-0.5 truncate text-sm text-text-soft-400">
							{subtitle}
						</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					{attainment && (
						<span
							className={cn(
								"rounded-md px-1.5 py-0.5 font-semibold text-xs tabular-nums",
								attainmentColors[attainment.status],
							)}
						>
							{attainment.percent}%
						</span>
					)}
					{state && (
						<span
							className="rounded-md border px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wide"
							style={{
								borderColor: `${stateColors[state] ?? "#888"}40`,
								color: stateColors[state] ?? "#888",
							}}
						>
							{state}
						</span>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="flex flex-1 flex-col gap-3 px-4 pb-3">
				{/* Staff avatars */}
				{staff && staff.initials.length > 0 && (
					<div className="flex items-center gap-1">
						<div className="flex -space-x-1.5">
							{staff.initials.slice(0, 4).map((initial, i) => (
								<div
									key={`${initial}-${i}`}
									className="flex size-7 items-center justify-center rounded-full border-2 border-bg-white-0 bg-neutral-100 font-medium text-[10px] text-neutral-600 dark:border-neutral-900 dark:bg-neutral-800 dark:text-neutral-300"
								>
									{initial}
								</div>
							))}
						</div>
						{staff.count > 4 && (
							<span className="ml-1 text-text-soft-400 text-xs">
								+{staff.count - 4}
							</span>
						)}
					</div>
				)}

				{/* Tags */}
				{tags && tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{tags.map((tag) => (
							<span
								key={tag.id}
								className="rounded-md border border-stroke-soft-200/80 bg-bg-weak-50/50 px-1.5 py-0.5 font-medium text-[10px] text-text-soft-400 dark:border-neutral-700 dark:bg-neutral-800/50"
								style={
									tag.color
										? {
												borderColor: `${tag.color}30`,
												color: tag.color,
												backgroundColor: `${tag.color}08`,
											}
										: undefined
								}
							>
								{tag.label}
							</span>
						))}
					</div>
				)}
			</div>

			{/* Budget progress */}
			{budgetProgress && (
				<div className="px-4 pb-3">
					<div className="mb-1 flex items-center justify-between">
						<span className="text-[10px] text-text-soft-400 uppercase tracking-wider">
							Budget
						</span>
						<span
							className={cn(
								"text-[11px] tabular-nums",
								budgetProgress.status === "over"
									? "text-red-500"
									: "text-text-soft-400",
							)}
						>
							{budgetProgress.label}
						</span>
					</div>
					<div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
						<div
							className={cn(
								"h-full rounded-full transition-all",
								budgetColors[budgetProgress.status],
							)}
							style={{ width: `${Math.min(budgetProgress.percent, 100)}%` }}
						/>
					</div>
				</div>
			)}

			{/* Footer stats */}
			{stats && stats.length > 0 && (
				<div className="flex items-center divide-x divide-stroke-soft-200/80 border-t border-stroke-soft-200/80 dark:divide-neutral-800 dark:border-neutral-800">
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="flex flex-1 flex-col items-center gap-0.5 py-2.5"
						>
							<span className="font-semibold text-sm tabular-nums tracking-tight text-text-strong-950">
								{stat.value}
							</span>
							<span className="text-[10px] text-text-soft-400">{stat.label}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSON CARD — Staff member display
// ═══════════════════════════════════════════════════════════════════════════

interface PersonCardProps {
	name: string;
	initials: string;
	role?: string;
	/** Department/service line */
	department?: { label: string; color?: string };
	/** Additional metadata badges */
	badges?: Array<{ label: string; variant?: "default" | "outline" }>;
	/** Salary or other monetary value */
	salary?: string;
	/** Avatar background color */
	avatarColor?: string;
	onClick?: () => void;
	className?: string;
}

export function PersonCard({
	name,
	initials,
	role,
	department,
	badges,
	salary,
	avatarColor = "#16a34a",
	onClick,
	className,
}: PersonCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group flex w-full items-start gap-3 rounded-xl border border-stroke-soft-200/80 bg-bg-white-0 p-3 text-left transition-all duration-150",
				"hover:border-stroke-soft-200 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
				"dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
				className,
			)}
		>
			{/* Avatar */}
			<div
				className="flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-xs text-white"
				style={{ backgroundColor: avatarColor }}
			>
				{initials}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<div className="truncate font-semibold text-sm text-text-strong-950">
					{name}
				</div>
				{role && (
					<div className="mt-0.5 truncate text-text-soft-400 text-xs">
						{role}
					</div>
				)}

				{/* Badges row */}
				{(department || (badges && badges.length > 0)) && (
					<div className="mt-2 flex flex-wrap gap-1">
						{department && (
							<span
								className="rounded-md border px-1.5 py-0.5 font-medium text-[10px]"
								style={{
									borderColor: `${department.color ?? "#888"}40`,
									color: department.color ?? "#888",
									backgroundColor: `${department.color ?? "#888"}08`,
								}}
							>
								{department.label}
							</span>
						)}
						{badges?.map((badge) => (
							<span
								key={badge.label}
								className={cn(
									"rounded-md px-1.5 py-0.5 font-medium text-[10px]",
									badge.variant === "outline"
										? "border border-stroke-soft-200/80 text-text-soft-400 dark:border-neutral-700"
										: "bg-neutral-100 text-text-sub-600 dark:bg-neutral-800 dark:text-neutral-300",
								)}
							>
								{badge.label}
							</span>
						))}
					</div>
				)}

				{/* Salary */}
				{salary && (
					<div className="mt-2 text-text-soft-400 text-xs tabular-nums">
						{salary}
					</div>
				)}
			</div>
		</button>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT ROW — Compact horizontal stat display
// ═══════════════════════════════════════════════════════════════════════════

interface StatRowProps {
	stats: Array<{
		label: string;
		value: ReactNode;
		valueClass?: string;
		loading?: boolean;
		/** Optional 0-1 indicator */
		indicator?: number;
	}>;
	className?: string;
}

export function StatRow({ stats, className }: StatRowProps) {
	const getIndicatorColor = (value: number) => {
		if (value < 0.3) return "bg-red-500";
		if (value < 0.7) return "bg-amber-500";
		return "bg-emerald-500";
	};

	const getIndicatorBars = (value: number) => {
		if (value < 0.3) return 1;
		if (value < 0.7) return 2;
		return 3;
	};

	return (
		<div
			className={cn(
				"flex items-center divide-x divide-stroke-soft-200/80 rounded-xl border border-stroke-soft-200/80 bg-bg-white-0",
				"dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/50",
				className,
			)}
		>
			{stats.map((stat, i) => (
				<div
					key={`${stat.label}-${i}`}
					className="flex flex-col gap-0.5 px-5 py-2.5 first:pl-5 last:pr-5"
				>
					<span className="font-medium text-[10px] text-text-soft-400 uppercase tracking-wider">
						{stat.label}
					</span>
					{stat.loading ? (
						<Skeleton className="h-5 w-14" />
					) : (
						<div className="flex items-center gap-1.5">
							{stat.indicator !== undefined && (
								<div className="flex gap-0.5">
									{[0, 1, 2].map((bar) => (
										<div
											key={bar}
											className={cn(
												"h-3 w-1 rounded-sm",
												bar < getIndicatorBars(stat.indicator!)
													? getIndicatorColor(stat.indicator!)
													: "bg-neutral-200 dark:bg-neutral-700",
											)}
										/>
									))}
								</div>
							)}
							<span
								className={cn(
									"font-semibold text-sm tabular-nums tracking-tight",
									stat.valueClass ?? "text-text-strong-950",
								)}
							>
								{stat.value}
							</span>
						</div>
					)}
				</div>
			))}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO CARD — What-if scenario display
// ═══════════════════════════════════════════════════════════════════════════

interface ScenarioCardCompactProps {
	name: string;
	description?: string;
	/** Accent color for the card */
	color?: string;
	/** Impact metrics */
	metrics?: Array<{
		label: string;
		base: string;
		revised: string;
		delta: string;
		isPositive?: boolean;
		invertColor?: boolean;
	}>;
	/** Summary stats */
	summary?: {
		payroll: string;
		headcount: number;
	};
	actions?: ReactNode;
	className?: string;
}

export function ScenarioCardCompact({
	name,
	description,
	color = "#666",
	metrics,
	summary,
	actions,
	className,
}: ScenarioCardCompactProps) {
	return (
		<div
			className={cn(
				"group relative overflow-hidden rounded-xl border border-stroke-soft-200/80 bg-bg-white-0 transition-all duration-150",
				"hover:border-stroke-soft-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
				"dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
				className,
			)}
		>
			{/* Color accent */}
			<div
				className="absolute top-0 left-0 h-full w-1"
				style={{ backgroundColor: color }}
			/>

			{/* Header */}
			<div className="flex items-start justify-between gap-2 p-4 pb-2 pl-5">
				<div className="min-w-0">
					<h4 className="truncate font-semibold text-sm text-text-strong-950">
						{name}
					</h4>
					{description && (
						<p className="mt-0.5 line-clamp-2 text-text-soft-400 text-xs">
							{description}
						</p>
					)}
				</div>
				{actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
			</div>

			{/* Metrics */}
			{metrics && metrics.length > 0 && (
				<div className="space-y-1.5 px-4 py-2 pl-5">
					{metrics.map((metric) => {
						const isGood = metric.invertColor
							? !metric.isPositive
							: metric.isPositive;
						return (
							<div
								key={metric.label}
								className="flex items-center justify-between gap-2"
							>
								<span className="text-text-soft-400 text-xs">{metric.label}</span>
								<div className="flex items-center gap-2">
									<span className="text-text-soft-400/60 text-xs tabular-nums line-through">
										{metric.base}
									</span>
									<span className="font-medium text-xs tabular-nums text-text-strong-950">
										{metric.revised}
									</span>
									<span
										className={cn(
											"rounded px-1 py-0.5 font-medium text-[10px] tabular-nums",
											isGood
												? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
												: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
										)}
									>
										{metric.delta}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Summary */}
			{summary && (
				<div className="flex items-center gap-4 border-t border-stroke-soft-200/80 px-4 py-2.5 pl-5 text-xs dark:border-neutral-800">
					<span className="text-text-soft-400">
						Payroll:{" "}
						<span className="font-medium tabular-nums text-text-strong-950">
							{summary.payroll}
						</span>
					</span>
					<span className="text-text-soft-400">
						Headcount:{" "}
						<span className="font-medium tabular-nums text-text-strong-950">
							+{summary.headcount}
						</span>
					</span>
				</div>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HEADER — Consistent section headers
// ═══════════════════════════════════════════════════════════════════════════

interface SectionHeaderProps {
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}

export function SectionHeader({
	title,
	description,
	action,
	className,
}: SectionHeaderProps) {
	return (
		<div className={cn("flex items-start justify-between gap-4", className)}>
			<div>
				<h2 className="font-semibold text-base text-text-strong-950 tracking-tight">
					{title}
				</h2>
				{description && (
					<p className="mt-0.5 text-sm text-text-soft-400">{description}</p>
				)}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
