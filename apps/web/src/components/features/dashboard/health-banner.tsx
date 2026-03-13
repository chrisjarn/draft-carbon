import { Skeleton } from "@/components/ui/skeleton";
import { STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RevenueEntry } from "./types";

/* ─── ZonePill ──────────────────────────────────────────────────────────── */

interface ZonePillProps {
	label: string;
	states: string[];
	variant: "green" | "amber" | "red";
}

const dotClass: Record<ZonePillProps["variant"], string> = {
	green: "bg-emerald-500",
	amber: "bg-amber-500",
	red: "bg-red-500",
};

const valueClass: Record<ZonePillProps["variant"], string> = {
	green: "text-emerald-700",
	amber: "text-amber-600",
	red: "text-red-600",
};

function ZonePill({ label, states, variant }: ZonePillProps) {
	return (
		<div className="flex items-center gap-2">
			<span
				className={cn("size-2 shrink-0 rounded-full", dotClass[variant])}
				aria-hidden="true"
			/>
			<span className="text-text-soft-400 text-xs">{label}</span>
			<span
				className={cn(
					"font-medium text-xs tabular-nums",
					states.length > 0 ? valueClass[variant] : "text-text-soft-400",
				)}
			>
				{states.length > 0 ? states.join(", ") : "—"}
			</span>
		</div>
	);
}

/* ─── HealthBanner ──────────────────────────────────────────────────────── */

interface HealthBannerProps {
	data: RevenueEntry[] | undefined;
	loading: boolean;
}

export function HealthBanner({ data, loading }: HealthBannerProps) {
	if (loading || !data) {
		return <Skeleton className="h-14 w-full rounded-lg" />;
	}

	// Group by state and compute attainment per state
	const stateMap = new Map<string, { target: number; actual: number }>();
	for (const entry of data) {
		const key = entry.state ?? "unknown";
		const existing = stateMap.get(key) ?? { target: 0, actual: 0 };
		stateMap.set(key, {
			target: existing.target + entry.target,
			actual: existing.actual + entry.actual,
		});
	}

	const greenStates: string[] = [];
	const amberStates: string[] = [];
	const redStates: string[] = [];

	for (const [stateId, { target, actual }] of stateMap.entries()) {
		if (target === 0) continue;
		const pct = (actual / target) * 100;
		const stateMeta = STATES.find((s) => s.id === stateId);
		const label = stateMeta?.abbr ?? stateId.toUpperCase();
		if (pct > 90) {
			greenStates.push(label);
		} else if (pct >= 75) {
			amberStates.push(label);
		} else {
			redStates.push(label);
		}
	}

	// Overall aggregate
	let totalTarget = 0;
	let totalActual = 0;
	for (const entry of data) {
		totalTarget += entry.target;
		totalActual += entry.actual;
	}
	const overallPct =
		totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

	const overallColorClass =
		overallPct >= 90
			? "text-emerald-600"
			: overallPct >= 75
				? "text-amber-600"
				: "text-red-600";

	const nonGreenCount = redStates.length + amberStates.length;
	const plural = nonGreenCount === 1 ? "" : "s";
	const summaryText =
		nonGreenCount === 0
			? "All states on track."
			: `${nonGreenCount} state${plural} need${nonGreenCount === 1 ? "s" : ""} attention.`;

	return (
		<div className="flex items-center gap-5 rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-5 py-3">
			{/* Attainment % */}
			<div className="flex shrink-0 items-baseline gap-1.5">
				<span
					className={cn(
						"font-bold text-2xl tabular-nums leading-none",
						overallColorClass,
					)}
				>
					{overallPct}%
				</span>
				<span className="text-text-soft-400 text-xs">attainment</span>
			</div>

			<div className="h-8 w-px shrink-0 bg-stroke-soft-200" />

			{/* Zone pills */}
			<div className="flex flex-1 items-center gap-5">
				<ZonePill label="On Track" states={greenStates} variant="green" />
				<ZonePill label="Watch" states={amberStates} variant="amber" />
				<ZonePill label="Shortfall" states={redStates} variant="red" />
			</div>

			<p className="hidden shrink-0 text-right text-text-soft-400 text-xs italic xl:block">
				{summaryText}
			</p>
		</div>
	);
}
