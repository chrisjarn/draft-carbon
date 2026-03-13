import {
	Building03Icon,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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

	const entityQuery = useQuery(trpc.wfp.entityOverview.queryOptions());
	const revByEntityQuery = useQuery(
		trpc.dashboard.revenueByEntity.queryOptions(fy ? { fy } : undefined),
	);

	const detailOpts = trpc.wfp.entityDetail.queryOptions({
		entityId: selectedEntity ?? "",
	});
	const detailQuery = useQuery({
		...detailOpts,
		enabled: !!selectedEntity,
	});

	const entitiesList = entityQuery.data ?? [];
	const detail = detailQuery.data;

	const revMap = useMemo(() => {
		const m = new Map<
			string,
			{ revPct: number; gap: number; target: number; actual: number }
		>();
		for (const r of revByEntityQuery.data ?? []) {
			m.set(r.id, {
				revPct: r.pct,
				gap: r.target - r.actual,
				target: r.target,
				actual: r.actual,
			});
		}
		return m;
	}, [revByEntityQuery.data]);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
			{/* Left: entity list */}
			<div className="border-r border-stroke-soft-200">
				<div className="border-b border-stroke-soft-200 px-4 py-3">
					<h2 className="text-xs font-medium text-text-soft-400 text-balance">
						Entities
					</h2>
				</div>
				{entityQuery.isPending ? (
					<div className="flex h-24 items-center justify-center text-sm text-text-soft-400">
						Loading...
					</div>
				) : (
					<div className="divide-y divide-stroke-soft-200">
						{entitiesList.map((ent) => {
							const rev = revMap.get(ent.id);
							const dotColor = rev
								? rev.revPct > 90
									? "bg-emerald-500"
									: rev.revPct >= 75
										? "bg-amber-500"
										: "bg-red-500"
								: null;
							const isSelected = selectedEntity === ent.id;
							return (
								<button
									key={ent.id}
									type="button"
									onClick={() =>
										setSelectedEntity(isSelected ? null : ent.id)
									}
									className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-bg-weak-50 ${
										isSelected ? "bg-bg-weak-50" : ""
									}`}
								>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="truncate font-medium text-sm">
												{ent.biz}
											</span>
											{dotColor && (
												<span
													className={`size-1.5 shrink-0 rounded-full ${dotColor}`}
												/>
											)}
										</div>
										<div className="mt-0.5 flex items-center gap-3 text-xs text-text-soft-400">
											<span className="tabular-nums">{ent.staffCount} staff</span>
											<span className="tabular-nums">
												${fmtK(ent.totalPayroll)}
											</span>
											{ent.podCount > 0 && (
												<span className="tabular-nums">{ent.podCount} pods</span>
											)}
											{rev && rev.gap > 0 && (
												<span className="tabular-nums text-red-400">
													{fmtDollar(rev.gap)} short
												</span>
											)}
										</div>
									</div>
									{ent.state && (
										<Badge variant="outline" size="sm" className="ml-2 shrink-0">
											{ent.state.toUpperCase()}
										</Badge>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* Right: detail panel */}
			<div>
				{selectedEntity ? (
					<EntityDetailPanel
						entityId={selectedEntity}
						detail={detail ?? null}
						loading={detailQuery.isPending}
						fy={fy}
						revOverride={revMap.get(selectedEntity)}
					/>
				) : (
					<div className="flex h-full items-center justify-center py-24">
						<Empty>
							<EmptyHeader>
								<HugeiconsIcon
									icon={Building03Icon}
									className="mb-3 size-8 text-text-soft-400/40"
								/>
								<EmptyTitle>No entity selected</EmptyTitle>
								<EmptyDescription>
									Select an entity to view its plan, revenue, staff, and
									headcount targets.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</div>
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
	revOverride,
}: {
	entityId: string;
	detail: EntityDetailData | null;
	loading: boolean;
	fy?: string;
	revOverride?: { target: number; actual: number; revPct: number; gap: number };
}) {
	const [settingsOpen, setSettingsOpen] = useState(false);

	if (loading) {
		return (
			<div className="flex h-32 items-center justify-center text-sm text-text-soft-400">
				Loading entity details...
			</div>
		);
	}

	if (!detail) {
		return (
			<div className="flex h-32 items-center justify-center text-sm text-text-soft-400">
				Entity not found
			</div>
		);
	}

	const revTarget = revOverride?.target ?? Number(detail.revenue?.target ?? 0);
	const revActual = revOverride?.actual ?? Number(detail.revenue?.actual ?? 0);
	const revPct = revOverride?.revPct ?? (revTarget > 0 ? Math.round((revActual / revTarget) * 100) : 0);
	const billingCap = detail.billingCapacity;
	const revGap = revOverride?.gap ?? detail.revenueGap;

	return (
		<div className="space-y-5 p-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h3 className="font-semibold text-base text-balance">
						{detail.entity.biz}
					</h3>
					<p className="text-sm text-text-soft-400">
						{detail.entity.state?.toUpperCase()}
						{detail.settings?.fy ? ` \u00B7 ${detail.settings.fy}` : ""}
					</p>
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

			{/* Revenue strip */}
			{(revOverride || detail.revenue) && revTarget > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-text-soft-400">Revenue</span>
						<span className="tabular-nums">
							{fmtDollar(revActual)} / {fmtDollar(revTarget)} ({revPct}%)
						</span>
					</div>
					<Progress value={Math.min(revPct, 100)} />
					<div className="flex items-center gap-6 pt-1 text-sm">
						<div>
							<span className="text-xs text-text-soft-400">Billing capacity</span>
							<span className="block font-medium tabular-nums">
								{fmtDollar(billingCap)}
							</span>
						</div>
						<div>
							<span className="text-xs text-text-soft-400">Revenue gap</span>
							<span
								className={`block font-medium tabular-nums ${
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
					<h4 className="mb-2 font-medium text-balance text-sm text-text-soft-400">Pods</h4>
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
