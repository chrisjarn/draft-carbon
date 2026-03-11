import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICE_LINES, SL_COLOR_MAP } from "@/lib/constants";
import type { SlRow } from "./types";

/* ─── SL Breakdown Bars ────────────────────────────────────────────────── */

interface SlBreakdownBarsProps {
	data: SlRow[] | undefined;
	loading: boolean;
}

export function SlBreakdownBars({ data, loading }: SlBreakdownBarsProps) {
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
				return (
					<div key={row.sl} className="space-y-1">
						<div className="flex items-center justify-between text-sm">
							<div className="flex items-center gap-2">
								<span
									className="inline-block size-2 rounded-full"
									style={{ backgroundColor: color }}
								/>
								<span className="font-medium">{slMeta?.name ?? row.sl}</span>
							</div>
							<div className="flex items-center gap-3 text-muted-foreground">
								<span className="tabular-nums">{row.headcount}</span>
								<span className="text-xs tabular-nums">({row.pctOfFirm}%)</span>
							</div>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full transition-all"
								style={{
									width: `${barPct}%`,
									backgroundColor: color,
								}}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}
