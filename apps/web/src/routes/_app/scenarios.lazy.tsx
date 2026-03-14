import {
	ArrowDataTransferHorizontalIcon,
	Copy02Icon,
	FlowSquareIcon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { NewScenarioWizard } from "@/components/features/scenarios/new-scenario-wizard";
import type {
	ScenarioData,
	ScenarioImpact,
} from "@/components/features/scenarios/scenario-card";
import {
	calcScenarioImpact,
	DeltaBadge,
	ScenarioCard,
} from "@/components/features/scenarios/scenario-card";
import { ScenarioFilters } from "@/components/features/scenarios/scenario-filters";
import { PageHeader } from "@/components/organisms/page-header";
import { PageStatsBar } from "@/components/organisms/page-stats-bar";
import { Page, PageBody, PageToolbar } from "@/components/templates/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { fmtDollar } from "@/lib/format";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/scenarios")({
	component: ScenariosPage,
});

function ScenariosPage() {
	const { entity, fy } = Route.useSearch();
	const navigate = useNavigate({ from: "/scenarios" });

	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	const [wizardOpen, setWizardOpen] = useState(false);
	const [compareOpen, setCompareOpen] = useState(false);

	// Auto-reset compareOpen when entity changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset on entity change only
	useEffect(() => {
		setCompareOpen(false);
	}, [entity]);

	// ── Entities ────────────────────────────────────────────────────────────
	const entitiesQuery = useQuery(trpc.entities.getAll.queryOptions());
	const entitiesList = entitiesQuery.data ?? [];

	// Auto-select first entity when landing without ?entity=
	useEffect(() => {
		if (!entity && entitiesList.length > 0 && entitiesList[0]) {
			void navigate({
				search: (prev) => ({ ...prev, entity: entitiesList[0]?.id }),
				replace: true,
			});
		}
	}, [entity, entitiesList, navigate]);

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

	// ── Entity detail ───────────────────────────────────────────────────────
	const detailOpts = trpc.wfp.entityDetail.queryOptions({
		entityId: entity ?? "",
	});
	const { data: detail, isPending: detailLoading } = useQuery({
		...detailOpts,
		enabled: !!entity,
	});

	const basePayroll = detail?.totalPayroll ?? 0;
	const baseBillingCapacity = detail?.billingCapacity ?? 0;
	const baseMultiple = basePayroll > 0 ? baseBillingCapacity / basePayroll : 0;
	const baseRevGap = detail?.revenueGap ?? 0;
	const revenueTarget = Number(detail?.revenue?.target ?? 0);
	const revenueActual = Number(detail?.revenue?.actual ?? 0);
	const billingMultiplier = detail?.settings?.billingMultiplier ?? null;
	const baseHeadcount = detail?.staff?.length ?? 0;

	// ── Scenarios ───────────────────────────────────────────────────────────
	const { data: scenarioList } = useQuery({
		...trpc.wfpExtended.getScenarios.queryOptions({
			entityId: entity ?? "",
			fy: fy,
		}),
		enabled: !!entity,
	});

	const qc = useQueryClient();
	const deleteScenario = useMutation(
		trpc.wfpExtended.deleteScenario.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getScenarios.queryKey(),
				});
				toast.success("Scenario deleted");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const scenarios = scenarioList ?? [];

	// Auto-reset compareOpen when scenario count drops below 2
	useEffect(() => {
		if (compareOpen && scenarios.length < 2) {
			setCompareOpen(false);
		}
	}, [scenarios.length, compareOpen]);

	// ── Scenario impacts ────────────────────────────────────────────────────
	const scenarioImpacts = useMemo(
		() =>
			scenarios.map((scenario) => ({
				scenario,
				impact: calcScenarioImpact(
					scenario.roles,
					basePayroll,
					baseBillingCapacity,
					revenueTarget,
					revenueActual,
					billingMultiplier,
				),
			})),
		[
			scenarios,
			basePayroll,
			baseBillingCapacity,
			revenueTarget,
			revenueActual,
			billingMultiplier,
		],
	);

	const recommendedId = useMemo(() => {
		if (scenarioImpacts.length === 0) return null;
		const closedGap = scenarioImpacts.filter(
			({ impact }) => impact.revisedRevGap <= 0,
		);
		if (closedGap.length > 0) {
			// Primary: smallest absolute gap (closest to zero), tie-break: highest billing multiple
			return closedGap.reduce((best, curr) => {
				const bestAbs = Math.abs(best.impact.revisedRevGap);
				const currAbs = Math.abs(curr.impact.revisedRevGap);
				if (currAbs !== bestAbs) return currAbs < bestAbs ? curr : best;
				return curr.impact.revisedMultiple > best.impact.revisedMultiple
					? curr
					: best;
			}).scenario.id;
		}
		return scenarioImpacts.reduce((best, curr) =>
			curr.impact.revisedRevGap < best.impact.revisedRevGap ? curr : best,
		).scenario.id;
	}, [scenarioImpacts]);

	return (
		<Page>
			<PageHeader>
				{hasWriteAccess && (
					<Button size="sm" onClick={() => setWizardOpen(true)}>
						<HugeiconsIcon icon={PlusSignIcon} className="mr-1.5 size-3.5" />
						New Scenario
					</Button>
				)}
			</PageHeader>

			<PageToolbar>
				<div>
					<ScenarioFilters
						entity={entity}
						fy={fy}
						entities={entitiesList}
						onEntityChange={setEntity}
						onFyChange={setFy}
					/>
				</div>
				{scenarios.length >= 2 && !!entity && (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCompareOpen((v) => !v)}
						>
							<HugeiconsIcon
								icon={ArrowDataTransferHorizontalIcon}
								className="mr-1.5 size-3.5"
							/>
							{compareOpen ? "Close Comparison" : "Compare"}
						</Button>
					</div>
				)}
			</PageToolbar>

			{!!entity && (
				<PageStatsBar
					stats={[
						{
							label: "Billing Capacity",
							value: fmtDollar(baseBillingCapacity),
							loading: detailLoading,
						},
						{
							label: "Revenue",
							value: fmtDollar(revenueActual),
							fraction: `/ ${fmtDollar(revenueTarget)} target`,
							loading: detailLoading,
						},
						{
							label: "Billing Multiple",
							value: `${baseMultiple.toFixed(2)}\u00D7`,
							loading: detailLoading,
						},
					]}
				/>
			)}

			<PageBody padded>
				{!entity ? (
					<Empty className="py-16 md:py-16">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<HugeiconsIcon icon={FlowSquareIcon} />
							</EmptyMedia>
							<EmptyTitle>Select an entity above</EmptyTitle>
							<EmptyDescription>
								Choose an entity to view and create hiring scenarios.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<>
						{scenarios.length === 0 ? (
							<Empty className="py-12 md:py-12">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<HugeiconsIcon icon={FlowSquareIcon} />
									</EmptyMedia>
									<EmptyTitle className="text-base">
										No scenarios yet
									</EmptyTitle>
									<EmptyDescription>
										Create a hiring scenario to model headcount and payroll
										impact.
									</EmptyDescription>
								</EmptyHeader>
								{hasWriteAccess && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => setWizardOpen(true)}
									>
										<HugeiconsIcon
											icon={PlusSignIcon}
											className="mr-1.5 size-3"
										/>
										Create First Scenario
									</Button>
								)}
							</Empty>
						) : compareOpen && scenarios.length >= 2 ? (
							<ScenarioComparisonTable
								scenarios={scenarios}
								impacts={scenarioImpacts.map(({ impact }) => impact)}
								basePayroll={basePayroll}
								baseBillingCapacity={baseBillingCapacity}
								baseMultiple={baseMultiple}
								baseRevGap={baseRevGap}
								baseHeadcount={baseHeadcount}
								recommendedId={recommendedId}
							/>
						) : (
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								{scenarios.map((sc) => (
									<ScenarioCard
										key={sc.id}
										scenario={sc}
										basePayroll={basePayroll}
										baseBillingCapacity={baseBillingCapacity}
										baseMultiple={baseMultiple}
										baseRevGap={baseRevGap}
										revenueTarget={revenueTarget}
										revenueActual={revenueActual}
										billingMultiplier={billingMultiplier}
										hasWriteAccess={hasWriteAccess}
										onDelete={() => deleteScenario.mutate({ id: sc.id })}
										onEdit={() =>
											void navigate({
												to: "/scenarios/$id",
												params: { id: sc.id },
											})
										}
									/>
								))}
							</div>
						)}
					</>
				)}
			</PageBody>

			<NewScenarioWizard
				key={String(wizardOpen)}
				open={wizardOpen}
				onOpenChange={setWizardOpen}
				initialEntityId={entity}
				initialFy={fy}
				entities={entitiesList.map((e) => ({
					id: e.id,
					biz: e.biz,
					state: e.state,
				}))}
			/>
		</Page>
	);
}

// ── Scenario Comparison Table ────────────────────────────────────────────────

function fmtMultiple(v: number): string {
	return `${v.toFixed(2)}\u00D7`;
}

const PLAN_LABELS = ["Plan A", "Plan B", "Plan C"] as const;

function ScenarioComparisonTable({
	scenarios,
	impacts,
	basePayroll,
	baseBillingCapacity,
	baseMultiple,
	baseRevGap,
	baseHeadcount,
	recommendedId,
}: {
	scenarios: ScenarioData[];
	impacts: ScenarioImpact[];
	basePayroll: number;
	baseBillingCapacity: number;
	baseMultiple: number;
	baseRevGap: number;
	baseHeadcount: number;
	recommendedId: string | null;
}) {
	// Fixed 4-column layout: Current State + Plan A + Plan B + Plan C
	const slots = PLAN_LABELS.map((label, i) => ({
		label,
		scenario: scenarios[i] ?? null,
		impact: impacts[i] ?? null,
	}));

	function handleCopy() {
		const pad = (s: string, n: number) => s.padEnd(n);
		const colW = 20;
		const labelW = 18;

		const header = [
			pad("", labelW),
			pad("Current State", colW),
			...slots.map(({ label }) => pad(label, colW)),
		].join("  ");

		const separator = "-".repeat(labelW + 2 + colW + 2 + 3 * (colW + 2));

		const rows = [
			[
				pad("Headcount", labelW),
				pad(String(baseHeadcount), colW),
				...slots.map(({ impact }) =>
					pad(impact ? String(baseHeadcount + impact.headcount) : "—", colW),
				),
			].join("  "),
			[
				pad("Annual Payroll", labelW),
				pad(fmtDollar(basePayroll), colW),
				...slots.map(({ impact }) =>
					pad(impact ? fmtDollar(impact.revisedPayroll) : "—", colW),
				),
			].join("  "),
			[
				pad("Billing Capacity", labelW),
				pad(fmtDollar(baseBillingCapacity), colW),
				...slots.map(({ impact }) =>
					pad(impact ? fmtDollar(impact.revisedBillingCap) : "—", colW),
				),
			].join("  "),
			[
				pad("Revenue Gap", labelW),
				pad(fmtDollar(baseRevGap), colW),
				...slots.map(({ impact }) =>
					pad(impact ? fmtDollar(impact.revisedRevGap) : "—", colW),
				),
			].join("  "),
			[
				pad("Billing Multiple", labelW),
				pad(fmtMultiple(baseMultiple), colW),
				...slots.map(({ impact }) =>
					pad(impact ? fmtMultiple(impact.revisedMultiple) : "—", colW),
				),
			].join("  "),
		];

		const text = [header, separator, ...rows].join("\n");

		navigator.clipboard.writeText(text).then(
			() => toast.success("Copied to clipboard"),
			() => toast.error("Failed to copy"),
		);
	}

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<span className="font-medium text-sm">Scenario Comparison</span>
				<Button variant="outline" size="sm" onClick={handleCopy}>
					<HugeiconsIcon icon={Copy02Icon} className="mr-1.5 size-3.5" />
					Copy
				</Button>
			</div>

			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-36 min-w-36">Metric</TableHead>
							<TableHead className="text-text-soft-400">
								Current State
							</TableHead>
							{slots.map(({ label, scenario }) => {
								const isRec = !!scenario && scenario.id === recommendedId;
								return (
									<TableHead
										key={label}
										className={
											isRec
												? "rounded-md ring-1 ring-blue-500 ring-inset"
												: undefined
										}
									>
										<div className="flex flex-col gap-1">
											<span className="font-medium">{label}</span>
											{scenario && (
												<span className="max-w-32 truncate font-normal text-text-soft-400 text-xs">
													{scenario.name}
												</span>
											)}
											{isRec && (
												<Badge variant="info" size="sm" className="w-fit">
													Recommended
												</Badge>
											)}
										</div>
									</TableHead>
								);
							})}
						</TableRow>
					</TableHeader>
					<TableBody>
						{/* Headcount */}
						<TableRow>
							<TableCell className="font-medium text-text-soft-400 text-xs">
								Headcount
							</TableCell>
							<TableCell className="text-text-soft-400 tabular-nums">
								{baseHeadcount}
							</TableCell>
							{slots.map(({ label, impact }) => (
								<TableCell key={label} className="tabular-nums">
									{impact ? (
										<div className="flex flex-col gap-1">
											<span>{baseHeadcount + impact.headcount}</span>
											<DeltaBadge
												value={impact.headcount}
												formatter={(v) => `+${v}`}
											/>
										</div>
									) : (
										<span className="text-text-soft-400">—</span>
									)}
								</TableCell>
							))}
						</TableRow>

						{/* Annual Payroll */}
						<TableRow>
							<TableCell className="font-medium text-text-soft-400 text-xs">
								Annual Payroll
							</TableCell>
							<TableCell className="text-text-soft-400 tabular-nums">
								{fmtDollar(basePayroll)}
							</TableCell>
							{slots.map(({ label, impact }) => (
								<TableCell key={label} className="tabular-nums">
									{impact ? (
										<div className="flex flex-col gap-1">
											<span>{fmtDollar(impact.revisedPayroll)}</span>
											<DeltaBadge
												value={impact.deltaPayroll}
												formatter={fmtDollar}
											/>
										</div>
									) : (
										<span className="text-text-soft-400">—</span>
									)}
								</TableCell>
							))}
						</TableRow>

						{/* Billing Capacity */}
						<TableRow>
							<TableCell className="font-medium text-text-soft-400 text-xs">
								Billing Capacity
							</TableCell>
							<TableCell className="text-text-soft-400 tabular-nums">
								{fmtDollar(baseBillingCapacity)}
							</TableCell>
							{slots.map(({ label, impact }) => (
								<TableCell key={label} className="tabular-nums">
									{impact ? (
										<div className="flex flex-col gap-1">
											<span>{fmtDollar(impact.revisedBillingCap)}</span>
											<DeltaBadge
												value={impact.deltaBilling}
												formatter={fmtDollar}
											/>
										</div>
									) : (
										<span className="text-text-soft-400">—</span>
									)}
								</TableCell>
							))}
						</TableRow>

						{/* Revenue Gap */}
						<TableRow>
							<TableCell className="font-medium text-text-soft-400 text-xs">
								Revenue Gap
							</TableCell>
							<TableCell className="text-text-soft-400 tabular-nums">
								{fmtDollar(baseRevGap)}
							</TableCell>
							{slots.map(({ label, impact }) => (
								<TableCell key={label} className="tabular-nums">
									{impact ? (
										<div className="flex flex-col gap-1">
											<span>{fmtDollar(impact.revisedRevGap)}</span>
											<DeltaBadge
												value={impact.deltaRevGap}
												formatter={fmtDollar}
												invertColor
											/>
										</div>
									) : (
										<span className="text-text-soft-400">—</span>
									)}
								</TableCell>
							))}
						</TableRow>

						{/* Billing Multiple */}
						<TableRow>
							<TableCell className="font-medium text-text-soft-400 text-xs">
								Billing Multiple
							</TableCell>
							<TableCell className="text-text-soft-400 tabular-nums">
								{fmtMultiple(baseMultiple)}
							</TableCell>
							{slots.map(({ label, impact }) => (
								<TableCell key={label} className="tabular-nums">
									{impact ? (
										<div className="flex flex-col gap-1">
											<span>{fmtMultiple(impact.revisedMultiple)}</span>
											<DeltaBadge
												value={impact.deltaMultiple}
												formatter={(v) => v.toFixed(2)}
											/>
										</div>
									) : (
										<span className="text-text-soft-400">—</span>
									)}
								</TableCell>
							))}
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
