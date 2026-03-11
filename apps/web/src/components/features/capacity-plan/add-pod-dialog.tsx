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
import { getOfficesForState, STATES } from "@/lib/constants";
import { trpc } from "@/utils/trpc";

// ── Schema ────────────────────────────────────────────────────────────────────

const requiredString = z.string().min(1, "Required");
const budgetSchema = z
	.string()
	.refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
		message: "Must be a non-negative number",
	});

// ── AddPodDialog ──────────────────────────────────────────────────────────────

export function AddPodDialog({
	open,
	onClose,
	defaultState,
	defaultOffice,
}: {
	open: boolean;
	onClose: () => void;
	defaultState?: string;
	defaultOffice?: string;
}) {
	const qc = useQueryClient();

	const upsert = useMutation(
		trpc.podBudgets.upsert.mutationOptions({
			onSuccess: () => {
				qc.invalidateQueries({ queryKey: trpc.podBudgets.getAll.queryKey() });
				toast.success("Pod added");
				onClose();
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const form = useForm({
		defaultValues: {
			state: defaultState ?? "",
			office: defaultOffice ?? "",
			podName: "",
			budget: "0",
		},
		onSubmit: ({ value }) => {
			upsert.mutate({
				state: value.state,
				office: value.office,
				podName: value.podName.trim(),
				budget: Number(value.budget),
			});
		},
	});

	return (
		<AppDialog open={open} onOpenChange={(o) => !o && onClose()}>
			<AppDialogContent size="sm">
				<AppDialogHeader>
					<AppDialogTitle>Add Pod</AppDialogTitle>
				</AppDialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FormGrid>
						<form.Field name="state" validators={{ onSubmit: requiredString }}>
							{(field) => (
								<FormField field={field} label="State" required>
									<Select
										value={field.state.value || undefined}
										onValueChange={(v) => {
											field.handleChange(v ?? "");
											form.setFieldValue("office", "");
										}}
									>
										<SelectTrigger className="w-full text-sm">
											<SelectValue placeholder="Select state..." />
										</SelectTrigger>
										<SelectContent>
											{STATES.map((s) => (
												<SelectItem key={s.id} value={s.id} label={s.name}>
													{s.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormField>
							)}
						</form.Field>

						<form.Subscribe selector={(s) => s.values.state}>
							{(stateVal) => {
								const officeOptions = stateVal
									? getOfficesForState(stateVal)
									: [];
								return (
									<form.Field
										name="office"
										validators={{ onSubmit: requiredString }}
									>
										{(field) => (
											<FormField field={field} label="Office" required>
												{officeOptions.length > 0 ? (
													<Select
														value={field.state.value || undefined}
														onValueChange={(v) => field.handleChange(v ?? "")}
													>
														<SelectTrigger className="w-full text-sm">
															<SelectValue placeholder="Select office..." />
														</SelectTrigger>
														<SelectContent>
															{officeOptions.map((o) => (
																<SelectItem
																	key={o.id}
																	value={o.id}
																	label={o.name}
																>
																	{o.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												) : (
													<Input
														id={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Select a state first"
														disabled={!stateVal}
													/>
												)}
											</FormField>
										)}
									</form.Field>
								);
							}}
						</form.Subscribe>

						<form.Field
							name="podName"
							validators={{ onSubmit: requiredString }}
						>
							{(field) => (
								<FormField field={field} label="Pod Name" required>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="e.g. Pod A"
									/>
								</FormField>
							)}
						</form.Field>

						<form.Field name="budget" validators={{ onSubmit: budgetSchema }}>
							{(field) => (
								<FormField field={field} label="Budget">
									<Input
										id={field.name}
										type="number"
										min={0}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="tabular-nums"
									/>
								</FormField>
							)}
						</form.Field>
					</FormGrid>

					<AppDialogFooter>
						<Button type="button" variant="outline" size="sm" onClick={onClose}>
							Cancel
						</Button>
						<form.Subscribe
							selector={(s) => [s.canSubmit, s.isSubmitting] as const}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									size="sm"
									disabled={!canSubmit || isSubmitting || upsert.isPending}
								>
									{upsert.isPending ? "Saving..." : "Save"}
								</Button>
							)}
						</form.Subscribe>
					</AppDialogFooter>
				</form>
			</AppDialogContent>
		</AppDialog>
	);
}
