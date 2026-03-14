// ProgressCircle — ported from Tremor template, restyled for zinc/emerald theme
// Uses cn() instead of tailwind-variants, React 19 ref prop (no forwardRef)

import { cn } from "@/lib/utils";

type ProgressCircleVariant =
	| "default"
	| "neutral"
	| "warning"
	| "error"
	| "success";

const variantStyles: Record<
	ProgressCircleVariant,
	{ background: string; circle: string }
> = {
	default: {
		background: "stroke-zinc-200 dark:stroke-zinc-700",
		circle: "stroke-emerald-500 dark:stroke-emerald-500",
	},
	neutral: {
		background: "stroke-zinc-200 dark:stroke-zinc-700",
		circle: "stroke-zinc-500 dark:stroke-zinc-400",
	},
	warning: {
		background: "stroke-zinc-200 dark:stroke-zinc-700",
		circle: "stroke-amber-500 dark:stroke-amber-500",
	},
	error: {
		background: "stroke-zinc-200 dark:stroke-zinc-700",
		circle: "stroke-red-500 dark:stroke-red-500",
	},
	success: {
		background: "stroke-zinc-200 dark:stroke-zinc-700",
		circle: "stroke-emerald-500 dark:stroke-emerald-500",
	},
};

interface ProgressCircleProps
	extends Omit<React.SVGProps<SVGSVGElement>, "value"> {
	value?: number;
	max?: number;
	showAnimation?: boolean;
	radius?: number;
	strokeWidth?: number;
	variant?: ProgressCircleVariant;
	children?: React.ReactNode;
	ref?: React.Ref<SVGSVGElement>;
}

function ProgressCircle({
	value = 0,
	max = 100,
	radius = 32,
	strokeWidth = 6,
	showAnimation = true,
	variant = "default",
	className,
	children,
	ref,
	...props
}: ProgressCircleProps) {
	const safeValue = Math.min(max, Math.max(value, 0));
	const normalizedRadius = radius - strokeWidth / 2;
	const circumference = normalizedRadius * 2 * Math.PI;
	const offset = circumference - (safeValue / max) * circumference;

	const styles = variantStyles[variant];

	return (
		<div
			className="relative"
			role="progressbar"
			aria-label="progress bar"
			aria-valuenow={value}
			aria-valuemin={0}
			aria-valuemax={max}
			data-max={max}
			data-value={safeValue ?? null}
		>
			<svg
				ref={ref}
				width={radius * 2}
				height={radius * 2}
				viewBox={`0 0 ${radius * 2} ${radius * 2}`}
				className={cn("-rotate-90 transform", className)}
				{...props}
			>
				<title>Progress</title>
				<circle
					r={normalizedRadius}
					cx={radius}
					cy={radius}
					strokeWidth={strokeWidth}
					fill="transparent"
					stroke=""
					strokeLinecap="round"
					className={cn("transition-colors ease-linear", styles.background)}
				/>
				{safeValue >= 0 ? (
					<circle
						r={normalizedRadius}
						cx={radius}
						cy={radius}
						strokeWidth={strokeWidth}
						strokeDasharray={`${circumference} ${circumference}`}
						strokeDashoffset={offset}
						fill="transparent"
						stroke=""
						strokeLinecap="round"
						className={cn(
							"transition-colors ease-linear",
							styles.circle,
							showAnimation &&
								"transform-gpu transition-all duration-300 ease-in-out",
						)}
					/>
				) : null}
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				{children}
			</div>
		</div>
	);
}

export { ProgressCircle, type ProgressCircleProps };
