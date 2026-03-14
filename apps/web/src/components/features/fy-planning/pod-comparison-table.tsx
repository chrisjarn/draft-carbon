import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	officeLabel,
	stateLabel,
} from "@/components/features/carbonites/types";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { fmtDollar } from "@/lib/format";
import { trpc } from "@/utils/trpc";
import type {
	ComparisonRow,
	PodBudgetRow,
	PodStaffAgg,
	PriorYearRow,
} from "./types";

// -- Build comparison rows ----------------------------------------------------

function buildComparison(
	current: PodBudgetRow[],
	prior: PriorYearRow[],
): ComparisonRow[] {
	const priorMap = new Map<string, PriorYearRow>();
	for (const p of prior) {
		priorMap.set(`${p.state}|${p.office}|${p.podName}`, p);
	}

	return current
		.map((c) => {
			const key = `${c.state}|${c.office}|${c.podName}`;
			const p = priorMap.get(key);
			const priorBudget = p?.budget ?? null;
			const yoyChange = priorBudget !== null ? c.budget - priorBudget : null;
			const yoyPct =
				priorBudget !== null && priorBudget !== 0
					? Math.round(((c.budget - priorBudget) / priorBudget) * 100)
					: null;

			return {
				state: c.state,
				office: c.office,
				podName: c.podName,
				currentBudget: c.budget,
				priorBudget,
				yoyChange,
				yoyPct,
			};
		})
		.sort((a, b) => {
			const s = a.state.localeCompare(b.state);
			if (s !== 0) return s;
			const o = a.office.localeCompare(b.office);
			if (o !== 0) return o;
			return a.podName.localeCompare(b.podName);
		});
}

// -- CSV export ---------------------------------------------------------------

function exportPodReportCsv(
	comparison: ComparisonRow[],
	staffMap: Map<string, PodStaffAgg>,
	priorFy: string,
) {
	const hasPrior = comparison.some((r) => r.priorBudget !== null);
	const headers = [
		"Pod",
		"Office",
		"State",
		"Headcount",
		"Budget",
		"Staff Cost",
		"Remaining",
		"Load %",
		...(hasPrior ? [`Prior Year (${priorFy})`, "YoY Change"] : []),
	];

	const lines = comparison.map((r) => {
		const staff = staffMap.get(`${r.state}|${r.office}|${r.podName}`) ?? {
			headcount: 0,
			staffCost: 0,
		};
		const remaining = r.currentBudget - staff.staffCost;
		const loadPct =
			r.currentBudget > 0
				? Math.round((staff.staffCost / r.currentBudget) * 100)
				: 0;
		const cols = [
			`"${r.podName}"`,
			`"${officeLabel(r.office)}"`,
			`"${stateLabel(r.state)}"`,
			staff.headcount,
			r.currentBudget,
			staff.staffCost,
			remaining,
			`${loadPct}%`,
			...(hasPrior
				? [
						r.priorBudget ?? "",
						r.yoyChange !== null
							? `${r.yoyChange >= 0 ? "+" : ""}${r.yoyChange}`
							: "",
					]
				: []),
		];
		return cols.join(",");
	});

	// Totals row
	const totals = comparison.reduce(
		(acc, r) => {
			const staff = staffMap.get(`${r.state}|${r.office}|${r.podName}`) ?? {
				headcount: 0,
				staffCost: 0,
			};
			acc.headcount += staff.headcount;
			acc.budget += r.currentBudget;
			acc.staffCost += staff.staffCost;
			acc.priorBudget += r.priorBudget ?? 0;
			return acc;
		},
		{ headcount: 0, budget: 0, staffCost: 0, priorBudget: 0 },
	);

	const totalRemaining = totals.budget - totals.staffCost;
	const totalLoadPct =
		totals.budget > 0
			? Math.round((totals.staffCost / totals.budget) * 100)
			: 0;
	const totalYoy = hasPrior ? totals.budget - totals.priorBudget : null;

	const totalLine = [
		'"TOTAL"',
		'""',
		'""',
		totals.headcount,
		totals.budget,
		totals.staffCost,
		totalRemaining,
		`${totalLoadPct}%`,
		...(hasPrior
			? [
					totals.priorBudget,
					totalYoy !== null ? `${totalYoy >= 0 ? "+" : ""}${totalYoy}` : "",
				]
			: []),
	].join(",");

	const csv = [headers.join(","), ...lines, totalLine].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `Carbon_Pod_Report_${new Date().toISOString().slice(0, 10)}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}

// -- Component ----------------------------------------------------------------

export function PodComparisonTable({ priorFy }: { priorFy: string }) {
	const podBudgetsQuery = useQuery(trpc.podBudgets.getAll.queryOptions());
	const priorYearQuery = useQuery(
		trpc.priorYear.getByYear.queryOptions({ year: priorFy }),
	);
	const carbonitesQuery = useQuery(trpc.carbonites.getAll.queryOptions());

	const podBudgets = (podBudgetsQuery.data ?? []) as PodBudgetRow[];
	const priorYear = (priorYearQuery.data ?? []) as PriorYearRow[];
	const comparison = useMemo(
		() => buildComparison(podBudgets, priorYear),
		[podBudgets, priorYear],
	);

	// Aggregate carbonites by pod for headcount + staff cost
	const staffMap = useMemo(() => {
		const map = new Map<string, PodStaffAgg>();
		if (!carbonitesQuery.data) return map;
		for (const c of carbonitesQuery.data) {
			if (!c.state || !c.office || !c.pod) continue;
			const key = `${c.state}|${c.office}|${c.pod}`;
			const existing = map.get(key) ?? { headcount: 0, staffCost: 0 };
			existing.headcount += 1;
			existing.staffCost += c.salary ?? 0;
			map.set(key, existing);
		}
		return map;
	}, [carbonitesQuery.data]);

	const loading =
		podBudgetsQuery.isPending ||
		priorYearQuery.isPending ||
		carbonitesQuery.isPending;

	if (loading) {
		return (
			<div className="flex h-24 items-center justify-center text-sm text-text-soft-400">
				Loading pod comparison...
			</div>
		);
	}

	if (comparison.length === 0) {
		return (
			<Empty className="py-8 md:py-8">
				<EmptyHeader>
					<EmptyTitle className="text-base">
						No pod budgets for comparison
					</EmptyTitle>
					<EmptyDescription>
						Set pod budgets in the Capacity Plan to compare year-over-year.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const hasPrior = comparison.some((r) => r.priorBudget !== null);

	return (
		<div className="space-y-3">
			<div className="flex justify-end">
				<Button
					variant="outline"
					size="sm"
					onClick={() => exportPodReportCsv(comparison, staffMap, priorFy)}
					className="gap-1.5 text-sm"
				>
					<HugeiconsIcon
						icon={Download01Icon}
						className="size-3.5"
						aria-hidden="true"
					/>
					Export Pod Report
				</Button>
			</div>
			<div className="overflow-auto rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>State</TableHead>
							<TableHead>Office</TableHead>
							<TableHead>Pod</TableHead>
							<TableHead className="text-right">People</TableHead>
							<TableHead className="text-right">Budget</TableHead>
							<TableHead className="text-right">Staff Cost</TableHead>
							<TableHead className="text-right">Remaining</TableHead>
							<TableHead className="text-right">Load %</TableHead>
							{hasPrior && (
								<>
									<TableHead className="text-right">
										Prior ({priorFy})
									</TableHead>
									<TableHead className="text-right">YoY Change</TableHead>
								</>
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{comparison.map((r) => {
							const staff = staffMap.get(
								`${r.state}|${r.office}|${r.podName}`,
							) ?? { headcount: 0, staffCost: 0 };
							const remaining = r.currentBudget - staff.staffCost;
							const loadPct =
								r.currentBudget > 0
									? Math.round((staff.staffCost / r.currentBudget) * 100)
									: 0;
							return (
								<TableRow key={`${r.state}-${r.office}-${r.podName}`}>
									<TableCell>{stateLabel(r.state)}</TableCell>
									<TableCell>{officeLabel(r.office)}</TableCell>
									<TableCell>{r.podName}</TableCell>
									<TableCell className="text-right tabular-nums">
										{staff.headcount}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{fmtDollar(r.currentBudget)}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{fmtDollar(staff.staffCost)}
									</TableCell>
									<TableCell
										className={`text-right tabular-nums ${remaining >= 0 ? "text-emerald-400" : "text-red-400"}`}
									>
										{fmtDollar(remaining)}
									</TableCell>
									<TableCell
										className={`text-right font-medium tabular-nums ${loadPct > 100 ? "text-red-400" : loadPct >= 90 ? "text-amber-400" : ""}`}
									>
										{loadPct}%
									</TableCell>
									{hasPrior && (
										<>
											<TableCell className="text-right tabular-nums">
												{r.priorBudget !== null
													? fmtDollar(r.priorBudget)
													: "\u2014"}
											</TableCell>
											<TableCell
												className={`text-right font-medium tabular-nums ${
													r.yoyChange === null
														? "text-text-soft-400"
														: r.yoyChange >= 0
															? "text-emerald-400"
															: "text-red-400"
												}`}
											>
												{r.yoyChange !== null
													? `${r.yoyChange >= 0 ? "+" : ""}${fmtDollar(r.yoyChange)}`
													: "\u2014"}
											</TableCell>
										</>
									)}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
