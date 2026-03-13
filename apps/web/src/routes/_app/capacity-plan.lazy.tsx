import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { FirmTab } from "@/components/features/capacity-plan/firm-tab";
import { PodBudgetsTab } from "@/components/features/capacity-plan/pod-budgets-tab";
import { StaffTab } from "@/components/features/capacity-plan/staff-tab";
import {
	buildOfficeOptions,
	buildPromoOptions,
	buildSlOptions,
} from "@/components/features/capacity-plan/staff-table-columns";
import type { StaffWithMeta } from "@/components/features/capacity-plan/types";
import { useStaffDataTable } from "@/components/features/capacity-plan/use-staff-data-table";
import { stateLabel } from "@/components/features/carbonites/types";
import { DataTableFacetedFilter } from "@/components/organisms/data-table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/organisms/data-table/data-table-view-options";
import { PageHeader } from "@/components/organisms/page-header";
import {
	type PageStat,
	PageStatsBar,
} from "@/components/organisms/page-stats-bar";
import { Page, PageBody, PageToolbar } from "@/components/templates/page";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { FY_OPTIONS } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/capacity-plan")({
	component: CapacityPlanPage,
});

type TabValue = "firm" | "staff" | "pod-budgets";

function CapacityPlanPage() {
	const { entity, fy, tab: tabParam } = Route.useSearch();
	const navigate = useNavigate({ from: "/capacity-plan" });
	const tab: TabValue = tabParam ?? "firm";
	const setTab = (value: TabValue) => {
		void navigate({ search: (prev) => ({ ...prev, tab: value }) });
	};

	const entitiesQuery = useQuery(trpc.entities.getAll.queryOptions());
	const entitiesList = entitiesQuery.data ?? [];

	const setEntity = (id: string | undefined) => {
		void navigate({
			search: (prev: Record<string, unknown>) => ({ ...prev, entity: id }),
		});
	};

	const setFy = (value: string | undefined) => {
		void navigate({
			search: (prev: Record<string, unknown>) => ({ ...prev, fy: value }),
		});
	};

	const entityLabel = entity
		? (entitiesList.find((e) => e.id === entity)?.biz ?? entity)
		: "All Entities";

	// ── Data for per-tab stats ─────────────────────────────────────────────────

	// Firm KPIs (headcount, payroll, avg salary, at-risk)
	const firmKpiQuery = useQuery({
		...trpc.wfp.firmKPIs.queryOptions(),
		enabled: tab === "firm",
	});
	const kpi = firmKpiQuery.data;

	// Staff data (for staff tab stats + table)
	const staffQuery = useQuery({
		...trpc.wfp.getStaffWithMeta.queryOptions(
			entity ? { entityId: entity } : undefined,
		),
		enabled: tab === "staff",
	});
	const staffRows = (staffQuery.data ?? []) as StaffWithMeta[];

	// Build filter options from staff data
	const slOptions = useMemo(() => buildSlOptions(staffRows), [staffRows]);
	const officeOptions = useMemo(
		() => buildOfficeOptions(staffRows),
		[staffRows],
	);
	const promoOptions = useMemo(() => buildPromoOptions(staffRows), [staffRows]);

	// Staff edit state — lifted to page so table actions + dialog stay in sync
	const [editStaff, setEditStaff] = useState<StaffWithMeta | null>(null);

	// Auth for canEdit
	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	// Inline-cell upsert mutation (quick edits from table cells)
	const qc = useQueryClient();

	// Lazy prefetch pod data on first pod-budgets tab activation
	const podPrefetched = useRef(false);
	useEffect(() => {
		if (tab === "pod-budgets" && !podPrefetched.current) {
			podPrefetched.current = true;
			void qc.ensureQueryData(trpc.carbonites.getAll.queryOptions({}));
			void qc.ensureQueryData(trpc.podBudgets.getAll.queryOptions());
		}
	}, [tab, qc]);

	const upsertMeta = useMutation(
		trpc.wfp.upsertStaffMeta.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfp.getStaffWithMeta.queryKey(
						entity ? { entityId: entity } : undefined,
					),
				});
				toast.success("Saved");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	// Staff table — lifted to page level so toolbar filters render in PageToolbar
	const onQuickUpsert = useCallback(
		(cbId: string, patch: Record<string, string>) => {
			upsertMeta.mutate({ cbId, ...patch });
		},
		[upsertMeta],
	);
	const onEdit = useCallback((staff: StaffWithMeta) => {
		setEditStaff(staff);
	}, []);

	const { table: staffTable } = useStaffDataTable({
		data: staffRows,
		onQuickUpsert,
		onEdit,
		canEdit: hasWriteAccess,
	});

	// Pod budgets data (for pod-budgets tab stats)
	const carbonitesQuery = useQuery({
		...trpc.carbonites.getAll.queryOptions({}),
		enabled: tab === "pod-budgets",
	});
	const podBudgetsQuery = useQuery({
		...trpc.podBudgets.getAll.queryOptions(),
		enabled: tab === "pod-budgets",
	});

	// ── Per-tab stat computations ──────────────────────────────────────────────

	const staffStats = useMemo((): [PageStat, PageStat, PageStat] => {
		const count = staffRows.length;
		const totalTarget = staffRows.reduce(
			(s, r) =>
				s +
				Number(
					(r as { meta?: { billingTarget?: string } }).meta?.billingTarget ?? 0,
				),
			0,
		);
		const totalActual = staffRows.reduce(
			(s, r) =>
				s +
				Number(
					(r as { meta?: { billingActual?: string } }).meta?.billingActual ?? 0,
				),
			0,
		);
		return [
			{
				label: "Total Staff",
				value: count,
				loading: staffQuery.isPending,
			},
			{
				label: "Billing Target",
				value: fmtDollar(totalTarget),
				loading: staffQuery.isPending,
			},
			{
				label: "Billing Actual",
				value: fmtDollar(totalActual),
				loading: staffQuery.isPending,
			},
		];
	}, [staffRows, staffQuery.isPending]);

	const podStats = useMemo((): [PageStat, PageStat, PageStat, PageStat] => {
		const isLoading = carbonitesQuery.isPending || podBudgetsQuery.isPending;

		const carbonitesList = (carbonitesQuery.data ?? []) as Array<{
			salary?: number | null;
			pod?: string | null;
			state?: string | null;
			office?: string | null;
		}>;
		const budgetsList = (podBudgetsQuery.data ?? []) as Array<{
			state: string;
			office: string;
			podName: string;
			budget: number;
		}>;

		const totalSalary = carbonitesList.reduce((s, c) => s + (c.salary ?? 0), 0);
		const totalBudget = budgetsList.reduce((s, b) => s + b.budget, 0);
		const variance = totalBudget > 0 ? totalBudget - totalSalary : 0;
		const utilisation =
			totalBudget > 0 ? Math.round((totalSalary / totalBudget) * 100) : null;

		const variancePositive = variance >= 0;
		const varianceStr =
			totalBudget > 0
				? `${variancePositive ? "+" : ""}${fmtDollar(Math.abs(variance))}`
				: "—";

		return [
			{
				label: "Total Budget",
				value: fmtDollar(totalBudget),
				loading: isLoading,
			},
			{
				label: "Total Staff Cost",
				value: fmtDollar(totalSalary),
				loading: isLoading,
			},
			{
				label: "Variance",
				value: varianceStr,
				valueClass:
					totalBudget > 0
						? variancePositive
							? "text-emerald-500"
							: "text-red-500"
						: undefined,
				loading: isLoading,
			},
			{
				label: "Utilisation",
				value: utilisation !== null ? `${utilisation}%` : "—",
				valueClass:
					utilisation !== null
						? utilisation >= 90
							? "text-emerald-500"
							: utilisation >= 75
								? "text-amber-500"
								: "text-red-500"
						: undefined,
				loading: isLoading,
			},
		];
	}, [
		carbonitesQuery.data,
		carbonitesQuery.isPending,
		podBudgetsQuery.data,
		podBudgetsQuery.isPending,
	]);

	// ── Resolved stats per active tab ─────────────────────────────────────────

	const stats = useMemo(():
		| [PageStat, PageStat, PageStat]
		| [PageStat, PageStat, PageStat, PageStat] => {
		if (tab === "firm") {
			return [
				{
					label: "Total Headcount",
					value: kpi ? String(kpi.headcount) : "—",
					loading: firmKpiQuery.isPending,
				},
				{
					label: "Total Payroll",
					value: kpi ? fmtDollar(kpi.totalPayroll) : "—",
					loading: firmKpiQuery.isPending,
				},
				{
					label: "Avg Salary",
					value: kpi ? fmtDollar(kpi.avgSalary) : "—",
					loading: firmKpiQuery.isPending,
				},
			];
		}
		if (tab === "staff") {
			return staffStats;
		}
		// pod-budgets
		return podStats;
	}, [tab, kpi, firmKpiQuery.isPending, staffStats, podStats]);

	return (
		<Page>
			<PageHeader />
			<PageToolbar>
				<div className="flex items-center gap-2">
					<Select
						value={entity ?? "__all__"}
						onValueChange={(v) =>
							setEntity(v === "__all__" ? undefined : v || undefined)
						}
					>
						<SelectTrigger className="w-44 text-sm">
							<span className="flex flex-1 truncate text-left">
								{entityLabel}
							</span>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__" label="All Entities">
								All Entities
							</SelectItem>
							{entitiesList.map((e) => {
								const displayLabel = `${e.biz}${e.state ? ` (${stateLabel(e.state)})` : ""}`;
								return (
									<SelectItem key={e.id} value={e.id} label={displayLabel}>
										{displayLabel}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>

					<Select
						value={fy ?? "__default__"}
						onValueChange={(v) =>
							setFy(v === "__default__" ? undefined : v || undefined)
						}
					>
						<SelectTrigger className="w-28 text-sm">
							<span className="flex flex-1 truncate text-left">
								{fy ?? "All FYs"}
							</span>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__default__" label="All FYs">
								All FYs
							</SelectItem>
							{FY_OPTIONS.map((f) => (
								<SelectItem key={f} value={f}>
									{f}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Staff-tab-specific filters — only visible on the staff tab */}
					{tab === "staff" && (
						<>
							<div className="h-4 w-px bg-border" aria-hidden="true" />
							{staffTable.getColumn("sl") && (
								<DataTableFacetedFilter
									column={staffTable.getColumn("sl")}
									title="Service Line"
									options={slOptions}
									multiple
								/>
							)}
							{staffTable.getColumn("office") && (
								<DataTableFacetedFilter
									column={staffTable.getColumn("office")}
									title="Office"
									options={officeOptions}
									multiple
								/>
							)}
							{staffTable.getColumn("promo") && (
								<DataTableFacetedFilter
									column={staffTable.getColumn("promo")}
									title="Promotion"
									options={promoOptions}
									multiple
								/>
							)}
							<DataTableViewOptions table={staffTable} />
						</>
					)}
				</div>

				<Tabs
					className="ml-auto"
					value={tab}
					onValueChange={(v) => setTab(v as TabValue)}
				>
					<TabsList variant="underline">
						<TabsTrigger value="firm">Firm</TabsTrigger>
						<TabsTrigger value="staff">Staff</TabsTrigger>
						<TabsTrigger value="pod-budgets">Pod Budgets</TabsTrigger>
					</TabsList>
				</Tabs>
			</PageToolbar>

			<PageStatsBar stats={stats} />

			{/* Tab content */}
			<PageBody>
				{tab === "firm" && <FirmTab initialEntityId={entity} fy={fy} />}
				{tab === "staff" && (
					<StaffTab
						entityId={entity}
						table={staffTable}
						editStaff={editStaff}
						onCloseEdit={() => setEditStaff(null)}
					/>
				)}
				{tab === "pod-budgets" && <PodBudgetsTab fy={fy} />}
			</PageBody>
		</Page>
	);
}
