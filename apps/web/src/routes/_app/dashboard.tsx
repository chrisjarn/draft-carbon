import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	BarChart3,
	Briefcase,
	Building2,
	RefreshCw,
	Users,
	WifiOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { SERVICE_LINES, SL_COLOR_MAP, STATE_COLOR_MAP } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/dashboard")({
	component: DashboardPage,
});

/* ─── Stat Card (existing) ─────────────────────────────────────────────── */

function StatCard({
	label,
	value,
	icon: Icon,
	loading,
}: {
	label: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	loading?: boolean;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-1">
				<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
					{label}
				</CardTitle>
				<Icon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				{loading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<div className="font-extrabold text-2xl tracking-tight">{value}</div>
				)}
			</CardContent>
		</Card>
	);
}

/* ─── SL color dot helper ──────────────────────────────────────────────── */

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

/* ─── State badge helper ───────────────────────────────────────────────── */

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

function EntityCardsGrid({
	data,
	loading,
}: {
	data:
		| {
				id: string;
				biz: string;
				state: string | null;
				officeId: string | null;
				headcount: number;
				totalSalary: number;
				sls: string[];
		  }[]
		| undefined;
	loading: boolean;
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
					to="/wfp"
					search={{ entity: ent.id }}
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

/* ─── SL Breakdown Table ───────────────────────────────────────────────── */

function SlBreakdownTable({
	data,
	loading,
}: {
	data:
		| {
				sl: string;
				headcount: number;
				totalSalary: number;
				pctOfFirm: number;
		  }[]
		| undefined;
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
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-500" />
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

/* ─── Main Dashboard Page ──────────────────────────────────────────────── */

function DashboardPage() {
	const queryClient = useQueryClient();
	const health = useQuery(trpc.healthCheck.queryOptions());
	const stats = useQuery(trpc.dashboard.stats.queryOptions());
	const entitySummaries = useQuery(
		trpc.dashboard.entitySummaries.queryOptions(),
	);
	const slBreakdown = useQuery(trpc.dashboard.slBreakdown.queryOptions());
	const alerts = useQuery(trpc.dashboard.alerts.queryOptions());

	const carboniteCount = stats.data?.totalCarbonites ?? 0;
	const officeCount = stats.data?.offices ?? 0;
	const openRoles = stats.data?.openRoles ?? 0;
	const entityCount = stats.data?.totalEntities ?? 0;

	const isError = stats.isError || health.isError;
	const isEmpty =
		!stats.isLoading &&
		!stats.isError &&
		carboniteCount === 0 &&
		officeCount === 0 &&
		openRoles === 0 &&
		entityCount === 0;

	const handleRetry = () => {
		queryClient.invalidateQueries();
	};

	if (isError) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-6">
				<Card className="max-w-md text-center">
					<CardContent className="flex flex-col items-center gap-4 pt-8 pb-6">
						<WifiOff className="size-10 text-destructive" />
						<div>
							<h2 className="font-semibold text-lg">Connection Error</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								Could not reach the API server. Make sure the backend is running
								on port 3000.
							</p>
						</div>
						<Button variant="outline" onClick={handleRetry}>
							<RefreshCw className="mr-2 size-4" />
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
						<BarChart3 className="size-10 text-muted-foreground" />
						<div>
							<h2 className="font-semibold text-lg">No Data Available</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								The database is empty. Seed some data or add carbonites and
								entities to get started.
							</p>
						</div>
						<Button variant="outline" onClick={handleRetry}>
							<RefreshCw className="mr-2 size-4" />
							Try Again
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Banner */}
			<div className="relative overflow-hidden rounded-sm bg-[#3a3f44] p-5">
				<div
					className="pointer-events-none absolute -top-7 -right-7 size-28 rounded-full border-[18px] border-sidebar-primary/15"
					aria-hidden="true"
				/>
				<div className="relative z-10 flex items-center justify-between">
					<div>
						<div
							className="font-medium text-sidebar-primary text-sm"
							style={{ fontFamily: "cursive" }}
						>
							Empowering the 3 C's
						</div>
						<div className="mt-0.5 font-extrabold text-base text-white tracking-tight">
							Carbonite Workforce Overview
						</div>
						<div className="mt-1 text-white/40 text-xs">
							FY 2025-26 · 5 States · {officeCount} offices · 6 service lines
						</div>
					</div>
					<div className="flex items-center gap-5">
						<div className="text-center">
							<div className="font-extrabold text-2xl text-white leading-none tracking-tight">
								{stats.isLoading ? "..." : carboniteCount}
							</div>
							<div className="mt-1 font-bold text-[9.5px] text-white/40 uppercase tracking-widest">
								Carbonites
							</div>
						</div>
						<div className="h-8 w-px bg-white/10" />
						<div className="text-center">
							<div className="font-extrabold text-2xl text-white leading-none tracking-tight">
								{stats.isLoading ? "..." : officeCount}
							</div>
							<div className="mt-1 font-bold text-[9.5px] text-white/40 uppercase tracking-widest">
								Offices
							</div>
						</div>
						<div className="h-8 w-px bg-white/10" />
						<div className="text-center">
							<div className="font-extrabold text-2xl text-white leading-none tracking-tight">
								{stats.isLoading ? "..." : entityCount}
							</div>
							<div className="mt-1 font-bold text-[9.5px] text-white/40 uppercase tracking-widest">
								Entities
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* KPI strip */}
			<div className="grid grid-cols-4 gap-3">
				<StatCard
					label="Total Carbonites"
					value={carboniteCount}
					icon={Users}
					loading={stats.isLoading}
				/>
				<StatCard
					label="Offices"
					value={officeCount}
					icon={Building2}
					loading={stats.isLoading}
				/>
				<StatCard
					label="Open Roles"
					value={openRoles}
					icon={Briefcase}
					loading={stats.isLoading}
				/>
				<StatCard
					label="Entities"
					value={entityCount}
					icon={BarChart3}
					loading={stats.isLoading}
				/>
			</div>

			{/* Alerts */}
			<AlertsPanel data={alerts.data} loading={alerts.isLoading} />

			{/* Entity Cards */}
			<div>
				<h2 className="mb-3 font-semibold text-sm tracking-tight">Entities</h2>
				<EntityCardsGrid
					data={entitySummaries.data}
					loading={entitySummaries.isLoading}
				/>
			</div>

			{/* SL Breakdown */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Service Line Breakdown</CardTitle>
				</CardHeader>
				<CardContent>
					<SlBreakdownTable
						data={slBreakdown.data}
						loading={slBreakdown.isLoading}
					/>
				</CardContent>
			</Card>

			{/* API status */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">API Status</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center gap-2">
					<div
						className={`size-2 rounded-full ${health.data ? "bg-green-500" : "bg-red-500"}`}
					/>
					<span className="text-muted-foreground text-xs">
						{health.isLoading
							? "Checking..."
							: health.data
								? "Connected"
								: "Disconnected"}
					</span>
				</CardContent>
			</Card>
		</div>
	);
}
