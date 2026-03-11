import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
	AppDialog,
	AppDialogContent,
	AppDialogFooter,
	AppDialogHeader,
	AppDialogTitle,
} from "@/components/molecules/app-dialog";
import { Button } from "@/components/ui/button";
import { FY_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { calcScenarioImpact, PRESET_COLORS } from "./scenario-card";
import { StepContext } from "./step-context";
import { StepDetails } from "./step-details";
import { StepRoles } from "./step-roles";
import {
	defaultWizardValues,
	type ScenarioRoleValues,
	STEP_LABELS,
	type WizardForm,
	type WizardProps,
	type WizardStep,
} from "./wizard-types";

// ── Step Progress ───────────────────────────────────────────────────────────

function StepProgress({ current }: { current: WizardStep }) {
	return (
		<div className="flex items-center gap-3">
			<ol className="flex gap-1" aria-label="Wizard steps">
				{STEP_LABELS.map((name, index) => (
					<li
						key={name}
						className={cn(
							"h-1 w-12 rounded-full transition-colors",
							index <= current ? "bg-primary" : "bg-muted",
						)}
					>
						<span className="sr-only">
							{name} —{" "}
							{index < current
								? "complete"
								: index === current
									? "current"
									: "upcoming"}
						</span>
					</li>
				))}
			</ol>
			<span className="text-muted-foreground text-xs">
				Step {current + 1} of {STEP_LABELS.length} — {STEP_LABELS[current]}
			</span>
		</div>
	);
}

// ── Main Wizard ─────────────────────────────────────────────────────────────

export function NewScenarioWizard({
	open,
	onOpenChange,
	initialEntityId,
	initialFy,
	entities,
}: WizardProps) {
	const qc = useQueryClient();

	// ── Step state (not part of form — UI-only) ────────────────────────────
	const [step, setStep] = useState<WizardStep>(0);

	// ── Form ───────────────────────────────────────────────────────────────
	const form = useForm({
		defaultValues: defaultWizardValues(
			initialEntityId,
			initialFy,
			FY_OPTIONS[0],
			PRESET_COLORS[0],
		),
		onSubmit: ({ value }) => {
			const validRoles = value.roles
				.filter((r) => r.roleTitle && r.salary)
				.map((r) => ({
					roleTitle: r.roleTitle,
					sl: r.sl || undefined,
					salary: Number(r.salary),
					count: Number(r.count) || 1,
				}));

			createScenario.mutate({
				entityId: value.entityId,
				fy: value.fy,
				name: value.name,
				description: value.description || undefined,
				color: value.color,
				roles: validRoles.length > 0 ? validRoles : undefined,
			});
		},
	});

	// ── Mutation ────────────────────────────────────────────────────────────
	const createScenario = useMutation(
		trpc.wfpExtended.createScenario.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfpExtended.getScenarios.queryKey(),
				});
				toast.success("Scenario created");
				onOpenChange(false);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	return (
		<AppDialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
			<AppDialogContent size="md" className="gap-0">
				<AppDialogHeader className="space-y-3">
					<AppDialogTitle className="text-base">New Scenario</AppDialogTitle>
					<StepProgress current={step} />
				</AppDialogHeader>

				<div className="min-h-[320px] py-4">
					<form.Subscribe
						selector={(s) =>
							[s.values.entityId, s.values.name, s.values.roles] as const
						}
					>
						{([entityId, name, roles]) => {
							const canProceedStep0 = !!entityId;
							const canProceedStep1 = !!name.trim();
							const canCreate = canProceedStep0 && canProceedStep1;

							return (
								<WizardBody
									form={form}
									step={step}
									setStep={setStep}
									entities={entities}
									entityId={entityId}
									roles={roles}
									canProceedStep0={canProceedStep0}
									canProceedStep1={canProceedStep1}
									canCreate={canCreate}
									isPending={createScenario.isPending}
									onClose={() => onOpenChange(false)}
								/>
							);
						}}
					</form.Subscribe>
				</div>
			</AppDialogContent>
		</AppDialog>
	);
}

// ── Inner body (avoids hooks-in-subscribe) ──────────────────────────────────

function WizardBody({
	form,
	step,
	setStep,
	entities,
	entityId,
	roles,
	canProceedStep0,
	canProceedStep1,
	canCreate,
	isPending,
	onClose,
}: {
	form: WizardForm;
	step: WizardStep;
	setStep: (s: WizardStep) => void;
	entities: WizardProps["entities"];
	entityId: string;
	roles: ScenarioRoleValues[];
	canProceedStep0: boolean;
	canProceedStep1: boolean;
	canCreate: boolean;
	isPending: boolean;
	onClose: () => void;
}) {
	// ── Entity detail for baseline ──────────────────────────────────────
	const detailOpts = trpc.wfp.entityDetail.queryOptions({ entityId });
	const { data: detail } = useQuery({
		...detailOpts,
		enabled: !!entityId,
	});

	const basePayroll = detail?.totalPayroll ?? 0;
	const baseBillingCapacity = detail?.billingCapacity ?? 0;
	const revenueTarget = Number(detail?.revenue?.target ?? 0);
	const revenueActual = Number(detail?.revenue?.actual ?? 0);
	const billingMultiplier = detail?.settings?.billingMultiplier ?? null;
	const baseMultiple = basePayroll > 0 ? baseBillingCapacity / basePayroll : 0;
	const baseRevGap =
		revenueTarget - Math.max(revenueActual, baseBillingCapacity);

	// ── Live impact preview ─────────────────────────────────────────────
	const parsedRoles = useMemo(
		() =>
			roles
				.filter((r) => r.roleTitle && r.salary)
				.map((r) => ({
					salary: Number(r.salary) || 0,
					count: Number(r.count) || 1,
				})),
		[roles],
	);

	const impact = useMemo(
		() =>
			calcScenarioImpact(
				parsedRoles,
				basePayroll,
				baseBillingCapacity,
				revenueTarget,
				revenueActual,
				billingMultiplier,
			),
		[
			parsedRoles,
			basePayroll,
			baseBillingCapacity,
			revenueTarget,
			revenueActual,
			billingMultiplier,
		],
	);

	const hasValidRoles = roles.some((r) => r.roleTitle && r.salary);

	return (
		<>
			{step === 0 && (
				<StepContext
					form={form}
					entities={entities}
					basePayroll={basePayroll}
					baseBillingCapacity={baseBillingCapacity}
					baseMultiple={baseMultiple}
					baseRevGap={baseRevGap}
					hasDetail={!!detail}
				/>
			)}
			{step === 1 && <StepDetails form={form} />}
			{step === 2 && (
				<StepRoles form={form} impact={impact} hasValidRoles={hasValidRoles} />
			)}

			<AppDialogFooter className="mt-4 flex items-center justify-between">
				<Button variant="ghost" size="sm" onClick={onClose}>
					Cancel
				</Button>
				<div className="flex items-center gap-2">
					{step > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setStep((step - 1) as WizardStep)}
						>
							Back
						</Button>
					)}
					{step < 2 ? (
						<Button
							size="sm"
							disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
							onClick={() => setStep((step + 1) as WizardStep)}
						>
							Next
						</Button>
					) : (
						<Button
							size="sm"
							disabled={!canCreate || isPending}
							onClick={() => form.handleSubmit()}
						>
							{isPending ? "Creating..." : "Create Scenario"}
						</Button>
					)}
				</div>
			</AppDialogFooter>
		</>
	);
}
