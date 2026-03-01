import {
	Alert02Icon,
	Building03Icon,
	ChartLineData02Icon,
	Delete02Icon,
	Dollar01Icon,
	MagicWand01Icon,
	PencilEdit01Icon,
	PlusSignIcon,
	StarIcon,
	Target01Icon,
	Tick01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { SERVICE_LINES } from "@/lib/constants";
import { fmtDollar, fmtK } from "@/lib/format";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/wfp")({
	component: WfpPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type StaffWithMeta = {
	id: string;
	name: string;
	role: string | null;
	sl: string | null;
	state: string | null;
	office: string | null;
	pod: string | null;
	salary: number | null;
	seniority: number | null;
	meta: {
		cbId: string;
		billingTarget: string | null;
		billingActual: string | null;
		perfRating: string | null;
		promoFlag: boolean | null;
		promoEta: string | null;
		staffRole: string | null;
	} | null;
};

// ── Perf rating badge ─────────────────────────────────────────────────────────

const PERF_STYLES: Record<string, string> = {
	Exceeds: "border-green-500/40 bg-green-500/10 text-green-400",
	Meets: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	Below: "border-red-500/40 bg-red-500/10 text-red-400",
	"N/A": "border-border bg-muted/40 text-muted-foreground",
};

function PerfBadge({ rating }: { rating: string | null | undefined }) {
	const r = rating ?? "N/A";
	const cls = PERF_STYLES[r] ?? PERF_STYLES["N/A"];
	return (
		<Badge variant="outline" className={`text-[10px] ${cls}`}>
			{r}
		</Badge>
	);
}

function pct(actual: string | null, target: string | null): string {
	const a = Number(actual);
	const t = Number(target);
	if (!t || !a) return "\u2014";
	return `${Math.round((a / t) * 100)}%`;
}

// ── Inline editable cell ──────────────────────────────────────────────────────

function EditableCell({
	value,
	onSave,
	prefix = "$",
	disabled,
}: {
	value: string | null | undefined;
	onSave: (v: string) => void;
	prefix?: string;
	disabled?: boolean;
}) {
	const [editing, setEditing] = useState(false);
	const [val, setVal] = useState(value ?? "");

	if (disabled) return <span className="text-xs">{fmtDollar(value)}</span>;

	if (editing) {
		return (
			<div className="flex items-center gap-1">
				<span className="text-muted-foreground text-xs">{prefix}</span>
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
					className="h-6 w-20 text-xs"
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
			<span className="text-xs">{fmtDollar(value)}</span>
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

// ── Staff meta edit dialog ────────────────────────────────────────────────────

type MetaForm = {
	perfRating: string;
	promoFlag: boolean;
	promoEta: string;
	staffRole: string;
	billingTarget: string;
	billingActual: string;
};

function MetaDialog({
	staff,
	onClose,
	onSave,
	saving,
}: {
	staff: StaffWithMeta | null;
	onClose: () => void;
	onSave: (f: MetaForm) => void;
	saving: boolean;
}) {
	const m = staff?.meta;
	const [form, setForm] = useState<MetaForm>({
		perfRating: m?.perfRating ?? "N/A",
		promoFlag: m?.promoFlag ?? false,
		promoEta: m?.promoEta ?? "",
		staffRole: m?.staffRole ?? "",
		billingTarget: m?.billingTarget ?? "",
		billingActual: m?.billingActual ?? "",
	});

	// reset on new staff
	const [prev, setPrev] = useState(staff);
	if (staff !== prev) {
		setPrev(staff);
		setForm({
			perfRating: m?.perfRating ?? "N/A",
			promoFlag: m?.promoFlag ?? false,
			promoEta: m?.promoEta ?? "",
			staffRole: m?.staffRole ?? "",
			billingTarget: m?.billingTarget ?? "",
			billingActual: m?.billingActual ?? "",
		});
	}

	const set = (k: keyof MetaForm) => (v: string | boolean | null) =>
		setForm((p) => ({ ...p, [k]: v ?? "" }));

	return (
		<Dialog open={!!staff} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="text-sm">{staff?.name}</DialogTitle>
					<p className="text-muted-foreground text-xs">
						{staff?.role} &middot; {staff?.office}
					</p>
				</DialogHeader>
				<div className="space-y-3">
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Role Override
						</Label>
						<Input
							value={form.staffRole}
							onChange={(e) => set("staffRole")(e.target.value)}
							className="h-8 text-xs"
							placeholder={staff?.role ?? ""}
						/>
					</div>
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Billing Target ($)
						</Label>
						<Input
							type="number"
							value={form.billingTarget}
							onChange={(e) => set("billingTarget")(e.target.value)}
							className="h-8 text-xs"
						/>
					</div>
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Billing Actual ($)
						</Label>
						<Input
							type="number"
							value={form.billingActual}
							onChange={(e) => set("billingActual")(e.target.value)}
							className="h-8 text-xs"
						/>
					</div>
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Performance Rating
						</Label>
						<Select value={form.perfRating} onValueChange={set("perfRating")}>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Exceeds">Exceeds</SelectItem>
								<SelectItem value="Meets">Meets</SelectItem>
								<SelectItem value="Below">Below</SelectItem>
								<SelectItem value="N/A">N/A</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-2">
						<input
							id="promoFlag"
							type="checkbox"
							checked={form.promoFlag}
							onChange={(e) => set("promoFlag")(e.target.checked)}
							className="size-3.5"
						/>
						<Label htmlFor="promoFlag" className="text-xs">
							Promotion Flagged
						</Label>
					</div>
					{form.promoFlag && (
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Promo ETA
							</Label>
							<Input
								value={form.promoEta}
								onChange={(e) => set("promoEta")(e.target.value)}
								className="h-8 text-xs"
								placeholder="e.g. Q2 FY26"
							/>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button size="sm" disabled={saving} onClick={() => onSave(form)}>
						{saving ? "Saving\u2026" : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Filters helper ────────────────────────────────────────────────────────────

function unique(items: StaffWithMeta[], key: keyof StaffWithMeta): string[] {
	return [
		...new Set(
			items.map((i) => i[key] as string | null).filter((v): v is string => !!v),
		),
	].sort();
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Firm Tab ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function FirmTab() {
	const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

	const kpiQuery = useQuery(trpc.wfp.firmKPIs.queryOptions());
	const entityQuery = useQuery(trpc.wfp.entityOverview.queryOptions());

	const detailOpts = trpc.wfp.entityDetail.queryOptions({
		entityId: selectedEntity ?? "",
	});
	const detailQuery = useQuery({
		...detailOpts,
		enabled: !!selectedEntity,
	});

	const kpi = kpiQuery.data;
	const entitiesList = entityQuery.data ?? [];
	const detail = detailQuery.data;

	return (
		<div className="space-y-6 p-6">
			{/* KPI Strip */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<KpiCard
					label="Total Headcount"
					value={kpi ? String(kpi.headcount) : "\u2014"}
					icon={
						<HugeiconsIcon
							icon={UserGroupIcon}
							className="size-4 text-blue-400"
						/>
					}
					loading={kpiQuery.isPending}
				/>
				<KpiCard
					label="Total Payroll"
					value={kpi ? fmtDollar(kpi.totalPayroll) : "\u2014"}
					icon={
						<HugeiconsIcon
							icon={Dollar01Icon}
							className="size-4 text-green-400"
						/>
					}
					loading={kpiQuery.isPending}
				/>
				<KpiCard
					label="Avg Salary"
					value={kpi ? fmtDollar(kpi.avgSalary) : "\u2014"}
					icon={
						<HugeiconsIcon
							icon={ChartLineData02Icon}
							className="size-4 text-amber-400"
						/>
					}
					loading={kpiQuery.isPending}
				/>
				<KpiCard
					label="At-Risk"
					value={kpi ? String(kpi.atRiskCount) : "\u2014"}
					icon={
						<HugeiconsIcon icon={StarIcon} className="size-4 text-red-400" />
					}
					loading={kpiQuery.isPending}
					muted
				/>
			</div>

			{/* Entity Selector Grid */}
			<div>
				<h2 className="mb-3 font-semibold text-sm">Entities</h2>
				{entityQuery.isPending ? (
					<div className="flex h-24 items-center justify-center text-muted-foreground text-xs">
						Loading entities...
					</div>
				) : (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{entitiesList.map((ent) => (
							<button
								key={ent.id}
								type="button"
								onClick={() =>
									setSelectedEntity(selectedEntity === ent.id ? null : ent.id)
								}
								className={`flex flex-col gap-2 rounded-sm border p-4 text-left transition-colors hover:bg-muted/50 ${
									selectedEntity === ent.id
										? "border-primary ring-1 ring-primary"
										: "border-border"
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">{ent.biz}</span>
									{ent.state && (
										<Badge variant="outline" className="text-[10px]">
											{ent.state.toUpperCase()}
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-4 text-muted-foreground text-xs">
									<span>{ent.staffCount} staff</span>
									<span>${fmtK(ent.totalPayroll)} payroll</span>
									{ent.podCount > 0 && <span>{ent.podCount} pods</span>}
								</div>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Entity Detail Panel */}
			{selectedEntity && (
				<EntityDetailPanel
					entityId={selectedEntity}
					detail={detail ?? null}
					loading={detailQuery.isPending}
				/>
			)}
		</div>
	);
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
	label,
	value,
	icon,
	loading,
	muted,
}: {
	label: string;
	value: string;
	icon: React.ReactNode;
	loading: boolean;
	muted?: boolean;
}) {
	return (
		<Card size="sm">
			<CardHeader className="flex-row items-center justify-between pb-1">
				<CardTitle className="font-normal text-muted-foreground text-xs">
					{label}
				</CardTitle>
				{icon}
			</CardHeader>
			<CardContent>
				{loading ? (
					<span className="text-muted-foreground text-xs">Loading...</span>
				) : (
					<span
						className={`font-bold text-xl tabular-nums ${muted ? "text-muted-foreground" : ""}`}
					>
						{value}
					</span>
				)}
			</CardContent>
		</Card>
	);
}

// ── Entity Detail Panel ───────────────────────────────────────────────────────

type EntityDetailData = {
	entity: {
		id: string;
		biz: string;
		state: string | null;
		officeId: string | null;
	};
	settings: {
		billingMultiplier: string | null;
		fy: string | null;
	} | null;
	revenue: {
		target: string | null;
		actual: string | null;
		fy: string;
	} | null;
	totalPayroll: number;
	pods: { name: string; headcount: number; totalSalary: number }[];
	staff: {
		id: string;
		name: string;
		role: string | null;
		sl: string | null;
		state: string | null;
		office: string | null;
		pod: string | null;
		salary: number | null;
		entity: string | null;
	}[];
	openHiringCount: number;
};

function EntityDetailPanel({
	entityId,
	detail,
	loading,
}: {
	entityId: string;
	detail: EntityDetailData | null;
	loading: boolean;
}) {
	if (loading) {
		return (
			<div className="flex h-32 items-center justify-center text-muted-foreground text-xs">
				Loading entity details...
			</div>
		);
	}

	if (!detail) {
		return (
			<div className="flex h-32 items-center justify-center text-muted-foreground text-xs">
				Entity not found
			</div>
		);
	}

	const revTarget = Number(detail.revenue?.target ?? 0);
	const revActual = Number(detail.revenue?.actual ?? 0);
	const revPct = revTarget > 0 ? Math.round((revActual / revTarget) * 100) : 0;

	return (
		<div className="space-y-4 rounded-sm border border-border p-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<HugeiconsIcon
						icon={Building03Icon}
						className="size-5 text-muted-foreground"
					/>
					<div>
						<h3 className="font-semibold text-sm">{detail.entity.biz}</h3>
						<p className="text-muted-foreground text-xs">
							{detail.entity.state?.toUpperCase()}
							{detail.settings?.fy ? ` \u00B7 ${detail.settings.fy}` : ""}
						</p>
					</div>
				</div>
				{detail.openHiringCount > 0 && (
					<Badge
						variant="outline"
						className="border-amber-500/40 text-amber-400"
					>
						{detail.openHiringCount} open hiring
					</Badge>
				)}
			</div>

			{/* Revenue Strip */}
			{detail.revenue && revTarget > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">Revenue</span>
						<span className="tabular-nums">
							{fmtDollar(revActual)} / {fmtDollar(revTarget)} ({revPct}%)
						</span>
					</div>
					<Progress value={Math.min(revPct, 100)} />
				</div>
			)}

			{/* Compensation Budget */}
			<div className="flex items-center justify-between rounded-sm bg-muted/30 px-4 py-3">
				<span className="text-muted-foreground text-xs">
					Compensation Budget
				</span>
				<span className="font-semibold text-sm tabular-nums">
					{fmtDollar(detail.totalPayroll)}
				</span>
			</div>

			{/* Pods Table */}
			{detail.pods.length > 0 && (
				<div>
					<h4 className="mb-2 font-medium text-muted-foreground text-xs">
						Pods
					</h4>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Pod</TableHead>
								<TableHead className="text-right">Headcount</TableHead>
								<TableHead className="text-right">Salary Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{detail.pods.map((pod) => (
								<TableRow key={pod.name}>
									<TableCell className="text-sm">{pod.name}</TableCell>
									<TableCell className="text-right text-xs tabular-nums">
										{pod.headcount}
									</TableCell>
									<TableCell className="text-right text-xs tabular-nums">
										{fmtDollar(pod.totalSalary)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Headcount Targets */}
			<HeadcountTargetsSection entityId={entityId} staff={detail.staff} />

			{/* Attrition Risks */}
			<AttritionRisksSection entityId={entityId} staff={detail.staff} />

			{/* Scenario Workbench */}
			<ScenarioWorkbenchSection entityId={entityId} />
		</div>
	);
}

// ── Headcount Targets Section ────────────────────────────────────────────────

function HeadcountTargetsSection({
	entityId,
	staff,
}: {
	entityId: string;
	staff: EntityDetailData["staff"];
}) {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const qc = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [formSl, setFormSl] = useState("");
	const [formTarget, setFormTarget] = useState("");
	const [formNotes, setFormNotes] = useState("");

	const { data: targets } = useQuery(
		trpc.wfpExtended.getHeadcountTargets.queryOptions({ entityId }),
	);

	const upsertTarget = useMutation(
		trpc.wfpExtended.upsertHeadcountTarget.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getHeadcountTargets.queryKey(),
				});
				setDialogOpen(false);
				setFormSl("");
				setFormTarget("");
				setFormNotes("");
				toast.success("Target saved");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const targetMap = new Map((targets ?? []).map((t) => [t.slId, t.target]));

	const slCounts = new Map<string, number>();
	for (const s of staff) {
		if (s.sl) {
			slCounts.set(s.sl, (slCounts.get(s.sl) ?? 0) + 1);
		}
	}

	return (
		<div>
			<div className="mb-2 flex items-center justify-between">
				<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
					<HugeiconsIcon icon={Target01Icon} className="size-3.5" />
					Headcount Targets
				</h4>
				{hasWriteAccess && (
					<Button
						variant="ghost"
						size="sm"
						className="h-6 text-[11px]"
						onClick={() => setDialogOpen(true)}
					>
						<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
						Set Target
					</Button>
				)}
			</div>
			<div className="space-y-2">
				{SERVICE_LINES.map((sl) => {
					const current = slCounts.get(sl.id) ?? 0;
					const target = targetMap.get(sl.id) ?? 0;
					const pctVal = target > 0 ? Math.round((current / target) * 100) : 0;
					if (current === 0 && target === 0) return null;
					return (
						<div key={sl.id} className="space-y-1">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<span
										className="inline-block size-2 rounded-full"
										style={{ backgroundColor: sl.color }}
									/>
									<span className="text-xs">{sl.short}</span>
								</div>
								<span className="text-[11px] text-muted-foreground tabular-nums">
									{current} / {target || "--"}
									{target > 0 && ` (${pctVal}%)`}
								</span>
							</div>
							{target > 0 && (
								<Progress value={Math.min(pctVal, 100)} className="h-1.5" />
							)}
						</div>
					);
				})}
			</div>

			{/* Set Target Dialog */}
			<Dialog
				open={dialogOpen}
				onOpenChange={(o) => !o && setDialogOpen(false)}
			>
				<DialogContent className="max-w-xs">
					<DialogHeader>
						<DialogTitle className="text-sm">Set Headcount Target</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Service Line
							</Label>
							<Select
								value={formSl || "__none__"}
								onValueChange={(v) =>
									setFormSl(v === "__none__" ? "" : (v ?? ""))
								}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue placeholder="Select SL" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__" disabled>
										Select SL
									</SelectItem>
									{SERVICE_LINES.map((sl) => (
										<SelectItem key={sl.id} value={sl.id}>
											{sl.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Target Headcount
							</Label>
							<Input
								type="number"
								value={formTarget}
								onChange={(e) => setFormTarget(e.target.value)}
								className="h-8 text-xs"
								min={0}
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Notes (optional)
							</Label>
							<Input
								value={formNotes}
								onChange={(e) => setFormNotes(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={!formSl || !formTarget || upsertTarget.isPending}
							onClick={() => {
								upsertTarget.mutate({
									entityId,
									slId: formSl,
									target: Number(formTarget),
									notes: formNotes || undefined,
								});
							}}
						>
							{upsertTarget.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ── Attrition Risks Section ──────────────────────────────────────────────────

const RISK_STYLES: Record<string, string> = {
	low: "border-blue-500/40 bg-blue-500/10 text-blue-400",
	medium: "border-amber-500/40 bg-amber-500/10 text-amber-400",
	high: "border-red-500/40 bg-red-500/10 text-red-400",
};

function AttritionRisksSection({
	entityId,
	staff,
}: {
	entityId: string;
	staff: EntityDetailData["staff"];
}) {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const qc = useQueryClient();
	const [flagOpen, setFlagOpen] = useState(false);
	const [editRisk, setEditRisk] = useState<string | null>(null);
	const [formStaff, setFormStaff] = useState("");
	const [formLevel, setFormLevel] = useState<"low" | "medium" | "high">(
		"medium",
	);
	const [formReason, setFormReason] = useState("");
	const [formAction, setFormAction] = useState("");

	const { data: risks } = useQuery(
		trpc.wfpExtended.getAttritionRisks.queryOptions({ entityId }),
	);

	const createRisk = useMutation(
		trpc.wfpExtended.createAttritionRisk.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getAttritionRisks.queryKey(),
				});
				qc.invalidateQueries({
					queryKey: trpc.wfp.firmKPIs.queryKey(),
				});
				setFlagOpen(false);
				resetForm();
				toast.success("Risk flagged");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const updateRisk = useMutation(
		trpc.wfpExtended.updateAttritionRisk.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getAttritionRisks.queryKey(),
				});
				qc.invalidateQueries({
					queryKey: trpc.wfp.firmKPIs.queryKey(),
				});
				setEditRisk(null);
				resetForm();
				toast.success("Risk updated");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const deleteRisk = useMutation(
		trpc.wfpExtended.deleteAttritionRisk.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getAttritionRisks.queryKey(),
				});
				qc.invalidateQueries({
					queryKey: trpc.wfp.firmKPIs.queryKey(),
				});
				toast.success("Risk removed");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function resetForm() {
		setFormStaff("");
		setFormLevel("medium");
		setFormReason("");
		setFormAction("");
	}

	const riskIds = new Set((risks ?? []).map((r) => r.carboniteId));
	const staffMap = new Map(staff.map((s) => [s.id, s]));
	const availableStaff = staff.filter((s) => !riskIds.has(s.id));

	function openEdit(riskId: string) {
		const r = (risks ?? []).find((x) => x.id === riskId);
		if (!r) return;
		setEditRisk(riskId);
		setFormLevel(r.riskLevel as "low" | "medium" | "high");
		setFormReason(r.reason ?? "");
		setFormAction(r.action ?? "");
	}

	return (
		<div>
			<div className="mb-2 flex items-center justify-between">
				<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
					<HugeiconsIcon icon={Alert02Icon} className="size-3.5" />
					Attrition Risks
				</h4>
				{hasWriteAccess && (
					<Button
						variant="ghost"
						size="sm"
						className="h-6 text-[11px]"
						onClick={() => {
							resetForm();
							setFlagOpen(true);
						}}
					>
						<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
						Flag Risk
					</Button>
				)}
			</div>

			{(risks ?? []).length === 0 ? (
				<p className="text-muted-foreground text-xs">
					No attrition risks flagged
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Risk</TableHead>
							<TableHead>Reason</TableHead>
							<TableHead>Action</TableHead>
							{hasWriteAccess && <TableHead className="w-16" />}
						</TableRow>
					</TableHeader>
					<TableBody>
						{(risks ?? []).map((risk) => {
							const member = staffMap.get(risk.carboniteId);
							return (
								<TableRow key={risk.id}>
									<TableCell className="text-sm">
										{member?.name ?? risk.carboniteId}
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">
										{member?.role ?? "--"}
									</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className={`text-[10px] ${RISK_STYLES[risk.riskLevel] ?? ""}`}
										>
											{risk.riskLevel}
										</Badge>
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-xs">
										{risk.reason || "--"}
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-xs">
										{risk.action || "--"}
									</TableCell>
									{hasWriteAccess && (
										<TableCell>
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() => openEdit(risk.id)}
												>
													<HugeiconsIcon
														icon={PencilEdit01Icon}
														className="size-3"
													/>
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
													onClick={() => deleteRisk.mutate({ id: risk.id })}
												>
													<HugeiconsIcon
														icon={Delete02Icon}
														className="size-3"
													/>
												</Button>
											</div>
										</TableCell>
									)}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}

			{/* Flag Risk Dialog */}
			<Dialog open={flagOpen} onOpenChange={(o) => !o && setFlagOpen(false)}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="text-sm">Flag Attrition Risk</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Staff Member
							</Label>
							<Select
								value={formStaff || "__none__"}
								onValueChange={(v) =>
									setFormStaff(v === "__none__" ? "" : (v ?? ""))
								}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue placeholder="Select staff" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__" disabled>
										Select staff
									</SelectItem>
									{availableStaff.map((s) => (
										<SelectItem key={s.id} value={s.id}>
											{s.name} ({s.role ?? "N/A"})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Risk Level
							</Label>
							<Select
								value={formLevel}
								onValueChange={(v) => {
									if (v === "low" || v === "medium" || v === "high") {
										setFormLevel(v);
									}
								}}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="high">High</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Reason
							</Label>
							<Textarea
								value={formReason}
								onChange={(e) => setFormReason(e.target.value)}
								className="text-xs"
								rows={2}
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Action
							</Label>
							<Textarea
								value={formAction}
								onChange={(e) => setFormAction(e.target.value)}
								className="text-xs"
								rows={2}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setFlagOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={!formStaff || createRisk.isPending}
							onClick={() => {
								createRisk.mutate({
									carboniteId: formStaff,
									riskLevel: formLevel,
									reason: formReason || undefined,
									action: formAction || undefined,
								});
							}}
						>
							{createRisk.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Risk Dialog */}
			<Dialog open={!!editRisk} onOpenChange={(o) => !o && setEditRisk(null)}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="text-sm">Edit Attrition Risk</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Risk Level
							</Label>
							<Select
								value={formLevel}
								onValueChange={(v) => {
									if (v === "low" || v === "medium" || v === "high") {
										setFormLevel(v);
									}
								}}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="high">High</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Reason
							</Label>
							<Textarea
								value={formReason}
								onChange={(e) => setFormReason(e.target.value)}
								className="text-xs"
								rows={2}
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Action
							</Label>
							<Textarea
								value={formAction}
								onChange={(e) => setFormAction(e.target.value)}
								className="text-xs"
								rows={2}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEditRisk(null)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={updateRisk.isPending}
							onClick={() => {
								if (!editRisk) return;
								updateRisk.mutate({
									id: editRisk,
									riskLevel: formLevel,
									reason: formReason || undefined,
									action: formAction || undefined,
								});
							}}
						>
							{updateRisk.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ── Scenario Workbench Section ───────────────────────────────────────────────

type ScenarioRoleForm = {
	roleTitle: string;
	sl: string;
	salary: string;
	count: string;
};

const PRESET_COLORS = [
	"#4CAF50",
	"#2196F3",
	"#FF8C00",
	"#7B2FBE",
	"#F76707",
	"#F5C518",
	"#e84040",
	"#12B886",
];

function ScenarioWorkbenchSection({ entityId }: { entityId: string }) {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const qc = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [formName, setFormName] = useState("");
	const [formDesc, setFormDesc] = useState("");
	const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
	const [formRoles, setFormRoles] = useState<ScenarioRoleForm[]>([
		{ roleTitle: "", sl: "", salary: "", count: "1" },
	]);

	const { data: scenarioList } = useQuery(
		trpc.wfpExtended.getScenarios.queryOptions({ entityId }),
	);

	const createScenario = useMutation(
		trpc.wfpExtended.createScenario.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getScenarios.queryKey(),
				});
				setDialogOpen(false);
				resetScenarioForm();
				toast.success("Scenario created");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const deleteScenario = useMutation(
		trpc.wfpExtended.deleteScenario.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getScenarios.queryKey(),
				});
				toast.success("Scenario deleted");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function resetScenarioForm() {
		setFormName("");
		setFormDesc("");
		setFormColor(PRESET_COLORS[0]);
		setFormRoles([{ roleTitle: "", sl: "", salary: "", count: "1" }]);
	}

	function updateRole(idx: number, key: keyof ScenarioRoleForm, val: string) {
		setFormRoles((prev) =>
			prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
		);
	}

	function removeRole(idx: number) {
		setFormRoles((prev) => prev.filter((_, i) => i !== idx));
	}

	return (
		<div>
			<div className="mb-2 flex items-center justify-between">
				<h4 className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
					<HugeiconsIcon icon={MagicWand01Icon} className="size-3.5" />
					Scenario Workbench
				</h4>
				{hasWriteAccess && (
					<Button
						variant="ghost"
						size="sm"
						className="h-6 text-[11px]"
						onClick={() => {
							resetScenarioForm();
							setDialogOpen(true);
						}}
					>
						<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
						New Scenario
					</Button>
				)}
			</div>

			{(scenarioList ?? []).length === 0 ? (
				<p className="text-muted-foreground text-xs">No scenarios created</p>
			) : (
				<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
					{(scenarioList ?? []).map((sc) => {
						const totalPayroll = sc.roles.reduce(
							(sum, r) => sum + r.salary * r.count,
							0,
						);
						const totalHeadcount = sc.roles.reduce(
							(sum, r) => sum + r.count,
							0,
						);
						return (
							<Card key={sc.id} className="relative overflow-hidden">
								<div
									className="absolute top-0 left-0 h-full w-1"
									style={{ backgroundColor: sc.color ?? "#666" }}
								/>
								<CardHeader className="pb-2 pl-4">
									<div className="flex items-center justify-between">
										<CardTitle className="text-sm">{sc.name}</CardTitle>
										{hasWriteAccess && (
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
												onClick={() => deleteScenario.mutate({ id: sc.id })}
											>
												<HugeiconsIcon icon={Delete02Icon} className="size-3" />
											</Button>
										)}
									</div>
									{sc.description && (
										<p className="text-[11px] text-muted-foreground">
											{sc.description}
										</p>
									)}
								</CardHeader>
								<CardContent className="pl-4">
									{sc.roles.length > 0 && (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Role</TableHead>
													<TableHead>SL</TableHead>
													<TableHead className="text-right">Salary</TableHead>
													<TableHead className="text-right">Count</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{sc.roles.map((role) => (
													<TableRow key={role.id}>
														<TableCell className="text-xs">
															{role.roleTitle}
														</TableCell>
														<TableCell className="text-muted-foreground text-xs">
															{role.sl || "--"}
														</TableCell>
														<TableCell className="text-right text-xs tabular-nums">
															{fmtDollar(role.salary)}
														</TableCell>
														<TableCell className="text-right text-xs tabular-nums">
															{role.count}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									)}
									<div className="mt-2 flex items-center gap-4 text-[11px]">
										<span className="text-muted-foreground">
											New Payroll:{" "}
											<span className="font-medium text-foreground tabular-nums">
												{fmtDollar(totalPayroll)}
											</span>
										</span>
										<span className="text-muted-foreground">
											Headcount:{" "}
											<span className="font-medium text-foreground tabular-nums">
												+{totalHeadcount}
											</span>
										</span>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* New Scenario Dialog */}
			<Dialog
				open={dialogOpen}
				onOpenChange={(o) => !o && setDialogOpen(false)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-sm">New Scenario</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Name
							</Label>
							<Input
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								className="h-8 text-xs"
								placeholder="e.g. Q3 Growth Plan"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Description
							</Label>
							<Input
								value={formDesc}
								onChange={(e) => setFormDesc(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Color
							</Label>
							<div className="flex items-center gap-1.5">
								{PRESET_COLORS.map((c) => (
									<button
										key={c}
										type="button"
										onClick={() => setFormColor(c)}
										className={`size-5 rounded-full border-2 transition-colors ${
											formColor === c
												? "border-foreground"
												: "border-transparent"
										}`}
										style={{ backgroundColor: c }}
									/>
								))}
							</div>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Roles
							</Label>
							<div className="space-y-2">
								{formRoles.map((role, idx) => (
									<div
										key={`role-row-${idx}`}
										className="flex items-center gap-1.5"
									>
										<Input
											value={role.roleTitle}
											onChange={(e) =>
												updateRole(idx, "roleTitle", e.target.value)
											}
											className="h-7 flex-1 text-[11px]"
											placeholder="Role title"
										/>
										<Select
											value={role.sl || "__none__"}
											onValueChange={(v) =>
												updateRole(idx, "sl", v === "__none__" ? "" : (v ?? ""))
											}
										>
											<SelectTrigger className="h-7 w-24 text-[11px]">
												<SelectValue placeholder="SL" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__none__">None</SelectItem>
												{SERVICE_LINES.map((sl) => (
													<SelectItem key={sl.id} value={sl.id}>
														{sl.short}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Input
											type="number"
											value={role.salary}
											onChange={(e) =>
												updateRole(idx, "salary", e.target.value)
											}
											className="h-7 w-20 text-[11px]"
											placeholder="Salary"
										/>
										<Input
											type="number"
											value={role.count}
											onChange={(e) => updateRole(idx, "count", e.target.value)}
											className="h-7 w-12 text-[11px]"
											placeholder="#"
											min={1}
										/>
										{formRoles.length > 1 && (
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
												onClick={() => removeRole(idx)}
											>
												<HugeiconsIcon icon={Delete02Icon} className="size-3" />
											</Button>
										)}
									</div>
								))}
								<Button
									variant="outline"
									size="sm"
									className="h-6 text-[11px]"
									onClick={() =>
										setFormRoles((prev) => [
											...prev,
											{ roleTitle: "", sl: "", salary: "", count: "1" },
										])
									}
								>
									<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
									Add Role
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={!formName || createScenario.isPending}
							onClick={() => {
								const validRoles = formRoles
									.filter((r) => r.roleTitle && r.salary)
									.map((r) => ({
										roleTitle: r.roleTitle,
										sl: r.sl || undefined,
										salary: Number(r.salary),
										count: Number(r.count) || 1,
									}));
								createScenario.mutate({
									entityId,
									name: formName,
									description: formDesc || undefined,
									color: formColor,
									roles: validRoles.length > 0 ? validRoles : undefined,
								});
							}}
						>
							{createScenario.isPending ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Staff Tab (existing functionality) ───────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function StaffTab() {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const qc = useQueryClient();
	const [editStaff, setEditStaff] = useState<StaffWithMeta | null>(null);
	const [filterSl, setFilterSl] = useState("");
	const [filterOffice, setFilterOffice] = useState("");
	const [filterPromo, setFilterPromo] = useState(false);

	const query = useQuery(trpc.wfp.getStaffWithMeta.queryOptions());
	const allStaff = (query.data ?? []) as StaffWithMeta[];

	const upsertMeta = useMutation(
		trpc.wfp.upsertStaffMeta.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfp.getStaffWithMeta.queryKey(),
				});
				setEditStaff(null);
				toast.success("Saved");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const quickUpsert = (cbId: string, patch: Record<string, string>) => {
		upsertMeta.mutate({ cbId, ...patch });
	};

	const filtered = allStaff.filter((s) => {
		if (filterSl && s.sl !== filterSl) return false;
		if (filterOffice && s.office !== filterOffice) return false;
		if (filterPromo && !s.meta?.promoFlag) return false;
		return true;
	});

	// Totals
	const totalTarget = filtered.reduce(
		(s, r) => s + Number(r.meta?.billingTarget ?? 0),
		0,
	);
	const totalActual = filtered.reduce(
		(s, r) => s + Number(r.meta?.billingActual ?? 0),
		0,
	);
	const promoCount = filtered.filter((r) => r.meta?.promoFlag).length;

	return (
		<div className="flex h-full flex-col">
			{/* Subheader */}
			<div className="flex items-center justify-between border-border border-b px-6 py-3">
				<p className="text-muted-foreground text-xs">
					{filtered.length} staff &middot; {fmtDollar(String(totalTarget))}{" "}
					target &middot; {fmtDollar(String(totalActual))} actual
					{promoCount > 0 && (
						<span className="ml-2 text-amber-400">
							{promoCount} promo flagged
						</span>
					)}
				</p>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-2 border-border border-b px-6 py-3">
				<Select
					value={filterSl || "__all__"}
					onValueChange={(v) => setFilterSl(v === "__all__" ? "" : (v ?? ""))}
				>
					<SelectTrigger className="h-8 w-40 text-xs">
						<SelectValue placeholder="All SLs" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__all__">All Service Lines</SelectItem>
						{unique(allStaff, "sl").map((v) => (
							<SelectItem key={v} value={v}>
								{v}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={filterOffice || "__all__"}
					onValueChange={(v) =>
						setFilterOffice(v === "__all__" ? "" : (v ?? ""))
					}
				>
					<SelectTrigger className="h-8 w-36 text-xs">
						<SelectValue placeholder="All Offices" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__all__">All Offices</SelectItem>
						{unique(allStaff, "office").map((v) => (
							<SelectItem key={v} value={v}>
								{v}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<button
					type="button"
					onClick={() => setFilterPromo((p) => !p)}
					className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${filterPromo ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-border text-muted-foreground hover:text-foreground"}`}
				>
					<HugeiconsIcon icon={StarIcon} className="size-3" /> Promo only
				</button>
			</div>

			{/* Table */}
			<div className="flex-1 overflow-auto">
				{query.isPending ? (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
						Loading...
					</div>
				) : filtered.length === 0 ? (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
						No staff found
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[180px]">Name</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>SL</TableHead>
								<TableHead>Office</TableHead>
								<TableHead>Pod</TableHead>
								<TableHead>Target</TableHead>
								<TableHead>Actual</TableHead>
								<TableHead>Attainment</TableHead>
								<TableHead>Perf</TableHead>
								<TableHead>Promo</TableHead>
								{hasWriteAccess && <TableHead />}
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.map((s) => (
								<TableRow key={s.id}>
									<TableCell className="font-medium text-sm">
										{s.name}
									</TableCell>
									<TableCell className="text-muted-foreground text-xs">
										{s.meta?.staffRole || s.role || "\u2014"}
									</TableCell>
									<TableCell className="text-xs">{s.sl ?? "\u2014"}</TableCell>
									<TableCell className="text-xs">
										{s.office ?? "\u2014"}
									</TableCell>
									<TableCell className="text-xs">{s.pod ?? "\u2014"}</TableCell>
									<TableCell>
										<EditableCell
											value={s.meta?.billingTarget}
											onSave={(v) => quickUpsert(s.id, { billingTarget: v })}
											disabled={!hasWriteAccess}
										/>
									</TableCell>
									<TableCell>
										<EditableCell
											value={s.meta?.billingActual}
											onSave={(v) => quickUpsert(s.id, { billingActual: v })}
											disabled={!hasWriteAccess}
										/>
									</TableCell>
									<TableCell>
										<span
											className={`font-medium text-xs tabular-nums ${Number(s.meta?.billingActual) >= Number(s.meta?.billingTarget) && s.meta?.billingTarget ? "text-green-400" : ""}`}
										>
											{pct(
												s.meta?.billingActual ?? null,
												s.meta?.billingTarget ?? null,
											)}
										</span>
									</TableCell>
									<TableCell>
										<PerfBadge rating={s.meta?.perfRating} />
									</TableCell>
									<TableCell>
										{s.meta?.promoFlag ? (
											<div className="flex items-center gap-1">
												<HugeiconsIcon
													icon={StarIcon}
													className="size-3.5 fill-amber-400 text-amber-400"
												/>
												{s.meta.promoEta && (
													<span className="text-[10px] text-amber-400">
														{s.meta.promoEta}
													</span>
												)}
											</div>
										) : (
											<span className="text-muted-foreground/40 text-xs">
												{"\u2014"}
											</span>
										)}
									</TableCell>
									{hasWriteAccess && (
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0"
												onClick={() => setEditStaff(s)}
											>
												<HugeiconsIcon
													icon={PencilEdit01Icon}
													className="size-3"
												/>
											</Button>
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

			{/* Edit dialog */}
			<MetaDialog
				staff={editStaff}
				onClose={() => setEditStaff(null)}
				onSave={(form) => {
					if (!editStaff) return;
					upsertMeta.mutate({
						cbId: editStaff.id,
						perfRating: form.perfRating,
						promoFlag: form.promoFlag,
						promoEta: form.promoEta || undefined,
						staffRole: form.staffRole || undefined,
						billingTarget: form.billingTarget || undefined,
						billingActual: form.billingActual || undefined,
					});
				}}
				saving={upsertMeta.isPending}
			/>
		</div>
	);
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Page ─────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function WfpPage() {
	const [tab, setTab] = useState("firm");

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-border border-b px-6 py-4">
				<div>
					<h1 className="font-extrabold text-lg tracking-tight">
						Workforce Planning
					</h1>
				</div>
				<div className="flex items-center gap-3">
					<Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
						<TabsList className="h-8">
							<TabsTrigger value="firm" className="px-3 text-xs">
								Firm
							</TabsTrigger>
							<TabsTrigger value="staff" className="px-3 text-xs">
								Staff
							</TabsTrigger>
						</TabsList>
					</Tabs>
					<HugeiconsIcon
						icon={ChartLineData02Icon}
						className="size-4 text-muted-foreground"
					/>
				</div>
			</div>

			{/* Tab content */}
			<div className="flex-1 overflow-auto">
				{tab === "firm" ? <FirmTab /> : <StaffTab />}
			</div>
		</div>
	);
}
