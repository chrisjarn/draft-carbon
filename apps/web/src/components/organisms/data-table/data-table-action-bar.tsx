import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Sidebar offset hook ──────────────────────────────────────────────────────
// Watches the sidebar-gap spacer element width via ResizeObserver so the
// action bar centers itself within the content area, not the full viewport.

function useSidebarOffset() {
	const [left, setLeft] = React.useState(0);

	React.useEffect(() => {
		const gap = document.querySelector<HTMLElement>(
			"[data-slot='sidebar-gap']",
		);
		if (!gap) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setLeft(entry.contentRect.width);
			}
		});
		setLeft(gap.getBoundingClientRect().width);
		observer.observe(gap);
		return () => observer.disconnect();
	}, []);

	return left;
}

// ── Action bar container (dark, button-group style) ───────────────────────────

interface DataTableActionBarProps<TData>
	extends React.ComponentProps<typeof motion.div> {
	container?: DocumentFragment | Element | null;
	table: Table<TData>;
	visible?: boolean;
}

function DataTableActionBar<TData>({
	children,
	className,
	container: containerProp,
	table,
	visible: visibleProp,
	...props
}: DataTableActionBarProps<TData>) {
	const [mounted, setMounted] = React.useState(false);
	const sidebarLeft = useSidebarOffset();

	React.useLayoutEffect(() => {
		setMounted(true);
	}, []);

	React.useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				table.toggleAllRowsSelected(false);
			}
		}

		globalThis.addEventListener("keydown", onKeyDown);
		return () => {
			globalThis.removeEventListener("keydown", onKeyDown);
		};
	}, [table]);

	const container =
		containerProp ?? (mounted ? globalThis.document.body : null);

	if (!container) return null;

	const visible =
		visibleProp ?? table.getFilteredSelectedRowModel().rows.length > 0;

	return ReactDOM.createPortal(
		<AnimatePresence>
			{visible && (
				<div
					className="pointer-events-none fixed right-0 bottom-0 z-50 flex justify-center pb-6 transition-[left] duration-200 ease-linear"
					style={{ left: sidebarLeft }}
				>
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						aria-orientation="horizontal"
						className={cn(
							"pointer-events-auto flex h-10 w-fit items-stretch overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 shadow-black/20 shadow-lg",
							className,
						)}
						exit={{ opacity: 0, y: 20 }}
						initial={{ opacity: 0, y: 20 }}
						role="toolbar"
						transition={{ duration: 0.2, ease: "easeInOut" }}
						{...props}
					>
						{children}
					</motion.div>
				</div>
			)}
		</AnimatePresence>,
		container,
	);
}

// ── Action button ─────────────────────────────────────────────────────────────

interface DataTableActionBarActionProps
	extends React.ComponentProps<typeof Button> {
	isPending?: boolean;
	tooltip?: string;
}

function DataTableActionBarAction({
	children,
	className,
	disabled,
	isPending,
	size = "sm",
	tooltip,
	variant,
	...props
}: DataTableActionBarActionProps) {
	const isDestructive = variant === "destructive";

	const trigger = (
		<Button
			data-slot="action-bar-action"
			className={cn(
				"h-full gap-1.5 rounded-none border-0 border-zinc-700/40 border-l px-3 text-xs [&>svg]:size-3.5",
				isDestructive
					? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
					: "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50",
				className,
			)}
			disabled={disabled ?? isPending}
			size={size}
			variant="ghost"
			{...props}
		>
			{isPending ? (
				<span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
			) : (
				children
			)}
		</Button>
	);

	if (!tooltip) return trigger;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger render={<span className="flex" />}>
					{trigger}
				</TooltipTrigger>
				<TooltipContent sideOffset={6}>{tooltip}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

// ── Selection count ───────────────────────────────────────────────────────────

interface DataTableActionBarSelectionProps<TData> {
	table: Table<TData>;
}

function DataTableActionBarSelection<TData>({
	table,
}: DataTableActionBarSelectionProps<TData>) {
	const onClearSelection = React.useCallback(() => {
		table.toggleAllRowsSelected(false);
	}, [table]);

	return (
		<div className="flex items-center gap-1.5 px-3">
			<span className="font-medium text-sm text-zinc-100 tabular-nums">
				{table.getFilteredSelectedRowModel().rows.length}
			</span>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								className="size-5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200"
								onClick={onClearSelection}
								size="icon"
								variant="ghost"
							/>
						}
					>
						<HugeiconsIcon icon={Cancel01Icon} className="size-3" />
					</TooltipTrigger>
					<TooltipContent
						className="flex items-center gap-2 border border-zinc-600 bg-zinc-800 px-2 py-1 font-semibold text-zinc-200 [&>span]:hidden"
						sideOffset={10}
					>
						<p>Clear selection</p>
						<kbd className="select-none rounded border border-zinc-600 bg-zinc-900 px-1.5 py-px font-mono font-normal text-[0.7rem] text-zinc-400 shadow-xs">
							<abbr className="no-underline" title="Escape">
								Esc
							</abbr>
						</kbd>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}

export {
	DataTableActionBar,
	DataTableActionBarAction,
	DataTableActionBarSelection,
};
