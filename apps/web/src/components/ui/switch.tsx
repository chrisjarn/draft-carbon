"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			className={cn(
				"peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-green-600/20 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-white-0 disabled:cursor-not-allowed disabled:opacity-64 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-stroke-soft-200",
				className,
			)}
			data-slot="switch"
			{...props}
		>
			<SwitchPrimitive.Thumb
				className={cn(
					"pointer-events-none block size-4 rounded-full bg-bg-white-0 shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
				)}
				data-slot="switch-thumb"
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch, SwitchPrimitive };
