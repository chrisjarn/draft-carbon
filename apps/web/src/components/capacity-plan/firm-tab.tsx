import {
	Building03Icon,
	ChartLineData02Icon,
	Dollar01Icon,
	StarIcon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { HeadcountTargetsSection } from "./headcount-targets-section";
import { ScenarioWorkbenchSection } from "./scenario-workbench-section";
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
		<div className="space-y-6 p-6">
			{/* KPI Strip */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
					<div className="flex h-24 items-center justify-center text-muted-foreground text-sm">
						Loading entities...
					</div>
				) : (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{entitiesList.map((ent) => (
							<button
								key={ent.id}
								type="button"
								onClick={() =>
									setSelectedEntity(selectedEntity === ent.id ? null : ent.id)
								}
								className={`flex flex-col gap-2 rounded-md border bg-white p-4 text-left transition-colors hover:bg-muted/50 ${
									selectedEntity === ent.id
										? "border-primary ring-1 ring-primary"
										: "border-border"
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="font-medium text-base">{ent.biz}</span>
									{ent.state && (
										<Badge variant="outline" className="text-[10px]">
											{ent.state.toUpperCase()}
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-4 text-muted-foreground text-sm">
									<span>{ent.staffCount} staff</span>
									<span>${fmtK(ent.totalPayroll)} payroll</span>
									{ent.podCount > 0 && <span>{ent.podCount} pods</span>}
								</div>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Entity Detail Panel */}
			{selectedEntity && (
				<EntityDetailPanel
					entityId={selectedEntity}
					detail={detail ?? null}
					loading={detailQuery.isPending}
					fy={fy}
				/>
			)}
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
	if (loading) {
		return (
			<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
				Loading entity details...
			</div>
		);
	}

	if (!detail) {
		return (
			<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
				Entity not found
			</div>
		);
	}

	const revTarget = Number(detail.revenue?.target ?? 0);
	const revActual = Number(detail.revenue?.actual ?? 0);
	const revPct = revTarget > 0 ? Math.round((revActual / revTarget) * 100) : 0;

	return (
		<div className="space-y-4 rounded-md border border-border bg-white p-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<HugeiconsIcon
						icon={Building03Icon}
						className="size-5 text-muted-foreground"
					/>
					<div>
						<h3 className="font-semibold text-base">{detail.entity.biz}</h3>
						<p className="text-muted-foreground text-sm">
							{detail.entity.state?.toUpperCase()}
							{detail.settings?.fy ? ` \u00B7 ${detail.settings.fy}` : ""}
						</p>
					</div>
				</div>
				{detail.openHiringCount > 0 && (
					<Badge
						variant="outline"
						className="border-amber-500/40 text-amber-400"
					>
						{detail.openHiringCount} open hiring
					</Badge>
				)}
			</div>

			{/* Revenue Strip */}
			{detail.revenue && revTarget > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Revenue</span>
						<span className="tabular-nums">
							{fmtDollar(revActual)} / {fmtDollar(revTarget)} ({revPct}%)
						</span>
					</div>
					<Progress value={Math.min(revPct, 100)} />
				</div>
			)}

			{/* Compensation Budget */}
			<div className="flex items-center justify-between rounded-sm bg-muted/30 px-4 py-3">
				<span className="text-muted-foreground text-sm">
					Compensation Budget
				</span>
				<span className="font-semibold text-base tabular-nums">
					{fmtDollar(detail.totalPayroll)}
				</span>
			</div>

			{/* Pods Table */}
			{detail.pods.length > 0 && (
				<div>
					<h4 className="mb-2 font-medium text-muted-foreground text-sm">
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

			{/* Headcount Targets */}
			<HeadcountTargetsSection
				entityId={entityId}
				staff={detail.staff}
				fy={fy}
			/>

			{/* Attrition Risks */}
			<AttritionRisksSection entityId={entityId} staff={detail.staff} />

			{/* Scenario Workbench */}
			<ScenarioWorkbenchSection entityId={entityId} fy={fy} />
		</div>
	);
}
