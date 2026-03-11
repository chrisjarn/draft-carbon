import { Dollar01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { fmtDollar } from "@/lib/format";
import { cn } from "@/lib/utils";

// ── Avg hiring cost placeholder ───────────────────────────────────────────────

const AVG_HIRING_SALARY = 80_000;

// ── Category Bar ──────────────────────────────────────────────────────────────

type CategorySegment = {
	label: string;
	value: number;
	color: string;
};

function CategoryBar({ segments }: { segments: CategorySegment[] }) {
	const total = segments.reduce((s, seg) => s + seg.value, 0);
	if (total <= 0) return null;

	return (
		<div className="space-y-1.5">
			<div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/30">
				{segments.map((seg) => {
					const pct = (seg.value / total) * 100;
					if (pct <= 0) return null;
					return (
						<div
							key={seg.label}
							className="h-full transition-all"
							style={{ width: `${pct}%`, backgroundColor: seg.color }}
							title={`${seg.label}: ${fmtDollar(seg.value)} (${Math.round(pct)}%)`}
						/>
					);
				})}
			</div>
			<div className="flex flex-wrap items-center gap-3">
				{segments.map((seg) => (
					<div key={seg.label} className="flex items-center gap-1.5">
						<span
							className="inline-block size-2 rounded-full"
							style={{ backgroundColor: seg.color }}
						/>
						<span className="text-muted-foreground text-xs">{seg.label}</span>
						<span className="text-xs tabular-nums">{fmtDollar(seg.value)}</span>
					</div>
				))}
			</div>
		</div>
	);
}

// ── Small metric card ─────────────────────────────────────────────────────────

function MiniMetric({
	label,
	value,
	muted,
}: {
	label: string;
	value: string;
	muted?: boolean;
}) {
	return (
		<div className="flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span
				className={cn(
					"font-semibold text-sm tabular-nums",
					muted && "text-muted-foreground",
				)}
			>
				{value}
			</span>
		</div>
	);
}

// ── CompBudgetSection ─────────────────────────────────────────────────────────

export function CompBudgetSection({
	totalPayroll,
	billingCapacity,
	openHiringCount,
	entityState,
}: {
	totalPayroll: number;
	billingCapacity: number;
	openHiringCount: number;
	entityState: string | null;
}) {
	const hiringCost = openHiringCount * AVG_HIRING_SALARY;
	const projectedTotal = totalPayroll + hiringCost;
	const billingMultiple =
		projectedTotal > 0 ? billingCapacity / projectedTotal : 0;
	const remaining = Math.max(billingCapacity - projectedTotal, 0);

	const segments: CategorySegment[] = [
		{ label: "Payroll", value: totalPayroll, color: "#10b981" }, // emerald-500
		{ label: "Hiring Cost", value: hiringCost, color: "#f59e0b" }, // amber-500
		{ label: "Remaining", value: remaining, color: "#71717a" }, // zinc-500
	];

	return (
		<div className="space-y-3">
			<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
				<HugeiconsIcon icon={Dollar01Icon} className="size-3.5" />
				Compensation Budget
				{entityState && (
					<span className="text-xs">({entityState.toUpperCase()})</span>
				)}
			</h4>

			<div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
				<MiniMetric label="Total Payroll" value={fmtDollar(totalPayroll)} />
				<MiniMetric
					label="Open Hiring Cost"
					value={
						openHiringCount > 0
							? `${fmtDollar(hiringCost)} (${openHiringCount})`
							: "\u2014"
					}
					muted={openHiringCount === 0}
				/>
				<MiniMetric label="Projected Total" value={fmtDollar(projectedTotal)} />
				<MiniMetric
					label="Billing Multiple"
					value={
						billingMultiple > 0 ? `${billingMultiple.toFixed(1)}x` : "\u2014"
					}
					muted={billingMultiple === 0}
				/>
			</div>

			<CategoryBar segments={segments} />
		</div>
	);
}
