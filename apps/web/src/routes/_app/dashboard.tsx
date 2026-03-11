import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";

import {
	AlertsPanel,
	BudgetPayrollChart,
	DashboardEmptyState,
	DashboardErrorState,
	DashboardGreeting,
	EntityCardGrid,
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
import {
	DashboardChartRow,
	DashboardSection,
	DashboardTemplate,
} from "@/components/templates/dashboard-template";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { SERVICE_LINES, SL_COLOR_MAP, STATES } from "@/lib/constants";
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

	const isError = stats.isError || health.isError;
	const isEmpty =
		!stats.isLoading &&
		!stats.isError &&
		(filteredStats?.totalCarbonites ?? 0) === 0 &&
		!stateFilter;
	const handleRetry = () => queryClient.invalidateQueries();

	// ── Render ───────────────────────────────────────────────────────────
	return (
		<DashboardTemplate
			greeting={
				<DashboardGreeting
					firstName={firstName}
					activeFy={activeFy}
					onFyChange={setFy}
				/>
			}
			filters={
				<>
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
					<SlFilterPills activeSlId={slFilter} onToggle={setSlFilter} />
				</>
			}
		>
			{isError ? (
				<DashboardErrorState onRetry={handleRetry} />
			) : isEmpty ? (
				<DashboardEmptyState onRetry={handleRetry} />
			) : (
				<>
					<KpiSection
						stats={filteredStats}
						loading={stats.isLoading}
						activeFy={activeFy}
					/>
					<Divider />
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
				</>
			)}
		</DashboardTemplate>
	);
}
