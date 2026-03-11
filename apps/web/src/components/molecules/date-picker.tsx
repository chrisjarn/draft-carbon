import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
	/** ISO date string (YYYY-MM-DD) or empty */
	value: string;
	onChange: (iso: string) => void;
	placeholder?: string;
	disabled?: boolean;
	id?: string;
	className?: string;
}

/**
 * DatePicker — Popover + Calendar with styled trigger.
 *
 * Replaces the hand-rolled Popover+Calendar pattern. Stores and emits
 * ISO date strings (YYYY-MM-DD).
 */
export function DatePicker({
	value,
	onChange,
	placeholder = "Pick a date",
	disabled,
	id,
	className,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);

	const selected = value ? new Date(`${value}T00:00:00`) : undefined;
	const displayText = selected
		? selected.toLocaleDateString("en-AU", {
				day: "numeric",
				month: "short",
				year: "numeric",
			})
		: placeholder;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						id={id}
						disabled={disabled}
						className={cn(
							"w-full justify-start text-left font-normal",
							!value && "text-muted-foreground",
							className,
						)}
					/>
				}
				aria-haspopup="dialog"
				aria-expanded={open}
			>
				<HugeiconsIcon icon={Calendar01Icon} className="mr-2 size-4" />
				{displayText}
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={(date) => {
						onChange(
							date
								? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
								: "",
						);
						setOpen(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
