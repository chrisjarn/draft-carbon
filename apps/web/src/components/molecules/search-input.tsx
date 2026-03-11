import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

/**
 * SearchInput — icon-prefixed search field.
 *
 * Replaces the repeated `<div className="relative"> + absolute icon + pl-8 Input`
 * pattern used across carbonites, fy-planning, and hiring.
 */
export function SearchInput({
	placeholder = "Search…",
	value,
	onChange,
	className,
}: SearchInputProps) {
	return (
		<div className="relative">
			<HugeiconsIcon
				icon={Search01Icon}
				className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
				aria-hidden="true"
			/>
			<Input
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={cn("w-48 pl-8 lg:w-64", className)}
			/>
		</div>
	);
}
