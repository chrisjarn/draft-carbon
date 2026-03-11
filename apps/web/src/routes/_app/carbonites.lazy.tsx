import {
	Delete01Icon,
	Download01Icon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { Carbonite, FormState } from "@/components/features/carbonites";
import {
	CarboniteCreateDialog,
	CarboniteDetailSheet,
	CarboniteDialog,
	carboniteToForm,
} from "@/components/features/carbonites";
import { seniorityLabel } from "@/components/features/carbonites/types";
import { useCarboniteDataTable } from "@/components/features/carbonites/use-carbonite-data-table";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import {
	KpiCard,
	KpiLegend,
	KpiLegendItem,
} from "@/components/molecules/kpi-card";
import { SearchInput } from "@/components/molecules/search-input";
import { DataTable } from "@/components/organisms/data-table/data-table";
import {
	DataTableActionBar,
	DataTableActionBarAction,
	DataTableActionBarSelection,
} from "@/components/organisms/data-table/data-table-action-bar";
import { PageHeader } from "@/components/organisms/page-header";
import { Page, PageBody, PageSection, PageToolbar } from "@/components/templates/page";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { canAdminWrite, canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/carbonites")({
	component: CarbonitesPage,
});

// ── CSV export helper ─────────────────────────────────────────────────────────

function exportCsv(rows: Carbonite[]) {
	const headers = [
		"Name",
		"Role",
		"Service Line",
		"State",
		"Office",
		"Pod",
		"Type",
		"Salary",
	];
	const csvRows = [
		headers.join(","),
		...rows.map((c) =>
			[
				`"${c.name}"`,
				`"${c.role ?? ""}"`,
				`"${c.sl ?? ""}"`,
				`"${c.state ?? ""}"`,
				`"${c.office ?? ""}"`,
				`"${c.pod ?? ""}"`,
				`"${c.type ?? "FT"}"`,
				c.salary ?? 0,
			].join(","),
		),
	];
	const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `carbonites-${new Date().toISOString().slice(0, 10)}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

// ── Page component ────────────────────────────────────────────────────────────

function CarbonitesPage() {
	const { search: searchParam } = Route.useSearch();
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);
	const hasAdminAccess = canAdminWrite(userRole);

	const qc = useQueryClient();

	// Detail sheet
	const [selected, setSelected] = useState<Carbonite | null>(null);

	// Edit / Create dialogs
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<Carbonite | null>(null);

	// Bulk deactivation
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

	// Single deactivation (from detail sheet)
	const [deleteTarget, setDeleteTarget] = useState<Carbonite | null>(null);

	// ── Data fetching ─────────────────────────────────────────────────────────

	const query = useQuery(trpc.carbonites.getAll.queryOptions({}));
	const allData = query.data ?? [];

	// Entities (for resolving entity names in detail sheet)
	const entitiesQuery = useQuery(trpc.entities.getAll.queryOptions());

	// Staff meta (perf ratings) + attrition risks
	const staffMetaQuery = useQuery(trpc.wfp.getStaffWithMeta.queryOptions({}));
	const riskQuery = useQuery(
		trpc.wfpExtended.getAllAttritionRisks.queryOptions(),
	);

	const perfMap = useMemo(() => {
		const map = new Map<string, string | null>();
		for (const s of staffMetaQuery.data ?? []) {
			map.set(s.id, s.meta?.perfRating ?? null);
		}
		return map;
	}, [staffMetaQuery.data]);

	const riskMap = useMemo(() => {
		const map = new Map<string, string | null>();
		for (const r of riskQuery.data ?? []) {
			map.set(r.carboniteId, r.riskLevel);
		}
		return map;
	}, [riskQuery.data]);

	const ftCount = useMemo(
		() => allData.filter((c) => !c.type || c.type === "FT").length,
		[allData],
	);

	const ptCount = useMemo(
		() => allData.filter((c) => c.type && c.type !== "FT").length,
		[allData],
	);

	const highRiskCount = useMemo(() => {
		let count = 0;
		for (const level of riskMap.values()) {
			if (level === "high") count++;
		}
		return count;
	}, [riskMap]);

	const avgSeniorityLabel = useMemo(() => {
		const vals = allData
			.map((c) => c.seniority)
			.filter((s): s is number => s != null);
		if (vals.length === 0) return "—";
		const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
		return seniorityLabel(Math.round(avg));
	}, [allData]);

	// entity id → biz name
	const entitiesMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const e of entitiesQuery.data ?? []) {
			map.set(e.id, e.biz);
		}
		return map;
	}, [entitiesQuery.data]);

	// carbonite id → name (for reportsTo resolution)
	const carbonitesMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const c of allData) {
			map.set(c.id, c.name);
		}
		return map;
	}, [allData]);

	// ── Table hook ────────────────────────────────────────────────────────────

	const handleEdit = useCallback((c: Carbonite) => {
		setEditTarget(c);
		setDialogOpen(true);
	}, []);

	const { table, globalFilter, setGlobalFilter } = useCarboniteDataTable({
		data: allData,
		onEdit: handleEdit,
		canEdit: hasWriteAccess,
		initialSearch: searchParam ?? "",
		perfMap,
		riskMap,
	});

	// ── Mutations ─────────────────────────────────────────────────────────────

	function invalidate() {
		qc.invalidateQueries({ queryKey: trpc.carbonites.getAll.queryKey() });
	}

	const createMut = useMutation(
		trpc.carbonites.create.mutationOptions({
			onSuccess: () => {
				invalidate();
				setDialogOpen(false);
				toast.success("Carbonite added");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const updateMut = useMutation(
		trpc.carbonites.update.mutationOptions({
			onSuccess: (updated) => {
				invalidate();
				setDialogOpen(false);
				setSelected(updated);
				toast.success("Carbonite updated");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const deleteMut = useMutation(
		trpc.carbonites.delete.mutationOptions({
			onSuccess: () => {
				invalidate();
				setDeleteTarget(null);
				setSelected(null);
				toast.success("Carbonite deleted");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	function handleSave(form: FormState) {
		const payload = {
			name: form.name,
			role: form.role || undefined,
			sl: form.sl || undefined,
			sg: form.sg || undefined,
			state: form.state || undefined,
			office: form.office || undefined,
			pod: form.pod || undefined,
			salary: form.salary ? Number(form.salary) : undefined,
			type: (form.type as "FT" | "PT") || undefined,
			seniority: form.seniority ? Number(form.seniority) : undefined,
			location: form.location || undefined,
			hours: form.hours ? Number(form.hours) : undefined,
			isPartner: form.isPartner || undefined,
			entity: form.entity || undefined,
			reportsTo: form.reportsTo || undefined,
		};
		if (editTarget) {
			updateMut.mutate({ id: editTarget.id, ...payload });
		} else {
			createMut.mutate(payload);
		}
	}

	const saving = createMut.isPending || updateMut.isPending;

	// ── Bulk actions ──────────────────────────────────────────────────────────

	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedCarbonites = selectedRows.map((r) => r.original);

	const [bulkDeleting, setBulkDeleting] = useState(false);

	async function handleBulkDeactivate() {
		setBulkDeleting(true);
		try {
			await Promise.all(
				selectedCarbonites.map((c) => deleteMut.mutateAsync({ id: c.id })),
			);
			table.toggleAllRowsSelected(false);
			setBulkDeleteOpen(false);
			toast.success(`${selectedCarbonites.length} carbonites deactivated`);
		} catch {
			// individual errors handled by deleteMut.onError
		} finally {
			setBulkDeleting(false);
		}
	}

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<Page>
			<PageHeader>
				{hasWriteAccess && (
					<Button
						onClick={() => {
							setEditTarget(null);
							setDialogOpen(true);
						}}
					>
						<HugeiconsIcon
							icon={PlusSignIcon}
							className="mr-1 size-3.5"
							aria-hidden="true"
						/>
						Add
					</Button>
				)}
			</PageHeader>

			<PageToolbar>
				<SearchInput
					placeholder="Search name, role, pod…"
					value={globalFilter}
					onChange={setGlobalFilter}
				/>
			</PageToolbar>

			<PageSection className="border-b">
				<dl className="grid grid-cols-4 gap-4">
					<KpiCard
						title="Total Staff"
						value={allData.length}
						loading={query.isPending}
					>
						<KpiLegend>
							<KpiLegendItem
								color="bg-primary"
								label={`${table.getFilteredRowModel().rows.length} shown`}
							/>
						</KpiLegend>
					</KpiCard>

					<KpiCard
						title="Employment Type"
						value={ftCount}
						loading={query.isPending}
					>
						<KpiLegend>
							<KpiLegendItem
								color="bg-emerald-500"
								label="Full Time"
								value={ftCount}
							/>
							<KpiLegendItem
								color="bg-amber-500"
								label="Part Time / Contract"
								value={ptCount}
							/>
						</KpiLegend>
					</KpiCard>

					<KpiCard
						title="High Attrition Risk"
						value={highRiskCount}
						valueClass={highRiskCount > 0 ? "text-red-500" : undefined}
						loading={riskQuery.isPending}
					>
						<KpiLegend>
							<KpiLegendItem
								color="bg-red-500"
								label={`of ${riskMap.size} assessed`}
							/>
						</KpiLegend>
					</KpiCard>

					<KpiCard
						title="Avg Seniority"
						value={avgSeniorityLabel}
						loading={query.isPending}
					/>
				</dl>
			</PageSection>

			<PageBody>
				<DataTable table={table} onRowClick={setSelected} />
			</PageBody>

			{/* ── Bulk action bar ──────────────────────────────────────────────── */}
			<DataTableActionBar table={table}>
				<DataTableActionBarSelection table={table} />

				<DataTableActionBarAction
					tooltip="Export selected as CSV"
					onClick={() => exportCsv(selectedCarbonites)}
				>
					<HugeiconsIcon
						icon={Download01Icon}
						className="size-3.5"
						aria-hidden="true"
					/>
					Export
				</DataTableActionBarAction>

				{hasAdminAccess && (
					<DataTableActionBarAction
						tooltip="Deactivate selected carbonites"
						variant="destructive"
						onClick={() => setBulkDeleteOpen(true)}
					>
						<HugeiconsIcon
							icon={Delete01Icon}
							className="size-3.5"
							aria-hidden="true"
						/>
						Deactivate
					</DataTableActionBarAction>
				)}
			</DataTableActionBar>

			{/* ── Detail sheet ──────────────────────────────────────────────────── */}
			<CarboniteDetailSheet
				carbonite={selected}
				onClose={() => setSelected(null)}
				onEdit={(c) => {
					setEditTarget(c);
					setDialogOpen(true);
				}}
				onDelete={setDeleteTarget}
				canWriteAccess={hasWriteAccess}
				canAdminAccess={hasAdminAccess}
				staffMeta={
					selected
						? (staffMetaQuery.data?.find((s) => s.id === selected.id)?.meta ??
							null)
						: null
				}
				attritionRisk={
					selected
						? (riskQuery.data?.find((r) => r.carboniteId === selected.id) ??
							null)
						: null
				}
				entitiesMap={entitiesMap}
				carbonitesMap={carbonitesMap}
			/>

			{/* ── Edit / Create dialogs ────────────────────────────────────────── */}
			{editTarget ? (
				<CarboniteDialog
					key={editTarget.id}
					open={dialogOpen}
					onClose={() => setDialogOpen(false)}
					initial={carboniteToForm(editTarget)}
					onSave={handleSave}
					saving={saving}
				/>
			) : (
				<CarboniteCreateDialog
					key={String(dialogOpen)}
					open={dialogOpen}
					onOpenChange={(o) => {
						if (!o) setDialogOpen(false);
					}}
					onSave={(payload) => createMut.mutate(payload)}
					saving={createMut.isPending}
					allData={allData}
				/>
			)}

			{/* ── Single deactivation dialog ───────────────────────────────────── */}
			<ConfirmDialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
				title="Deactivate Carbonite"
				description={
					<>
						Are you sure you want to deactivate{" "}
						<strong>{deleteTarget?.name}</strong>? They will be removed from all
						active views.
					</>
				}
				confirmLabel="Deactivate"
				pendingLabel="Deactivating…"
				loading={deleteMut.isPending}
				onConfirm={() =>
					deleteTarget && deleteMut.mutate({ id: deleteTarget.id })
				}
			/>

			{/* ── Bulk deactivation dialog ──────────────────────────────────────── */}
			<ConfirmDialog
				open={bulkDeleteOpen}
				onOpenChange={(o) => !o && setBulkDeleteOpen(false)}
				title={`Deactivate ${selectedCarbonites.length} carbonites`}
				description={
					<>
						Are you sure you want to deactivate{" "}
						<strong>{selectedCarbonites.length} carbonites</strong>? They will
						be removed from all active views.
					</>
				}
				confirmLabel="Deactivate all"
				pendingLabel="Deactivating…"
				loading={bulkDeleting}
				onConfirm={handleBulkDeactivate}
			/>
		</Page>
	);
}
