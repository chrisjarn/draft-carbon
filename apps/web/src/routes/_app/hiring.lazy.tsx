import { Briefcase01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {} from "@tanstack/react-router";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
import {
	CloseRoleDialog,
	EXPECTED_DAYS,
	emptyForm,
	formToPayload,
	HiringDetailSheet,
	HiringDrawer,
	type HiringNeed,
	roleToForm,
	type TabStatus,
	TthDrawer,
	useHiringColumns,
	useHiringStats,
} from "@/components/features/hiring";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { DataTable } from "@/components/organisms/data-table/data-table";
import { PageHeader } from "@/components/organisms/page-header";
import { PageStatsBar } from "@/components/organisms/page-stats-bar";
import { Page, PageBody, PageToolbar } from "@/components/templates/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/hiring")({
	component: HiringPage,
});

function HiringPage() {
	const { data: session } = authClient.useSession();
	const hasWriteAccess = canWrite(getUserRole(session?.user));

	const qc = useQueryClient();
	const { tab: tabParam } = Route.useSearch();
	const navigate = useNavigate({ from: "/hiring" });
	const tab: TabStatus = tabParam ?? "open";
	const setTab = (v: TabStatus) => {
		void navigate({ search: (prev) => ({ ...prev, tab: v }) });
	};

	const [selected, setSelected] = useState<HiringNeed | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HiringNeed | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<HiringNeed | null>(null);
	const [closeTarget, setCloseTarget] = useState<HiringNeed | null>(null);
	const [tthOpen, setTthOpen] = useState(false);

	const query = useQuery(trpc.hiring.getAll.queryOptions({ status: tab }));
	const allQuery = useQuery(trpc.hiring.getAll.queryOptions({ status: "all" }));
	const rows = query.data ?? [];
	const allRows = allQuery.data ?? [];
	const counts = {
		open: allRows.filter((r) => r.status === "open").length,
		active: allRows.filter((r) => r.status === "active").length,
		offer: allRows.filter((r) => r.status === "offer").length,
		closed: allRows.filter((r) => r.status === "closed").length,
	};

	function invalidate() {
		for (const s of ["open", "active", "offer", "closed", "all"] as const)
			qc.invalidateQueries({
				queryKey: trpc.hiring.getAll.queryKey({ status: s }),
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

	function handleSave(form: Parameters<typeof formToPayload>[0]) {
		const payload = formToPayload(form);
		if (editTarget) updateMut.mutate({ id: editTarget.id, ...payload });
		else createMut.mutate(payload);
	}

	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const hiringStats = useHiringStats(rows, tab);
	const columns = useHiringColumns(tab);
	const table = useReactTable({
		data: rows,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: "includesString",
		state: { sorting, globalFilter },
		initialState: { pagination: { pageSize: 10 } },
	});

	return (
		<Page>
			<PageHeader>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => setTthOpen(true)}>
						Time to Hire
					</Button>
					{hasWriteAccess && (
						<Button
							onClick={() => {
								setEditTarget(null);
								setDialogOpen(true);
							}}
						>
							<HugeiconsIcon
								icon={PlusSignIcon}
								className="mr-1.5 size-3.5"
								aria-hidden="true"
							/>{" "}
							Add Role
						</Button>
					)}
				</div>
			</PageHeader>

			<PageToolbar>
				<Input
					placeholder="Search roles\u2026"
					value={globalFilter}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="w-48 lg:w-64"
				/>
				<Tabs
					className="ml-auto"
					value={tab}
					onValueChange={(v) => {
						setTab(v as TabStatus);
						setSelected(null);
					}}
				>
					<TabsList variant="pill">
						<TabsTrigger value="open" className="gap-1.5">
							Open
							{counts.open > 0 && (
								<Badge variant="secondary" size="sm" className="tabular-nums">
									{counts.open}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="active" className="gap-1.5">
							Active
							{counts.active > 0 && (
								<Badge variant="secondary" size="sm" className="tabular-nums">
									{counts.active}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="offer" className="gap-1.5">
							Offer
							{counts.offer > 0 && (
								<Badge variant="secondary" size="sm" className="tabular-nums">
									{counts.offer}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="closed" className="gap-1.5">
							Closed
							{counts.closed > 0 && (
								<Badge variant="secondary" size="sm" className="tabular-nums">
									{counts.closed}
								</Badge>
							)}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</PageToolbar>

			<PageStatsBar
				stats={[
					{
						label: hiringStats.stat1.label,
						value: hiringStats.stat1.value,
						loading: query.isPending,
					},
					{
						label: hiringStats.stat2.label,
						value: hiringStats.stat2.value,
						loading: query.isPending,
					},
					{
						label: hiringStats.stat3.label,
						value: hiringStats.stat3.value,
						loading: query.isPending,
						indicator:
							typeof hiringStats.stat3.raw === "number" &&
							hiringStats.stat3.raw > 0
								? Math.max(0, 1 - hiringStats.stat3.raw / (EXPECTED_DAYS * 2))
								: 1,
						fraction: `${EXPECTED_DAYS}d benchmark`,
					},
				]}
			/>

			<PageBody>
				{query.isPending ? (
					<div className="flex h-40 items-center justify-center text-text-soft-400 text-sm">
						Loading\u2026
					</div>
				) : rows.length === 0 ? (
					<Empty className="min-h-[10rem]">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<HugeiconsIcon icon={Briefcase01Icon} />
							</EmptyMedia>
							<EmptyTitle>No {tab} roles</EmptyTitle>
						</EmptyHeader>
					</Empty>
				) : (
					<DataTable table={table} onRowClick={setSelected} />
				)}
			</PageBody>

			<TthDrawer open={tthOpen} onClose={() => setTthOpen(false)} />
			<HiringDetailSheet
				role={selected}
				onClose={() => setSelected(null)}
				onEdit={(r) => {
					setEditTarget(r);
					setDialogOpen(true);
				}}
				onDelete={setDeleteTarget}
				onCloseRole={setCloseTarget}
				onReopen={(r) => reopenMut.mutate({ id: r.id })}
				canWriteAccess={hasWriteAccess}
			/>
			<HiringDrawer
				key={editTarget?.id ?? "create"}
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				initial={editTarget ? roleToForm(editTarget) : emptyForm()}
				onSave={handleSave}
				saving={createMut.isPending || updateMut.isPending}
			/>
			<CloseRoleDialog
				key={closeTarget?.id ?? "none"}
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
			<ConfirmDialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
				title="Delete Role"
				description={
					<>
						Delete <strong>{deleteTarget?.role}</strong>? This cannot be undone.
					</>
				}
				confirmLabel="Delete"
				pendingLabel="Deleting\u2026"
				loading={deleteMut.isPending}
				onConfirm={() =>
					deleteTarget && deleteMut.mutate({ id: deleteTarget.id })
				}
			/>
		</Page>
	);
}
