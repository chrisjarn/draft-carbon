import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
	/** Custom message. Defaults to "Loading…" */
	children?: ReactNode;
	className?: string;
}

/**
 * LoadingState — centered placeholder shown while data loads.
 *
 * Replaces the repeated `flex h-40 items-center justify-center text-text-soft-400 text-sm`
 * pattern used in hiring, fy-planning, admin, and pod-budgets.
 */
export function LoadingState({ children, className }: LoadingStateProps) {
	return (
		<div
			className={cn(
				"flex h-40 items-center justify-center text-sm text-text-soft-400",
				className,
			)}
		>
			{children ?? "Loading…"}
		</div>
	);
}
