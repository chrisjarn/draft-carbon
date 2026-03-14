import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FormGridProps {
	columns?: 1 | 2;
	className?: string;
	children: ReactNode;
}

/**
 * FormGrid — standardized form layout with `gap-4`.
 *
 * Usage:
 *   <FormGrid columns={2}>
 *     <FormField ...>...</FormField>
 *     <FormField ... className="col-span-2">...</FormField>
 *   </FormGrid>
 */
export function FormGrid({ columns = 1, className, children }: FormGridProps) {
	return (
		<div
			className={cn("grid gap-4", columns === 2 && "grid-cols-2", className)}
		>
			{children}
		</div>
	);
}
