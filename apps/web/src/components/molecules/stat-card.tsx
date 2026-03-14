import { ArrowDown02Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
	label: string;
	value: string | number;
	loading?: boolean;
	subtitle?: string;
	subtitleClass?: string;
	trend?: { value: string; positive: boolean };
	/** Icon component to display */
	icon?: React.ComponentType<{ className?: string }>;
	/** Value color variant */
	variant?: "default" | "success" | "warning" | "error";
	className?: string;
}

export function StatCard({
	label,
	value,
	loading,
	subtitle,
	subtitleClass,
	trend,
	icon: Icon,
	variant = "default",
	className,
}: StatCardProps) {
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
				<>
					<Skeleton className="h-8 w-24" />
					<Skeleton className="mt-0.5 h-3.5 w-16" />
				</>
			) : (
				<>
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
									trend.positive
										? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
										: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
								)}
							>
								<HugeiconsIcon
									icon={trend.positive ? ArrowUp02Icon : ArrowDown02Icon}
									className="size-3"
									aria-hidden="true"
								/>
								{trend.value}
							</span>
						)}
					</div>
					{subtitle && (
						<span className={cn("text-xs", subtitleClass ?? "text-text-soft-400")}>
							{subtitle}
						</span>
					)}
				</>
			)}
		</div>
	);
}
