"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const InputPrimitive = React.forwardRef<
	HTMLInputElement,
	React.ComponentPropsWithoutRef<"input">
>((props, ref) => <input ref={ref} {...props} />);
InputPrimitive.displayName = "InputPrimitive";

type InputProps = Omit<
	React.ComponentPropsWithoutRef<"input"> &
		React.RefAttributes<HTMLInputElement>,
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
		"h-10 w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] caret-primary-base outline-none [transition:background-color_5000000s_ease-in-out_0s] placeholder:text-text-disabled-300",
		size === "sm" && "h-8 px-[calc(--spacing(2.5)-1px)]",
		size === "lg" && "h-12",
		props.type === "search" &&
			"[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
		props.type === "file" &&
			"text-text-soft-400 file:me-3 file:bg-transparent file:font-medium file:text-sm file:text-text-strong-950",
	);

	return (
		<span
			className={
				cn(
					!unstyled &&
						"relative inline-flex w-full items-center rounded-lg border border-transparent bg-bg-weak-50 text-base text-text-strong-950 transition-[border-color,background-color] duration-200 ease-out has-aria-invalid:has-focus:border-error-base has-disabled:cursor-not-allowed has-aria-invalid:border-error-base has-focus:border-primary-base has-focus:bg-bg-white-0 has-disabled:opacity-64 has-focus:shadow-[var(--shadow-block-custom-input-active)] sm:text-sm",
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
