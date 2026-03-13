// Tremor ProgressBar [v0.0.1] — ported to Carbon WFP

import { cn } from "@/lib/utils";

type ProgressBarVariant =
	| "default"
	| "neutral"
	| "warning"
	| "error"
	| "success";

const variantStyles: Record<ProgressBarVariant, { bg: string; bar: string }> = {
	default: {
		bg: "bg-blue-200 dark:bg-blue-500/30",
		bar: "bg-blue-500",
	},
	neutral: {
		bg: "bg-bg-weak-50",
		bar: "bg-text-soft-400",
	},
	warning: {
		bg: "bg-yellow-200 dark:bg-yellow-500/30",
		bar: "bg-yellow-500",
	},
	error: {
		bg: "bg-red-200 dark:bg-red-500/30",
		bar: "bg-red-500",
	},
	success: {
		bg: "bg-emerald-200 dark:bg-emerald-500/30",
		bar: "bg-emerald-500",
	},
};

interface ProgressBarProps extends React.ComponentPropsWithoutRef<"div"> {
	value?: number;
	max?: number;
	variant?: ProgressBarVariant;
	showAnimation?: boolean;
	label?: string;
}

export function ProgressBar({
	value = 0,
	max = 100,
	variant = "default",
	showAnimation = false,
	label,
	className,
	...props
}: ProgressBarProps) {
	const safeValue = Math.min(max, Math.max(value, 0));
	const { bg, bar } = variantStyles[variant];

	return (
		<div className={cn("flex w-full items-center", className)} {...props}>
			<div
				className={cn("relative flex h-2 w-full items-center rounded-full", bg)}
				aria-label="progress bar"
				aria-valuenow={value}
				aria-valuemax={max}
				role="progressbar"
			>
				<div
					className={cn(
						"h-full flex-col rounded-full",
						bar,
						showAnimation &&
							"transform-gpu transition-all duration-300 ease-in-out",
					)}
					style={{
						width: `${(safeValue / max) * 100}%`,
					}}
				/>
			</div>
			{label && (
				<span className="ml-2 whitespace-nowrap font-medium text-sm leading-none">
					{label}
				</span>
			)}
		</div>
	);
}
