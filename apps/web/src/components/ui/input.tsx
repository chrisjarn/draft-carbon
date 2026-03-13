"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const InputPrimitive = React.forwardRef<
	HTMLInputElement,
	React.ComponentPropsWithoutRef<"input">
>((props, ref) => <input ref={ref} {...props} />);
InputPrimitive.displayName = "InputPrimitive";

type InputProps = Omit<
	React.ComponentPropsWithoutRef<"input"> & React.RefAttributes<HTMLInputElement>,
	"size"
> & {
	size?: "sm" | "default" | "lg" | number;
	unstyled?: boolean;
	nativeInput?: boolean;
};

function Input({
	className,
	size = "default",
	unstyled = false,
	nativeInput = false,
	...props
}: InputProps) {
	const inputClassName = cn(
		"h-10 w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] outline-none [transition:background-color_5000000s_ease-in-out_0s] placeholder:text-text-disabled-300",
		size === "sm" && "h-8 px-[calc(--spacing(2.5)-1px)]",
		size === "lg" && "h-12",
		props.type === "search" &&
			"[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
		props.type === "file" &&
			"text-text-soft-400 file:me-3 file:bg-transparent file:font-medium file:text-text-strong-950 file:text-sm",
	);

	return (
		<span
			className={
				cn(
					!unstyled &&
						"relative inline-flex w-full items-center shadow-custom-input bg-bg-white-0 rounded-lg text-text-strong-950 text-base border border-transparent transition-[shadow,border-color] has-focus:border-green-600 has-focus:shadow-gray-shadow-2 has-aria-invalid:border-error-base has-disabled:opacity-64 sm:text-sm",
					className,
				) || undefined
			}
			data-size={size}
			data-slot="input-control"
		>
			<input
				className={inputClassName}
				data-slot="input"
				size={typeof size === "number" ? size : undefined}
				{...props}
			/>
		</span>
	);
}

export { Input, type InputProps, InputPrimitive };
