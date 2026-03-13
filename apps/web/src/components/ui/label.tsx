"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
	return (
		<label
			className={cn(
				"inline-flex items-center gap-2 font-medium text-sm text-text-sub-600",
				className,
			)}
			data-slot="label"
			{...props}
		/>
	);
}

export { Label };
