import type { SL_VALUES, STATE_VALUES } from "@carbon-wfp/db/schema/enums";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SERVICE_LINES, STATES } from "@/lib/constants";
import { trpc } from "@/utils/trpc";

import type { Entity } from "./types";

// ── Schema ────────────────────────────────────────────────────────────────────

const requiredString = z.string().min(1, "Required");

// ── Helpers ───────────────────────────────────────────────────────────────────

type EntityFormValues = {
	biz: string;
	tan: string;
	phone: string;
	email: string;
	address: string;
	state: string;
	sl: string[];
};

const EMPTY_FORM: EntityFormValues = {
	biz: "",
	tan: "",
	phone: "",
	email: "",
	address: "",
	state: "",
	sl: [],
};

function entityToForm(entity: Entity): EntityFormValues {
	return {
		biz: entity.biz ?? "",
		tan: entity.tan ?? "",
		phone: entity.phone ?? "",
		email: entity.email ?? "",
		address: entity.address ?? "",
		state: entity.state ?? "",
		sl: (entity.sl as string[] | null) ?? [],
	};
}

// ── Component ─────────────────────────────────────────────────────────────────

type EntityDialogProps =
	| {
			mode: "create";
			entity?: undefined;
			open: boolean;
			onOpenChange: (open: boolean) => void;
	  }
	| {
			mode: "edit";
			entity: Entity | null;
			open: boolean;
			onOpenChange: (open: boolean) => void;
	  };

export function EntityDialog({
	mode,
	entity,
	open,
	onOpenChange,
}: EntityDialogProps) {
	const qc = useQueryClient();
	const isCreate = mode === "create";

	const createEntity = useMutation(
		trpc.entities.create.mutationOptions({
			onSuccess: (created) => {
				qc.invalidateQueries({
					queryKey: trpc.entities.getAll.queryKey(),
				});
				onOpenChange(false);
				toast.success(`Entity "${created?.biz ?? "New entity"}" created`);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const updateEntity = useMutation(
		trpc.entities.update.mutationOptions({
			onSuccess: (updated) => {
				qc.invalidateQueries({
					queryKey: trpc.entities.getAll.queryKey(),
				});
				onOpenChange(false);
				toast.success(`Entity "${updated?.biz ?? "entity"}" updated`);
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	const form = useForm({
		defaultValues:
			mode === "edit" && entity ? entityToForm(entity) : EMPTY_FORM,
		onSubmit: ({ value }) => {
			if (isCreate) {
				createEntity.mutate({
					biz: value.biz,
					state: value.state as (typeof STATE_VALUES)[number],
				});
			} else if (entity) {
				updateEntity.mutate({
					id: entity.id,
					biz: value.biz,
					tan: value.tan || undefined,
					phone: value.phone || undefined,
					email: value.email || undefined,
					address: value.address || undefined,
					state: value.state as (typeof STATE_VALUES)[number],
					sl: value.sl as (typeof SL_VALUES)[number][],
				});
			}
		},
	});

	const isPending = createEntity.isPending || updateEntity.isPending;

	return (
		<AppDialog open={open} onOpenChange={onOpenChange}>
			<AppDialogContent size={isCreate ? "sm" : "md"}>
				<AppDialogHeader>
					<AppDialogTitle>
						{isCreate ? "Add Entity" : "Edit Entity"}
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
						<form.Field name="biz" validators={{ onSubmit: requiredString }}>
							{(field) => (
								<FormField
									field={field}
									label={isCreate ? "Name" : "Business Name"}
									required
								>
									<Input
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={isCreate ? "e.g. Carbon Perth" : undefined}
									/>
								</FormField>
							)}
						</form.Field>

						{/* Extra fields only in edit mode */}
						{!isCreate && (
							<>
								<form.Field name="tan">
									{(field) => (
										<FormField field={field} label="TAN">
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										</FormField>
									)}
								</form.Field>

								<form.Field name="phone">
									{(field) => (
										<FormField field={field} label="Phone">
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										</FormField>
									)}
								</form.Field>

								<form.Field name="email">
									{(field) => (
										<FormField field={field} label="Email">
											<Input
												id={field.name}
												type="email"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										</FormField>
									)}
								</form.Field>

								<form.Field name="address">
									{(field) => (
										<FormField field={field} label="Address">
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										</FormField>
									)}
								</form.Field>
							</>
						)}

						<form.Field name="state" validators={{ onSubmit: requiredString }}>
							{(field) => (
								<FormField field={field} label="State" required>
									<Select
										value={field.state.value || undefined}
										onValueChange={(v) => field.handleChange(v ?? "")}
									>
										<SelectTrigger aria-label="State">
											<SelectValue placeholder="Select state" />
										</SelectTrigger>
										<SelectContent>
											{STATES.map((s) => (
												<SelectItem
													key={s.id}
													value={s.id}
													label={s.name}
													className="text-sm"
												>
													{s.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormField>
							)}
						</form.Field>

						{/* Service lines only in edit mode */}
						{!isCreate && (
							<form.Field name="sl">
								{(field) => (
									<FormField field={field} label="Service Lines">
										<div className="flex flex-wrap gap-x-4 gap-y-2">
											{SERVICE_LINES.map((sl) => {
												const checked = field.state.value.includes(sl.id);
												const cbId = `edit-sl-${sl.id}`;
												return (
													<label
														key={sl.id}
														htmlFor={cbId}
														className="flex items-center gap-1.5 text-sm"
													>
														<Checkbox
															id={cbId}
															checked={checked}
															onCheckedChange={(c) => {
																field.handleChange(
																	c
																		? [...field.state.value, sl.id]
																		: field.state.value.filter(
																				(x) => x !== sl.id,
																			),
																);
															}}
														/>
														{sl.short}
													</label>
												);
											})}
										</div>
									</FormField>
								)}
							</form.Field>
						)}
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
									disabled={!canSubmit || isSubmitting || isPending}
								>
									{isPending
										? isCreate
											? "Creating\u2026"
											: "Saving\u2026"
										: isCreate
											? "Create Entity"
											: "Save Changes"}
								</Button>
							)}
						</form.Subscribe>
					</AppDialogFooter>
				</form>
			</AppDialogContent>
		</AppDialog>
	);
}
