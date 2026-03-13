import { PlusSignIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import type { ExpandedState, Row } from "@tanstack/react-table";
import {
	getCoreRowModel,
	getExpandedRowModel,
	getGroupedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/organisms/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { authClient } from "@/lib/auth-client";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

import { AddPodDialog } from "./add-pod-dialog";
import { BudgetSummary } from "./budget-summary";
import {
	buildPodGroupCells,
	makePodBudgetColumns,
	PodBudgetsTotalsFooter,
} from "./pod-budgets-columns";
import { PodStaffSheet } from "./pod-staff-sheet";
import type {
	Carbonite,
	PodBudget,
	PodRow,
	PodTableRow,
	SelectedPod,
	StateGroup,
} from "./types";

// ── Group builder ─────────────────────────────────────────────────────────────

type OfficeGroup = {
	office: string;
	pods: PodRow[];
	totalBudget: number;
	totalActual: number;
	totalSalary: number;
};

function buildGroups(
	carbonites: Carbonite[],
	budgets: PodBudget[],
): StateGroup[] {
	const podSet = new Map<
		string,
		{ state: string; office: string; podName: string }
	>();

	for (const c of carbonites) {
		if (!c.state || !c.office || !c.pod) continue;
		const key = `${c.state}||${c.office}||${c.pod}`;
		if (!podSet.has(key))
			podSet.set(key, { state: c.state, office: c.office, podName: c.pod });
	}
	for (const b of budgets) {
		const key = `${b.state}||${b.office}||${b.podName}`;
		if (!podSet.has(key))
			podSet.set(key, { state: b.state, office: b.office, podName: b.podName });
	}

	const countMap = new Map<string, number>();
	const salaryMap = new Map<string, number>();
	const slTally = new Map<string, Map<string, number>>();
	for (const c of carbonites) {
		if (!c.state || !c.office || !c.pod) continue;
		const key = `${c.state}||${c.office}||${c.pod}`;
		countMap.set(key, (countMap.get(key) ?? 0) + 1);
		salaryMap.set(key, (salaryMap.get(key) ?? 0) + (c.salary ?? 0));
		if (c.sl) {
			if (!slTally.has(key)) slTally.set(key, new Map());
			const podSls = slTally.get(key) as Map<string, number>;
			podSls.set(c.sl, (podSls.get(c.sl) ?? 0) + 1);
		}
	}

	const budgetMap = new Map<string, number>();
	for (const b of budgets) {
		budgetMap.set(`${b.state}||${b.office}||${b.podName}`, b.budget);
	}

	const stateMap = new Map<string, Map<string, PodRow[]>>();
	for (const { state, office, podName } of podSet.values()) {
		if (!stateMap.has(state)) stateMap.set(state, new Map());
		const offMap = stateMap.get(state);
		if (!offMap) continue;
		if (!offMap.has(office)) offMap.set(office, []);
		const key = `${state}||${office}||${podName}`;
		const podSls = slTally.get(key);
		let dominantSl: string | null = null;
		if (podSls) {
			let maxCount = 0;
			for (const [sl, count] of podSls) {
				if (count > maxCount) {
					maxCount = count;
					dominantSl = sl;
				}
			}
		}
		const explicitBudget = budgetMap.get(key);
		const podTotalSalary = salaryMap.get(key) ?? 0;
		const hasBudgetSet = explicitBudget != null;
		offMap.get(office)?.push({
			podName,
			budget: hasBudgetSet ? explicitBudget : podTotalSalary,
			actual: countMap.get(key) ?? 0,
			dominantSl,
			totalSalary: podTotalSalary,
			hasBudgetSet,
		});
	}

	const states: StateGroup[] = [];
	for (const [state, offMap] of [...stateMap.entries()].sort(([a], [b]) =>
		a.localeCompare(b),
	)) {
		const offices: OfficeGroup[] = [];
		for (const [office, pods] of [...offMap.entries()].sort(([a], [b]) =>
			a.localeCompare(b),
		)) {
			const sorted = pods.sort((a, b) => a.podName.localeCompare(b.podName));
			const totalBudget = sorted.reduce((s, p) => s + p.budget, 0);
			const totalActual = sorted.reduce((s, p) => s + p.actual, 0);
			const totalSalary = sorted.reduce((s, p) => s + p.totalSalary, 0);
			offices.push({
				office,
				pods: sorted,
				totalBudget,
				totalActual,
				totalSalary,
			});
		}
		const totalBudget = offices.reduce((s, o) => s + o.totalBudget, 0);
		const totalActual = offices.reduce((s, o) => s + o.totalActual, 0);
		const totalSalary = offices.reduce((s, o) => s + o.totalSalary, 0);
		states.push({ state, offices, totalBudget, totalActual, totalSalary });
	}
	return states;
}

// ── Elapsed FY months (Australian FY: July 1 – June 30) ──────────────────────

function getElapsedFyMonths(): number {
	const month = new Date().getMonth(); // 0-indexed: 0=Jan, 6=Jul
	return month >= 6 ? month - 6 + 1 : month + 7;
}

// ── Flatten StateGroup[] → PodTableRow[] ─────────────────────────────────────

function flattenToRows(groups: StateGroup[]): PodTableRow[] {
	const rows: PodTableRow[] = [];
	const elapsed = getElapsedFyMonths();
	for (const sg of groups) {
		for (const og of sg.offices) {
			for (const pod of og.pods) {
				rows.push({
					stateGroup: sg.state,
					officeGroup: og.office,
					podName: pod.podName,
					budget: pod.budget,
					totalSalary: pod.totalSalary,
					actual: pod.actual,
					hasBudgetSet: pod.hasBudgetSet,
					dominantSl: pod.dominantSl,
					variance: pod.budget - pod.totalSalary,
					utilisation: pod.budget > 0 ? pod.totalSalary / pod.budget : 0,
					projectedYearEnd:
						elapsed > 0
							? (pod.totalSalary / elapsed) * 12
							: pod.totalSalary,
				});
			}
		}
	}
	return rows;
}

// Stable reference — must not be defined inline in useReactTable({ state })
const GROUPING: string[] = ["stateGroup", "officeGroup"];

// ══════════════════════════════════════════════════════════════════════════════
// ── Pod Budgets Tab ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function PodBudgetsTab({ fy: _fy }: { fy?: string }) {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const [addPodOpen, setAddPodOpen] = useState(false);
	const [addPodDefaults, setAddPodDefaults] = useState<{
		state: string;
		office: string;
	} | null>(null);
	const [selectedPod, setSelectedPod] = useState<SelectedPod | null>(null);
	const [expanded, setExpanded] = useState<ExpandedState>(true);

	function handleAddPod(state: string, office: string) {
		setAddPodDefaults({ state, office });
		setAddPodOpen(true);
	}

	const carbonitesQuery = useQuery(trpc.carbonites.getAll.queryOptions({}));
	const budgetsQuery = useQuery(trpc.podBudgets.getAll.queryOptions());

	const isLoading = carbonitesQuery.isPending || budgetsQuery.isPending;

	const carbonites = (carbonitesQuery.data ?? []) as Carbonite[];
	const budgets = budgetsQuery.data ?? [];

	const groups = useMemo(
		() => buildGroups(carbonites, budgets),
		[carbonites, budgets],
	);

	const { totalBudget, totalSalary, tableData, groupAggregates } =
		useMemo(() => {
			const tBudget = groups.reduce((s, g) => s + g.totalBudget, 0);
			const tSalary = groups.reduce((s, g) => s + g.totalSalary, 0);
			const rows = flattenToRows(groups);

			// Precompute aggregates for each group key (state and state||office)
			const aggs = new Map<
				string,
				{
					totalBudget: number;
					totalSalary: number;
					leafCount: number;
					officeCount?: number;
				}
			>();
			for (const sg of groups) {
				const officeSet = new Set<string>();
				let stateBudget = 0;
				let stateSalary = 0;
				let stateLeafCount = 0;
				for (const og of sg.offices) {
					officeSet.add(og.office);
					const officeBudget = og.totalBudget;
					const officeSalary = og.totalSalary;
					const officeLeafCount = og.pods.length;
					aggs.set(`${sg.state}||${og.office}`, {
						totalBudget: officeBudget,
						totalSalary: officeSalary,
						leafCount: officeLeafCount,
					});
					stateBudget += officeBudget;
					stateSalary += officeSalary;
					stateLeafCount += officeLeafCount;
				}
				aggs.set(sg.state, {
					totalBudget: stateBudget,
					totalSalary: stateSalary,
					leafCount: stateLeafCount,
					officeCount: officeSet.size,
				});
			}

			return {
				totalBudget: tBudget,
				totalSalary: tSalary,
				tableData: rows,
				groupAggregates: aggs,
			};
		}, [groups]);

	const columns = useMemo(
		() => makePodBudgetColumns(hasWriteAccess, setSelectedPod),
		[hasWriteAccess],
	);

	const table = useReactTable({
		data: tableData,
		columns,
		state: {
			grouping: GROUPING,
			expanded,
		},
		onExpandedChange: setExpanded,
		autoResetExpanded: false,
		getExpandedRowModel: getExpandedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		initialState: {
			columnVisibility: { stateGroup: false, officeGroup: false },
		},
	});

	const renderGroupCells = useCallback(
		(row: Row<PodTableRow>) =>
			buildPodGroupCells(row, groupAggregates, handleAddPod, hasWriteAccess),
		[hasWriteAccess, groupAggregates, handleAddPod],
	);

	// ── Render ────────────────────────────────────────────────────────────────

	if (isLoading) {
		return (
			<div className="flex h-40 items-center justify-center text-sm text-text-soft-400">
				Loading...
			</div>
		);
	}

	if (groups.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-6">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<HugeiconsIcon icon={UserGroupIcon} />
						</EmptyMedia>
						<EmptyTitle>No pod budgets yet</EmptyTitle>
						<EmptyDescription>
							Set headcount budgets for your pods to start tracking capacity
							across states and offices.
						</EmptyDescription>
					</EmptyHeader>
					{hasWriteAccess && (
						<Button
							size="sm"
							onClick={() => {
								setAddPodDefaults(null);
								setAddPodOpen(true);
							}}
						>
							<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3.5" />
							Add your first pod
						</Button>
					)}
				</Empty>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="p-6 pb-2">
				<BudgetSummary totalBudget={totalBudget} totalActual={totalSalary} />
			</div>

			<div className="flex-1 overflow-auto px-6 pb-6">
				<DataTable
					table={table}
					fixedLayout
					renderGroupCells={renderGroupCells}
					footer={
						<PodBudgetsTotalsFooter
							totalBudget={totalBudget}
							totalSalary={totalSalary}
						/>
					}
				/>
			</div>

			<AddPodDialog
				key={`${addPodDefaults?.state}-${addPodDefaults?.office}`}
				open={addPodOpen}
				onClose={() => {
					setAddPodOpen(false);
					setAddPodDefaults(null);
				}}
				defaultState={addPodDefaults?.state}
				defaultOffice={addPodDefaults?.office}
			/>

			<PodStaffSheet
				selectedPod={selectedPod}
				onClose={() => setSelectedPod(null)}
				carbonites={carbonites}
				budgets={budgets}
			/>
		</div>
	);
}
