import {
	ArrowDown01Icon,
	ArrowRight01Icon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type { ReactNode } from "react";

import {
	officeLabel,
	slLabel,
	stateLabel,
} from "@/components/features/carbonites/types";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { fmtDollar } from "@/lib/format";

import { BudgetCell, CapacityBar, StatusBadge } from "./pod-row";
import type { PodTableRow, SelectedPod } from "./types";

// ── SL badge colour mapping (lifted from pod-row.tsx) ────────────────────────

const SL_BADGE_COLORS: Record<string, string> = {
	acc: "bg-[#4CAF50]/15 text-[#4CAF50]",
	bkcfo: "bg-[#2196F3]/15 text-[#2196F3]",
	fin: "bg-[#FF8C00]/15 text-[#FF8C00]",
	wm: "bg-[#7B2FBE]/15 text-[#7B2FBE]",
	rd: "bg-[#F76707]/15 text-[#F76707]",
	ins: "bg-[#F5C518]/15 text-[#F5C518]",
	admin: "bg-[#9E9E9E]/15 text-[#9E9E9E]",
};

function slBadgeClass(sl: string): string {
	const color = SL_BADGE_COLORS[sl] ?? "bg-muted text-muted-foreground";
	return `inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase leading-none ${color}`;
}

// ── Variance display helper ──────────────────────────────────────────────────

function VarianceCell({
	variance,
	hasBudgetSet,
}: {
	variance: number;
	hasBudgetSet: boolean;
}) {
	if (!hasBudgetSet)
		return <span className="text-muted-foreground text-sm">—</span>;
	if (variance === 0)
		return <span className="text-muted-foreground text-sm">—</span>;
	const cls = variance > 0 ? "text-green-400" : "text-red-400";
	return (
		<span className={`font-medium text-sm tabular-nums ${cls}`}>
			{variance > 0 ? `+${fmtDollar(variance)}` : fmtDollar(variance)}
		</span>
	);
}

function AggregateVariance({
	budget,
	salary,
}: {
	budget: number;
	salary: number;
}) {
	if (budget === 0)
		return <span className="text-muted-foreground text-sm">—</span>;
	const v = budget - salary;
	if (v === 0) return <span className="text-muted-foreground text-sm">—</span>;
	const cls = v > 0 ? "text-green-400" : "text-red-400";
	return (
		<span className={`font-medium text-sm tabular-nums ${cls}`}>
			{v > 0 ? `+${fmtDollar(v)}` : fmtDollar(v)}
		</span>
	);
}

// ── Column widths ────────────────────────────────────────────────────────────

const COL_WIDTHS = {
	location: { minSize: 150, size: 9999 }, // flexible: fills remaining space (like 1fr)
	budget: 100,
	staffCost: 100,
	variance: 100,
	utilisation: 140,
	status: 120,
} as const;

// ── Column definitions ───────────────────────────────────────────────────────

export function makePodBudgetColumns(
	canWriteAccess: boolean,
	onSelectPod: (pod: SelectedPod) => void,
): ColumnDef<PodTableRow>[] {
	return [
		{
			accessorKey: "stateGroup",
			header: "State",
			enableHiding: false,
		},
		{
			accessorKey: "officeGroup",
			header: "Office",
			enableHiding: false,
		},
		{
			id: "location",
			header: "Location",
			cell: ({ row }) => {
				const r = row.original;
				if (r.isAddPodRow) return null;
				return (
					<div className="flex min-w-0 flex-col gap-0.5 pl-8">
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() =>
									onSelectPod({
										state: r.stateGroup,
										office: r.officeGroup,
										podName: r.podName,
									})
								}
								className="truncate text-left text-muted-foreground text-sm hover:text-foreground hover:underline"
							>
								{r.podName}
							</button>
							{r.dominantSl && (
								<span className={slBadgeClass(r.dominantSl)}>
									{slLabel(r.dominantSl, "short")}
								</span>
							)}
						</div>
						<span className="text-[11px] text-muted-foreground tabular-nums">
							{r.actual} staff
						</span>
					</div>
				);
			},
			minSize: COL_WIDTHS.location.minSize,
			size: COL_WIDTHS.location.size,
		},
		{
			id: "budget",
			accessorFn: (row) => row.budget,
			header: "Budget",
			cell: ({ row }) => {
				const r = row.original;
				if (r.isAddPodRow) return null;
				return (
					<BudgetCell
						state={r.stateGroup}
						office={r.officeGroup}
						podName={r.podName}
						budget={r.budget}
						canWriteAccess={canWriteAccess}
						hasBudgetSet={r.hasBudgetSet}
					/>
				);
			},
			size: COL_WIDTHS.budget,
		},
		{
			id: "staffCost",
			accessorFn: (row) => row.totalSalary,
			header: "Staff Cost",
			cell: ({ row }) => {
				if (row.original.isAddPodRow) return null;
				return (
					<span className="font-medium text-sm tabular-nums">
						{fmtDollar(row.original.totalSalary)}
					</span>
				);
			},
			size: COL_WIDTHS.staffCost,
		},
		{
			id: "variance",
			header: "Variance",
			cell: ({ row }) => {
				if (row.original.isAddPodRow) return null;
				return (
					<VarianceCell
						variance={row.original.variance}
						hasBudgetSet={row.original.hasBudgetSet}
					/>
				);
			},
			size: COL_WIDTHS.variance,
		},
		{
			id: "utilisation",
			header: "Utilisation",
			cell: ({ row }) => {
				if (row.original.isAddPodRow) return null;
				return (
					<CapacityBar
						actual={row.original.totalSalary}
						budget={row.original.budget}
					/>
				);
			},
			size: COL_WIDTHS.utilisation,
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) => {
				if (row.original.isAddPodRow) return null;
				return (
					<StatusBadge
						actual={row.original.totalSalary}
						budget={row.original.budget}
					/>
				);
			},
			size: COL_WIDTHS.status,
		},
	];
}

// ── Group row cells ──────────────────────────────────────────────────────────

export type GroupAggregates = Map<
	string,
	{
		totalBudget: number;
		totalSalary: number;
		leafCount: number;
		officeCount?: number;
	}
>;

export function buildPodGroupCells(
	row: Row<PodTableRow>,
	aggregates: GroupAggregates,
	onAddPod?: (state: string, office: string) => void,
	canWriteAccess?: boolean,
): Record<string, ReactNode> {
	const isExpanded = row.getIsExpanded();
	const isStateGroup = row.groupingColumnId === "stateGroup";

	const stateVal: string = row.getValue("stateGroup") ?? "";
	const officeVal: string = isStateGroup
		? ""
		: (row.getValue("officeGroup") ?? "");
	const aggKey = isStateGroup ? stateVal : `${stateVal}||${officeVal}`;
	const agg = aggregates.get(aggKey);

	const totalBudget = agg?.totalBudget ?? 0;
	const totalSalary = agg?.totalSalary ?? 0;

	const groupLabel = isStateGroup
		? stateLabel(stateVal)
		: officeLabel(officeVal);

	const countLabel = isStateGroup
		? `${agg?.officeCount ?? 0} offices`
		: `${agg?.leafCount ?? 0} pods`;

	const locationContent = (
		<div className={`flex flex-col gap-1 ${isStateGroup ? "" : "pl-4"}`}>
			<button
				type="button"
				onClick={() => row.toggleExpanded()}
				className="flex items-center gap-2 text-left"
			>
				{isExpanded ? (
					<HugeiconsIcon
						icon={ArrowDown01Icon}
						className="size-4 text-muted-foreground"
						aria-hidden="true"
					/>
				) : (
					<HugeiconsIcon
						icon={ArrowRight01Icon}
						className="size-4 text-muted-foreground"
						aria-hidden="true"
					/>
				)}
				<span
					className={isStateGroup ? "font-bold" : "font-semibold text-base"}
				>
					{groupLabel}
				</span>
				<Badge variant={isStateGroup ? "secondary" : "outline"} size="sm">
					{countLabel}
				</Badge>
			</button>
			{!isStateGroup && isExpanded && canWriteAccess && onAddPod && (
				<button
					type="button"
					onClick={() => onAddPod(stateVal, officeVal)}
					className="mt-1 flex items-center gap-2 rounded-md border-2 border-border/60 border-dashed px-4 py-2 text-muted-foreground text-sm transition-colors hover:border-primary/40 hover:text-foreground"
				>
					<HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
					<span>Add Pod</span>
				</button>
			)}
		</div>
	);

	return {
		location: locationContent,
		budget: (
			<span className="font-medium text-sm tabular-nums">
				{totalBudget > 0 ? fmtDollar(totalBudget) : "—"}
			</span>
		),
		staffCost: (
			<span className="font-medium text-sm tabular-nums">
				{fmtDollar(totalSalary)}
			</span>
		),
		variance: <AggregateVariance budget={totalBudget} salary={totalSalary} />,
		utilisation: <CapacityBar actual={totalSalary} budget={totalBudget} />,
		status: <StatusBadge actual={totalSalary} budget={totalBudget} />,
	};
}

// ── Footer totals ────────────────────────────────────────────────────────────

export function PodBudgetsTotalsFooter({
	totalBudget,
	totalSalary,
}: {
	totalBudget: number;
	totalSalary: number;
}) {
	return (
		<TableFooter>
			<TableRow className="bg-muted/30 font-semibold">
				{/* stateGroup (hidden) + officeGroup (hidden) + location */}
				<TableCell className="text-muted-foreground">Total</TableCell>
				<TableCell className="text-sm tabular-nums">
					{totalBudget > 0 ? fmtDollar(totalBudget) : "—"}
				</TableCell>
				<TableCell className="text-sm tabular-nums">
					{fmtDollar(totalSalary)}
				</TableCell>
				<TableCell>
					<AggregateVariance budget={totalBudget} salary={totalSalary} />
				</TableCell>
				<TableCell>
					<CapacityBar actual={totalSalary} budget={totalBudget} />
				</TableCell>
				<TableCell>
					<StatusBadge actual={totalSalary} budget={totalBudget} />
				</TableCell>
			</TableRow>
		</TableFooter>
	);
}
