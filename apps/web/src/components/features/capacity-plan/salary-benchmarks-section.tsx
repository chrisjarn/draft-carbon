import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { SERVICE_LINES } from "@/lib/constants";
import { fmtDollar, fmtK } from "@/lib/format";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import type { EntityDetailData } from "./types";

// ── Types ─────────────────────────────────────────────────────────────────────

type StateRange = {
	m: [number, number] | null;
	r: [number, number];
} | null;

type BracketRow = {
	id: string;
	sl: string;
	role: string;
	nsw: StateRange;
	qld: StateRange;
	sa: StateRange;
	vic: StateRange;
	wa: StateRange;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMarketRange(
	bracket: BracketRow,
	state: string | null,
): { min: number; max: number } | null {
	if (!state) return null;
	const stateKey = state.toLowerCase() as keyof Pick<
		BracketRow,
		"nsw" | "qld" | "sa" | "vic" | "wa"
	>;
	const range = bracket[stateKey];
	if (!range) return null;
	if (range.m) return { min: range.m[0], max: range.m[1] };
	return { min: range.r[0], max: range.r[1] };
}

function getStatus(
	avg: number,
	market: { min: number; max: number },
): { textColor: string; dotClass: string; label: string; badgeClass: string } {
	if (avg > market.max)
		return {
			textColor: "text-red-400",
			dotClass: "bg-red-400",
			label: "Above",
			badgeClass: "border-red-500/40 bg-red-500/10 text-red-400",
		};
	if (avg > market.max * 0.9)
		return {
			textColor: "text-amber-400",
			dotClass: "bg-amber-400",
			label: "Near Max",
			badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-400",
		};
	if (avg >= market.min)
		return {
			textColor: "text-emerald-500",
			dotClass: "bg-emerald-500",
			label: "In Range",
			badgeClass: "border-green-500/40 bg-green-500/10 text-green-400",
		};
	return {
		textColor: "text-blue-400",
		dotClass: "bg-blue-400",
		label: "Below Min",
		badgeClass: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	};
}

function slLabel(slId: string): string {
	return SERVICE_LINES.find((sl) => sl.id === slId)?.short ?? slId;
}

// ── SalaryBenchmarksSection ───────────────────────────────────────────────────

export function SalaryBenchmarksSection({
	entityId: _entityId,
	staff,
}: {
	entityId: string;
	staff: EntityDetailData["staff"];
}) {
	const staffSls = useMemo(() => {
		const slSet = new Set<string>();
		for (const s of staff) {
			if (s.sl) slSet.add(s.sl);
		}
		return [...slSet].sort();
	}, [staff]);

	const avgBySl = useMemo(() => {
		const map = new Map<string, { total: number; count: number }>();
		for (const s of staff) {
			if (!s.sl || !s.salary) continue;
			const entry = map.get(s.sl) ?? { total: 0, count: 0 };
			entry.total += s.salary;
			entry.count += 1;
			map.set(s.sl, entry);
		}
		const result = new Map<string, number>();
		for (const [sl, { total, count }] of map) {
			result.set(sl, Math.round(total / count));
		}
		return result;
	}, [staff]);

	const bracketsQuery = useQuery({
		...trpc.salaryBrackets.getAll.queryOptions(),
		enabled: staffSls.length > 0,
	});

	const brackets = useMemo(() => {
		if (!bracketsQuery.data) return [];
		const slSet = new Set(staffSls);
		return bracketsQuery.data.filter((b) => slSet.has(b.sl));
	}, [bracketsQuery.data, staffSls]);

	const entityState = staff[0]?.state ?? null;

	if (staff.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-text-soft-400">
				No staff data available
			</p>
		);
	}

	if (bracketsQuery.isPending) {
		return (
			<div className="space-y-6 py-2">
				{[1, 2, 3].map((i) => (
					<div key={i} className="space-y-2">
						<div className="h-4 w-36 rounded bg-bg-weak-50" />
						<div className="h-2 w-full rounded-full bg-bg-weak-50" />
						<div className="h-3 w-24 rounded bg-bg-weak-50" />
					</div>
				))}
			</div>
		);
	}

	if (brackets.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-text-soft-400">
				No benchmark data for this entity&apos;s service lines
			</p>
		);
	}

	return (
		<div className="space-y-5">
			{brackets.map((bracket) => {
				const market = getMarketRange(bracket as BracketRow, entityState);
				const carbonAvg = avgBySl.get(bracket.sl) ?? 0;

				return (
					<BenchmarkRangeRow
						key={bracket.id}
						sl={slLabel(bracket.sl)}
						role={bracket.role}
						market={market}
						carbonAvg={carbonAvg}
					/>
				);
			})}
		</div>
	);
}

// ── BenchmarkRangeRow ─────────────────────────────────────────────────────────

function BenchmarkRangeRow({
	sl,
	role,
	market,
	carbonAvg,
}: {
	sl: string;
	role: string;
	market: { min: number; max: number } | null;
	carbonAvg: number;
}) {
	if (!market) {
		return (
			<div className="flex items-center justify-between">
				<div>
					<span className="font-medium text-sm">{sl}</span>
					<span className="ml-1.5 text-text-soft-400 text-xs">{role}</span>
				</div>
				<span className="text-text-soft-400 text-xs">No market data</span>
			</div>
		);
	}

	const pad = (market.max - market.min) * 0.5;
	const barMin = Math.max(0, market.min - pad);
	const barMax = market.max + pad;
	const barSpan = barMax - barMin;

	const minPct = ((market.min - barMin) / barSpan) * 100;
	const maxPct = ((market.max - barMin) / barSpan) * 100;
	const rawAvgPct =
		carbonAvg > 0 ? ((carbonAvg - barMin) / barSpan) * 100 : null;
	const clampedAvgPct =
		rawAvgPct !== null ? Math.max(0, Math.min(100, rawAvgPct)) : null;

	const status = carbonAvg > 0 ? getStatus(carbonAvg, market) : null;

	return (
		<div className="space-y-1.5">
			{/* Row header */}
			<div className="flex items-center justify-between gap-4">
				<div className="min-w-0">
					<span className="font-medium text-sm">{sl}</span>
					<span className="ml-1.5 truncate text-text-soft-400 text-xs">
						{role}
					</span>
				</div>
				{status && carbonAvg > 0 && (
					<div className="flex shrink-0 items-center gap-2">
						<span
							className={cn(
								"font-medium text-sm tabular-nums",
								status.textColor,
							)}
						>
							{fmtDollar(carbonAvg)}
						</span>
						<Badge variant="outline" size="sm" className={status.badgeClass}>
							{status.label}
						</Badge>
					</div>
				)}
			</div>

			{/* Range bar */}
			<div className="relative h-2 overflow-hidden rounded-full bg-bg-weak-50">
				{/* Market zone */}
				<div
					className="absolute h-full bg-emerald-500/20"
					style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
				/>
				{/* Min boundary */}
				<div
					className="absolute h-full w-px bg-emerald-500/60"
					style={{ left: `${minPct}%` }}
				/>
				{/* Max boundary */}
				<div
					className="absolute h-full w-px bg-emerald-500/60"
					style={{ left: `${maxPct}%` }}
				/>
				{/* Carbon avg marker */}
				{clampedAvgPct !== null && (
					<div
						className={cn(
							"absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
							status?.dotClass ?? "bg-text-soft-400",
						)}
						style={{ left: `${clampedAvgPct}%` }}
					/>
				)}
			</div>

			{/* Scale labels aligned to min/max boundaries */}
			<div className="relative h-4">
				<span
					className="absolute text-text-soft-400 text-xs tabular-nums"
					style={{ left: `${minPct}%`, transform: "translateX(-50%)" }}
				>
					{fmtK(market.min)}
				</span>
				<span
					className="absolute text-text-soft-400 text-xs tabular-nums"
					style={{ left: `${maxPct}%`, transform: "translateX(-50%)" }}
				>
					{fmtK(market.max)}
				</span>
			</div>
		</div>
	);
}
