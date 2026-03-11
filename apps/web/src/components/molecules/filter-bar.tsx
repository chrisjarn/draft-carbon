import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
	children: ReactNode;
	className?: string;
}

/**
 * FilterBar — horizontal flex container for filter controls inside PageToolbar.
 *
 * Replaces the repeated `flex items-center gap-2` / `gap-3` pattern used
 * across capacity-plan, hiring, fy-planning, and admin toolbars.
 *
 * Use inside `<PageToolbar>` to group selects, search inputs, and filter pills.
 */
export function FilterBar({ children, className }: FilterBarProps) {
	return (
		<div className={cn("flex items-center gap-2", className)}>{children}</div>
	);
}

/**
 * FilterBarActions — right-aligned action group (buttons, toggles).
 *
 * Replaces `ml-auto flex items-center gap-2` in toolbars.
 */
export function FilterBarActions({ children, className }: FilterBarProps) {
	return (
		<div className={cn("ml-auto flex items-center gap-2", className)}>
			{children}
		</div>
	);
}

/**
 * FilterDivider — vertical divider between filter groups.
 *
 * Replaces `h-4 w-px bg-border` used in capacity-plan toolbar.
 */
export function FilterDivider() {
	return <div className="h-4 w-px bg-border" aria-hidden="true" />;
}
