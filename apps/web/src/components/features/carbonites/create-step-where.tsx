import z from "zod";

import { FormField } from "@/components/molecules/form-field";
import { FormGrid } from "@/components/molecules/form-grid";
import { Input } from "@/components/ui/input";
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
	ROLE_CATALOGUE,
	SERVICE_LINES,
	STATES,
} from "@/lib/constants";
import type { CreateForm } from "./carbonite-create-types";
import { seniorityLabel } from "./types";

// ---------------------------------------------------------------------------
// Step 2 — "Where & What": state/office, service line/sub-group/role, seniority
// ---------------------------------------------------------------------------

export function CreateStepWhere({ form }: { form: CreateForm }) {
	return (
		<FormGrid>
			{/* State + Office (cascading) */}
			<div className="grid grid-cols-2 gap-4">
				<form.Field
					name="state"
					validators={{ onSubmit: z.string().min(1, "Required") }}
				>
					{(field) => (
						<FormField field={field} label="State" required>
							<Select
								value={field.state.value || undefined}
								onValueChange={(v) => {
									field.handleChange(v ?? "");
									form.setFieldValue("office", "");
								}}
							>
								<SelectTrigger id={field.name}>
									<SelectValue placeholder="Select state\u2026" />
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
						const officeOptions = stateId ? getOfficesForState(stateId) : [];
						return (
							<form.Field
								name="office"
								validators={{ onSubmit: z.string().min(1, "Required") }}
							>
								{(field) => (
									<FormField field={field} label="Office" required>
										{officeOptions.length > 0 ? (
											<Select
												value={field.state.value || undefined}
												onValueChange={(v) => field.handleChange(v ?? "")}
											>
												<SelectTrigger id={field.name}>
													<SelectValue placeholder="Select office\u2026" />
												</SelectTrigger>
												<SelectContent>
													{officeOptions.map((o) => (
														<SelectItem key={o.id} value={o.id} label={o.name}>
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
												placeholder="Select state first"
												disabled={!stateId}
											/>
										)}
									</FormField>
								)}
							</form.Field>
						);
					}}
				</form.Subscribe>
			</div>

			{/* Service Line + Sub-group / Role (cascading) */}
			<form.Subscribe selector={(s) => s.values.sl}>
				{(slId) => {
					const sgOptions = slId ? getSubgroupsForSL(slId) : [];
					const roleOptions = slId ? (ROLE_CATALOGUE[slId] ?? []) : [];
					return (
						<>
							<div className="grid grid-cols-2 gap-4">
								<form.Field
									name="sl"
									validators={{ onSubmit: z.string().min(1, "Required") }}
								>
									{(field) => (
										<FormField field={field} label="Service line" required>
											<Select
												value={field.state.value || undefined}
												onValueChange={(v) => {
													field.handleChange(v ?? "");
													form.setFieldValue("sg", "");
													form.setFieldValue("role", "");
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

								{sgOptions.length > 0 && (
									<form.Field name="sg">
										{(field) => (
											<FormField field={field} label="Sub-group">
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
											</FormField>
										)}
									</form.Field>
								)}
							</div>

							{roleOptions.length > 0 && (
								<form.Field name="role">
									{(field) => (
										<FormField field={field} label="Role">
											<Select
												value={field.state.value || undefined}
												onValueChange={(v) => field.handleChange(v ?? "")}
											>
												<SelectTrigger id={field.name}>
													<SelectValue placeholder="Select role\u2026" />
												</SelectTrigger>
												<SelectContent>
													{roleOptions.map((r) => (
														<SelectItem
															key={`${r.level}-${r.title}`}
															value={r.title}
															label={r.title}
														>
															{r.title}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormField>
									)}
								</form.Field>
							)}
						</>
					);
				}}
			</form.Subscribe>

			{/* Seniority */}
			<form.Subscribe selector={(s) => s.values.seniority}>
				{(seniority) => {
					const senLabel = seniority ? seniorityLabel(Number(seniority)) : null;
					return (
						<div className="grid grid-cols-2 items-end gap-4">
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
										/>
									</FormField>
								)}
							</form.Field>
							{senLabel && (
								<div className="pb-2 text-muted-foreground text-sm">
									Level:{" "}
									<span className="font-medium text-foreground">
										{senLabel}
									</span>
								</div>
							)}
						</div>
					);
				}}
			</form.Subscribe>
		</FormGrid>
	);
}
