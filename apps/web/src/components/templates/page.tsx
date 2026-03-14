import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageProps {
	children: ReactNode;
	className?: string;
}

/**
 * Top-level page wrapper. Always `flex h-full flex-col`.
 * Pages must not add any spacing, sizing, or layout classes — use `PageBody`.
 */
export function Page({ children, className }: PageProps) {
	return (
		<div className={cn("flex h-full flex-col", className)}>{children}</div>
	);
}

interface PageToolbarProps {
	children: ReactNode;
	className?: string;
	/** Tailwind max-w class — centers content to a max width (e.g. "max-w-[968px]"). */
	constrain?: string;
}

/**
 * Secondary toolbar band below PageHeader.
 * Standardized `border-b px-6 py-2` — never override spacing on pages.
 */
export function PageToolbar({
	children,
	className,
	constrain,
}: PageToolbarProps) {
	if (constrain) {
		return (
			<div className={cn("px-6 py-2", className)}>
				<div
					className={cn(
						"mx-auto flex w-full items-center justify-between",
						constrain,
					)}
				>
					{children}
				</div>
			</div>
		);
	}
	return (
		<div
			className={cn("flex items-center justify-between px-6 py-2", className)}
		>
			{children}
		</div>
	);
}

interface PageBodyProps {
	children: ReactNode;
	/** Apply standard page padding (px-6 py-4 bg-bg-weak-50/30). Default: false (no padding). */
	padded?: boolean;
	/**
	 * Constrain content to a max width and center it.
	 * Accepts a Tailwind max-w-* value (e.g. "max-w-md", "max-w-[968px]").
	 */
	constrain?: string;
	className?: string;
}

interface PageSectionProps {
	children: ReactNode;
	className?: string;
}

/**
 * Non-scrolling page section (e.g. secondary panel below the main content area).
 * Applies standard `px-6 py-4 bg-bg-weak-50/30` padding. Use `border-t` via `className` if needed.
 */
export function PageSection({ children, className }: PageSectionProps) {
	return (
		<div className={cn("bg-bg-weak-50/30 px-6 py-4", className)}>
			{children}
		</div>
	);
}

/**
 * Scrollable page content area.
 * - `padded` adds standard dashboard padding (px-6 py-4 bg-bg-weak-50/30)
 * - `constrain` wraps content in a centered max-width container
 */
export function PageBody({
	children,
	padded = false,
	constrain,
	className,
}: PageBodyProps) {
	const inner = constrain ? (
		<div className={cn("mx-auto w-full", constrain)}>{children}</div>
	) : (
		children
	);

	return (
		<div
			className={cn(
				"flex-1 overflow-auto",
				padded && "bg-bg-weak-50/30 px-6 py-4",
				className,
			)}
		>
			{inner}
		</div>
	);
}
