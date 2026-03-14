import { InputPrimitive } from "@/components/ui/input";
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
 * Uses InputPrimitive so pl-8 applies directly to the <input>,
 * not a wrapper span, keeping the placeholder correctly aligned.
 */
export function SearchInput({
	placeholder = "Search…",
	value,
	onChange,
	className,
}: SearchInputProps) {
	return (
		<div
			className={cn(
				"flex h-10 w-48 items-center rounded-10 border border-transparent bg-bg-white-0 shadow-custom-input transition-[shadow,border-color] hover:shadow-gray-shadow has-[:focus]:border-green-600 has-[:focus]:shadow-gray-shadow-2 lg:w-64",
				className,
			)}
		>
			<InputPrimitive
				className="h-full w-full rounded-[inherit] bg-transparent px-3 text-sm text-text-strong-950 outline-none placeholder:text-text-disabled-300"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	);
}
