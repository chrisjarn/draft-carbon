"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-base outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-10 pointer-coarse:after:min-w-11 focus-visible:shadow-button-important-focus focus-visible:ring-2 focus-visible:ring-stroke-strong-950 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 sm:text-sm [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
	{
		defaultVariants: {
			size: "default",
			variant: "default",
		},
		variants: {
			size: {
				default: "h-9 px-[calc(--spacing(3)-1px)] sm:h-10",
				icon: "size-9 sm:size-8",
				"icon-lg": "size-10 sm:size-9",
				"icon-sm": "size-8 sm:size-7",
				"icon-xl":
					"size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
				"icon-xs":
					"size-7 rounded-md before:rounded-[calc(var(--radius-md)-1px)] sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9",
				md: "h-9 px-[calc(--spacing(3)-1px)] sm:h-8",
				sm: "h-10 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7",
				xl: "h-10 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
				xs: "h-7 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-sm before:rounded-[calc(var(--radius-md)-1px)] sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
				xxs: "h-6 gap-0.5 rounded-md px-[calc(--spacing(1.5)-1px)] text-xs before:rounded-[calc(var(--radius-md)-1px)] sm:h-5 sm:text-[0.6875rem] [&_svg:not([class*='size-'])]:size-3.5 sm:[&_svg:not([class*='size-'])]:size-3",
			},
			variant: {
				default:
					"border-transparent bg-bg-surface-800 text-text-white-0 shadow-none hover:bg-stroke-strong-950",
				destructive: "border-transparent bg-error-base text-text-white-0",
				"destructive-outline":
					"border-transparent text-error-base ring-1 ring-error-base ring-inset hover:bg-error-light",
				ghost: "border-transparent text-text-sub-600 hover:bg-bg-weak-50",
				link: "border-transparent text-text-sub-600 underline-offset-4 hover:underline",
				outline:
					"border-transparent bg-bg-white-0 text-text-sub-600 ring-1 ring-stroke-soft-200 ring-inset hover:bg-bg-weak-50",
				secondary:
					"border-transparent bg-bg-weak-50 text-text-sub-600 hover:bg-bg-weak-50",
			},
		},
	},
);

interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
	variant?: VariantProps<typeof buttonVariants>["variant"];
	size?: VariantProps<typeof buttonVariants>["size"];
	asChild?: boolean;
}

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			className={cn(buttonVariants({ className, size, variant }))}
			data-slot="button"
			{...(asChild ? {} : { type: "button" as const })}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
