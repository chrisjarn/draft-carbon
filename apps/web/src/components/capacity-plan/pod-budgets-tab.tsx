import {
	ArrowDown01Icon,
	ArrowRight01Icon,
	PencilEdit01Icon,
	PlusSignIcon,
	Tick01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { getOfficesForState, getSL, STATES } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

import styles from "./pod-budgets-tab.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type Carbonite = {
	id: string;
	name: string | null;
	role: string | null;
	salary: number | null;
	sl: string | null;
	state: string | null;
	office: string | null;
	pod: string | null;
};

type PodBudget = {
	state: string;
	office: string;
	podName: string;
	budget: number;
};

type PodRow = {
	podName: string;
	budget: number;
	actual: number;
	dominantSl: string | null;
	totalSalary: number;
};

type OfficeGroup = {
	office: string;
	pods: PodRow[];
	totalBudget: number;
	totalActual: number;
};

type StateGroup = {
	state: string;
	offices: OfficeGroup[];
	totalBudget: number;
	totalActual: number;
};

type SelectedPod = {
	state: string;
	office: string;
	podName: string;
};

// ── SL badge class mapping ────────────────────────────────────────────────────

const SL_BADGE_MODIFIER: Record<string, string> = {
	acc: "slBadge--accounting",
	bkcfo: "slBadge--bookkeeping",
	fin: "slBadge--finance",
	wm: "slBadge--wealth",
	rd: "slBadge--rd",
	ins: "slBadge--insurance",
	admin: "slBadge--admin",
};

function slBadgeClass(sl: string): string {
	const modifier = SL_BADGE_MODIFIER[sl] ?? "slBadge--unknown";
	return `${styles.slBadge ?? ""} ${styles[modifier] ?? ""}`.trim();
}

// ── Status logic ──────────────────────────────────────────────────────────────

type Status = "under" | "at" | "over" | "empty";

function getStatus(actual: number, budget: number): Status {
	if (budget === 0) return "empty";
	if (actual > budget) return "over";
	if (actual === budget) return "at";
	return "under";
}

function StatusBadge({ actual, budget }: { actual: number; budget: number }) {
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

function CapacityBar({ actual, budget }: { actual: number; budget: number }) {
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

// ── Budget edit cell ──────────────────────────────────────────────────────────

function BudgetCell({
	state,
	office,
	podName,
	budget,
	canWriteAccess,
}: {
	state: string;
	office: string;
	podName: string;
	budget: number;
	canWriteAccess: boolean;
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
					className="h-6 w-16 text-center text-sm"
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
			<span className="font-medium text-sm tabular-nums">{budget}</span>
			{canWriteAccess && (
				<button
					type="button"
					onClick={() => {
						setVal(String(budget));
						setEditing(true);
					}}
					className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
				>
					<HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
				</button>
			)}
		</div>
	);
}

// ── Add Pod Dialog ────────────────────────────────────────────────────────────

function AddPodDialog({
	open,
	onClose,
	defaultState,
	defaultOffice,
}: {
	open: boolean;
	onClose: () => void;
	defaultState?: string;
	defaultOffice?: string;
}) {
	const qc = useQueryClient();
	const [state, setState] = useState(defaultState ?? "");
	const [office, setOffice] = useState(defaultOffice ?? "");
	const [podName, setPodName] = useState("");
	const [budget, setBudget] = useState("0");

	// Sync defaults when the dialog opens with pre-filled context
	const prevOpen = useRef(open);
	if (open && !prevOpen.current) {
		if (defaultState && state !== defaultState) setState(defaultState);
		if (defaultOffice && office !== defaultOffice) setOffice(defaultOffice);
	}
	prevOpen.current = open;

	const officeOptions = state ? getOfficesForState(state) : [];

	const upsert = useMutation(
		trpc.podBudgets.upsert.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: trpc.podBudgets.getAll.queryKey() });
				toast.success("Pod added");
				resetAndClose();
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function resetAndClose() {
		setState("");
		setOffice("");
		setPodName("");
		setBudget("0");
		onClose();
	}

	function handleSave() {
		if (!state || !office || !podName.trim()) {
			toast.error("State, office, and pod name are required");
			return;
		}
		const n = Number(budget);
		if (Number.isNaN(n) || n < 0) {
			toast.error("Budget must be a non-negative number");
			return;
		}
		upsert.mutate({ state, office, podName: podName.trim(), budget: n });
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Add Pod</DialogTitle>
				</DialogHeader>
				<div className="grid gap-3">
					<div>
						<Label className="mb-1 block text-muted-foreground">State</Label>
						<Select
							value={state || "__none__"}
							onValueChange={(v) => {
								const val = v === "__none__" ? "" : (v ?? "");
								setState(val);
								setOffice("");
							}}
						>
							<SelectTrigger className="w-full text-sm">
								<SelectValue placeholder="Select state..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">Select state...</SelectItem>
								{STATES.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label className="mb-1 block text-muted-foreground">Office</Label>
						{officeOptions.length > 0 ? (
							<Select
								value={office || "__none__"}
								onValueChange={(v) =>
									setOffice(v === "__none__" ? "" : (v ?? ""))
								}
							>
								<SelectTrigger className="w-full text-sm">
									<SelectValue placeholder="Select office..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">Select office...</SelectItem>
									{officeOptions.map((o) => (
										<SelectItem key={o.id} value={o.id}>
											{o.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<Input
								value={office}
								onChange={(e) => setOffice(e.target.value)}
								placeholder="Select a state first"
								disabled={!state}
							/>
						)}
					</div>
					<div>
						<Label className="mb-1 block text-muted-foreground">Pod Name</Label>
						<Input
							value={podName}
							onChange={(e) => setPodName(e.target.value)}
							placeholder="e.g. Pod A"
							className="h-8 text-sm"
						/>
					</div>
					<div>
						<Label className="mb-1 block text-muted-foreground">Budget</Label>
						<Input
							type="number"
							min={0}
							value={budget}
							onChange={(e) => setBudget(e.target.value)}
							className="h-8 text-sm"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						size="sm"
						onClick={resetAndClose}
						className="text-sm"
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={upsert.isPending}
						className="text-sm"
					>
						{upsert.isPending ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Pod Staff Sheet ───────────────────────────────────────────────────────────

function PodStaffSheet({
	selectedPod,
	onClose,
	carbonites,
	budgets,
}: {
	selectedPod: SelectedPod | null;
	onClose: () => void;
	carbonites: Carbonite[];
	budgets: PodBudget[];
}) {
	const podStaff = selectedPod
		? carbonites.filter(
				(c) =>
					c.state === selectedPod.state &&
					c.office === selectedPod.office &&
					c.pod === selectedPod.podName,
			)
		: [];

	const totalSalary = podStaff.reduce((sum, c) => sum + (c.salary ?? 0), 0);

	const podBudget = selectedPod
		? (budgets.find(
				(b) =>
					b.state === selectedPod.state &&
					b.office === selectedPod.office &&
					b.podName === selectedPod.podName,
			)?.budget ?? 0)
		: 0;

	return (
		<Sheet open={!!selectedPod} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-[380px] sm:w-[420px]">
				{selectedPod && (
					<>
						<SheetHeader>
							<SheetTitle className="flex items-center gap-2">
								<HugeiconsIcon icon={UserGroupIcon} className="size-4" />
								{selectedPod.podName}
							</SheetTitle>
							<SheetDescription>
								{selectedPod.office} &middot; {selectedPod.state} &middot;{" "}
								{podStaff.length} staff
							</SheetDescription>
						</SheetHeader>
						<div className={styles.sheetSummary ?? ""}>
							<div className={styles.sheetSummaryItem ?? ""}>
								<span className={styles.sheetSummaryLabel ?? ""}>
									Headcount
								</span>
								<span className={styles.sheetSummaryValue ?? ""}>
									{podStaff.length} / {podBudget}
								</span>
							</div>
							<div className={styles.sheetSummaryItem ?? ""}>
								<span className={styles.sheetSummaryLabel ?? ""}>
									Staff Cost
								</span>
								<span className={styles.sheetSummaryValue ?? ""}>
									{fmtDollar(totalSalary)}
								</span>
							</div>
							<StatusBadge actual={podStaff.length} budget={podBudget} />
						</div>
						<div className="flex-1 overflow-auto px-4 py-3">
							{podStaff.length === 0 ? (
								<p className="py-8 text-center text-muted-foreground text-sm">
									No staff assigned to this pod.
								</p>
							) : (
								<div className="space-y-1">
									{podStaff.map((c) => (
										<div
											key={c.id}
											className="flex items-center justify-between rounded-sm px-2 py-2 hover:bg-muted/40"
										>
											<div className="min-w-0 flex-1">
												<p className="truncate font-medium text-sm">
													{c.name ?? "Unknown"}
												</p>
												<p className="truncate text-muted-foreground text-xs">
													{c.role ?? "No role"}
												</p>
											</div>
											<div className="flex items-center gap-2">
												{c.sl && (
													<Badge
														variant="outline"
														size="sm"
														className="uppercase"
													>
														{c.sl}
													</Badge>
												)}
												<span className="min-w-[60px] text-right font-medium text-sm tabular-nums">
													{fmtDollar(c.salary)}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
						{podStaff.length > 0 && (
							<SheetFooter className="border-border border-t">
								<div className="flex items-center justify-between">
									<span className="font-medium text-muted-foreground text-sm">
										Total Salary
									</span>
									<span className="font-semibold text-base tabular-nums">
										{fmtDollar(totalSalary)}
									</span>
								</div>
							</SheetFooter>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

// ── Budget Summary Cards ──────────────────────────────────────────────────────

function BudgetSummary({
	totalBudget,
	totalActual,
}: {
	totalBudget: number;
	totalActual: number;
}) {
	const variance = totalBudget - totalActual;
	const utilisation =
		totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

	return (
		<div className="grid grid-cols-4 gap-3 pb-4">
			<Card size="sm">
				<CardContent>
					<p className="text-muted-foreground text-xs">Total Budget</p>
					<p className="font-bold text-lg tabular-nums">{totalBudget}</p>
				</CardContent>
			</Card>
			<Card size="sm">
				<CardContent>
					<p className="text-muted-foreground text-xs">Total Actual</p>
					<p className="font-bold text-lg tabular-nums">{totalActual}</p>
				</CardContent>
			</Card>
			<Card size="sm">
				<CardContent>
					<p className="text-muted-foreground text-xs">Variance</p>
					<p
						className={`font-bold text-lg tabular-nums ${
							variance < 0
								? "text-red-400"
								: variance > 0
									? "text-green-400"
									: "text-muted-foreground"
						}`}
					>
						{variance > 0 ? `+${variance}` : variance === 0 ? "0" : variance}
					</p>
				</CardContent>
			</Card>
			<Card size="sm">
				<CardContent>
					<p className="text-muted-foreground text-xs">Utilisation</p>
					<p
						className={`font-bold text-lg tabular-nums ${
							utilisation > 100
								? "text-red-400"
								: utilisation >= 90
									? "text-amber-400"
									: "text-green-400"
						}`}
					>
						{totalBudget > 0 ? `${utilisation}%` : "\u2014"}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

// ── Group builder ─────────────────────────────────────────────────────────────

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
		offMap.get(office)?.push({
			podName,
			budget: budgetMap.get(key) ?? 0,
			actual: countMap.get(key) ?? 0,
			dominantSl,
			totalSalary: salaryMap.get(key) ?? 0,
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
			offices.push({ office, pods: sorted, totalBudget, totalActual });
		}
		const totalBudget = offices.reduce((s, o) => s + o.totalBudget, 0);
		const totalActual = offices.reduce((s, o) => s + o.totalActual, 0);
		states.push({ state, offices, totalBudget, totalActual });
	}
	return states;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PodRowComponent({
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
	return (
		<div className="grid grid-cols-[1fr_80px_80px_80px_140px_120px] items-center gap-4 px-4 py-2 text-base hover:bg-muted/30">
			<div className={styles.podNameCell}>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => onSelect({ state, office, podName: pod.podName })}
						className={styles.podNameLink}
					>
						{pod.podName}
					</button>
					{pod.dominantSl && (
						<span className={slBadgeClass(pod.dominantSl)}>
							{getSL(pod.dominantSl)?.short ?? pod.dominantSl}
						</span>
					)}
				</div>
				<span className={styles.podMeta}>
					{pod.actual} staff / {fmtDollar(pod.totalSalary)}
				</span>
			</div>
			<BudgetCell
				state={state}
				office={office}
				podName={pod.podName}
				budget={pod.budget}
				canWriteAccess={canWriteAccess}
			/>
			<span className="font-medium text-sm tabular-nums">{pod.actual}</span>
			<span
				className={`font-medium text-sm tabular-nums ${pod.actual > pod.budget && pod.budget > 0 ? "text-red-400" : "text-muted-foreground"}`}
			>
				{pod.budget > 0
					? pod.budget > pod.actual
						? `+${pod.budget - pod.actual}`
						: pod.actual > pod.budget
							? `-${pod.actual - pod.budget}`
							: "0"
					: "\u2014"}
			</span>
			<CapacityBar actual={pod.actual} budget={pod.budget} />
			<StatusBadge actual={pod.actual} budget={pod.budget} />
		</div>
	);
}

function OfficeSection({
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
				className="grid w-full grid-cols-[1fr_80px_80px_80px_140px_120px] items-center gap-4 px-4 py-2.5 text-left hover:bg-muted/20"
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
					{office.totalBudget}
				</span>
				<span className="text-muted-foreground text-sm tabular-nums">
					{office.totalActual}
				</span>
				<span
					className={`text-sm tabular-nums ${office.totalActual > office.totalBudget && office.totalBudget > 0 ? "text-red-400" : "text-muted-foreground"}`}
				>
					{office.totalBudget > 0
						? office.totalBudget > office.totalActual
							? `+${office.totalBudget - office.totalActual}`
							: office.totalActual > office.totalBudget
								? `-${office.totalActual - office.totalBudget}`
								: "0"
						: "\u2014"}
				</span>
				<CapacityBar actual={office.totalActual} budget={office.totalBudget} />
				<StatusBadge actual={office.totalActual} budget={office.totalBudget} />
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
							className={styles.ghostRow ?? ""}
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

function StateSection({
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
				className="grid w-full grid-cols-[1fr_80px_80px_80px_140px_120px] items-center gap-4 bg-muted/40 px-4 py-3 text-left hover:bg-muted/60"
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
					{group.totalBudget}
				</span>
				<span className="font-medium text-sm tabular-nums">
					{group.totalActual}
				</span>
				<span
					className={`font-medium text-sm tabular-nums ${group.totalActual > group.totalBudget && group.totalBudget > 0 ? "text-red-400" : "text-muted-foreground"}`}
				>
					{group.totalBudget > 0
						? group.totalBudget > group.totalActual
							? `+${group.totalBudget - group.totalActual}`
							: group.totalActual > group.totalBudget
								? `-${group.totalActual - group.totalBudget}`
								: "0"
						: "\u2014"}
				</span>
				<CapacityBar actual={group.totalActual} budget={group.totalBudget} />
				<StatusBadge actual={group.totalActual} budget={group.totalBudget} />
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
	const totalActual = groups.reduce((s, g) => s + g.totalActual, 0);

	return (
		<div className="flex h-full flex-col">
			{/* Subheader */}
			<div className="flex items-center justify-between border-border border-b px-6 py-3">
				<p className="text-muted-foreground text-sm">
					Pod headcount vs budget — {groups.length} states &middot;{" "}
					{groups.reduce((s, g) => s + g.offices.length, 0)} offices
				</p>
				<div className="flex items-center gap-4 text-muted-foreground text-sm">
					<span>
						<span className="font-semibold text-foreground">{totalActual}</span>{" "}
						/ {totalBudget} headcount
					</span>
					<StatusBadge actual={totalActual} budget={totalBudget} />
				</div>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-6 border-border border-b px-6 py-2.5">
				<div className="grid w-full grid-cols-[1fr_80px_80px_80px_140px_120px] gap-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
					<span className="pl-4">Location</span>
					<span>Budget</span>
					<span>Actual</span>
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
							totalActual={totalActual}
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
