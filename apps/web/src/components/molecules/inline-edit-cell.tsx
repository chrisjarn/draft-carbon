import { PencilEdit01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InlineEditCellProps {
	value: string | null | undefined;
	onSave: (v: string) => void;
	/** Display formatter — receives the raw value, returns display string */
	format?: (v: string | null | undefined) => string;
	/** Prefix shown to the left of the input while editing (e.g. "$") */
	prefix?: string;
	disabled?: boolean;
	/** Input width class (default: "w-20") */
	inputWidth?: string;
	className?: string;
}

/**
 * InlineEditCell — click-to-edit cell for table columns.
 *
 * Replaces both `EditableCell` (capacity-plan) and `RevenueCell` (fy-planning)
 * with a single, configurable molecule.
 */
export function InlineEditCell({
	value,
	onSave,
	format,
	prefix = "$",
	disabled,
	inputWidth = "w-20",
	className,
}: InlineEditCellProps) {
	const [editing, setEditing] = useState(false);
	const [val, setVal] = useState(value ?? "");

	const displayValue = format ? format(value) : (value ?? "\u2014");

	if (disabled) {
		return (
			<span className={cn("text-sm tabular-nums", className)}>
				{displayValue}
			</span>
		);
	}

	if (editing) {
		return (
			<div className="flex items-center gap-1">
				<span className="text-sm text-text-soft-400">{prefix}</span>
				<Input
					type="number"
					value={val}
					onChange={(e) => setVal(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onSave(val);
							setEditing(false);
						}
						if (e.key === "Escape") setEditing(false);
					}}
					className={cn("h-6 text-sm", inputWidth)}
				/>
				<button
					type="button"
					aria-label="Save value"
					onClick={() => {
						onSave(val);
						setEditing(false);
					}}
					className="rounded-sm text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong-950"
				>
					<HugeiconsIcon
						icon={Tick01Icon}
						className="size-3.5"
						aria-hidden="true"
					/>
				</button>
			</div>
		);
	}

	return (
		<div className={cn("group flex items-center gap-1", className)}>
			<span className="text-sm tabular-nums">{displayValue}</span>
			<button
				type="button"
				aria-label="Edit value"
				onClick={() => {
					setVal(value ?? "");
					setEditing(true);
				}}
				className="rounded-sm text-text-soft-400 opacity-0 transition-opacity hover:text-text-strong-950 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong-950 group-hover:opacity-100"
			>
				<HugeiconsIcon
					icon={PencilEdit01Icon}
					className="size-3"
					aria-hidden="true"
				/>
			</button>
		</div>
	);
}
