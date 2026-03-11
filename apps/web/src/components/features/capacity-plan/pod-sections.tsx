import {
	ArrowDown01Icon,
	ArrowRight01Icon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { fmtDollar } from "@/lib/format";

import { CapacityBar, PodRowComponent, StatusBadge } from "./pod-row";
import type { OfficeGroup, SelectedPod, StateGroup } from "./types";

// ── Office section (collapsible) ─────────────────────────────────────────────

export function OfficeSection({
	office,
	state,
	canWriteAccess,
	defaultOpen,
	onSelectPod,
	onAddPod,
}: {
	office: OfficeGroup;
	state: string;
	canWriteAccess: boolean;
	defaultOpen: boolean;
	onSelectPod: (pod: SelectedPod) => void;
	onAddPod: (state: string, office: string) => void;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="grid w-full grid-cols-[1fr_100px_100px_100px_140px_120px] items-center gap-4 px-4 py-2.5 text-left hover:bg-muted/20"
			>
				<div className="flex items-center gap-2 pl-4">
					{open ? (
						<HugeiconsIcon
							icon={ArrowDown01Icon}
							className="size-3.5 text-muted-foreground"
						/>
					) : (
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							className="size-3.5 text-muted-foreground"
						/>
					)}
					<span className="font-semibold text-base">{office.office}</span>
					<Badge variant="outline" size="sm">
						{office.pods.length} pods
					</Badge>
				</div>
				<span className="text-muted-foreground text-sm tabular-nums">
					{office.totalBudget > 0 ? fmtDollar(office.totalBudget) : "—"}
				</span>
				<span className="text-muted-foreground text-sm tabular-nums">
					{fmtDollar(office.totalSalary)}
				</span>
				<span
					className={`text-sm tabular-nums ${office.totalSalary > office.totalBudget && office.totalBudget > 0 ? "text-red-400" : office.totalBudget > office.totalSalary && office.totalBudget > 0 ? "text-green-400" : "text-muted-foreground"}`}
				>
					{office.totalBudget > 0
						? office.totalBudget > office.totalSalary
							? `+${fmtDollar(office.totalBudget - office.totalSalary)}`
							: office.totalSalary > office.totalBudget
								? fmtDollar(office.totalSalary - office.totalBudget)
								: "—"
						: "—"}
				</span>
				<CapacityBar actual={office.totalSalary} budget={office.totalBudget} />
				<StatusBadge actual={office.totalSalary} budget={office.totalBudget} />
			</button>
			{open && (
				<>
					{office.pods.map((pod) => (
						<PodRowComponent
							key={pod.podName}
							pod={pod}
							state={state}
							office={office.office}
							canWriteAccess={canWriteAccess}
							onSelect={onSelectPod}
						/>
					))}
					{canWriteAccess && (
						<button
							type="button"
							onClick={() => onAddPod(state, office.office)}
							className="mx-4 my-2 flex items-center gap-2 rounded-md border-2 border-border/60 border-dashed px-4 py-2.5 text-muted-foreground text-sm transition-colors hover:border-primary/40 hover:text-foreground"
						>
							<HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
							<span>Add Pod</span>
						</button>
					)}
				</>
			)}
		</div>
	);
}

// ── State section (collapsible) ──────────────────────────────────────────────

export function StateSection({
	group,
	canWriteAccess,
	onSelectPod,
	onAddPod,
}: {
	group: StateGroup;
	canWriteAccess: boolean;
	onSelectPod: (pod: SelectedPod) => void;
	onAddPod: (state: string, office: string) => void;
}) {
	const [open, setOpen] = useState(true);
	return (
		<div className="overflow-hidden rounded-lg border border-border">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="grid w-full grid-cols-[1fr_100px_100px_100px_140px_120px] items-center gap-4 bg-muted/40 px-4 py-3 text-left hover:bg-muted/60"
			>
				<div className="flex items-center gap-2">
					{open ? (
						<HugeiconsIcon
							icon={ArrowDown01Icon}
							className="size-4 text-muted-foreground"
						/>
					) : (
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							className="size-4 text-muted-foreground"
						/>
					)}
					<span className="font-bold">{group.state}</span>
					<Badge variant="secondary" size="sm">
						{group.offices.length} offices
					</Badge>
				</div>
				<span className="font-medium text-sm tabular-nums">
					{group.totalBudget > 0 ? fmtDollar(group.totalBudget) : "—"}
				</span>
				<span className="font-medium text-sm tabular-nums">
					{fmtDollar(group.totalSalary)}
				</span>
				<span
					className={`font-medium text-sm tabular-nums ${group.totalSalary > group.totalBudget && group.totalBudget > 0 ? "text-red-400" : group.totalBudget > group.totalSalary && group.totalBudget > 0 ? "text-green-400" : "text-muted-foreground"}`}
				>
					{group.totalBudget > 0
						? group.totalBudget > group.totalSalary
							? `+${fmtDollar(group.totalBudget - group.totalSalary)}`
							: group.totalSalary > group.totalBudget
								? fmtDollar(group.totalSalary - group.totalBudget)
								: "—"
						: "—"}
				</span>
				<CapacityBar actual={group.totalSalary} budget={group.totalBudget} />
				<StatusBadge actual={group.totalSalary} budget={group.totalBudget} />
			</button>
			{open && (
				<div className="divide-y divide-border/50">
					{group.offices.map((office) => (
						<OfficeSection
							key={office.office}
							office={office}
							state={group.state}
							canWriteAccess={canWriteAccess}
							defaultOpen={group.offices.length === 1}
							onSelectPod={onSelectPod}
							onAddPod={onAddPod}
						/>
					))}
				</div>
			)}
		</div>
	);
}
