import type * as React from "react";

import { cn } from "@/lib/utils";

function Separator({
	className,
	orientation = "horizontal",
	decorative = true,
	...props
}: React.ComponentPropsWithoutRef<"div"> & {
	orientation?: "horizontal" | "vertical";
	decorative?: boolean;
}) {
	return (
		<div
			role={decorative ? "none" : "separator"}
			aria-orientation={decorative ? undefined : orientation}
			className={cn(
				"shrink-0 bg-stroke-soft-200",
				orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
				className,
			)}
			data-slot="separator"
			data-orientation={orientation}
			{...props}
		/>
	);
}

export { Separator };
