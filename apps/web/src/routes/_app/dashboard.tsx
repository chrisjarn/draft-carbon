import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Briefcase, Building2, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/dashboard")({
	component: DashboardPage,
});

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
				<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
					{label}
				</CardTitle>
				<Icon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				{loading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<div className="text-2xl font-extrabold tracking-tight">{value}</div>
				)}
			</CardContent>
		</Card>
	);
}

function DashboardPage() {
	const health = useQuery(trpc.healthCheck.queryOptions());

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Banner */}
			<div className="relative overflow-hidden rounded-sm bg-[#3a3f44] p-5">
				<div
					className="pointer-events-none absolute -right-7 -top-7 size-28 rounded-full border-[18px] border-sidebar-primary/15"
					aria-hidden="true"
				/>
				<div className="relative z-10 flex items-center justify-between">
					<div>
						<div
							className="text-sm font-medium text-sidebar-primary"
							style={{ fontFamily: "cursive" }}
						>
							Empowering the 3 C's
						</div>
						<div className="mt-0.5 text-base font-extrabold tracking-tight text-white">
							Carbonite Workforce Overview
						</div>
						<div className="mt-1 text-xs text-white/40">
							FY 2025–26 · 5 States · 18 offices · 6 service lines
						</div>
					</div>
					<div className="flex items-center gap-5">
						<div className="text-center">
							<div className="text-2xl font-extrabold leading-none tracking-tight text-white">
								—
							</div>
							<div className="mt-1 text-[9.5px] font-bold uppercase tracking-widest text-white/40">
								Carbonites
							</div>
						</div>
						<div className="h-8 w-px bg-white/10" />
						<div className="text-center">
							<div className="text-2xl font-extrabold leading-none tracking-tight text-white">
								—
							</div>
							<div className="mt-1 text-[9.5px] font-bold uppercase tracking-widest text-white/40">
								Offices
							</div>
						</div>
						<div className="h-8 w-px bg-white/10" />
						<div className="text-center">
							<div className="text-2xl font-extrabold leading-none tracking-tight text-white">
								—
							</div>
							<div className="mt-1 text-[9.5px] font-bold uppercase tracking-widest text-white/40">
								Service Lines
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* KPI strip */}
			<div className="grid grid-cols-4 gap-3">
				<StatCard label="Total Carbonites" value="—" icon={Users} />
				<StatCard label="Offices" value="—" icon={Building2} />
				<StatCard label="Open Roles" value="—" icon={Briefcase} />
				<StatCard label="Over Budget Pods" value="—" icon={BarChart3} />
			</div>

			{/* API status */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">API Status</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center gap-2">
					<div
						className={`size-2 rounded-full ${health.data ? "bg-green-500" : "bg-red-500"}`}
					/>
					<span className="text-xs text-muted-foreground">
						{health.isLoading ? "Checking…" : health.data ? "Connected" : "Disconnected"}
					</span>
				</CardContent>
			</Card>
		</div>
	);
}
