import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── SheetRow ──────────────────────────────────────────────────────────────────

interface SheetRowProps {
	label: string;
	value?: string | number | null;
	/** Custom content — replaces the default value render when provided. */
	children?: ReactNode;
}

/**
 * SheetRow — label/value pair used inside detail sheets and drawers.
 *
 * Extracted from the identical `SheetRow` / `Row` patterns in
 * hiring.lazy.tsx and carbonite-detail-sheet.tsx.
 */
export function SheetRow({ label, value, children }: SheetRowProps) {
	return (
		<div className="flex items-center justify-between gap-4 py-2">
			<span className="shrink-0 text-text-soft-400 text-xs">{label}</span>
			{children ?? (
				<span className="text-right font-medium text-sm tabular-nums">
					{value ?? <span className="text-text-soft-400/50">—</span>}
				</span>
			)}
		</div>
	);
}

// ── SheetGroup ────────────────────────────────────────────────────────────────

interface SheetGroupProps {
	title: string;
	children: ReactNode;
	className?: string;
}

/**
 * SheetGroup — titled section with bordered content used inside detail sheets.
 *
 * Extracted from the identical `SheetGroup` / `Group` patterns in
 * hiring.lazy.tsx and carbonite-detail-sheet.tsx.
 */
export function SheetGroup({ title, children, className }: SheetGroupProps) {
	return (
		<div className={cn("pt-4 pb-2", className)}>
			<p className="section-label mb-1">{title}</p>
			<div className="divide-y divide-border/40 rounded-md border /60 bg-bg-weak-50/20 px-3">
				{children}
			</div>
		</div>
	);
}
