import { PencilEdit01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fmtDollar } from "@/lib/format";
import { trpc } from "@/utils/trpc";

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
			className: " bg-bg-weak-50/40 text-text-soft-400",
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
		return <div className="h-1.5 w-full rounded-full bg-bg-weak-50" />;
	const pct = Math.min((actual / budget) * 100, 100);
	const over = actual > budget;
	return (
		<div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-weak-50">
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
				className={`font-medium text-sm tabular-nums ${!hasBudgetSet ? "text-text-soft-400 italic" : ""}`}
			>
				{budget > 0 ? (
					fmtDollar(budget)
				) : (
					<span className="text-text-soft-400">—</span>
				)}
			</span>
			{canWriteAccess && (
				<button
					type="button"
					onClick={() => {
						setVal(String(budget));
						setEditing(true);
					}}
					className="text-text-soft-400 opacity-0 transition-opacity hover:text-text-strong-950 group-hover:opacity-100"
					aria-label="Edit budget"
				>
					<HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
				</button>
			)}
		</div>
	);
}
