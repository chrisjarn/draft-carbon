import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import { toast } from "sonner";
import {
	AppDialog,
	AppDialogContent,
	AppDialogFooter,
	AppDialogHeader,
	AppDialogTitle,
} from "@/components/molecules/app-dialog";
import { DatePicker } from "@/components/molecules/date-picker";
import { FormField } from "@/components/molecules/form-field";
import { FormGrid } from "@/components/molecules/form-grid";
import { DataTable } from "@/components/organisms/data-table/data-table";
import { DataTableSkeleton } from "@/components/organisms/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

import type { MetaForm, StaffWithMeta } from "./types";

// ── Staff meta edit dialog ────────────────────────────────────────────────────

function MetaDialog({
	staff,
	onClose,
	onSave,
	saving,
}: {
	staff: StaffWithMeta;
	onClose: () => void;
	onSave: (f: MetaForm) => void;
	saving: boolean;
}) {
	const m = staff.meta;

	const form = useForm({
		defaultValues: {
			perfRating: m?.perfRating ?? "N/A",
			promoFlag: m?.promoFlag ?? "no",
			promoEta: m?.promoEta ?? "",
			staffRole: m?.staffRole ?? "",
			roleTag: m?.roleTag ?? "",
			billingTarget: m?.billingTarget ?? "",
			billingActual: m?.billingActual ?? "",
		} satisfies MetaForm,
		onSubmit: ({ value }) => onSave(value),
	});

	return (
		<AppDialog open onOpenChange={(o) => !o && onClose()}>
			<AppDialogContent size="sm">
				<AppDialogHeader>
					<AppDialogTitle className="text-base">{staff.name}</AppDialogTitle>
					<p className="text-text-soft-400 text-sm">
						{staff.role} &middot; {staff.office}
					</p>
				</AppDialogHeader>

				<FormGrid>
					<form.Field name="staffRole">
						{(field) => (
							<FormField field={field} label="Role Override">
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={staff.role ?? ""}
								/>
							</FormField>
						)}
					</form.Field>

					<form.Field name="roleTag">
						{(field) => (
							<FormField field={field} label="Role Tag">
								<Select
									value={field.state.value || "none"}
									onValueChange={(v) =>
										field.handleChange(
											v === "none" ? "" : (v ?? field.state.value),
										)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">None</SelectItem>
										<SelectItem value="doer">Doer</SelectItem>
										<SelectItem value="reviewer">Reviewer</SelectItem>
										<SelectItem value="bd">BD</SelectItem>
									</SelectContent>
								</Select>
							</FormField>
						)}
					</form.Field>

					<form.Field name="billingTarget">
						{(field) => (
							<FormField field={field} label="Billing Target ($)">
								<Input
									id={field.name}
									type="number"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormField>
						)}
					</form.Field>

					<form.Field name="billingActual">
						{(field) => (
							<FormField field={field} label="Billing Actual ($)">
								<Input
									id={field.name}
									type="number"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormField>
						)}
					</form.Field>

					<form.Field name="perfRating">
						{(field) => (
							<FormField field={field} label="Performance Rating">
								<Select
									value={field.state.value}
									onValueChange={(v) =>
										field.handleChange(v ?? field.state.value)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Exceeds">Exceeds</SelectItem>
										<SelectItem value="Meets">Meets</SelectItem>
										<SelectItem value="Below">Below</SelectItem>
										<SelectItem value="N/A">N/A</SelectItem>
									</SelectContent>
								</Select>
							</FormField>
						)}
					</form.Field>

					<form.Field name="promoFlag">
						{(field) => (
							<FormField field={field} label="Promotion Status">
								<Select
									value={field.state.value}
									onValueChange={(v) =>
										field.handleChange(v ?? field.state.value)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="no">No</SelectItem>
										<SelectItem value="maybe">Maybe</SelectItem>
										<SelectItem value="yes">Yes</SelectItem>
									</SelectContent>
								</Select>
							</FormField>
						)}
					</form.Field>

					<form.Subscribe selector={(s) => s.values.promoFlag}>
						{(promoFlag) =>
							promoFlag !== "no" ? (
								<form.Field name="promoEta">
									{(field) => (
										<FormField field={field} label="Promo ETA">
											<DatePicker
												value={field.state.value}
												onChange={(v) => field.handleChange(v)}
											/>
										</FormField>
									)}
								</form.Field>
							) : null
						}
					</form.Subscribe>
				</FormGrid>

				<AppDialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button
						size="sm"
						disabled={saving}
						onClick={() => form.handleSubmit()}
					>
						{saving ? "Saving\u2026" : "Save"}
					</Button>
				</AppDialogFooter>
			</AppDialogContent>
		</AppDialog>
	);
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Staff Tab ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function StaffTab({
	entityId,
	table,
	editStaff,
	onCloseEdit,
}: {
	entityId?: string;
	table: Table<StaffWithMeta>;
	editStaff: StaffWithMeta | null;
	onCloseEdit: () => void;
}) {
	const qc = useQueryClient();

	const query = useQuery(
		trpc.wfp.getStaffWithMeta.queryOptions(entityId ? { entityId } : undefined),
	);

	const upsertMeta = useMutation(
		trpc.wfp.upsertStaffMeta.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfp.getStaffWithMeta.queryKey(
						entityId ? { entityId } : undefined,
					),
				});
				onCloseEdit();
				toast.success("Saved");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	if (query.isPending) {
		return (
			<div className="flex h-full flex-col">
				<div className="bg-bg-white-0 px-6 py-4">
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
			{/* DataTable — filters are rendered in PageToolbar above */}
			<div className="flex-1 overflow-auto bg-bg-weak-50">
				<DataTable table={table} />
			</div>

			{/* Edit dialog */}
			{editStaff && (
				<MetaDialog
					key={editStaff.id}
					staff={editStaff}
					onClose={onCloseEdit}
					onSave={(f) => {
						upsertMeta.mutate({
							cbId: editStaff.id,
							perfRating: f.perfRating,
							promoFlag: f.promoFlag as "yes" | "maybe" | "no",
							promoEta: f.promoEta || undefined,
							staffRole: f.staffRole || undefined,
							roleTag: f.roleTag
								? (f.roleTag as "doer" | "reviewer" | "bd")
								: null,
							billingTarget: f.billingTarget || undefined,
							billingActual: f.billingActual || undefined,
						});
					}}
					saving={upsertMeta.isPending}
				/>
			)}
		</div>
	);
}

// Export setEditStaff type for page-level use
export type { StaffWithMeta };
