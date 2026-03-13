import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";

import {
	AlertsPanel,
	BudgetPayrollChart,
	DashboardEmptyState,
	DashboardErrorState,
	EntityCardGrid,
	HealthBanner,
	KpiSection,
	RevenueChart,
	SlBreakdownBars,
	SlFilterPills,
	useFilteredBudgetBySl,
	useFilteredEntities,
	useFilteredRevenue,
	useFilteredSlBreakdown,
	useFilteredStats,
} from "@/components/features/dashboard";
import { PageHeader } from "@/components/organisms/page-header";
import {
	DashboardChartRow,
	DashboardSection,
} from "@/components/templates/dashboard-template";
import { Page, PageBody, PageToolbar } from "@/components/templates/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import {
	FY_OPTIONS,
	SERVICE_LINES,
	SL_COLOR_MAP,
	STATES,
} from "@/lib/constants";
import { trpc } from "@/utils/trpc";

/* ─── Route definition ─────────────────────────────────────────────────── */

const searchSchema = z.object({
	fy: z.string().optional(),
	state: z.string().optional(),
	sl: z.string().optional(),
});

export const Route = createFileRoute("/_app/dashboard")({
	validateSearch: searchSchema,
	component: DashboardPage,
	loaderDeps: ({ search }) => ({ fy: search.fy }),
	loader: ({ context: { trpc, queryClient }, deps: { fy: fyParam } }) => {
		const fy = fyParam ?? "FY25-26";
		void queryClient.ensureQueryData(trpc.healthCheck.queryOptions());
		void queryClient.ensureQueryData(trpc.dashboard.stats.queryOptions({ fy }));
		void queryClient.ensureQueryData(
			trpc.dashboard.entitySummaries.queryOptions(),
		);
		void queryClient.ensureQueryData(
			trpc.dashboard.revenueByEntity.queryOptions({ fy }),
		);
		void queryClient.ensureQueryData(trpc.dashboard.slBreakdown.queryOptions());
		void queryClient.ensureQueryData(trpc.dashboard.alerts.queryOptions());
	},
});

/* ─── Main Dashboard Page ──────────────────────────────────────────────── */

function DashboardPage() {
	const navigate = useNavigate({ from: "/dashboard" });
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const { fy, state: stateParam, sl: slParam } = Route.useSearch();
	const activeFy = fy ?? "FY25-26";
	const firstName = session?.user?.name?.split(" ")[0];

	const stateFilter = stateParam ?? null;
	const slFilter = slParam ?? null;

	const setStateFilter = (val: string | null) => {
		void navigate({
			search: (prev: Record<string, unknown>) => ({
				...prev,
				state: val ?? undefined,
			}),
		});
	};
	const setSlFilter = (val: string | null) => {
		void navigate({
			search: (prev: Record<string, unknown>) => ({
				...prev,
				sl: val ?? undefined,
			}),
		});
	};
	const setFy = (newFy: string | null) => {
		if (!newFy) return;
		void navigate({
			search: (prev: Record<string, unknown>) => ({
				...prev,
				fy: newFy === "FY25-26" ? undefined : newFy,
			}),
		});
	};

	// ── Queries ─────────────────────────────────────────────────────────
	const health = useQuery(trpc.healthCheck.queryOptions());
	const stats = useQuery(trpc.dashboard.stats.queryOptions({ fy: activeFy }));
	const entitySummaries = useQuery(
		trpc.dashboard.entitySummaries.queryOptions(),
	);
	const revenueByEntity = useQuery(
		trpc.dashboard.revenueByEntity.queryOptions({ fy: activeFy }),
	);
	const slBreakdown = useQuery(trpc.dashboard.slBreakdown.queryOptions());
	const budgetBySl = useQuery(trpc.dashboard.budgetBySl.queryOptions());
	const alerts = useQuery(trpc.dashboard.alerts.queryOptions());

	// ── Client-side filtering ───────────────────────────────────────────
	const filteredStats = useFilteredStats(stats.data, stateFilter, slFilter);
	const filteredEntities = useFilteredEntities(
		entitySummaries.data,
		stateFilter,
		slFilter,
	);
	const filteredRevenue = useFilteredRevenue(
		revenueByEntity.data,
		stateFilter,
		slFilter,
		entitySummaries.data,
	);
	const filteredSl = useFilteredSlBreakdown(
		slBreakdown.data,
		stateFilter,
		slFilter,
	);
	const filteredBudgetMap = useFilteredBudgetBySl(
		budgetBySl.data,
		stateFilter,
		slFilter,
	);

	const budgetPayrollData = useMemo(() => {
		if (!filteredSl) return [];
		return filteredSl.map((row) => {
			const slMeta = SERVICE_LINES.find((s) => s.id === row.sl);
			return {
				sl: row.sl,
				slName: slMeta?.name ?? row.sl,
				budget: filteredBudgetMap.get(row.sl) ?? 0,
				payroll: row.totalSalary,
				color: SL_COLOR_MAP[row.sl] ?? "#888",
			};
		});
	}, [filteredSl, filteredBudgetMap]);

	const revenueMap = useMemo(() => {
		if (!filteredRevenue) return undefined;
		const map = new Map<string, number>();
		for (const r of filteredRevenue) map.set(r.id, r.pct);
		return map;
	}, [filteredRevenue]);

	// ── Banner stats ─────────────────────────────────────────────────
	const bannerStats = useMemo(() => {
		const ents = filteredEntities ?? [];
		const officeSet = new Set<string>();
		const slSet = new Set<string>();
		const stateSet = new Set<string>();
		for (const e of ents) {
			if (e.officeId) officeSet.add(e.officeId);
			if (e.state) stateSet.add(e.state);
			for (const sl of e.sls) slSet.add(sl);
		}
		return {
			carbonites: filteredStats?.totalCarbonites ?? 0,
			offices: officeSet.size,
			serviceLines: slSet.size,
			states: stateSet.size,
		};
	}, [filteredEntities, filteredStats]);

	const isError = stats.isError || health.isError;
	const isEmpty =
		!stats.isLoading &&
		!stats.isError &&
		(filteredStats?.totalCarbonites ?? 0) === 0 &&
		!stateFilter;
	const handleRetry = () => queryClient.invalidateQueries();

	const greetingTitle = firstName ? `Hi, ${firstName}` : "Hi";

	// ── Render ───────────────────────────────────────────────────────────
	return (
		<Page className="h-auto min-h-full">
			<PageHeader titleOverride={greetingTitle} constrain="max-w-[968px]">
				<Select value={activeFy} onValueChange={setFy}>
					<SelectTrigger className="h-8 w-28 text-xs">
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
			</PageHeader>

			<PageToolbar className="bg-bg-weak-50/30" constrain="max-w-[968px]">
				<Tabs
					value={stateFilter ?? "all"}
					onValueChange={(val) => setStateFilter(val === "all" ? null : val)}
				>
					<TabsList variant="pill">
						<TabsTrigger value="all">All States</TabsTrigger>
						{STATES.map((s) => (
							<TabsTrigger key={s.id} value={s.id}>
								{s.abbr}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</PageToolbar>

			<PageBody padded constrain="max-w-[968px]" className="overflow-visible">
				{isError ? (
					<DashboardErrorState onRetry={handleRetry} />
				) : isEmpty ? (
					<DashboardEmptyState onRetry={handleRetry} />
				) : (
					<div className="flex flex-col gap-5">
						<div className="flex items-center justify-between rounded-20 bg-zinc-900 px-8 py-6">
							<div className="flex flex-col gap-1">
								<h2 className="font-semibold text-xl text-white text-balance">
									Carbonite Workforce Overview
								</h2>
								<p className="text-white/50 text-sm text-pretty">
									{activeFy} &middot; {bannerStats.states} States &middot;{" "}
									{bannerStats.offices} Offices &middot;{" "}
									{bannerStats.serviceLines} Service Lines
								</p>
							</div>
							<div className="flex items-center gap-8">
								<div className="flex flex-col items-center gap-1">
									<span className="font-semibold text-2xl text-white tabular-nums">
										{bannerStats.carbonites}
									</span>
									<span className="text-white/50 text-xs">Carbonites</span>
								</div>
								<div className="h-10 w-px bg-white/20" />
								<div className="flex flex-col items-center gap-1">
									<span className="font-semibold text-2xl text-white tabular-nums">
										{bannerStats.offices}
									</span>
									<span className="text-white/50 text-xs">Offices</span>
								</div>
								<div className="h-10 w-px bg-white/20" />
								<div className="flex flex-col items-center gap-1">
									<span className="font-semibold text-2xl text-white tabular-nums">
										{bannerStats.serviceLines}
									</span>
									<span className="text-white/50 text-xs">Service Lines</span>
								</div>
							</div>
						</div>
						<HealthBanner
							data={filteredRevenue}
							loading={revenueByEntity.isLoading}
						/>
						<KpiSection
							stats={filteredStats}
							entities={filteredEntities}
							loading={stats.isLoading || entitySummaries.isLoading}
							revenueActual={filteredStats?.revenueActual ?? 0}
							revenueTarget={filteredStats?.revenueTarget ?? 0}
						/>
						<SlFilterPills activeSlId={slFilter} onToggle={setSlFilter} />
						<DashboardChartRow>
							<RevenueChart
								data={filteredRevenue}
								loading={revenueByEntity.isLoading}
								fy={activeFy}
							/>
							<Card>
								<CardHeader>
									<CardTitle>Service Line Breakdown</CardTitle>
								</CardHeader>
								<CardContent>
									<SlBreakdownBars
										data={filteredSl}
										loading={slBreakdown.isLoading}
										activeSlId={slFilter}
										onSlClick={setSlFilter}
									/>
								</CardContent>
							</Card>
						</DashboardChartRow>
						<BudgetPayrollChart
							data={budgetPayrollData}
							loading={slBreakdown.isLoading}
						/>
						<AlertsPanel data={alerts.data} loading={alerts.isLoading} />
						<DashboardSection title="Entities">
							<EntityCardGrid
								data={filteredEntities}
								loading={entitySummaries.isLoading}
								fy={activeFy}
								columns={2}
								revenueMap={revenueMap}
							/>
						</DashboardSection>
					</div>
				)}
			</PageBody>
		</Page>
	);
}
