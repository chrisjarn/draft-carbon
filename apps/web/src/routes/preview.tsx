import { createFileRoute } from "@tanstack/react-router";
import {
	MetricCard,
	EntityCard,
	PersonCard,
	StatRow,
	ScenarioCardCompact,
	SectionHeader,
} from "@/components/molecules/linear-cards";
import { StatCard } from "@/components/molecules/stat-card";
import { KpiCard } from "@/components/molecules/kpi-card";
import {
	DollarCircleIcon,
	UserMultiple02Icon,
	ChartLineData01Icon,
	Building06Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const Route = createFileRoute("/preview")({
	component: PreviewPage,
});

function PreviewPage() {
	return (
		<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
			{/* Header */}
			<div className="border-b border-stroke-soft-200/60 bg-bg-white-0 px-8 py-6 dark:border-neutral-800 dark:bg-neutral-900/50">
				<h1 className="font-semibold text-2xl tracking-tight text-text-strong-950">
					Linear-Style Components Preview
				</h1>
				<p className="mt-1 text-text-soft-400">
					Polished, professional card components for the Carbon WFP dashboard
				</p>
			</div>

			<div className="mx-auto max-w-6xl space-y-12 p-8">
				{/* Metric Cards */}
				<section>
					<SectionHeader
						title="Metric Cards"
						description="Single KPI displays with optional trends and icons"
						className="mb-4"
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<MetricCard
							label="Total Payroll"
							value="$2.4M"
							trend={{ value: "+12%", direction: "up" }}
							subtitle="Across all entities"
							icon={(props) => <HugeiconsIcon icon={DollarCircleIcon} {...props} />}
						/>
						<MetricCard
							label="Headcount"
							value="156"
							trend={{ value: "+8", direction: "up" }}
							subtitle="Active staff"
							icon={(props) => <HugeiconsIcon icon={UserMultiple02Icon} {...props} />}
						/>
						<MetricCard
							label="Budget Used"
							value="87%"
							variant="warning"
							subtitle="$340k remaining"
						/>
						<MetricCard
							label="Revenue Gap"
							value="-$180k"
							variant="error"
							trend={{ value: "-5%", direction: "down", positive: true }}
						/>
					</div>
				</section>

				{/* Stat Cards */}
				<section>
					<SectionHeader
						title="Stat Cards"
						description="Updated stat cards with improved styling"
						className="mb-4"
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<StatCard
							label="Total Revenue"
							value="$4.2M"
							trend={{ value: "+18%", positive: true }}
							subtitle="YTD actual"
						/>
						<StatCard
							label="Capacity"
							value="92%"
							variant="success"
							subtitle="Billing capacity utilized"
						/>
						<StatCard
							label="Attrition"
							value="4.2%"
							variant="warning"
							subtitle="Rolling 12 months"
						/>
						<StatCard
							label="Over Budget"
							value="$45k"
							variant="error"
							subtitle="3 entities affected"
						/>
					</div>
				</section>

				{/* KPI Cards */}
				<section>
					<SectionHeader
						title="KPI Cards"
						description="Flexible KPI displays with optional children"
						className="mb-4"
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<KpiCard title="Revenue Target" value="$5.2M">
							<div className="flex items-center gap-2">
								<div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
									<div className="h-full w-[78%] rounded-full bg-emerald-500" />
								</div>
								<span className="text-xs tabular-nums text-text-soft-400">78%</span>
							</div>
						</KpiCard>
						<KpiCard
							title="Billing Multiple"
							value="3.2x"
							valueClass="text-emerald-600 dark:text-emerald-500"
						>
							<div className="text-text-soft-400 text-xs">
								Target: 3.0x min
							</div>
						</KpiCard>
						<KpiCard title="Open Positions" value="12">
							<div className="flex gap-2 text-xs">
								<span className="text-emerald-600">8 approved</span>
								<span className="text-amber-600">4 pending</span>
							</div>
						</KpiCard>
					</div>
				</section>

				{/* Stat Row */}
				<section>
					<SectionHeader
						title="Stat Row"
						description="Compact horizontal stat display"
						className="mb-4"
					/>
					<StatRow
						stats={[
							{
								label: "Billing Capacity",
								value: "$3.8M",
								indicator: 0.85,
							},
							{
								label: "Payroll",
								value: "$2.4M",
							},
							{
								label: "Headcount",
								value: "156",
							},
							{
								label: "Utilization",
								value: "78%",
								indicator: 0.78,
							},
						]}
					/>
				</section>

				{/* Entity Cards */}
				<section>
					<SectionHeader
						title="Entity Cards"
						description="Business unit cards with staff, tags, and budget progress"
						className="mb-4"
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<EntityCard
							title="Carbon Sydney"
							subtitle="Carbon Group Pty Ltd"
							state="NSW"
							attainment={{ percent: 94, status: "success" }}
							staff={{
								initials: ["JD", "AK", "MP", "SR", "TW"],
								count: 24,
							}}
							tags={[
								{ id: "tax", label: "Tax", color: "#2563eb" },
								{ id: "audit", label: "Audit", color: "#7c3aed" },
								{ id: "advisory", label: "Advisory", color: "#16a34a" },
							]}
							budgetProgress={{
								percent: 72,
								status: "healthy",
								label: "$280k remaining",
							}}
							stats={[
								{ label: "Payroll/yr", value: "$1.2M" },
								{ label: "Staff", value: 24 },
								{ label: "Pods", value: 4 },
							]}
						/>
						<EntityCard
							title="Carbon Melbourne"
							subtitle="Carbon Victoria Pty Ltd"
							state="VIC"
							attainment={{ percent: 82, status: "warning" }}
							staff={{
								initials: ["LM", "KC", "RB"],
								count: 18,
							}}
							tags={[
								{ id: "tax", label: "Tax", color: "#2563eb" },
								{ id: "wealth", label: "Wealth", color: "#ca8a04" },
							]}
							budgetProgress={{
								percent: 91,
								status: "warning",
								label: "$45k remaining",
							}}
							stats={[
								{ label: "Payroll/yr", value: "$890k" },
								{ label: "Staff", value: 18 },
								{ label: "Pods", value: 3 },
							]}
						/>
						<EntityCard
							title="Carbon Brisbane"
							subtitle="Carbon QLD Pty Ltd"
							state="QLD"
							attainment={{ percent: 68, status: "error" }}
							staff={{
								initials: ["PH", "NW"],
								count: 12,
							}}
							tags={[{ id: "advisory", label: "Advisory", color: "#16a34a" }]}
							budgetProgress={{
								percent: 108,
								status: "over",
								label: "$32k over",
							}}
							stats={[
								{ label: "Payroll/yr", value: "$540k" },
								{ label: "Staff", value: 12 },
								{ label: "Pods", value: 2 },
							]}
						/>
					</div>
				</section>

				{/* Person Cards */}
				<section>
					<SectionHeader
						title="Person Cards"
						description="Staff member cards with roles and metadata"
						className="mb-4"
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<PersonCard
							name="James Davidson"
							initials="JD"
							role="Senior Tax Accountant"
							department={{ label: "Tax", color: "#2563eb" }}
							badges={[
								{ label: "NSW", variant: "outline" },
								{ label: "FT" },
							]}
							salary="$145,000"
						/>
						<PersonCard
							name="Sarah Mitchell"
							initials="SM"
							role="Audit Manager"
							department={{ label: "Audit", color: "#7c3aed" }}
							badges={[
								{ label: "VIC", variant: "outline" },
								{ label: "FT" },
							]}
							salary="$165,000"
							avatarColor="#7c3aed"
						/>
						<PersonCard
							name="Michael Chen"
							initials="MC"
							role="Financial Advisor"
							department={{ label: "Advisory", color: "#16a34a" }}
							badges={[
								{ label: "QLD", variant: "outline" },
								{ label: "PT", variant: "outline" },
							]}
							salary="$95,000"
							avatarColor="#0891b2"
						/>
					</div>
				</section>

				{/* Scenario Cards */}
				<section>
					<SectionHeader
						title="Scenario Cards"
						description="What-if scenario displays with impact metrics"
						className="mb-4"
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<ScenarioCardCompact
							name="Hire 2 Senior Accountants"
							description="Add capacity for Q3 workload increase"
							color="#16a34a"
							metrics={[
								{
									label: "Billing Capacity",
									base: "$3.8M",
									revised: "$4.2M",
									delta: "+$400k",
									isPositive: true,
								},
								{
									label: "Revenue Gap",
									base: "-$180k",
									revised: "+$220k",
									delta: "+$400k",
									isPositive: true,
								},
							]}
							summary={{ payroll: "+$290k", headcount: 2 }}
						/>
						<ScenarioCardCompact
							name="Contract Team Extension"
							description="Extend contractor engagement through EOFY"
							color="#2563eb"
							metrics={[
								{
									label: "Payroll",
									base: "$2.4M",
									revised: "$2.6M",
									delta: "+$200k",
									isPositive: false,
									invertColor: true,
								},
								{
									label: "Utilization",
									base: "78%",
									revised: "85%",
									delta: "+7%",
									isPositive: true,
								},
							]}
							summary={{ payroll: "+$200k", headcount: 4 }}
						/>
					</div>
				</section>

				{/* Loading States */}
				<section>
					<SectionHeader
						title="Loading States"
						description="Skeleton loading indicators"
						className="mb-4"
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<MetricCard label="Loading..." value="" loading />
						<StatCard label="Loading..." value="" loading />
						<KpiCard title="Loading..." value="" loading />
						<StatRow
							stats={[
								{ label: "Loading", value: "", loading: true },
								{ label: "Loading", value: "", loading: true },
							]}
						/>
					</div>
				</section>
			</div>
		</div>
	);
}
