import { PencilEdit01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getSL } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { trpc } from "@/utils/trpc";

import type { PodRow, SelectedPod } from "./types";

// ── SL badge colour mapping ──────────────────────────────────────────────────

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

// ── Status logic ─────────────────────────────────────────────────────────────

type Status = "under" | "at" | "over" | "empty";

function getStatus(actual: number, budget: number): Status {
	if (budget === 0) return "empty";
	if (actual > budget) return "over";
	if (actual === budget) return "at";
	return "under";
}

export function StatusBadge({
	actual,
	budget,
}: {
	actual: number;
	budget: number;
}) {
	const status = getStatus(actual, budget);
	const map: Record<Status, { label: string; className: string }> = {
		under: {
			label: "Under",
			className: "border-green-500/40 bg-green-500/10 text-green-400",
		},
		at: {
			label: "At capacity",
			className: "border-amber-500/40 bg-amber-500/10 text-amber-400",
		},
		over: {
			label: "Over",
			className: "border-red-500/40 bg-red-500/10 text-red-400",
		},
		empty: {
			label: "No budget",
			className: "border-border bg-muted/40 text-muted-foreground",
		},
	};
	const { label, className } = map[status];
	return (
		<Badge variant="outline" size="sm" className={className}>
			{label}
		</Badge>
	);
}

export function CapacityBar({
	actual,
	budget,
}: {
	actual: number;
	budget: number;
}) {
	if (budget === 0)
		return <div className="h-1.5 w-full rounded-full bg-muted" />;
	const pct = Math.min((actual / budget) * 100, 100);
	const over = actual > budget;
	return (
		<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div
				className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct >= 90 ? "bg-amber-500" : "bg-green-500"}`}
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

// ── Budget edit cell ─────────────────────────────────────────────────────────

export function BudgetCell({
	state,
	office,
	podName,
	budget,
	canWriteAccess,
	hasBudgetSet = true,
}: {
	state: string;
	office: string;
	podName: string;
	budget: number;
	canWriteAccess: boolean;
	/** When false, budget is a fallback (= staffCost). Display as muted. */
	hasBudgetSet?: boolean;
}) {
	const qc = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [val, setVal] = useState(String(budget));

	const upsert = useMutation(
		trpc.podBudgets.upsert.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: trpc.podBudgets.getAll.queryKey() });
				setEditing(false);
				toast.success("Budget updated");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function save() {
		const n = Number(val);
		if (Number.isNaN(n) || n < 0) return;
		upsert.mutate({ state, office, podName, budget: n });
	}

	if (editing) {
		return (
			<div className="flex items-center gap-1">
				<Input
					type="number"
					min={0}
					value={val}
					onChange={(e) => setVal(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") save();
						if (e.key === "Escape") setEditing(false);
					}}
					className="h-6 w-24 text-center text-sm"
				/>
				<button
					type="button"
					onClick={save}
					disabled={upsert.isPending}
					className="text-green-400 hover:text-green-300"
				>
					<HugeiconsIcon icon={Tick01Icon} className="size-3.5" />
				</button>
			</div>
		);
	}

	return (
		<div className="group flex items-center gap-1">
			<span
				className={`font-medium text-sm tabular-nums ${!hasBudgetSet ? "text-muted-foreground italic" : ""}`}
			>
				{budget > 0 ? (
					fmtDollar(budget)
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</span>
			{canWriteAccess && (
				<button
					type="button"
					onClick={() => {
						setVal(String(budget));
						setEditing(true);
					}}
					className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
					aria-label="Edit budget"
				>
					<HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
				</button>
			)}
		</div>
	);
}

// ── Pod row ──────────────────────────────────────────────────────────────────

export function PodRowComponent({
	pod,
	state,
	office,
	canWriteAccess,
	onSelect,
}: {
	pod: PodRow;
	state: string;
	office: string;
	canWriteAccess: boolean;
	onSelect: (pod: SelectedPod) => void;
}) {
	const variance = pod.budget - pod.totalSalary;
	return (
		<div className="grid grid-cols-[1fr_100px_100px_100px_140px_120px] items-center gap-4 px-4 py-2 text-base hover:bg-muted/30">
			<div className="flex min-w-0 flex-col gap-0.5 pl-10">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => onSelect({ state, office, podName: pod.podName })}
						className="truncate text-left text-muted-foreground text-sm hover:text-foreground hover:underline"
					>
						{pod.podName}
					</button>
					{pod.dominantSl && (
						<span className={slBadgeClass(pod.dominantSl)}>
							{getSL(pod.dominantSl)?.short ?? pod.dominantSl}
						</span>
					)}
				</div>
				<span className="text-[11px] text-muted-foreground tabular-nums">
					{pod.actual} staff
				</span>
			</div>
			<BudgetCell
				state={state}
				office={office}
				podName={pod.podName}
				budget={pod.budget}
				canWriteAccess={canWriteAccess}
				hasBudgetSet={pod.hasBudgetSet}
			/>
			<span className="font-medium text-sm tabular-nums">
				{fmtDollar(pod.totalSalary)}
			</span>
			<span
				className={`font-medium text-sm tabular-nums ${pod.hasBudgetSet && variance < 0 ? "text-red-400" : pod.hasBudgetSet && variance > 0 ? "text-green-400" : "text-muted-foreground"}`}
			>
				{pod.hasBudgetSet
					? variance > 0
						? `+${fmtDollar(variance)}`
						: variance === 0
							? "—"
							: fmtDollar(variance)
					: "—"}
			</span>
			<CapacityBar actual={pod.totalSalary} budget={pod.budget} />
			<StatusBadge actual={pod.totalSalary} budget={pod.budget} />
		</div>
	);
}
