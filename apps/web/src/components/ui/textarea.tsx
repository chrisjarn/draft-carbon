"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
	size?: "sm" | "default" | "lg" | number;
	unstyled?: boolean;
};

function Textarea({
	className,
	size = "default",
	unstyled = false,
	...props
}: TextareaProps) {
	return (
		<span
			className={
				cn(
					!unstyled &&
						"relative inline-flex w-full rounded-lg border border-stroke-soft-200 bg-bg-white-0 shadow-custom-input text-base text-text-strong-950 transition-[box-shadow,border-color,background-color] duration-200 ease-out has-[:hover:not(:focus)]:bg-bg-weak-50 has-[:hover:not(:focus)]:shadow-none has-focus:border-primary-base has-focus:bg-bg-white-0 has-focus:shadow-[var(--shadow-block-custom-input-active)] has-aria-invalid:border-error-base has-aria-invalid:has-focus:border-error-base has-disabled:cursor-not-allowed has-disabled:opacity-64 sm:text-sm",
					className,
				) || undefined
			}
			data-size={size}
			data-slot="textarea-control"
		>
			<textarea
				className={cn(
					"field-sizing-content min-h-17.5 w-full rounded-[inherit] px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] caret-primary-base outline-none placeholder:text-text-disabled-300 max-sm:min-h-20.5",
					size === "sm" &&
						"min-h-16.5 px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)] max-sm:min-h-19.5",
					size === "lg" &&
						"min-h-18.5 py-[calc(--spacing(2)-1px)] max-sm:min-h-21.5",
				)}
				data-slot="textarea"
				{...props}
			/>
		</span>
	);
}

export { Textarea, type TextareaProps };
