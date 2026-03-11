import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	ChartLineData02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsiblePanel,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { SERVICE_LINES } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
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

	// Prefer market range (m), fall back to recommended range (r)
	if (range.m) return { min: range.m[0], max: range.m[1] };
	return { min: range.r[0], max: range.r[1] };
}

function benchmarkColor(
	avg: number,
	market: { min: number; max: number } | null,
): string {
	if (!market || avg === 0) return "text-muted-foreground";
	if (avg > market.max) return "text-red-400";
	if (avg > market.max * 0.9) return "text-amber-400";
	if (avg >= market.min) return "text-green-400";
	return "text-blue-400"; // below min — might be underpaying
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
	const [open, setOpen] = useState(false);

	// Derive unique SLs from staff
	const staffSls = useMemo(() => {
		const slSet = new Set<string>();
		for (const s of staff) {
			if (s.sl) slSet.add(s.sl);
		}
		return [...slSet].sort();
	}, [staff]);

	// Compute avg salary per SL from entity staff
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

	// Fetch bracket data for each SL present in the entity
	// Use getAll since we need multiple SLs — filter client-side
	const bracketsQuery = useQuery({
		...trpc.salaryBrackets.getAll.queryOptions(),
		enabled: open && staffSls.length > 0,
	});

	const brackets = useMemo(() => {
		if (!bracketsQuery.data) return [];
		const slSet = new Set(staffSls);
		return bracketsQuery.data.filter((b) => slSet.has(b.sl));
	}, [bracketsQuery.data, staffSls]);

	// Derive entity state from first staff member (they share entity state)
	const entityState = staff[0]?.state ?? null;

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="flex w-full items-center justify-between rounded-sm px-1 py-1.5 hover:bg-muted/30">
				<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
					<HugeiconsIcon icon={ChartLineData02Icon} className="size-3.5" />
					Salary Benchmarks
					<Badge variant="outline" size="sm" className="ml-1">
						{staffSls.length} SL
					</Badge>
				</h4>
				<HugeiconsIcon
					icon={open ? ArrowUp01Icon : ArrowDown01Icon}
					className="size-3.5 text-muted-foreground"
				/>
			</CollapsibleTrigger>

			<CollapsiblePanel>
				{bracketsQuery.isPending ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						Loading benchmarks...
					</p>
				) : brackets.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						No benchmark data available for this entity&apos;s service lines
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Service Line</TableHead>
								<TableHead>Benchmark Role</TableHead>
								<TableHead className="text-right">Market Min</TableHead>
								<TableHead className="text-right">Market Max</TableHead>
								<TableHead className="text-right">Carbon Avg</TableHead>
								<TableHead className="text-center">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{brackets.map((bracket) => {
								const market = getMarketRange(
									bracket as BracketRow,
									entityState,
								);
								const carbonAvg = avgBySl.get(bracket.sl) ?? 0;
								const color = benchmarkColor(carbonAvg, market);

								return (
									<TableRow key={bracket.id}>
										<TableCell className="text-sm">
											{slLabel(bracket.sl)}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{bracket.role}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums">
											{market ? fmtDollar(market.min) : "\u2014"}
										</TableCell>
										<TableCell className="text-right text-sm tabular-nums">
											{market ? fmtDollar(market.max) : "\u2014"}
										</TableCell>
										<TableCell
											className={cn(
												"text-right font-medium text-sm tabular-nums",
												color,
											)}
										>
											{carbonAvg > 0 ? fmtDollar(carbonAvg) : "\u2014"}
										</TableCell>
										<TableCell className="text-center">
											{carbonAvg > 0 && market ? (
												<StatusBadge avg={carbonAvg} market={market} />
											) : (
												<span className="text-muted-foreground text-xs">
													{"\u2014"}
												</span>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</CollapsiblePanel>
		</Collapsible>
	);
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({
	avg,
	market,
}: {
	avg: number;
	market: { min: number; max: number };
}) {
	if (avg > market.max) {
		return (
			<Badge
				variant="outline"
				size="sm"
				className="border-red-500/40 bg-red-500/10 text-red-400"
			>
				Above
			</Badge>
		);
	}
	if (avg > market.max * 0.9) {
		return (
			<Badge
				variant="outline"
				size="sm"
				className="border-amber-500/40 bg-amber-500/10 text-amber-400"
			>
				Near Max
			</Badge>
		);
	}
	return (
		<Badge
			variant="outline"
			size="sm"
			className="border-green-500/40 bg-green-500/10 text-green-400"
		>
			In Range
		</Badge>
	);
}
