import {
	Alert02Icon,
	ArrowReloadHorizontalIcon,
	BarChartIcon,
	Briefcase01Icon,
	ChartLineData03Icon,
	UserGroupIcon,
	WifiOff01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	FY_OPTIONS,
	SERVICE_LINES,
	SL_COLOR_MAP,
	STATE_COLOR_MAP,
	STATES,
} from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/dashboard")({
	component: DashboardPage,
});

/* ─── Revenue color helpers ────────────────────────────────────────────── */

function revColor(pct: number): string {
	if (pct >= 95) return "var(--color-emerald-500, #10b981)";
	if (pct >= 80) return "var(--color-amber-500, #f59e0b)";
	return "var(--color-red-500, #ef4444)";
}

function revTextColor(pct: number): string {
	if (pct >= 95) return "text-emerald-500";
	if (pct >= 80) return "text-amber-500";
	return "text-red-500";
}

/* ─── Stat Card ────────────────────────────────────────────────────────── */

function StatCard({
	label,
	value,
	icon: Icon,
	loading,
	subtitle,
	subtitleClass,
}: {
	label: string;
	value: string | number;
	icon: IconSvgElement;
	loading?: boolean;
	subtitle?: string;
	subtitleClass?: string;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-1">
				<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
					{label}
				</CardTitle>
				<HugeiconsIcon icon={Icon} className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				{loading ? (
					<Skeleton className="h-8 w-24" />
				) : (
					<>
						<div className="font-extrabold text-2xl tracking-tight">
							{value}
						</div>
						{subtitle && (
							<div
								className={`mt-0.5 text-xs ${subtitleClass ?? "text-muted-foreground"}`}
							>
								{subtitle}
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

/* ─── SL dot + State badge ─────────────────────────────────────────────── */

function SlDot({ sl }: { sl: string }) {
	const color = SL_COLOR_MAP[sl] ?? "#888";
	const slMeta = SERVICE_LINES.find((s) => s.id === sl);
	return (
		<span
			title={slMeta?.name ?? sl}
			className="inline-block size-2.5 rounded-full"
			style={{ backgroundColor: color }}
		/>
	);
}

function StateBadge({ stateId }: { stateId: string | null }) {
	if (!stateId) return null;
	const color = STATE_COLOR_MAP[stateId];
	return (
		<Badge
			variant="outline"
			className="text-[10px] uppercase"
			style={color ? { borderColor: color, color } : undefined}
		>
			{stateId}
		</Badge>
	);
}

/* ─── Entity Card Grid ─────────────────────────────────────────────────── */

type EntitySummary = {
	id: string;
	biz: string;
	state: string | null;
	officeId: string | null;
	headcount: number;
	totalSalary: number;
	sls: string[];
};

function EntityCardsGrid({
	data,
	loading,
	fy,
}: {
	data: EntitySummary[] | undefined;
	loading: boolean;
	fy: string;
}) {
	if (loading) {
		return (
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<Card key={`skel-${i.toString()}`}>
						<CardContent className="space-y-2 pt-4">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-3 w-24" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!data || data.length === 0) {
		return <p className="text-muted-foreground text-sm">No entities found.</p>;
	}

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{data.map((ent) => (
				<Link
					key={ent.id}
					to="/capacity-plan"
					search={{ entity: ent.id, fy }}
					className="group"
				>
					<Card className="transition-colors group-hover:border-sidebar-primary/40">
						<CardContent className="space-y-1.5 pt-4">
							<div className="flex items-start justify-between gap-2">
								<span className="font-semibold text-sm leading-tight">
									{ent.biz}
								</span>
								<StateBadge stateId={ent.state} />
							</div>
							<div className="flex items-center gap-3 text-muted-foreground text-xs">
								<span>{ent.headcount} staff</span>
								<span className="text-border">|</span>
								<span>{fmtDollar(ent.totalSalary)} salary</span>
							</div>
							{ent.sls.length > 0 && (
								<div className="flex items-center gap-1 pt-0.5">
									{ent.sls.map((sl) => (
										<SlDot key={sl} sl={sl} />
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}

/* ─── Revenue Bar Chart ────────────────────────────────────────────────── */

type RevenueEntry = {
	id: string;
	biz: string;
	state: string | null;
	target: number;
	actual: number;
	pct: number;
};

function RevenueChart({
	data,
	loading,
	fy,
}: {
	data: RevenueEntry[] | undefined;
	loading: boolean;
	fy: string;
}) {
	const navigate = useNavigate();

	if (loading) {
		return <Skeleton className="h-[350px] w-full" />;
	}

	if (!data || data.length === 0) {
		return (
			<p className="py-8 text-center text-muted-foreground text-sm">
				No revenue data for this FY.
			</p>
		);
	}

	const chartData = data.map((d) => ({
		...d,
		name: d.biz.length > 18 ? `${d.biz.slice(0, 16)}...` : d.biz,
		targetM: d.target / 1_000_000,
		actualM: d.actual / 1_000_000,
	}));

	return (
		<ResponsiveContainer width="100%" height={350}>
			<BarChart
				data={chartData}
				margin={{ top: 8, right: 16, left: 0, bottom: 60 }}
			>
				<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
				<XAxis
					dataKey="name"
					angle={-45}
					textAnchor="end"
					tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
					interval={0}
					height={80}
				/>
				<YAxis
					tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
					tickFormatter={(v: number) => `$${v.toFixed(1)}m`}
				/>
				<Tooltip
					content={({ active, payload }) => {
						if (!active || !payload?.length) return null;
						const item = payload[0]?.payload as (typeof chartData)[0];
						return (
							<div className="rounded-md border bg-popover px-3 py-2 shadow-md">
								<div className="font-semibold text-sm">{item.biz}</div>
								<div className="mt-1 space-y-0.5 text-xs">
									<div>
										Target:{" "}
										<span className="font-medium">
											{fmtDollar(item.target)}
										</span>
									</div>
									<div>
										Actual:{" "}
										<span className="font-medium">
											{fmtDollar(item.actual)}
										</span>
									</div>
									<div className={revTextColor(item.pct)}>
										{item.pct}% to target
									</div>
								</div>
							</div>
						);
					}}
				/>
				<Bar
					dataKey="targetM"
					name="Target"
					fill="hsl(var(--muted-foreground) / 0.3)"
					radius={[2, 2, 0, 0]}
				/>
				<Bar
					dataKey="actualM"
					name="Actual"
					radius={[2, 2, 0, 0]}
					cursor="pointer"
					onClick={(_data: unknown, index: number) => {
						const entry = chartData[index];
						if (entry) {
							navigate({
								to: "/capacity-plan",
								search: { entity: entry.id, fy },
							});
						}
					}}
				>
					{chartData.map((entry) => (
						<Cell key={entry.id} fill={revColor(entry.pct)} />
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

/* ─── SL Breakdown Table ───────────────────────────────────────────────── */

type SlRow = {
	sl: string;
	headcount: number;
	totalSalary: number;
	pctOfFirm: number;
};

function SlBreakdownTable({
	data,
	loading,
}: {
	data: SlRow[] | undefined;
	loading: boolean;
}) {
	if (loading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={`sl-skel-${i.toString()}`} className="h-6 w-full" />
				))}
			</div>
		);
	}

	if (!data || data.length === 0) {
		return <p className="text-muted-foreground text-sm">No data available.</p>;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Service Line</TableHead>
					<TableHead className="text-right">Headcount</TableHead>
					<TableHead className="text-right">Total Salary</TableHead>
					<TableHead className="text-right">% of Firm</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{data.map((row) => {
					const slMeta = SERVICE_LINES.find((s) => s.id === row.sl);
					const color = SL_COLOR_MAP[row.sl] ?? "#888";
					return (
						<TableRow key={row.sl}>
							<TableCell>
								<div className="flex items-center gap-2">
									<span
										className="inline-block size-2.5 rounded-full"
										style={{ backgroundColor: color }}
									/>
									<span>{slMeta?.name ?? row.sl}</span>
								</div>
							</TableCell>
							<TableCell className="text-right font-medium">
								{row.headcount}
							</TableCell>
							<TableCell className="text-right">
								{fmtDollar(row.totalSalary)}
							</TableCell>
							<TableCell className="text-right">{row.pctOfFirm}%</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

/* ─── Alerts Panel ─────────────────────────────────────────────────────── */

function AlertsPanel({
	data,
	loading,
}: {
	data:
		| {
				type: string;
				severity: "warning" | "error" | "info";
				title: string;
				message: string;
				link: string;
		  }[]
		| undefined;
	loading: boolean;
}) {
	if (loading || !data || data.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Alerts</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{data.map((alert) => (
					<Link
						key={`${alert.type}-${alert.title}`}
						to={alert.link}
						className="flex items-start gap-3 rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3 transition-colors hover:border-yellow-500/40"
					>
						<HugeiconsIcon
							icon={Alert02Icon}
							className="mt-0.5 size-4 shrink-0 text-yellow-500"
						/>
						<div className="min-w-0">
							<div className="font-medium text-sm">{alert.title}</div>
							<div className="text-muted-foreground text-xs">
								{alert.message}
							</div>
						</div>
					</Link>
				))}
			</CardContent>
		</Card>
	);
}

/* ─── Client-side filter helpers ───────────────────────────────────────── */

function useFilteredStats(
	raw:
		| {
				staffByState: {
					state: string | null;
					headcount: number;
					fte: number;
				}[];
				revenueByEntity: {
					entId: string;
					target: number;
					actual: number;
					state: string | null;
				}[];
		  }
		| undefined,
	stateFilter: string | null,
) {
	return useMemo(() => {
		if (!raw) return null;

		const staff = stateFilter
			? raw.staffByState.filter((r) => r.state === stateFilter)
			: raw.staffByState;

		const rev = stateFilter
			? raw.revenueByEntity.filter((r) => r.state === stateFilter)
			: raw.revenueByEntity;

		const totalCarbonites = staff.reduce((s, r) => s + r.headcount, 0);
		const totalFte = Number(staff.reduce((s, r) => s + r.fte, 0).toFixed(1));
		const revenueTarget = rev.reduce((s, r) => s + r.target, 0);
		const revenueActual = rev.reduce((s, r) => s + r.actual, 0);
		const revenuePct =
			revenueTarget > 0 ? Math.round((revenueActual / revenueTarget) * 100) : 0;

		return {
			totalCarbonites,
			totalFte,
			revenueTarget,
			revenueActual,
			revenuePct,
		};
	}, [raw, stateFilter]);
}

function useFilteredEntities(
	data: EntitySummary[] | undefined,
	stateFilter: string | null,
) {
	return useMemo(() => {
		if (!data) return undefined;
		if (!stateFilter) return data;
		return data.filter((e) => e.state === stateFilter);
	}, [data, stateFilter]);
}

function useFilteredRevenue(
	data: RevenueEntry[] | undefined,
	stateFilter: string | null,
) {
	return useMemo(() => {
		if (!data) return undefined;
		if (!stateFilter) return data;
		return data.filter((e) => e.state === stateFilter);
	}, [data, stateFilter]);
}

function useFilteredSlBreakdown(
	raw:
		| {
				sl: string;
				state: string | null;
				headcount: number;
				totalSalary: number;
		  }[]
		| undefined,
	stateFilter: string | null,
): SlRow[] | undefined {
	return useMemo(() => {
		if (!raw) return undefined;

		const filtered = stateFilter
			? raw.filter((r) => r.state === stateFilter)
			: raw;

		// Aggregate by SL (server returns per-state rows)
		const map = new Map<string, { headcount: number; totalSalary: number }>();
		for (const row of filtered) {
			const existing = map.get(row.sl) ?? { headcount: 0, totalSalary: 0 };
			existing.headcount += row.headcount;
			existing.totalSalary += row.totalSalary;
			map.set(row.sl, existing);
		}

		const totalHeadcount = [...map.values()].reduce(
			(s, r) => s + r.headcount,
			0,
		);

		return [...map.entries()]
			.map(([sl, agg]) => ({
				sl,
				headcount: agg.headcount,
				totalSalary: agg.totalSalary,
				pctOfFirm:
					totalHeadcount > 0
						? Math.round((agg.headcount / totalHeadcount) * 100)
						: 0,
			}))
			.sort((a, b) => b.headcount - a.headcount);
	}, [raw, stateFilter]);
}

/* ─── Main Dashboard Page ──────────────────────────────────────────────── */

function DashboardPage() {
	const navigate = useNavigate({ from: "/dashboard" });
	const queryClient = useQueryClient();
	const { fy } = Route.useSearch();
	const activeFy = fy ?? "FY25-26";

	// State filter is local — no URL param, no server re-fetch
	const [stateFilter, setStateFilter] = useState<string | null>(null);

	// ── Server queries (no state param — RBAC only) ──────────────────────
	const health = useQuery(trpc.healthCheck.queryOptions());
	const stats = useQuery(trpc.dashboard.stats.queryOptions({ fy: activeFy }));
	const entitySummaries = useQuery(
		trpc.dashboard.entitySummaries.queryOptions(),
	);
	const revenueByEntity = useQuery(
		trpc.dashboard.revenueByEntity.queryOptions({ fy: activeFy }),
	);
	const slBreakdown = useQuery(trpc.dashboard.slBreakdown.queryOptions());
	const alerts = useQuery(trpc.dashboard.alerts.queryOptions());

	// ── Client-side filtering (instant, no network) ──────────────────────
	const filteredStats = useFilteredStats(stats.data, stateFilter);
	const filteredEntities = useFilteredEntities(
		entitySummaries.data,
		stateFilter,
	);
	const filteredRevenue = useFilteredRevenue(revenueByEntity.data, stateFilter);
	const filteredSl = useFilteredSlBreakdown(slBreakdown.data, stateFilter);

	const isError = stats.isError || health.isError;
	const isEmpty =
		!stats.isLoading &&
		!stats.isError &&
		(filteredStats?.totalCarbonites ?? 0) === 0 &&
		!stateFilter;

	const handleRetry = () => {
		queryClient.invalidateQueries();
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

	if (isError) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-6">
				<Card className="max-w-md text-center">
					<CardContent className="flex flex-col items-center gap-4 pt-8 pb-6">
						<HugeiconsIcon
							icon={WifiOff01Icon}
							className="size-10 text-destructive"
						/>
						<div>
							<h2 className="font-semibold text-lg">Connection Error</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								Could not reach the API server. Make sure the backend is running
								on port 3000.
							</p>
						</div>
						<Button variant="outline" onClick={handleRetry}>
							<HugeiconsIcon
								icon={ArrowReloadHorizontalIcon}
								className="mr-2 size-4"
							/>
							Try Again
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isEmpty) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-6">
				<Card className="max-w-md text-center">
					<CardContent className="flex flex-col items-center gap-4 pt-8 pb-6">
						<HugeiconsIcon
							icon={BarChartIcon}
							className="size-10 text-muted-foreground"
						/>
						<div>
							<h2 className="font-semibold text-lg">No Data Available</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								The database is empty. Seed some data or add carbonites and
								entities to get started.
							</p>
						</div>
						<Button variant="outline" onClick={handleRetry}>
							<HugeiconsIcon
								icon={ArrowReloadHorizontalIcon}
								className="mr-2 size-4"
							/>
							Try Again
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<PageHeader>
				<div className="flex items-center gap-3">
					<Select value={activeFy} onValueChange={setFy}>
						<SelectTrigger className="w-[130px]">
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
				</div>
			</PageHeader>

			<div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
				{/* State filter tabs */}
				<Tabs
					value={stateFilter ?? "all"}
					onValueChange={(val) => setStateFilter(val === "all" ? null : val)}
				>
					<TabsList variant="line">
						<TabsTrigger value="all">All States</TabsTrigger>
						{STATES.map((s) => (
							<TabsTrigger key={s.id} value={s.id}>
								{s.abbr}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				{/* KPI strip */}
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					<StatCard
						label="Total Carbonites"
						value={filteredStats?.totalCarbonites ?? 0}
						icon={UserGroupIcon}
						loading={stats.isLoading}
					/>
					<StatCard
						label="Total FTE"
						value={filteredStats?.totalFte ?? 0}
						icon={Briefcase01Icon}
						loading={stats.isLoading}
					/>
					<StatCard
						label="Revenue Target"
						value={fmtDollar(filteredStats?.revenueTarget)}
						icon={ChartLineData03Icon}
						loading={stats.isLoading}
						subtitle={activeFy}
					/>
					<StatCard
						label="Revenue Actual"
						value={fmtDollar(filteredStats?.revenueActual)}
						icon={BarChartIcon}
						loading={stats.isLoading}
						subtitle={
							filteredStats
								? `${filteredStats.revenuePct}% to target`
								: undefined
						}
						subtitleClass={
							filteredStats ? revTextColor(filteredStats.revenuePct) : undefined
						}
					/>
				</div>

				{/* Revenue Chart */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							Revenue by Entity — {activeFy}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<RevenueChart
							data={filteredRevenue}
							loading={revenueByEntity.isLoading}
							fy={activeFy}
						/>
					</CardContent>
				</Card>

				{/* Alerts */}
				<AlertsPanel data={alerts.data} loading={alerts.isLoading} />

				{/* Entity Cards */}
				<div>
					<h2 className="mb-3 font-semibold text-sm tracking-tight">
						Entities
					</h2>
					<EntityCardsGrid
						data={filteredEntities}
						loading={entitySummaries.isLoading}
						fy={activeFy}
					/>
				</div>

				{/* SL Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Service Line Breakdown</CardTitle>
					</CardHeader>
					<CardContent>
						<SlBreakdownTable
							data={filteredSl}
							loading={slBreakdown.isLoading}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
