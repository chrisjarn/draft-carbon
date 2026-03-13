"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
	return (
		<label
			className={cn(
				"inline-flex items-center gap-2 font-medium text-text-sub-600 text-sm",
				className,
			)}
			data-slot="label"
			{...props}
		/>
	);
}

export { Label };
