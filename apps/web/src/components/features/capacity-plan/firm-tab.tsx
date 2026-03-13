import {
	Building03Icon,
	ChartLineData02Icon,
	Dollar01Icon,
	Settings01Icon,
	StarIcon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { fmtDollar, fmtK } from "@/lib/format";
import { trpc } from "@/utils/trpc";

import { AttritionRisksSection } from "./attrition-risks-section";
import { CompBudgetSection } from "./comp-budget-section";
import { EntityPlanningSettingsDialog } from "./entity-settings-dialog";
import { EntityStaffSection } from "./entity-staff-section";
import { HeadcountTargetsSection } from "./headcount-targets-section";
import { SalaryBenchmarksSection } from "./salary-benchmarks-section";

import { KpiCard } from "./shared";
import type { EntityDetailData } from "./types";

// ══════════════════════════════════════════════════════════════════════════════
// ── Firm Tab ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function FirmTab({
	initialEntityId,
	fy,
}: {
	initialEntityId?: string | null;
	fy?: string;
}) {
	const [selectedEntity, setSelectedEntity] = useState<string | null>(
		initialEntityId ?? null,
	);

	const kpiQuery = useQuery(trpc.wfp.firmKPIs.queryOptions());
	const entityQuery = useQuery(trpc.wfp.entityOverview.queryOptions());

	const detailOpts = trpc.wfp.entityDetail.queryOptions({
		entityId: selectedEntity ?? "",
	});
	const detailQuery = useQuery({
		...detailOpts,
		enabled: !!selectedEntity,
	});

	const kpi = kpiQuery.data;
	const entitiesList = entityQuery.data ?? [];
	const detail = detailQuery.data;

	return (
		<div className="grid grid-cols-1 gap-6 bg-zinc-50 p-6 lg:grid-cols-2">
			{/* Left column: KPIs + entity list */}
			<div className="space-y-6">
				{/* KPI Strip */}
				<div className="grid grid-cols-2 gap-4">
					<KpiCard
						label="Total Headcount"
						value={kpi ? String(kpi.headcount) : "\u2014"}
						icon={
							<HugeiconsIcon
								icon={UserGroupIcon}
								className="size-4 text-blue-400"
							/>
						}
						loading={kpiQuery.isPending}
					/>
					<KpiCard
						label="Total Payroll"
						value={kpi ? fmtDollar(kpi.totalPayroll) : "\u2014"}
						icon={
							<HugeiconsIcon
								icon={Dollar01Icon}
								className="size-4 text-green-400"
							/>
						}
						loading={kpiQuery.isPending}
					/>
					<KpiCard
						label="Avg Salary"
						value={kpi ? fmtDollar(kpi.avgSalary) : "\u2014"}
						icon={
							<HugeiconsIcon
								icon={ChartLineData02Icon}
								className="size-4 text-amber-400"
							/>
						}
						loading={kpiQuery.isPending}
					/>
					<KpiCard
						label="At-Risk"
						value={kpi ? String(kpi.atRiskCount) : "\u2014"}
						icon={
							<HugeiconsIcon icon={StarIcon} className="size-4 text-red-400" />
						}
						loading={kpiQuery.isPending}
						muted
					/>
				</div>

				{/* Entity Selector Grid */}
				<div>
					<h2 className="mb-3 font-semibold text-base">Entities</h2>
					{entityQuery.isPending ? (
						<div className="flex h-24 items-center justify-center text-text-soft-400 text-sm">
							Loading entities...
						</div>
					) : (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{entitiesList.map((ent) => (
								<button
									key={ent.id}
									type="button"
									onClick={() =>
										setSelectedEntity(selectedEntity === ent.id ? null : ent.id)
									}
									className={`flex flex-col gap-2 rounded-md border border-stroke-soft-200 bg-bg-white-0 p-4 text-left transition-colors hover:bg-bg-weak-50/50 ${
										selectedEntity === ent.id
											? "border-stroke-strong-950 ring-1 ring-stroke-strong-950"
											: ""
									}`}
								>
									<div className="flex items-center justify-between">
										<span className="font-medium text-base">{ent.biz}</span>
										{ent.state && (
											<Badge variant="outline" size="sm">
												{ent.state.toUpperCase()}
											</Badge>
										)}
									</div>
									<div className="flex items-center gap-4 text-text-soft-400 text-sm">
										<span>{ent.staffCount} staff</span>
										<span>${fmtK(ent.totalPayroll)} payroll</span>
										{ent.podCount > 0 && <span>{ent.podCount} pods</span>}
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Right column: detail panel or empty state — sticky so it stays in view while left scrolls */}
			<div
				className="sticky top-0 self-start rounded-md border border-dashed border-stroke-soft-200 bg-bg-white-0"
				style={{ minHeight: "calc(100vh - 12rem)" }}
			>
				{selectedEntity ? (
					<EntityDetailPanel
						entityId={selectedEntity}
						detail={detail ?? null}
						loading={detailQuery.isPending}
						fy={fy}
					/>
				) : (
					<Empty>
						<EmptyHeader>
							<HugeiconsIcon
								icon={Building03Icon}
								className="mb-3 size-8 text-text-soft-400/40"
							/>
							<EmptyTitle>No entity selected</EmptyTitle>
							<EmptyDescription>
								Select an entity on the left to view its plan, revenue, staff,
								and headcount targets.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</div>
		</div>
	);
}

// ── Entity Detail Panel ───────────────────────────────────────────────────────

function EntityDetailPanel({
	entityId,
	detail,
	loading,
	fy,
}: {
	entityId: string;
	detail: EntityDetailData | null;
	loading: boolean;
	fy?: string;
}) {
	const [settingsOpen, setSettingsOpen] = useState(false);

	if (loading) {
		return (
			<div className="flex h-32 items-center justify-center text-text-soft-400 text-sm">
				Loading entity details...
			</div>
		);
	}

	if (!detail) {
		return (
			<div className="flex h-32 items-center justify-center text-text-soft-400 text-sm">
				Entity not found
			</div>
		);
	}

	const revTarget = Number(detail.revenue?.target ?? 0);
	const revActual = Number(detail.revenue?.actual ?? 0);
	const revPct = revTarget > 0 ? Math.round((revActual / revTarget) * 100) : 0;
	const billingCap = detail.billingCapacity;
	const revGap = detail.revenueGap;

	return (
		<div className="space-y-4 p-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<HugeiconsIcon
						icon={Building03Icon}
						className="size-5 text-text-soft-400"
					/>
					<div>
						<h3 className="font-semibold text-base">{detail.entity.biz}</h3>
						<p className="text-text-soft-400 text-sm">
							{detail.entity.state?.toUpperCase()}
							{detail.settings?.fy ? ` \u00B7 ${detail.settings.fy}` : ""}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{detail.openHiringCount > 0 && (
						<Badge
							variant="outline"
							className="border-amber-500/40 text-amber-400"
						>
							{detail.openHiringCount} open hiring
						</Badge>
					)}
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => setSettingsOpen(true)}
						aria-label="Entity settings"
					>
						<HugeiconsIcon icon={Settings01Icon} className="size-3.5" />
					</Button>
				</div>
			</div>

			{/* Revenue Strip — expanded with Billing Capacity + Revenue Gap */}
			{detail.revenue && revTarget > 0 && (
				<div className="space-y-3">
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-text-soft-400">Revenue</span>
							<span className="tabular-nums">
								{fmtDollar(revActual)} / {fmtDollar(revTarget)} ({revPct}%)
							</span>
						</div>
						<Progress value={Math.min(revPct, 100)} />
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-sm bg-bg-weak-50/30 px-3 py-2">
							<span className="block text-text-soft-400 text-xs">
								Billing Capacity
							</span>
							<span className="font-semibold text-sm tabular-nums">
								{fmtDollar(billingCap)}
							</span>
						</div>
						<div className="rounded-sm bg-bg-weak-50/30 px-3 py-2">
							<span className="block text-text-soft-400 text-xs">
								Revenue Gap
							</span>
							<span
								className={`font-semibold text-sm tabular-nums ${
									revGap > 0
										? "text-red-400"
										: revGap < 0
											? "text-emerald-400"
											: ""
								}`}
							>
								{revGap > 0
									? `${fmtDollar(revGap)} shortfall`
									: revGap < 0
										? `${fmtDollar(Math.abs(revGap))} surplus`
										: "On target"}
							</span>
						</div>
					</div>
					{/* Revenue gap hire recommendation alert */}
					{revGap > 0 && (
						<div className="rounded-sm border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-amber-400 text-xs">
							Revenue gap of {fmtDollar(revGap)} suggests additional billing
							capacity is needed. Consider hiring or billing rate adjustments.
						</div>
					)}
				</div>
			)}

			{/* Compensation Budget Section */}
			<CompBudgetSection
				totalPayroll={detail.totalPayroll}
				billingCapacity={detail.billingCapacity}
				openHiringCount={detail.openHiringCount}
				entityState={detail.entity.state}
			/>

			{/* Pods Table */}
			{detail.pods.length > 0 && (
				<div>
					<h4 className="mb-2 font-medium text-text-soft-400 text-sm">
						Pods
					</h4>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Pod</TableHead>
								<TableHead className="text-right">Headcount</TableHead>
								<TableHead className="text-right">Salary Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{detail.pods.map((pod) => (
								<TableRow key={pod.name}>
									<TableCell className="text-base">{pod.name}</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{pod.headcount}
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{fmtDollar(pod.totalSalary)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Entity Staff Billing */}
			<EntityStaffSection
				staff={detail.staff}
				billingMultiplier={detail.settings?.billingMultiplier ?? null}
			/>

			{/* Salary Benchmarks */}
			<SalaryBenchmarksSection entityId={entityId} staff={detail.staff} />

			{/* Headcount Targets */}
			<HeadcountTargetsSection
				entityId={entityId}
				staff={detail.staff}
				fy={fy}
			/>

			{/* Attrition Risks */}
			<AttritionRisksSection entityId={entityId} staff={detail.staff} />

			{/* Entity Settings Dialog */}
			<EntityPlanningSettingsDialog
				key={`${entityId}-${detail.settings?.billingMultiplier}-${detail.settings?.fy}`}
				entityId={entityId}
				currentMultiplier={detail.settings?.billingMultiplier ?? null}
				currentFy={detail.settings?.fy ?? null}
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
			/>
		</div>
	);
}
