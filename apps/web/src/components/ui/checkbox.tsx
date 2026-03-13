"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as React from "react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
	React.ComponentRef<typeof CheckboxPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
		indeterminate?: boolean;
	}
>(({ className, checked, indeterminate, ...props }, ref) => {
	// Map Base UI's `indeterminate` prop to Radix's `checked="indeterminate"`
	const resolvedChecked = indeterminate ? "indeterminate" : checked;

	return (
		<CheckboxPrimitive.Root
			ref={ref}
			className={cn(
				"group relative inline-flex size-4.5 shrink-0 items-center justify-center rounded-[.25rem] border border-stroke-soft-200 bg-bg-white-0 shadow-xs/5 outline-none transition-shadow data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=indeterminate]:bg-green-600 data-[state=indeterminate]:border-green-600 focus-visible:ring-2 focus-visible:ring-green-600/20 focus-visible:ring-offset-1 aria-invalid:border-destructive/36 data-[disabled]:pointer-events-none data-[disabled]:opacity-64 sm:size-4",
				className,
			)}
			data-slot="checkbox"
			checked={resolvedChecked}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				className="flex items-center justify-center text-text-white-0"
				data-slot="checkbox-indicator"
			>
				{/* Dash icon — shown when indeterminate */}
				<svg
					className="size-3.5 sm:size-3 hidden group-data-[state=indeterminate]:block"
					fill="none"
					height="24"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="3"
					viewBox="0 0 24 24"
					width="24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M5.252 12h13.496" />
				</svg>
				{/* Check icon — shown when checked */}
				<svg
					className="size-3.5 sm:size-3 block group-data-[state=indeterminate]:hidden"
					fill="none"
					height="24"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="3"
					viewBox="0 0 24 24"
					width="24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
				</svg>
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
});
Checkbox.displayName = "Checkbox";

export { Checkbox, CheckboxPrimitive };
