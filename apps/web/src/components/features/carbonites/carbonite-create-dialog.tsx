import { useForm } from "@tanstack/react-form";
import { useCallback } from "react";

import {
	StepDialog,
	StepDialogBody,
	StepDialogContent,
	StepDialogFooter,
	StepDialogHeader,
	StepDialogIndicator,
	StepDialogStep,
} from "@/components/ui/step-dialog";
import type { CreatePayload } from "./carbonite-create-types";
import { defaultCreateValues } from "./carbonite-create-types";
import { CreateStepPodPay } from "./create-step-pod-pay";
import { CreateStepWhere } from "./create-step-where";
import { CreateStepWho } from "./create-step-who";
import type { Carbonite } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (payload: CreatePayload) => void;
	saving: boolean;
	allData: Carbonite[];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CarboniteCreateDialog({
	open,
	onOpenChange,
	onSave,
	saving,
	allData,
}: Props) {
	const form = useForm({
		defaultValues: defaultCreateValues,
		onSubmit: async ({ value }) => {
			const name = `${value.firstName.trim()} ${value.lastName.trim()}`.trim();
			onSave({
				name,
				type: value.type,
				startDate: value.startDate || undefined,
				hours:
					value.type === "PT" && value.hours ? Number(value.hours) : undefined,
				location: value.location || undefined,
				state: value.state || undefined,
				office: value.office || undefined,
				sl: value.sl || undefined,
				sg: value.sg || undefined,
				role: value.role || undefined,
				seniority: value.seniority ? Number(value.seniority) : undefined,
				pod: value.pod || undefined,
				reportsTo: value.reportsTo || undefined,
				salary: value.salary ? Number(value.salary) : undefined,
				isPartner: value.isPartner || undefined,
			});
		},
	});

	// ── Step validators ──────────────────────────────────────────────────────

	const validateStep1 = useCallback(async (): Promise<boolean> => {
		await form.validateField("firstName", "submit");
		await form.validateField("lastName", "submit");
		const s = form.state.values;
		return !!(s.firstName.trim() && s.lastName.trim());
	}, [form]);

	const validateStep2 = useCallback(async (): Promise<boolean> => {
		await form.validateField("state", "submit");
		await form.validateField("office", "submit");
		await form.validateField("sl", "submit");
		const s = form.state.values;
		return !!(s.state && s.office && s.sl);
	}, [form]);

	return (
		<StepDialog open={open} onOpenChange={onOpenChange} totalSteps={3}>
			<StepDialogContent>
				<StepDialogHeader
					title="Add Carbonite"
					description="~60 seconds to complete"
				/>
				<StepDialogIndicator labels={["Who", "Where & What", "Pod & Pay"]} />
				<StepDialogBody>
					<StepDialogStep step={1} onBeforeNext={validateStep1}>
						<CreateStepWho form={form} />
					</StepDialogStep>

					<StepDialogStep step={2} onBeforeNext={validateStep2}>
						<CreateStepWhere form={form} />
					</StepDialogStep>

					<StepDialogStep step={3}>
						<CreateStepPodPay form={form} allData={allData} />
					</StepDialogStep>
				</StepDialogBody>
				<StepDialogFooter
					onSubmit={() => form.handleSubmit()}
					submitLabel="Save Carbonite"
					isSubmitting={saving}
				/>
			</StepDialogContent>
		</StepDialog>
	);
}
