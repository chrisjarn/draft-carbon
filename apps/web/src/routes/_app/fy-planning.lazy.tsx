import {
	ArrowDown01Icon,
	ArrowRight01Icon,
	Download01Icon,
	PencilEdit01Icon,
	Tick01Icon,
	Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { FY_OPTIONS } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { canAdminWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/fy-planning")({
	component: FyPlanningPage,
});

// -- Types --------------------------------------------------------------------

type EntityWithRevenue = {
	id: string;
	biz: string;
	state: string | null;
	officeId: string | null;
	revenue: { target: string | null; actual: string | null } | null;
};

// -- Helpers ------------------------------------------------------------------

function fmt(v: string | null | undefined): string {
	const n = Number(v);
	if (!v || Number.isNaN(n) || n === 0) return "\u2014";
	if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}m`;
	if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
	return `$${n}`;
}

function variance(
	target: string | null,
	actual: string | null,
): { val: string; positive: boolean | null } {
	const t = Number(target);
	const a = Number(actual);
	if (!t || !a) return { val: "\u2014", positive: null };
	const diff = a - t;
	const positive = diff >= 0;
	const abs = Math.abs(diff);
	const label =
		abs >= 1_000_000
			? `${(abs / 1_000_000).toFixed(2)}m`
			: abs >= 1_000
				? `${Math.round(abs / 1_000)}k`
				: String(abs);
	return { val: `${positive ? "+" : "-"}$${label}`, positive };
}

function attainmentPct(
	target: string | null,
	actual: string | null,
): number | null {
	const t = Number(target);
	const a = Number(actual);
	if (!t || !a) return null;
	return Math.round((a / t) * 100);
}

function derivePriorFy(fy: string): string {
	const match = fy.match(/^FY(\d{2})-(\d{2})$/);
	if (!match) return fy;
	const start = Number(match[1]) - 1;
	const end = Number(match[2]) - 1;
	return `FY${String(start).padStart(2, "0")}-${String(end).padStart(2, "0")}`;
}

// -- Progress bar -------------------------------------------------------------

function RevenueBar({
	target,
	actual,
}: {
	target: string | null;
	actual: string | null;
}) {
	const t = Number(target);
	const a = Number(actual);
	if (!t) return <div className="h-1.5 w-full rounded-full bg-muted" />;
	const pct = Math.min((a / t) * 100, 100);
	const over = a > t;
	return (
		<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div
				className={`h-full rounded-full transition-all ${over ? "bg-green-500" : pct >= 80 ? "bg-amber-500" : "bg-blue-500"}`}
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

// -- Inline editable dollar cell ----------------------------------------------

function RevenueCell({
	value,
	onSave,
	disabled,
}: {
	value: string | null | undefined;
	onSave: (v: string) => void;
	disabled?: boolean;
}) {
	const [editing, setEditing] = useState(false);
	const [val, setVal] = useState(value ?? "");

	if (disabled)
		return <span className="text-xs tabular-nums">{fmt(value)}</span>;

	if (editing) {
		return (
			<div className="flex items-center gap-1">
				<span className="text-muted-foreground text-xs">$</span>
				<Input
					type="number"
					value={val}
					onChange={(e) => setVal(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onSave(val);
							setEditing(false);
						}
						if (e.key === "Escape") setEditing(false);
					}}
					className="h-6 w-24 text-xs"
					autoFocus
				/>
				<button
					type="button"
					onClick={() => {
						onSave(val);
						setEditing(false);
					}}
					className="text-green-400 hover:text-green-300"
				>
					<HugeiconsIcon icon={Tick01Icon} className="size-3.5" />
				</button>
			</div>
		);
	}

	return (
		<div className="group flex items-center gap-1">
			<span className="text-xs tabular-nums">{fmt(value)}</span>
			<button
				type="button"
				onClick={() => {
					setVal(value ?? "");
					setEditing(true);
				}}
				className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
			>
				<HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
			</button>
		</div>
	);
}

// -- State group --------------------------------------------------------------

type StateGroup = {
	state: string;
	entities: EntityWithRevenue[];
	totalTarget: number;
	totalActual: number;
};

function buildStateGroups(rows: EntityWithRevenue[]): StateGroup[] {
	const map = new Map<string, EntityWithRevenue[]>();
	for (const r of rows) {
		const s = r.state ?? "Unknown";
		if (!map.has(s)) map.set(s, []);
		map.get(s)?.push(r);
	}
	return [...map.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([state, entities]) => ({
			state,
			entities,
			totalTarget: entities.reduce(
				(s, e) => s + Number(e.revenue?.target ?? 0),
				0,
			),
			totalActual: entities.reduce(
				(s, e) => s + Number(e.revenue?.actual ?? 0),
				0,
			),
		}));
}

function EntityRow({
	entity,
	fy: _fy,
	canWriteAccess,
	onSave,
}: {
	entity: EntityWithRevenue;
	fy: string;
	canWriteAccess: boolean;
	onSave: (entId: string, field: "target" | "actual", value: string) => void;
}) {
	const target = entity.revenue?.target ?? null;
	const actual = entity.revenue?.actual ?? null;
	const v = variance(target, actual);
	const pct = attainmentPct(target, actual);

	return (
		<div className="grid grid-cols-[1fr_130px_130px_110px_160px_80px] items-center gap-4 px-4 py-2.5 hover:bg-muted/20">
			<span className="pl-8 text-xs">{entity.biz}</span>
			<RevenueCell
				value={target}
				onSave={(v) => onSave(entity.id, "target", v)}
				disabled={!canWriteAccess}
			/>
			<RevenueCell
				value={actual}
				onSave={(v) => onSave(entity.id, "actual", v)}
				disabled={!canWriteAccess}
			/>
			<span
				className={`font-medium text-xs tabular-nums ${v.positive === null ? "text-muted-foreground" : v.positive ? "text-green-400" : "text-red-400"}`}
			>
				{v.val}
			</span>
			<RevenueBar target={target} actual={actual} />
			<span
				className={`font-medium text-xs tabular-nums ${pct === null ? "text-muted-foreground" : pct >= 100 ? "text-green-400" : pct >= 80 ? "text-amber-400" : "text-red-400"}`}
			>
				{pct !== null ? `${pct}%` : "\u2014"}
			</span>
		</div>
	);
}

function StateSection({
	group,
	fy,
	canWriteAccess,
	onSave,
}: {
	group: StateGroup;
	fy: string;
	canWriteAccess: boolean;
	onSave: (entId: string, field: "target" | "actual", value: string) => void;
}) {
	const [open, setOpen] = useState(true);
	const v = variance(String(group.totalTarget), String(group.totalActual));
	const pct = attainmentPct(
		String(group.totalTarget),
		String(group.totalActual),
	);

	return (
		<div className="overflow-hidden rounded-lg border border-border">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="grid w-full grid-cols-[1fr_130px_130px_110px_160px_80px] items-center gap-4 bg-muted/40 px-4 py-3 text-left hover:bg-muted/60"
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
					<Badge variant="outline" className="text-[10px]">
						{group.entities.length} entities
					</Badge>
				</div>
				<span className="font-medium text-xs tabular-nums">
					{fmt(String(group.totalTarget))}
				</span>
				<span className="font-medium text-xs tabular-nums">
					{fmt(String(group.totalActual))}
				</span>
				<span
					className={`font-medium text-xs tabular-nums ${v.positive === null ? "text-muted-foreground" : v.positive ? "text-green-400" : "text-red-400"}`}
				>
					{v.val}
				</span>
				<RevenueBar
					target={String(group.totalTarget)}
					actual={String(group.totalActual)}
				/>
				<span
					className={`font-medium text-xs tabular-nums ${pct === null ? "text-muted-foreground" : pct >= 100 ? "text-green-400" : pct >= 80 ? "text-amber-400" : "text-red-400"}`}
				>
					{pct !== null ? `${pct}%` : "\u2014"}
				</span>
			</button>
			{open && (
				<div className="divide-y divide-border/50">
					{group.entities.map((e) => (
						<EntityRow
							key={e.id}
							entity={e}
							fy={fy}
							canWriteAccess={canWriteAccess}
							onSave={onSave}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// -- CSV Parsing --------------------------------------------------------------

type CsvRow = {
	state: string;
	office: string;
	podName: string;
	budget: number;
};

function parseCsvRows(raw: string): CsvRow[] {
	const lines = raw
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0);

	if (lines.length === 0) return [];

	const rows: CsvRow[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const parts = line.split(",").map((p) => p.trim());
		if (parts.length < 4) continue;

		const budgetVal = Number(parts[3]);
		if (Number.isNaN(budgetVal)) continue;

		rows.push({
			state: parts[0] ?? "",
			office: parts[1] ?? "",
			podName: parts[2] ?? "",
			budget: Math.round(budgetVal),
		});
	}

	return rows;
}

// -- CSV Import Modal ---------------------------------------------------------

function CsvImportDialog({
	open,
	onClose,
	fy,
}: {
	open: boolean;
	onClose: () => void;
	fy: string;
}) {
	const qc = useQueryClient();
	const [csvText, setCsvText] = useState("");
	const parsed = parseCsvRows(csvText);

	const batchUpsert = useMutation(
		trpc.priorYear.batchUpsert.mutationOptions({
			onSuccess: (data) => {
				qc.invalidateQueries({
					queryKey: trpc.priorYear.getByYear.queryKey({ year: fy }),
				});
				toast.success(`Imported ${data.length} rows`);
				setCsvText("");
				onClose();
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function handleImport() {
		if (parsed.length === 0) return;
		batchUpsert.mutate({
			year: fy,
			rows: parsed.map((r) => ({
				state: r.state,
				office: r.office,
				podName: r.podName,
				budget: r.budget,
			})),
		});
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) {
					setCsvText("");
					onClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Import Prior Year Data ({fy})</DialogTitle>
				</DialogHeader>

				<p className="text-muted-foreground text-xs">
					Paste CSV data with format:{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						state,office,pod_name,budget
					</code>
				</p>

				<Textarea
					value={csvText}
					onChange={(e) => setCsvText(e.target.value)}
					placeholder={
						"nsw,parramatta,Acc & Tax,150000\nvic,elsternwick,BKK,120000"
					}
					className="min-h-24 font-mono text-xs"
				/>

				{parsed.length > 0 && (
					<div className="max-h-48 overflow-auto rounded border border-border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>State</TableHead>
									<TableHead>Office</TableHead>
									<TableHead>Pod</TableHead>
									<TableHead className="text-right">Budget</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{parsed.map((r, i) => (
									<TableRow key={`${r.state}-${r.office}-${r.podName}-${i}`}>
										<TableCell>{r.state}</TableCell>
										<TableCell>{r.office}</TableCell>
										<TableCell>{r.podName}</TableCell>
										<TableCell className="text-right tabular-nums">
											{fmtDollar(r.budget)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setCsvText("");
							onClose();
						}}
					>
						Cancel
					</Button>
					<Button
						size="sm"
						onClick={handleImport}
						disabled={parsed.length === 0 || batchUpsert.isPending}
					>
						{batchUpsert.isPending
							? "Importing..."
							: `Import ${parsed.length} rows`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// -- CSV Export ----------------------------------------------------------------

function exportRevenueCsv(rows: EntityWithRevenue[], fy: string) {
	const header = "entity,state,target,actual,variance,attainment%";
	const lines = rows.map((r) => {
		const target = r.revenue?.target ?? "";
		const actual = r.revenue?.actual ?? "";
		const t = Number(target);
		const a = Number(actual);
		const diff = t && a ? a - t : 0;
		const pct = t ? Math.round((a / t) * 100) : 0;
		return `"${r.biz}","${r.state ?? ""}",${target},${actual},${diff},${pct}`;
	});

	const csv = [header, ...lines].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `fy-${fy}-revenue.csv`;
	link.click();
	URL.revokeObjectURL(url);
}

// -- Pod Comparison Table -----------------------------------------------------

type PodBudgetRow = {
	state: string;
	office: string;
	podName: string;
	budget: number;
};

type PriorYearRow = {
	state: string;
	office: string;
	podName: string;
	year: string;
	budget: number | null;
	headcount: number | null;
};

type ComparisonRow = {
	state: string;
	office: string;
	podName: string;
	currentBudget: number;
	priorBudget: number | null;
	yoyChange: number | null;
	yoyPct: number | null;
};

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

function PodComparisonTable({ priorFy }: { priorFy: string }) {
	const podBudgetsQuery = useQuery(trpc.podBudgets.getAll.queryOptions());
	const priorYearQuery = useQuery(
		trpc.priorYear.getByYear.queryOptions({ year: priorFy }),
	);

	const podBudgets = (podBudgetsQuery.data ?? []) as PodBudgetRow[];
	const priorYear = (priorYearQuery.data ?? []) as PriorYearRow[];
	const comparison = buildComparison(podBudgets, priorYear);

	if (podBudgetsQuery.isPending || priorYearQuery.isPending) {
		return (
			<div className="flex h-24 items-center justify-center text-muted-foreground text-xs">
				Loading pod comparison...
			</div>
		);
	}

	if (comparison.length === 0) {
		return (
			<div className="flex h-24 items-center justify-center text-muted-foreground text-xs">
				No pod budgets available for comparison.
			</div>
		);
	}

	return (
		<div className="overflow-auto rounded-lg border border-border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>State</TableHead>
						<TableHead>Office</TableHead>
						<TableHead>Pod</TableHead>
						<TableHead className="text-right">Current Budget</TableHead>
						<TableHead className="text-right">Prior Year ({priorFy})</TableHead>
						<TableHead className="text-right">YoY Change</TableHead>
						<TableHead className="text-right">YoY %</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{comparison.map((r) => (
						<TableRow key={`${r.state}-${r.office}-${r.podName}`}>
							<TableCell>{r.state}</TableCell>
							<TableCell>{r.office}</TableCell>
							<TableCell>{r.podName}</TableCell>
							<TableCell className="text-right tabular-nums">
								{fmtDollar(r.currentBudget)}
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{r.priorBudget !== null ? fmtDollar(r.priorBudget) : "\u2014"}
							</TableCell>
							<TableCell
								className={`text-right font-medium tabular-nums ${
									r.yoyChange === null
										? "text-muted-foreground"
										: r.yoyChange >= 0
											? "text-green-400"
											: "text-red-400"
								}`}
							>
								{r.yoyChange !== null
									? `${r.yoyChange >= 0 ? "+" : ""}${fmtDollar(r.yoyChange)}`
									: "\u2014"}
							</TableCell>
							<TableCell
								className={`text-right font-medium tabular-nums ${
									r.yoyPct === null
										? "text-muted-foreground"
										: r.yoyPct >= 0
											? "text-green-400"
											: "text-red-400"
								}`}
							>
								{r.yoyPct !== null
									? `${r.yoyPct >= 0 ? "+" : ""}${r.yoyPct}%`
									: "\u2014"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

// -- Page ---------------------------------------------------------------------

function FyPlanningPage() {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canAdminWrite(userRole);

	const qc = useQueryClient();
	const [fy, setFy] = useState("FY25-26");
	const [importOpen, setImportOpen] = useState(false);

	const priorFy = derivePriorFy(fy);

	const query = useQuery(trpc.wfp.getRevenue.queryOptions({ fy }));
	const rows = (query.data ?? []) as EntityWithRevenue[];
	const groups = buildStateGroups(rows);

	const totalTarget = groups.reduce((s, g) => s + g.totalTarget, 0);
	const totalActual = groups.reduce((s, g) => s + g.totalActual, 0);
	const overallPct = attainmentPct(String(totalTarget), String(totalActual));

	const upsert = useMutation(
		trpc.wfp.upsertRevenue.mutationOptions({
			onSuccess: () =>
				qc.invalidateQueries({
					queryKey: trpc.wfp.getRevenue.queryKey({ fy }),
				}),
			onError: (e) => toast.error(e.message),
		}),
	);

	function handleSave(
		entId: string,
		field: "target" | "actual",
		value: string,
	) {
		upsert.mutate({ entId, fy, [field]: value });
	}

	return (
		<div className="flex h-full flex-col">
			<PageHeader
				description={
					<>
						Revenue targets vs actuals · {fmt(String(totalTarget))} target ·{" "}
						{fmt(String(totalActual))} actual
						{overallPct !== null && (
							<span
								className={`ml-2 font-semibold ${overallPct >= 100 ? "text-green-400" : overallPct >= 80 ? "text-amber-400" : "text-red-400"}`}
							>
								{overallPct}% attainment
							</span>
						)}
					</>
				}
			>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => exportRevenueCsv(rows, fy)}
						className="gap-1.5 text-xs"
					>
						<HugeiconsIcon icon={Download01Icon} className="size-3.5" />
						Export CSV
					</Button>
					{hasWriteAccess && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setImportOpen(true)}
							className="gap-1.5 text-xs"
						>
							<HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
							Import CSV
						</Button>
					)}
					<Select value={fy} onValueChange={(v) => v && setFy(v)}>
						<SelectTrigger className="h-8 w-32 text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FY_OPTIONS.map((f) => (
								<SelectItem key={f} value={f}>
									{f}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</PageHeader>

			{/* Column headers */}
			<div className="border-border border-b px-6 py-2.5">
				<div className="grid grid-cols-[1fr_130px_130px_110px_160px_80px] gap-4 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
					<span className="pl-8">Entity</span>
					<span>Target</span>
					<span>Actual</span>
					<span>Variance</span>
					<span>Progress</span>
					<span>Attainment</span>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto p-6">
				{query.isPending ? (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
						Loading...
					</div>
				) : groups.length === 0 ? (
					<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
						<p>No entities found.</p>
						<p className="text-[11px]">
							Seed entities data to see FY revenue planning.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{groups.map((g) => (
							<StateSection
								key={g.state}
								group={g}
								fy={fy}
								canWriteAccess={hasWriteAccess}
								onSave={handleSave}
							/>
						))}
					</div>
				)}

				{/* Pod Budget Comparison */}
				<div className="mt-8">
					<h2 className="mb-4 font-bold text-base tracking-tight">
						Pod Budget Comparison
					</h2>
					<PodComparisonTable priorFy={priorFy} />
				</div>
			</div>

			{/* Footer totals */}
			{groups.length > 0 && (
				<div className="border-border border-t px-6 py-3">
					<div className="grid grid-cols-[1fr_130px_130px_110px_160px_80px] gap-4 font-semibold text-xs">
						<span className="text-muted-foreground">Total ({fy})</span>
						<span className="tabular-nums">{fmt(String(totalTarget))}</span>
						<span className="tabular-nums">{fmt(String(totalActual))}</span>
						{(() => {
							const v = variance(String(totalTarget), String(totalActual));
							return (
								<span
									className={`tabular-nums ${v.positive === null ? "text-muted-foreground" : v.positive ? "text-green-400" : "text-red-400"}`}
								>
									{v.val}
								</span>
							);
						})()}
						<RevenueBar
							target={String(totalTarget)}
							actual={String(totalActual)}
						/>
						<span
							className={
								overallPct === null
									? "text-muted-foreground"
									: overallPct >= 100
										? "text-green-400"
										: overallPct >= 80
											? "text-amber-400"
											: "text-red-400"
							}
						>
							{overallPct !== null ? `${overallPct}%` : "\u2014"}
						</span>
					</div>
				</div>
			)}

			{/* CSV Import Dialog */}
			<CsvImportDialog
				open={importOpen}
				onClose={() => setImportOpen(false)}
				fy={priorFy}
			/>
		</div>
	);
}
