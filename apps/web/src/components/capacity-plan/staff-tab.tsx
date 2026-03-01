import { PencilEdit01Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { fmtDollar } from "@/lib/format";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

import { EditableCell, PerfBadge, pct, unique } from "./shared";
import type { MetaForm, StaffWithMeta } from "./types";

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
					<div>
						<Label className="mb-1 block text-[11px] text-muted-foreground">
							Promotion Status
						</Label>
						<Select value={form.promoFlag} onValueChange={set("promoFlag")}>
							<SelectTrigger className="h-8 text-xs">
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

// ══════════════════════════════════════════════════════════════════════════════
// ── Staff Tab ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function StaffTab() {
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
		if (
			filterPromo &&
			s.meta?.promoFlag !== "yes" &&
			s.meta?.promoFlag !== "maybe"
		)
			return false;
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
	const promoCount = filtered.filter(
		(r) => r.meta?.promoFlag === "yes" || r.meta?.promoFlag === "maybe",
	).length;

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
										{s.meta?.promoFlag === "yes" ||
										s.meta?.promoFlag === "maybe" ? (
											<div className="flex items-center gap-1">
												<HugeiconsIcon
													icon={StarIcon}
													className={`size-3.5 ${s.meta.promoFlag === "yes" ? "fill-amber-400 text-amber-400" : "fill-amber-400/50 text-amber-400/50"}`}
												/>
												<span className="text-[10px] text-amber-400">
													{s.meta.promoFlag === "maybe" ? "Maybe" : ""}
													{s.meta.promoEta
														? s.meta.promoFlag === "maybe"
															? ` \u00B7 ${s.meta.promoEta}`
															: s.meta.promoEta
														: ""}
												</span>
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
						promoFlag: form.promoFlag as "yes" | "maybe" | "no",
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
