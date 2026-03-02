import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { fmtDollar } from "@/lib/format";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

import type { MetaForm, StaffWithMeta } from "./types";
import { useStaffDataTable } from "./use-staff-data-table";

// ── Staff meta edit dialog ────────────────────────────────────────────────────

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
		promoFlag: m?.promoFlag ?? "no",
		promoEta: m?.promoEta ?? "",
		staffRole: m?.staffRole ?? "",
		roleTag: m?.roleTag ?? "",
		billingTarget: m?.billingTarget ?? "",
		billingActual: m?.billingActual ?? "",
	});

	// reset on new staff
	const [prev, setPrev] = useState(staff);
	if (staff !== prev) {
		setPrev(staff);
		setForm({
			perfRating: m?.perfRating ?? "N/A",
			promoFlag: m?.promoFlag ?? "no",
			promoEta: m?.promoEta ?? "",
			staffRole: m?.staffRole ?? "",
			roleTag: m?.roleTag ?? "",
			billingTarget: m?.billingTarget ?? "",
			billingActual: m?.billingActual ?? "",
		});
	}
	const set = (k: keyof MetaForm) => (v: string | null) =>
		setForm((p) => ({ ...p, [k]: v ?? "" }));

	return (
		<Dialog open={!!staff} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="text-base">{staff?.name}</DialogTitle>
					<p className="text-muted-foreground text-sm">
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
							className="h-8 text-sm"
							placeholder={staff?.role ?? ""}
						/>
					</div>
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Role Tag
						</Label>
						<Select
							value={form.roleTag || "none"}
							onValueChange={(v) => set("roleTag")(v === "none" ? "" : v)}
						>
							<SelectTrigger className="text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								<SelectItem value="doer">Doer</SelectItem>
								<SelectItem value="reviewer">Reviewer</SelectItem>
								<SelectItem value="bd">BD</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Billing Target ($)
						</Label>
						<Input
							type="number"
							value={form.billingTarget}
							onChange={(e) => set("billingTarget")(e.target.value)}
							className="h-8 text-sm"
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
							className="h-8 text-sm"
						/>
					</div>
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Performance Rating
						</Label>
						<Select value={form.perfRating} onValueChange={set("perfRating")}>
							<SelectTrigger className="text-sm">
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
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Promotion Status
						</Label>
						<Select value={form.promoFlag} onValueChange={set("promoFlag")}>
							<SelectTrigger className="text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="no">No</SelectItem>
								<SelectItem value="maybe">Maybe</SelectItem>
								<SelectItem value="yes">Yes</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{form.promoFlag !== "no" && (
						<div>
							<Label className="mb-1 block text-[11px] text-muted-foreground">
								Promo ETA
							</Label>
							<Input
								type="date"
								value={form.promoEta}
								onChange={(e) => set("promoEta")(e.target.value)}
								className="h-8 text-sm"
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

// ══════════════════════════════════════════════════════════════════════════════
// ── Staff Tab ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function StaffTab({ entityId }: { entityId?: string }) {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const qc = useQueryClient();
	const [editStaff, setEditStaff] = useState<StaffWithMeta | null>(null);

	const query = useQuery(
		trpc.wfp.getStaffWithMeta.queryOptions(entityId ? { entityId } : undefined),
	);
	const allStaff = (query.data ?? []) as StaffWithMeta[];

	const upsertMeta = useMutation(
		trpc.wfp.upsertStaffMeta.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfp.getStaffWithMeta.queryKey(
						entityId ? { entityId } : undefined,
					),
				});
				setEditStaff(null);
				toast.success("Saved");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const quickUpsert = useCallback(
		(cbId: string, patch: Record<string, string>) => {
			upsertMeta.mutate({ cbId, ...patch });
		},
		[upsertMeta],
	);

	const onEdit = useCallback((staff: StaffWithMeta) => {
		setEditStaff(staff);
	}, []);

	const { table } = useStaffDataTable({
		data: allStaff,
		onQuickUpsert: quickUpsert,
		onEdit,
		canEdit: hasWriteAccess,
	});

	// Compute summary from filtered rows (what the table shows after filters)
	const filteredRows = table.getFilteredRowModel().rows;
	const totalTarget = useMemo(
		() =>
			filteredRows.reduce(
				(s, r) => s + Number(r.original.meta?.billingTarget ?? 0),
				0,
			),
		[filteredRows],
	);
	const totalActual = useMemo(
		() =>
			filteredRows.reduce(
				(s, r) => s + Number(r.original.meta?.billingActual ?? 0),
				0,
			),
		[filteredRows],
	);
	const promoCount = useMemo(
		() =>
			filteredRows.filter(
				(r) =>
					r.original.meta?.promoFlag === "yes" ||
					r.original.meta?.promoFlag === "maybe",
			).length,
		[filteredRows],
	);

	if (query.isPending) {
		return (
			<div className="flex h-full flex-col">
				<div className="px-6 py-4">
					<DataTableSkeleton
						columnCount={12}
						rowCount={10}
						filterCount={4}
						withPagination
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Summary bar */}
			<div className="flex items-center justify-between border-border border-b px-6 py-3">
				<p className="text-muted-foreground text-sm">
					{filteredRows.length} staff &middot; {fmtDollar(String(totalTarget))}{" "}
					target &middot; {fmtDollar(String(totalActual))} actual
					{promoCount > 0 && (
						<span className="ml-2 text-amber-400">
							{promoCount} promo flagged
						</span>
					)}
				</p>
			</div>

			{/* DataTable with toolbar */}
			<div className="flex-1 overflow-auto px-6 py-4">
				<DataTable table={table}>
					<DataTableToolbar table={table} />
				</DataTable>
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
						promoFlag: form.promoFlag as "yes" | "maybe" | "no",
						promoEta: form.promoEta || undefined,
						staffRole: form.staffRole || undefined,
						roleTag: form.roleTag
							? (form.roleTag as "doer" | "reviewer" | "bd")
							: null,
						billingTarget: form.billingTarget || undefined,
						billingActual: form.billingActual || undefined,
					});
				}}
				saving={upsertMeta.isPending}
			/>
		</div>
	);
}
