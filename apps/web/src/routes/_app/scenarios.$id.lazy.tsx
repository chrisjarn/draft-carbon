import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { calcScenarioImpact } from "@/components/features/scenarios/scenario-card";
import { ScenarioLeversPanel } from "@/components/features/scenarios/scenario-levers-panel";
import { ScenarioOutcomePanel } from "@/components/features/scenarios/scenario-outcome-panel";
import type { ScenarioRoleValues } from "@/components/features/scenarios/wizard-types";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { canWrite, getUserRole } from "@/lib/rbac";
import { trpc } from "@/utils/trpc";

export const Route = createLazyFileRoute("/_app/scenarios/$id")({
	component: ScenarioBuilderPage,
});

function ScenarioBuilderPage() {
	const { id } = Route.useParams();
	const qc = useQueryClient();

	const { data: session } = authClient.useSession();
	const userRole = getUserRole(session?.user);
	const hasWriteAccess = canWrite(userRole);

	// Fetch the scenario
	const { data: scenario, isPending: scenarioPending } = useQuery(
		trpc.wfpExtended.getScenario.queryOptions({ id }),
	);

	// Fetch entity detail once we have the entityId
	const { data: detail, isPending: detailPending } = useQuery({
		...trpc.wfp.entityDetail.queryOptions({
			entityId: scenario?.entityId ?? "",
		}),
		enabled: !!scenario?.entityId,
	});

	// Entities list for name lookup
	const { data: entities } = useQuery(trpc.entities.getAll.queryOptions());
	const entityName = useMemo(() => {
		if (!scenario?.entityId || !entities) return "";
		const ent = entities.find((e) => e.id === scenario.entityId);
		return ent?.biz ?? "";
	}, [scenario?.entityId, entities]);

	// Local hires state initialised from scenario.roles
	const [hires, setHires] = useState<ScenarioRoleValues[]>([]);
	useEffect(() => {
		if (scenario?.roles) {
			setHires(
				scenario.roles.map((r) => ({
					roleTitle: r.roleTitle,
					sl: r.sl ?? "",
					salary: String(r.salary),
					count: String(r.count),
					employmentType: r.employmentType ?? "",
					startMonth: r.startMonth ?? "",
				})),
			);
		}
	}, [scenario?.roles]);

	// Baseline numbers
	const basePayroll = detail?.totalPayroll ?? 0;
	const baseBillingCapacity = detail?.billingCapacity ?? 0;
	const revenueTarget = Number(detail?.revenue?.target ?? 0);
	const revenueActual = Number(detail?.revenue?.actual ?? 0);
	const billingMultiplier = detail?.settings?.billingMultiplier ?? null;
	const baseMultiple = basePayroll > 0 ? baseBillingCapacity / basePayroll : 0;
	const baseRevGap =
		revenueTarget - Math.max(revenueActual, baseBillingCapacity);
	const baseHeadcount = detail?.staff.length ?? 0;

	// Compute impact from current hires state
	const parsedHires = useMemo(
		() =>
			hires
				.filter((r) => r.roleTitle && r.salary)
				.map((r) => ({
					salary: Number(r.salary) || 0,
					count: Number(r.count) || 1,
				})),
		[hires],
	);

	const impact = useMemo(
		() =>
			calcScenarioImpact(
				parsedHires,
				basePayroll,
				baseBillingCapacity,
				revenueTarget,
				revenueActual,
				billingMultiplier,
			),
		[
			parsedHires,
			basePayroll,
			baseBillingCapacity,
			revenueTarget,
			revenueActual,
			billingMultiplier,
		],
	);

	// Update mutation
	const updateScenario = useMutation(
		trpc.wfpExtended.updateScenario.mutationOptions({
			onSuccess: () => {
				void qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getScenarios.queryKey(),
				});
				void qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getScenario.queryKey({ id }),
				});
				toast.success("Scenario saved");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const isLoading = scenarioPending || (!!scenario?.entityId && detailPending);

	if (isLoading) {
		return (
			<div className="grid h-dvh grid-cols-[420px_1fr] overflow-hidden">
				<div className="space-y-4 border-r p-6">
					<Skeleton className="h-14 w-full" />
					<Skeleton className="h-14 w-full" />
					<Skeleton className="h-14 w-full" />
				</div>
				<div className="space-y-4 p-6">
					<Skeleton className="h-14 w-full" />
					<Skeleton className="h-14 w-full" />
					<Skeleton className="h-14 w-full" />
				</div>
			</div>
		);
	}

	if (!scenario) return null;

	return (
		<div className="grid h-dvh grid-cols-[420px_1fr] overflow-hidden">
			<ScenarioLeversPanel
				scenario={scenario}
				entityName={entityName}
				entityDetail={detail ?? null}
				billingMultiplier={billingMultiplier}
				hires={hires}
				onHiresChange={setHires}
				onSave={(data) => updateScenario.mutate({ id, ...data })}
				isSaving={updateScenario.isPending}
				canWrite={hasWriteAccess}
			/>
			<ScenarioOutcomePanel
				impact={impact}
				baseHeadcount={baseHeadcount}
				basePayroll={basePayroll}
				baseBillingCapacity={baseBillingCapacity}
				baseMultiple={baseMultiple}
				baseRevGap={baseRevGap}
				revenueTarget={revenueTarget}
				hires={hires}
				billingMultiplier={billingMultiplier}
			/>
		</div>
	);
}
