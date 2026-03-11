import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import {
	AppDialog,
	AppDialogContent,
	AppDialogFooter,
	AppDialogHeader,
	AppDialogTitle,
} from "@/components/molecules/app-dialog";
import { FormField } from "@/components/molecules/form-field";
import { FormGrid } from "@/components/molecules/form-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FY_OPTIONS } from "@/lib/constants";
import { trpc } from "@/utils/trpc";

// ── Schema ────────────────────────────────────────────────────────────────────

const multiplierSchema = z
	.string()
	.min(1, "Required")
	.refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
		message: "Must be a positive number",
	});

// ── EntityPlanningSettingsDialog ───────────────────────────────────────────────

export function EntityPlanningSettingsDialog({
	entityId,
	currentMultiplier,
	currentFy,
	open,
	onOpenChange,
}: {
	entityId: string;
	currentMultiplier: string | null;
	currentFy: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const qc = useQueryClient();

	const upsertSettings = useMutation(
		trpc.wfp.upsertEntitySettings.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({
					queryKey: trpc.wfp.entityDetail.queryKey(),
				});
				qc.invalidateQueries({
					queryKey: trpc.wfp.entityOverview.queryKey(),
				});
				onOpenChange(false);
				toast.success("Entity settings saved");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const form = useForm({
		defaultValues: {
			multiplier: currentMultiplier ?? "3.5",
			fy: currentFy ?? FY_OPTIONS[0],
		},
		onSubmit: ({ value }) => {
			upsertSettings.mutate({
				entId: entityId,
				billingMultiplier: String(Number(value.multiplier)),
				fy: value.fy,
			});
		},
	});

	return (
		<AppDialog open={open} onOpenChange={onOpenChange}>
			<AppDialogContent size="sm">
				<AppDialogHeader>
					<AppDialogTitle className="text-base">
						Entity Planning Settings
					</AppDialogTitle>
				</AppDialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FormGrid>
						<form.Field
							name="multiplier"
							validators={{ onSubmit: multiplierSchema }}
						>
							{(field) => (
								<FormField
									field={field}
									label="Billing Multiplier"
									required
									hint="Used to calculate auto billing targets (salary x multiplier)"
								>
									<Input
										id={field.name}
										type="number"
										step="0.1"
										min="0.1"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="3.5"
										className="tabular-nums"
									/>
								</FormField>
							)}
						</form.Field>

						<form.Field name="fy">
							{(field) => (
								<FormField field={field} label="Financial Year">
									<Select
										value={field.state.value}
										onValueChange={(v) =>
											field.handleChange(v ?? FY_OPTIONS[0])
										}
									>
										<SelectTrigger className="text-sm">
											<SelectValue placeholder="Select FY" />
										</SelectTrigger>
										<SelectContent>
											{FY_OPTIONS.map((option) => (
												<SelectItem key={option} value={option} label={option}>
													{option}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormField>
							)}
						</form.Field>
					</FormGrid>

					<AppDialogFooter>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<form.Subscribe
							selector={(s) => [s.canSubmit, s.isSubmitting] as const}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									size="sm"
									disabled={
										!canSubmit || isSubmitting || upsertSettings.isPending
									}
								>
									{upsertSettings.isPending ? "Saving..." : "Save"}
								</Button>
							)}
						</form.Subscribe>
					</AppDialogFooter>
				</form>
			</AppDialogContent>
		</AppDialog>
	);
}
