import { FlowSquareIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { NewScenarioWizard } from "@/components/features/scenarios/new-scenario-wizard";
import { ScenarioCard } from "@/components/features/scenarios/scenario-card";
import { ScenarioFilters } from "@/components/features/scenarios/scenario-filters";
import { ScenarioKpiSection } from "@/components/features/scenarios/scenario-kpi-section";
import { PageHeader } from "@/components/organisms/page-header";
import { Page, PageBody } from "@/components/templates/page";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { authClient } from "@/lib/auth-client";
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

			<PageBody padded>
				<ScenarioFilters
					entity={entity}
					fy={fy}
					entities={entitiesList}
					onEntityChange={setEntity}
					onFyChange={setFy}
				/>

				{!entity ? (
					<>
						<Divider />
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
					</>
				) : (
					<>
						<Divider />

						<ScenarioKpiSection
							baseBillingCapacity={baseBillingCapacity}
							basePayroll={basePayroll}
							baseMultiple={baseMultiple}
							baseRevGap={baseRevGap}
							revenueTarget={revenueTarget}
							revenueActual={revenueActual}
							scenarioCount={scenarios.length}
							loading={detailLoading}
						/>

						<Divider />

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
