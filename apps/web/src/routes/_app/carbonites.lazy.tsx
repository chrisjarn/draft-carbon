import { PlusSignIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Carbonite, Filters, FormState } from "@/components/carbonites";
import {
	CarboniteCard,
	CarboniteDetailSheet,
	CarboniteDialog,
	CarboniteFilters,
	carboniteToForm,
	EMPTY_FILTERS,
	emptyForm,
} from "@/components/carbonites";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { canAdminWrite, canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/carbonites")({
	component: CarbonitesPage,
});

function CarbonitesPage() {
	const { search: searchParam } = Route.useSearch();
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);
	const hasAdminAccess = canAdminWrite(userRole);

	const qc = useQueryClient();
	const [filters, setFilters] = useState<Filters>({
		...EMPTY_FILTERS,
		search: searchParam ?? "",
	});
	const [selected, setSelected] = useState<Carbonite | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<Carbonite | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Carbonite | null>(null);

	// Single unfiltered query — client-side filtering via useMemo
	const query = useQuery(trpc.carbonites.getAll.queryOptions({}));
	const allData = query.data ?? [];

	const filteredRows = useMemo(() => {
		return allData.filter((c) => {
			if (filters.search) {
				const q = filters.search.toLowerCase();
				const match =
					c.name.toLowerCase().includes(q) ||
					c.role?.toLowerCase().includes(q) ||
					c.pod?.toLowerCase().includes(q);
				if (!match) return false;
			}
			if (filters.state && c.state !== filters.state) return false;
			if (filters.sl && c.sl !== filters.sl) return false;
			if (filters.office && c.office !== filters.office) return false;
			if (filters.type && c.type !== filters.type) return false;
			return true;
		});
	}, [allData, filters]);

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
				toast.success("Carbonite deactivated");
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

	return (
		<div className="flex h-full flex-col">
			<PageHeader />



			<div className=" px-6 flex border-b bg-white justify-between py-2">
				<CarboniteFilters
					filters={filters}
					onChange={setFilters}
					allData={allData}
				/>
							{hasWriteAccess && (
					<Button
		
						onClick={() => {
							setEditTarget(null);
							setDialogOpen(true);
						}}
					>
						<HugeiconsIcon icon={PlusSignIcon} className="mr-1.5 size-3.5" />{" "}
						Add Carbonite
					</Button>

			)}
			</div>

			<div className="flex-1 overflow-auto p-6">
				{query.isPending ? (
					<div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
						Loading…
					</div>
				) : filteredRows.length === 0 ? (
					<div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
						<HugeiconsIcon icon={UserGroupIcon} className="size-8 opacity-30" />
						No carbonites found
					</div>
				) : (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{filteredRows.map((c) => (
							<CarboniteCard
								key={c.id}
								carbonite={c}
								onClick={() => setSelected(c)}
							/>
						))}
					</div>
				)}
			</div>

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
			/>

			<CarboniteDialog
				key={editTarget?.id ?? "create"}
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				initial={editTarget ? carboniteToForm(editTarget) : emptyForm()}
				onSave={handleSave}
				saving={saving}
			/>

			<Dialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Deactivate Carbonite</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Are you sure you want to deactivate{" "}
						<strong>{deleteTarget?.name}</strong>? They will be removed from all
						active views.
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
							{deleteMut.isPending ? "Deactivating…" : "Deactivate"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
