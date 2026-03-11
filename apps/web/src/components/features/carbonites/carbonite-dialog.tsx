import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import {
	AppDialog,
	AppDialogContent,
	AppDialogFooter,
	AppDialogHeader,
	AppDialogTitle,
} from "@/components/molecules/app-dialog";
import { CheckboxField, FormField } from "@/components/molecules/form-field";
import { FormGrid } from "@/components/molecules/form-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getOfficesForState,
	getSubgroupsForSL,
	SERVICE_LINES,
	STATES,
} from "@/lib/constants";

import type { FormState } from "./types";

// ── Schema ────────────────────────────────────────────────────────────────────

const nameSchema = z.string().min(1, "Required");

// ── Component ─────────────────────────────────────────────────────────────────

export function CarboniteDialog({
	open,
	onClose,
	initial,
	onSave,
	saving,
}: {
	open: boolean;
	onClose: () => void;
	initial: FormState;
	onSave: (f: FormState) => void;
	saving: boolean;
}) {
	const form = useForm({
		defaultValues: initial,
		onSubmit: ({ value }) => {
			onSave(value);
		},
	});

	return (
		<AppDialog open={open} onOpenChange={(o) => !o && onClose()}>
			<AppDialogContent size="lg" className="flex max-h-[85vh] flex-col">
				<AppDialogHeader>
					<AppDialogTitle>
						{initial.name ? "Edit Carbonite" : "Add Carbonite"}
					</AppDialogTitle>
				</AppDialogHeader>

				<form
					className="flex min-h-0 flex-1 flex-col"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<ScrollArea className="flex-1">
						<FormGrid columns={2} className="p-1">
							<form.Field name="name" validators={{ onSubmit: nameSchema }}>
								{(field) => (
									<FormField
										field={field}
										label="Name"
										required
										className="col-span-2"
									>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="role">
								{(field) => (
									<FormField field={field} label="Role">
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="sl">
								{(field) => (
									<FormField field={field} label="Service Line">
										<Select
											value={field.state.value || undefined}
											onValueChange={(v) => {
												field.handleChange(v ?? "");
												form.setFieldValue("sg", "");
											}}
										>
											<SelectTrigger id={field.name}>
												<SelectValue placeholder="Select\u2026" />
											</SelectTrigger>
											<SelectContent>
												{SERVICE_LINES.map((s) => (
													<SelectItem key={s.id} value={s.id} label={s.name}>
														{s.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormField>
								)}
							</form.Field>

							<form.Subscribe selector={(s) => s.values.sl}>
								{(slId) => {
									const sgOptions = slId ? getSubgroupsForSL(slId) : [];
									return (
										<form.Field name="sg">
											{(field) => (
												<FormField field={field} label="Sub Group">
													{sgOptions.length > 0 ? (
														<Select
															value={field.state.value || undefined}
															onValueChange={(v) => field.handleChange(v ?? "")}
														>
															<SelectTrigger id={field.name}>
																<SelectValue placeholder="Select\u2026" />
															</SelectTrigger>
															<SelectContent>
																{sgOptions.map((s) => (
																	<SelectItem
																		key={s.id}
																		value={s.id}
																		label={s.name}
																	>
																		{s.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													) : (
														<Input
															id={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
														/>
													)}
												</FormField>
											)}
										</form.Field>
									);
								}}
							</form.Subscribe>

							<form.Field name="state">
								{(field) => (
									<FormField field={field} label="State">
										<Select
											value={field.state.value || undefined}
											onValueChange={(v) => {
												field.handleChange(v ?? "");
												form.setFieldValue("office", "");
											}}
										>
											<SelectTrigger id={field.name}>
												<SelectValue placeholder="Select\u2026" />
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
								{(stateId) => {
									const officeOptions = stateId
										? getOfficesForState(stateId)
										: [];
									return (
										<form.Field name="office">
											{(field) => (
												<FormField field={field} label="Office">
													{officeOptions.length > 0 ? (
														<Select
															value={field.state.value || undefined}
															onValueChange={(v) => field.handleChange(v ?? "")}
														>
															<SelectTrigger id={field.name}>
																<SelectValue placeholder="Select\u2026" />
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
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
														/>
													)}
												</FormField>
											)}
										</form.Field>
									);
								}}
							</form.Subscribe>

							<form.Field name="pod">
								{(field) => (
									<FormField field={field} label="Pod">
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="entity">
								{(field) => (
									<FormField field={field} label="Entity">
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="type">
								{(field) => (
									<FormField field={field} label="Type">
										<Select
											value={field.state.value}
											onValueChange={(v) =>
												field.handleChange((v ?? "FT") as "FT" | "PT")
											}
										>
											<SelectTrigger id={field.name}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="FT" label="Full Time">
													Full Time
												</SelectItem>
												<SelectItem value="PT" label="Part Time">
													Part Time
												</SelectItem>
											</SelectContent>
										</Select>
									</FormField>
								)}
							</form.Field>

							<form.Field name="seniority">
								{(field) => (
									<FormField field={field} label="Seniority (1\u201310)">
										<Input
											id={field.name}
											type="number"
											min={1}
											max={10}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="tabular-nums"
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="salary">
								{(field) => (
									<FormField field={field} label="Salary">
										<Input
											id={field.name}
											type="number"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="tabular-nums"
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="hours">
								{(field) => (
									<FormField field={field} label="Hours / week">
										<Input
											id={field.name}
											type="number"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="tabular-nums"
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="location">
								{(field) => (
									<FormField
										field={field}
										label="Location"
										className="col-span-2"
									>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="reportsTo">
								{(field) => (
									<FormField
										field={field}
										label="Reports To"
										className="col-span-2"
									>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="isPartner">
								{(field) => (
									<CheckboxField
										field={field}
										label="Partner"
										className="col-span-2"
									/>
								)}
							</form.Field>
						</FormGrid>
					</ScrollArea>

					<AppDialogFooter className="mt-4">
						<Button variant="outline" type="button" onClick={onClose}>
							Cancel
						</Button>
						<form.Subscribe
							selector={(s) => [s.canSubmit, s.isSubmitting] as const}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									disabled={!canSubmit || isSubmitting || saving}
								>
									{saving || isSubmitting ? "Saving\u2026" : "Save"}
								</Button>
							)}
						</form.Subscribe>
					</AppDialogFooter>
				</form>
			</AppDialogContent>
		</AppDialog>
	);
}
