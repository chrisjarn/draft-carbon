import { Download01Icon, Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import type { ExpandedState, Row } from "@tanstack/react-table";
import {
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getGroupedRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	attainmentPct,
	buildGroupCells,
	CsvImportDialog,
	derivePriorFy,
	type EntityWithRevenue,
	exportRevenueCsv,
	fmt,
	makeRevenueColumns,
	PodComparisonTable,
	type RevenueRow,
	TotalsFooter,
} from "@/components/features/fy-planning";
import { SearchInput } from "@/components/molecules/search-input";
import { DataTable } from "@/components/organisms/data-table/data-table";
import { PageHeader } from "@/components/organisms/page-header";
import { PageStatsBar } from "@/components/organisms/page-stats-bar";
import {
	Page,
	PageBody,
	PageSection,
	PageToolbar,
} from "@/components/templates/page";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { FY_OPTIONS } from "@/lib/constants";
import { canAdminWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/fy-planning")({
	component: FyPlanningPage,
});

// Stable reference — must not be defined inline in useReactTable({ state })
// because TanStack Table's internal memo uses === comparison on grouping deps.
// A new array every render causes getGroupedRowModel to recompute, which fires
// _autoResetExpanded, which calls setExpanded, which triggers another render → loop.
const GROUPING: string[] = ["stateGroup"];

// -- Page ---------------------------------------------------------------------

function FyPlanningPage() {
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canAdminWrite(userRole);

	const qc = useQueryClient();
	const { fy: fyParam } = Route.useSearch();
	const navigate = useNavigate({ from: "/fy-planning" });
	const fy = fyParam ?? "FY25-26";
	const setFy = (value: string) => {
		void navigate({ search: (prev) => ({ ...prev, fy: value }) });
	};
	const [importOpen, setImportOpen] = useState(false);
	const [globalFilter, setGlobalFilter] = useState("");
	const [expanded, setExpanded] = useState<ExpandedState>(true);

	const priorFy = derivePriorFy(fy);

	// -- Data -----------------------------------------------------------------

	const query = useQuery(trpc.wfp.getRevenue.queryOptions({ fy }));
	const rawRows = (query.data ?? []) as EntityWithRevenue[];

	const tableData: RevenueRow[] = useMemo(
		() =>
			rawRows.map((r) => ({
				...r,
				stateGroup: r.state ?? "Unknown",
			})),
		[rawRows],
	);

	const { mutate: upsertRevenue } = useMutation(
		trpc.wfp.upsertRevenue.mutationOptions({
			onSuccess: () =>
				qc.invalidateQueries({
					queryKey: trpc.wfp.getRevenue.queryKey({ fy }),
				}),
			onError: (e) => toast.error(e.message),
		}),
	);

	const handleSave = useCallback(
		(entId: string, field: "target" | "actual", value: string) => {
			upsertRevenue({ entId, fy, [field]: value });
		},
		[upsertRevenue, fy],
	);

	// -- Table ----------------------------------------------------------------

	const columns = useMemo(
		() => makeRevenueColumns(hasWriteAccess, handleSave),
		[hasWriteAccess, handleSave],
	);

	const table = useReactTable({
		data: tableData,
		columns,
		state: {
			grouping: GROUPING,
			expanded,
			globalFilter,
		},
		onExpandedChange: setExpanded,
		onGlobalFilterChange: setGlobalFilter,
		// Prevent _autoResetExpanded from firing when grouping recomputes,
		// which would call setExpanded → re-render → recompute → infinite loop.
		autoResetExpanded: false,
		getExpandedRowModel: getExpandedRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		initialState: {
			columnVisibility: { stateGroup: false },
		},
	});

	// -- Stats ----------------------------------------------------------------

	const { totalTarget, totalActual, overallPct } = useMemo(() => {
		let target = 0;
		let actual = 0;
		for (const r of rawRows) {
			target += Number(r.revenue?.target ?? 0);
			actual += Number(r.revenue?.actual ?? 0);
		}
		return {
			totalTarget: target,
			totalActual: actual,
			overallPct: attainmentPct(String(target), String(actual)),
		};
	}, [rawRows]);

	const renderGroupCells = useCallback(
		(row: Row<RevenueRow>) => buildGroupCells(row),
		[],
	);

	const attainmentClass =
		overallPct === null
			? undefined
			: overallPct >= 95
				? "text-emerald-500"
				: overallPct >= 80
					? "text-amber-500"
					: "text-red-500";

	// -- Render ---------------------------------------------------------------

	return (
		<Page>
			<PageHeader />

			<PageToolbar>
				<div className="flex items-center gap-3">
					<Select value={fy} onValueChange={(v) => v && setFy(v)}>
						<SelectTrigger className="w-32 text-sm">
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
					<SearchInput
						placeholder="Search entities…"
						value={globalFilter}
						onChange={setGlobalFilter}
					/>
				</div>
				<div className="ml-auto flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => exportRevenueCsv(rawRows, fy)}
					>
						<HugeiconsIcon
							icon={Download01Icon}
							className="size-3.5"
							aria-hidden="true"
						/>
						Export CSV
					</Button>
					{hasWriteAccess && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setImportOpen(true)}
						>
							<HugeiconsIcon
								icon={Upload01Icon}
								className="size-3.5"
								aria-hidden="true"
							/>
							Import CSV
						</Button>
					)}
				</div>
			</PageToolbar>

			<PageStatsBar
				stats={[
					{
						label: "Total Target",
						value: fmt(String(totalTarget)),
						loading: query.isPending,
					},
					{
						label: "Total Actual",
						value: fmt(String(totalActual)),
						loading: query.isPending,
					},
					{
						label: "Attainment",
						value: overallPct !== null ? `${overallPct}%` : "\u2014",
						valueClass: attainmentClass,
						loading: query.isPending,
					},
				]}
			/>

			<PageBody>
				{query.isPending ? (
					<div className="flex h-40 items-center justify-center text-text-soft-400 text-sm">
						Loading...
					</div>
				) : rawRows.length === 0 ? (
					<Empty className="min-h-[10rem]">
						<EmptyHeader>
							<EmptyTitle className="text-base">No entities found</EmptyTitle>
							<EmptyDescription>
								Seed entities data to see FY revenue planning.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<DataTable
						table={table}
						fixedLayout
						renderGroupCells={renderGroupCells}
						footer={
							<TotalsFooter
								totalTarget={totalTarget}
								totalActual={totalActual}
								fy={fy}
							/>
						}
					/>
				)}
			</PageBody>

			<PageSection className="border-t">
				<h2 className="mb-4 font-bold text-base tracking-tight">
					Pod Budget Comparison
				</h2>
				<PodComparisonTable priorFy={priorFy} />
			</PageSection>

			<CsvImportDialog
				key={String(importOpen)}
				open={importOpen}
				onClose={() => setImportOpen(false)}
				fy={priorFy}
			/>
		</Page>
	);
}
