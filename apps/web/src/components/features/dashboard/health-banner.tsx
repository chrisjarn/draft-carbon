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

const zonePillClasses: Record<
	ZonePillProps["variant"],
	string
> = {
	green: "bg-green-100 text-green-700 border-green-200",
	amber: "bg-yellow-100 text-yellow-700 border-yellow-200",
	red: "bg-red-100 text-red-700 border-red-200",
};

function ZonePill({ label, states, variant }: ZonePillProps) {
	return (
		<div
			className={cn(
				"rounded-lg border px-3 py-2 flex items-center gap-2",
				zonePillClasses[variant],
			)}
		>
			<span className="font-medium text-xs uppercase">{label}</span>
			<span className="text-sm tabular-nums">
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

	const nonGreenCount = redStates.length + amberStates.length;
	const plural = nonGreenCount === 1 ? "" : "s";
	const summaryText = `Overall business is tracking at ${overallPct}% — ${nonGreenCount} state${plural} need attention.`;

	// Determine worst zone for background tint
	const worstZone =
		redStates.length > 0
			? "red"
			: amberStates.length > 0
				? "amber"
				: "green";
	const stripBg =
		worstZone === "red"
			? "bg-red-50"
			: worstZone === "amber"
				? "bg-yellow-50"
				: "bg-green-50";

	return (
		<div
			className={cn(
				"flex items-center justify-between gap-4 rounded-xl px-4 py-3",
				stripBg,
			)}
		>
			<div className="flex items-center gap-3">
				<ZonePill label="On Track" states={greenStates} variant="green" />
				<ZonePill label="Watch" states={amberStates} variant="amber" />
				<ZonePill label="Shortfall" states={redStates} variant="red" />
			</div>
			<p className="text-sm italic text-text-soft-400 text-pretty">
				{summaryText}
			</p>
		</div>
	);
}
