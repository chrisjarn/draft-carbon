import { PlusSignIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

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
import { StateSection } from "./pod-sections";
import { PodStaffSheet } from "./pod-staff-sheet";
import type {
	Carbonite,
	PodBudget,
	PodRow,
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

	function handleAddPod(state: string, office: string) {
		setAddPodDefaults({ state, office });
		setAddPodOpen(true);
	}

	const carbonitesQuery = useQuery(trpc.carbonites.getAll.queryOptions({}));
	const budgetsQuery = useQuery(trpc.podBudgets.getAll.queryOptions());

	const isLoading = carbonitesQuery.isPending || budgetsQuery.isPending;

	const carbonites = (carbonitesQuery.data ?? []) as Carbonite[];
	const budgets = budgetsQuery.data ?? [];
	const groups = buildGroups(carbonites, budgets);

	const totalBudget = groups.reduce((s, g) => s + g.totalBudget, 0);
	const totalSalary = groups.reduce((s, g) => s + g.totalSalary, 0);

	return (
		<div className="flex h-full flex-col">
			{/* Legend */}
			<div className="flex items-center gap-6 border-border border-b px-6 py-2.5">
				<div className="grid w-full grid-cols-[1fr_100px_100px_100px_140px_120px] gap-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
					<span className="pl-4">Location</span>
					<span>Budget</span>
					<span>Staff Cost</span>
					<span>Variance</span>
					<span>Utilisation</span>
					<span>Status</span>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto p-6">
				{isLoading ? (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
						Loading...
					</div>
				) : groups.length === 0 ? (
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
				) : (
					<div className="space-y-4">
						<BudgetSummary
							totalBudget={totalBudget}
							totalActual={totalSalary}
						/>
						{groups.map((group) => (
							<StateSection
								key={group.state}
								group={group}
								canWriteAccess={hasWriteAccess}
								onSelectPod={setSelectedPod}
								onAddPod={handleAddPod}
							/>
						))}
					</div>
				)}
			</div>

			{/* Add Pod Dialog */}
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

			{/* Pod Staff Sheet */}
			<PodStaffSheet
				selectedPod={selectedPod}
				onClose={() => setSelectedPod(null)}
				carbonites={carbonites}
				budgets={budgets}
			/>
		</div>
	);
}
