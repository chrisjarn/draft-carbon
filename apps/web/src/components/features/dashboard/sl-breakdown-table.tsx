import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICE_LINES, SL_COLOR_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SlRow } from "./types";

/* ─── SL Breakdown Bars ────────────────────────────────────────────────── */

interface SlBreakdownBarsProps {
	data: SlRow[] | undefined;
	loading: boolean;
	activeSlId?: string | null;
	onSlClick?: (slId: string | null) => void;
}

export function SlBreakdownBars({
	data,
	loading,
	activeSlId,
	onSlClick,
}: SlBreakdownBarsProps) {
	if (loading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={`sl-skel-${i.toString()}`} className="h-6 w-full" />
				))}
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Empty className="py-8 md:py-8">
				<EmptyHeader>
					<EmptyTitle className="text-base">No data available</EmptyTitle>
					<EmptyDescription>
						Service line data will appear here once carbonites are assigned.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const maxHeadcount = Math.max(...data.map((r) => r.headcount));

	return (
		<div className="space-y-2.5">
			{data.map((row) => {
				const slMeta = SERVICE_LINES.find((s) => s.id === row.sl);
				const color = SL_COLOR_MAP[row.sl] ?? "#888";
				const barPct =
					maxHeadcount > 0
						? Math.round((row.headcount / maxHeadcount) * 100)
						: 0;
				const isActive = row.sl === activeSlId;
				return (
					<button
						key={row.sl}
						type="button"
						className={cn(
							"w-full space-y-1 rounded-md px-2 py-1 text-left transition-colors hover:bg-bg-weak-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stroke-soft-200",
							isActive && "border-emerald-500 border-l-2 pl-1.5",
						)}
						onClick={() => onSlClick?.(isActive ? null : row.sl)}
					>
						<div className="flex items-center justify-between text-sm">
							<div className="flex items-center gap-2">
								<span
									className="inline-block size-2 rounded-full"
									style={{ backgroundColor: color }}
								/>
								<span className="font-medium">{slMeta?.name ?? row.sl}</span>
							</div>
							<div className="flex items-center gap-3 text-text-soft-400">
								<span className="tabular-nums">{row.headcount}</span>
								<span className="text-xs tabular-nums">({row.pctOfFirm}%)</span>
							</div>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-weak-50">
							<div
								className="h-full rounded-full transition-all"
								style={{
									width: `${barPct}%`,
									backgroundColor: color,
								}}
							/>
						</div>
					</button>
				);
			})}
		</div>
	);
}
