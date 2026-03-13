import { cn } from "@/lib/utils";

import type { MetricCellProps } from "./wizard-types";

/** Compact label + value cell used in baseline and impact preview cards. */
export function MetricCell({ label, value, valueClass }: MetricCellProps) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-text-soft-400 text-xs">{label}</span>
			<span className={cn("font-semibold text-sm tabular-nums", valueClass)}>
				{value}
			</span>
		</div>
	);
}
