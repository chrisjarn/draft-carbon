import {
	Briefcase01Icon,
	Cancel01Icon,
	Delete02Icon,
	PencilEdit01Icon,
	PlusSignIcon,
	Rotate01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { DetailRow, DetailSection } from "@/components/shared/detail-display";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/hiring")({
	component: HiringPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type HiringNeed = {
	id: string;
	role: string;
	sl: string | null;
	sg: string | null;
	state: string | null;
	office: string | null;
	location: string | null;
	positions: number | null;
	type: string | null;
	priority: string | null;
	status: string | null;
	salaryMin: number | null;
	salaryMax: number | null;
	targetStart: string | null;
	approvedBy: string | null;
	managedBy: string | null;
	notes: string | null;
	closedHow: string | null;
	closedDate: string | null;
	closedName: string | null;
	createdAt: string | null;
	updatedAt: string | null;
};

type TabStatus = "open" | "closed";

// ── Priority badge ────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
	critical: "border-red-500/40 bg-red-500/10 text-red-400",
	urgent: "border-red-500/40 bg-red-500/10 text-red-400",
	high: "border-orange-500/40 bg-orange-500/10 text-orange-400",
	medium: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
	low: "border-border bg-muted/40 text-muted-foreground",
	planned: "border-border bg-muted/40 text-muted-foreground",
};

function PriorityBadge({ priority }: { priority: string | null }) {
	const cls = PRIORITY_STYLES[priority ?? "low"] ?? PRIORITY_STYLES.low;
	return (
		<Badge variant="outline" className={`text-[10px] capitalize ${cls}`}>
			{priority ?? "—"}
		</Badge>
	);
}

function TypeBadge({ type }: { type: string | null }) {
	return (
		<Badge variant="outline" className="text-[10px]">
			{type ?? "—"}
		</Badge>
	);
}

function salaryRange(min: number | null, max: number | null) {
	if (!min && !max) return "—";
	const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
	if (min && max) return `${fmt(min)} – ${fmt(max)}`;
	if (min) return `from ${fmt(min)}`;
	return max ? `up to ${fmt(max)}` : "—";
}

// ── Detail sheet ──────────────────────────────────────────────────────────────

function DetailSheet({
	role,
	onClose,
	onEdit,
	onDelete,
	onClose2,
	onReopen,
	canWriteAccess,
}: {
	role: HiringNeed | null;
	onClose: () => void;
	onEdit: (r: HiringNeed) => void;
	onDelete: (r: HiringNeed) => void;
	onClose2: (r: HiringNeed) => void;
	onReopen: (r: HiringNeed) => void;
	canWriteAccess: boolean;
}) {
	const isOpen = role?.status === "open";
	return (
		<Sheet open={!!role} onOpenChange={(o) => !o && onClose()}>
			<SheetContent className="w-[380px] sm:w-[420px]">
				{role && (
					<>
						<SheetHeader className="pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<HugeiconsIcon icon={Briefcase01Icon} className="size-4" />
								</div>
								<div className="min-w-0 flex-1">
									<SheetTitle className="text-base">{role.role}</SheetTitle>
									<div className="mt-1 flex flex-wrap gap-1">
										<PriorityBadge priority={role.priority} />
										<TypeBadge type={role.type} />
										{role.positions && role.positions > 1 && (
											<Badge variant="secondary" className="text-[10px]">
												{role.positions} positions
											</Badge>
										)}
									</div>
								</div>
							</div>
						</SheetHeader>

						<ScrollArea className="h-[calc(100vh-220px)]">
							<div className="space-y-4 pr-4">
								<DetailSection title="Role Details">
									<DetailRow label="Service Line" value={role.sl} />
									<DetailRow label="Sub Group" value={role.sg} />
									<DetailRow label="State" value={role.state} />
									<DetailRow label="Office" value={role.office} />
									<DetailRow label="Location" value={role.location} />
									<DetailRow label="Type" value={role.type} />
									<DetailRow
										label="Positions"
										value={role.positions?.toString()}
									/>
									<DetailRow label="Target Start" value={role.targetStart} />
									<DetailRow
										label="Salary Range"
										value={salaryRange(role.salaryMin, role.salaryMax)}
									/>
								</DetailSection>

								<DetailSection title="Approvals">
									<DetailRow label="Approved By" value={role.approvedBy} />
									<DetailRow label="Managed By" value={role.managedBy} />
								</DetailSection>

								{role.notes && (
									<DetailSection title="Notes">
										<p className="whitespace-pre-wrap text-muted-foreground text-xs">
											{role.notes}
										</p>
									</DetailSection>
								)}

								{!isOpen && (
									<DetailSection title="Closure">
										<DetailRow label="Closed How" value={role.closedHow} />
										<DetailRow label="Closed Date" value={role.closedDate} />
										<DetailRow label="Hired Name" value={role.closedName} />
									</DetailSection>
								)}
							</div>
						</ScrollArea>

						{canWriteAccess && (
							<div className="flex flex-wrap gap-2 pt-4">
								<Button
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => onEdit(role)}
								>
									<HugeiconsIcon
										icon={PencilEdit01Icon}
										className="mr-1.5 size-3"
									/>{" "}
									Edit
								</Button>
								{isOpen ? (
									<Button
										size="sm"
										variant="secondary"
										onClick={() => onClose2(role)}
									>
										<HugeiconsIcon
											icon={Cancel01Icon}
											className="mr-1.5 size-3"
										/>{" "}
										Close Role
									</Button>
								) : (
									<Button
										size="sm"
										variant="secondary"
										onClick={() => onReopen(role)}
									>
										<HugeiconsIcon
											icon={Rotate01Icon}
											className="mr-1.5 size-3"
										/>{" "}
										Reopen
									</Button>
								)}
								<Button
									size="sm"
									variant="destructive"
									onClick={() => onDelete(role)}
								>
									<HugeiconsIcon icon={Delete02Icon} className="size-3" />
								</Button>
							</div>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

// ── Form ──────────────────────────────────────────────────────────────────────

type FormState = {
	role: string;
	sl: string;
	sg: string;
	state: string;
	office: string;
	location: string;
	positions: string;
	type: string;
	priority: string;
	salaryMin: string;
	salaryMax: string;
	targetStart: string;
	approvedBy: string;
	managedBy: string;
	notes: string;
};

function emptyForm(): FormState {
	return {
		role: "",
		sl: "",
		sg: "",
		state: "",
		office: "",
		location: "",
		positions: "1",
		type: "FT",
		priority: "medium",
		salaryMin: "",
		salaryMax: "",
		targetStart: "",
		approvedBy: "",
		managedBy: "",
		notes: "",
	};
}

function roleToForm(r: HiringNeed): FormState {
	return {
		role: r.role,
		sl: r.sl ?? "",
		sg: r.sg ?? "",
		state: r.state ?? "",
		office: r.office ?? "",
		location: r.location ?? "",
		positions: r.positions?.toString() ?? "1",
		type: r.type ?? "FT",
		priority: r.priority ?? "medium",
		salaryMin: r.salaryMin?.toString() ?? "",
		salaryMax: r.salaryMax?.toString() ?? "",
		targetStart: r.targetStart ?? "",
		approvedBy: r.approvedBy ?? "",
		managedBy: r.managedBy ?? "",
		notes: r.notes ?? "",
	};
}

function HiringDialog({
	open,
	onClose,
	initial,
	onSave,
	saving,
}: {
	open: boolean;
	onClose: () => void;
	initial: FormState;
	onSave: (f: FormState) => void;
	saving: boolean;
}) {
	const [form, setForm] = useState<FormState>(initial);
	const [prevInitial, setPrevInitial] = useState(initial);
	if (initial !== prevInitial) {
		setPrevInitial(initial);
		setForm(initial);
	}
	const set = (k: keyof FormState) => (v: string | null) =>
		setForm((p) => ({ ...p, [k]: v ?? "" }));

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{initial.role ? "Edit Role" : "Add Role"}</DialogTitle>
				</DialogHeader>
				<ScrollArea className="max-h-[60vh]">
					<div className="grid grid-cols-2 gap-3 p-1">
						<div className="col-span-2">
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Role Title *
							</Label>
							<Input
								value={form.role}
								onChange={(e) => set("role")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Service Line
							</Label>
							<Input
								value={form.sl}
								onChange={(e) => set("sl")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Sub Group
							</Label>
							<Input
								value={form.sg}
								onChange={(e) => set("sg")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								State
							</Label>
							<Input
								value={form.state}
								onChange={(e) => set("state")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Office
							</Label>
							<Input
								value={form.office}
								onChange={(e) => set("office")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Location
							</Label>
							<Input
								value={form.location}
								onChange={(e) => set("location")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Positions
							</Label>
							<Input
								type="number"
								min={1}
								value={form.positions}
								onChange={(e) => set("positions")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Type
							</Label>
							<Select value={form.type} onValueChange={set("type")}>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="FT">Full Time</SelectItem>
									<SelectItem value="PT">Part Time</SelectItem>
									<SelectItem value="Contract">Contract</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Priority
							</Label>
							<Select value={form.priority} onValueChange={set("priority")}>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="critical">Critical</SelectItem>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="low">Low</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Salary Min
							</Label>
							<Input
								type="number"
								value={form.salaryMin}
								onChange={(e) => set("salaryMin")(e.target.value)}
								className="h-8 text-xs"
								placeholder="e.g. 65000"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Salary Max
							</Label>
							<Input
								type="number"
								value={form.salaryMax}
								onChange={(e) => set("salaryMax")(e.target.value)}
								className="h-8 text-xs"
								placeholder="e.g. 80000"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Target Start
							</Label>
							<Input
								value={form.targetStart}
								onChange={(e) => set("targetStart")(e.target.value)}
								className="h-8 text-xs"
								placeholder="e.g. Mar 2025"
							/>
						</div>
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Approved By
							</Label>
							<Input
								value={form.approvedBy}
								onChange={(e) => set("approvedBy")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div className="col-span-2">
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Managed By
							</Label>
							<Input
								value={form.managedBy}
								onChange={(e) => set("managedBy")(e.target.value)}
								className="h-8 text-xs"
							/>
						</div>
						<div className="col-span-2">
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Notes
							</Label>
							<Textarea
								value={form.notes}
								onChange={(e) => set("notes")(e.target.value)}
								className="text-xs"
								rows={3}
							/>
						</div>
					</div>
				</ScrollArea>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button
						size="sm"
						disabled={!form.role || saving}
						onClick={() => onSave(form)}
					>
						{saving ? "Saving…" : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Close dialog ──────────────────────────────────────────────────────────────

function CloseRoleDialog({
	role,
	onClose,
	onConfirm,
	saving,
}: {
	role: HiringNeed | null;
	onClose: () => void;
	onConfirm: (
		how: "hired" | "cancelled" | "deferred",
		date: string,
		name: string,
	) => void;
	saving: boolean;
}) {
	const [how, setHow] = useState<"hired" | "cancelled" | "deferred">("hired");
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [name, setName] = useState("");

	return (
		<Dialog open={!!role} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Close Role — {role?.role}</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Outcome
						</Label>
						<Select value={how} onValueChange={(v) => setHow(v as typeof how)}>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="hired">Hired</SelectItem>
								<SelectItem value="cancelled">Cancelled</SelectItem>
								<SelectItem value="deferred">Deferred</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Date
						</Label>
						<Input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="h-8 text-xs"
						/>
					</div>
					{how === "hired" && (
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Hired Name
							</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="h-8 text-xs"
								placeholder="Full name"
							/>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button
						size="sm"
						disabled={saving}
						onClick={() => onConfirm(how, date, name)}
					>
						{saving ? "Closing…" : "Close Role"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Main page ─────────────────────────────────────────────────────────────────

function HiringPage() {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const qc = useQueryClient();
	const [tab, setTab] = useState<TabStatus>("open");
	const [selected, setSelected] = useState<HiringNeed | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HiringNeed | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<HiringNeed | null>(null);
	const [closeTarget, setCloseTarget] = useState<HiringNeed | null>(null);

	const query = useQuery(trpc.hiring.getAll.queryOptions({ status: tab }));
	const rows = query.data ?? [];

	function invalidate() {
		qc.invalidateQueries({
			queryKey: trpc.hiring.getAll.queryKey({ status: "open" }),
		});
		qc.invalidateQueries({
			queryKey: trpc.hiring.getAll.queryKey({ status: "closed" }),
		});
	}

	const createMut = useMutation(
		trpc.hiring.create.mutationOptions({
			onSuccess: () => {
				invalidate();
				setDialogOpen(false);
				toast.success("Role added");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const updateMut = useMutation(
		trpc.hiring.update.mutationOptions({
			onSuccess: (updated) => {
				invalidate();
				setDialogOpen(false);
				setSelected(updated);
				toast.success("Role updated");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const closeMut = useMutation(
		trpc.hiring.close.mutationOptions({
			onSuccess: () => {
				invalidate();
				setCloseTarget(null);
				setSelected(null);
				toast.success("Role closed");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const reopenMut = useMutation(
		trpc.hiring.reopen.mutationOptions({
			onSuccess: (updated) => {
				invalidate();
				setSelected(updated);
				toast.success("Role reopened");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const deleteMut = useMutation(
		trpc.hiring.delete.mutationOptions({
			onSuccess: () => {
				invalidate();
				setDeleteTarget(null);
				setSelected(null);
				toast.success("Role deleted");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function handleSave(form: FormState) {
		const payload = {
			role: form.role,
			sl: form.sl || undefined,
			sg: form.sg || undefined,
			state: form.state || undefined,
			office: form.office || undefined,
			location: form.location || undefined,
			positions: form.positions ? Number(form.positions) : undefined,
			type: (form.type as "FT" | "PT" | "Contract") || undefined,
			priority:
				(form.priority as "critical" | "high" | "medium" | "low") || undefined,
			salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
			salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
			targetStart: form.targetStart || undefined,
			approvedBy: form.approvedBy || undefined,
			managedBy: form.managedBy || undefined,
			notes: form.notes || undefined,
		};
		if (editTarget) {
			updateMut.mutate({ id: editTarget.id, ...payload });
		} else {
			createMut.mutate(payload);
		}
	}

	const saving = createMut.isPending || updateMut.isPending;

	// Summary counts per priority for open tab
	const openByPriority = rows.reduce<Record<string, number>>((acc, r) => {
		const p = r.priority ?? "low";
		acc[p] = (acc[p] ?? 0) + (r.positions ?? 1);
		return acc;
	}, {});

	const columns = useMemo<ColumnDef<HiringNeed, unknown>[]>(() => {
		const base: ColumnDef<HiringNeed, unknown>[] = [
			{
				accessorKey: "role",
				header: "Role",
				cell: ({ row }) => (
					<span className="font-medium text-sm">{row.getValue("role")}</span>
				),
			},
			{
				accessorKey: "sl",
				header: "SL",
				cell: ({ row }) => (
					<span className="text-xs">
						{(row.getValue("sl") as string) ?? "—"}
					</span>
				),
			},
			{
				accessorKey: "state",
				header: "State",
				cell: ({ row }) => (
					<span className="text-xs">
						{(row.getValue("state") as string) ?? "—"}
					</span>
				),
			},
			{
				accessorKey: "office",
				header: "Office",
				cell: ({ row }) => (
					<span className="text-xs">
						{(row.getValue("office") as string) ?? "—"}
					</span>
				),
			},
			{
				accessorKey: "positions",
				header: "Pos.",
				cell: ({ row }) => (
					<span className="text-xs tabular-nums">
						{(row.getValue("positions") as number) ?? 1}
					</span>
				),
			},
			{
				accessorKey: "type",
				header: "Type",
				cell: ({ row }) => <TypeBadge type={row.getValue("type")} />,
			},
			{
				accessorKey: "priority",
				header: "Priority",
				cell: ({ row }) => (
					<PriorityBadge priority={row.getValue("priority")} />
				),
			},
			{
				accessorKey: "targetStart",
				header: "Target Start",
				cell: ({ row }) => (
					<span className="text-xs">
						{(row.getValue("targetStart") as string) ?? "—"}
					</span>
				),
			},
			{
				id: "salary",
				header: "Salary",
				cell: ({ row }) => (
					<span className="text-xs">
						{salaryRange(row.original.salaryMin, row.original.salaryMax)}
					</span>
				),
			},
		];

		if (tab === "closed") {
			base.push({
				accessorKey: "closedHow",
				header: "Closed How",
				cell: ({ row }) => (
					<Badge variant="outline" className="text-[10px] capitalize">
						{(row.getValue("closedHow") as string) ?? "—"}
					</Badge>
				),
			});
		}

		return base;
	}, [tab]);

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-border border-b px-6 py-4">
				<div>
					<h1 className="font-extrabold text-lg tracking-tight">Hiring</h1>
					<p className="mt-0.5 text-muted-foreground text-xs">
						{query.isSuccess
							? `${rows.length} role${rows.length !== 1 ? "s" : ""}`
							: "Loading…"}
						{tab === "open" && rows.length > 0 && (
							<span className="ml-2 space-x-1">
								{(
									[
										"critical",
										"urgent",
										"high",
										"medium",
										"low",
										"planned",
									] as const
								).map((p) =>
									openByPriority[p] ? (
										<span
											key={p}
											className={`inline-flex items-center gap-0.5 text-[10px] ${PRIORITY_STYLES[p]?.split(" ")[2]}`}
										>
											{openByPriority[p]} {p}
										</span>
									) : null,
								)}
							</span>
						)}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Tabs
						value={tab}
						onValueChange={(v) => {
							setTab(v as TabStatus);
							setSelected(null);
						}}
					>
						<TabsList className="h-8">
							<TabsTrigger value="open" className="px-3 text-xs">
								Open
							</TabsTrigger>
							<TabsTrigger value="closed" className="px-3 text-xs">
								Closed
							</TabsTrigger>
						</TabsList>
					</Tabs>
					{hasWriteAccess && (
						<Button
							size="sm"
							onClick={() => {
								setEditTarget(null);
								setDialogOpen(true);
							}}
						>
							<HugeiconsIcon icon={PlusSignIcon} className="mr-1.5 size-3.5" />{" "}
							Add Role
						</Button>
					)}
				</div>
			</div>

			{/* Table */}
			<div className="flex-1 overflow-auto px-6 py-4">
				{query.isPending ? (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
						Loading…
					</div>
				) : rows.length === 0 ? (
					<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
						<HugeiconsIcon
							icon={Briefcase01Icon}
							className="size-8 opacity-30"
						/>
						No {tab} roles
					</div>
				) : (
					<DataTable
						columns={columns}
						data={rows}
						pageSize={10}
						searchPlaceholder="Search roles..."
						onRowClick={setSelected}
						emptyMessage={`No ${tab} roles`}
					/>
				)}
			</div>

			{/* Detail sheet */}
			<DetailSheet
				role={selected}
				onClose={() => setSelected(null)}
				onEdit={(r) => {
					setEditTarget(r);
					setDialogOpen(true);
				}}
				onDelete={setDeleteTarget}
				onClose2={setCloseTarget}
				onReopen={(r) => reopenMut.mutate({ id: r.id })}
				canWriteAccess={hasWriteAccess}
			/>

			{/* Edit/Create dialog */}
			<HiringDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				initial={editTarget ? roleToForm(editTarget) : emptyForm()}
				onSave={handleSave}
				saving={saving}
			/>

			{/* Close role dialog */}
			<CloseRoleDialog
				role={closeTarget}
				onClose={() => setCloseTarget(null)}
				onConfirm={(how, date, name) => {
					if (!closeTarget) return;
					closeMut.mutate({
						id: closeTarget.id,
						closedHow: how,
						closedDate: date,
						closedName: name || undefined,
					});
				}}
				saving={closeMut.isPending}
			/>

			{/* Delete confirm */}
			<Dialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Delete Role</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Delete <strong>{deleteTarget?.role}</strong>? This cannot be undone.
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDeleteTarget(null)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							disabled={deleteMut.isPending}
							onClick={() =>
								deleteTarget && deleteMut.mutate({ id: deleteTarget.id })
							}
						>
							{deleteMut.isPending ? "Deleting…" : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
