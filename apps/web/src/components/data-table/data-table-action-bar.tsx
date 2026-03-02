import { Cancel01Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					aria-orientation="horizontal"
					className={cn(
						"fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-md border bg-background p-2 text-foreground shadow-sm",
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
			)}
		</AnimatePresence>,
		container,
	);
}

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
	...props
}: DataTableActionBarActionProps) {
	return (
		<Button
			className={cn(
				"gap-1.5 border border-secondary bg-secondary [&>svg]:size-3.5",
				size === "icon" ? "size-7" : "h-7",
				className,
			)}
			disabled={disabled ?? isPending}
			size={size}
			variant="secondary"
			title={tooltip}
			{...props}
		>
			{isPending ? (
				<HugeiconsIcon icon={Loading01Icon} className="animate-spin" />
			) : (
				children
			)}
		</Button>
	);
}

function DataTableActionBarSelection<TData>({
	table,
}: {
	table: Table<TData>;
}) {
	const onClearSelection = React.useCallback(() => {
		table.toggleAllRowsSelected(false);
	}, [table]);

	return (
		<div className="flex h-7 items-center rounded-md border pr-1 pl-2.5">
			<span className="whitespace-nowrap text-xs">
				{table.getFilteredSelectedRowModel().rows.length} selected
			</span>

			<Separator
				className="mr-1 ml-2 data-[orientation=vertical]:h-4"
				orientation="vertical"
			/>

			<Button
				className="size-5"
				onClick={onClearSelection}
				size="icon"
				variant="ghost"
				title="Clear selection (Esc)"
			>
				<HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
			</Button>
		</div>
	);
}

export {
	DataTableActionBar,
	DataTableActionBarAction,
	DataTableActionBarSelection,
};
