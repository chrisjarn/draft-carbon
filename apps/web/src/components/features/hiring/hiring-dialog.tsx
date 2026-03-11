import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";

import type { HiringNeed } from "@/components/features/hiring/hiring-table-columns";
import { DatePicker } from "@/components/molecules/date-picker";
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
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
	getOfficesForState,
	getSubgroupsForSL,
	SERVICE_LINES,
	STATES,
} from "@/lib/constants";

// ── Form state (exported — consumed by hiring.lazy.tsx) ───────────────────────

export type FormState = {
	role: string;
	sl: string;
	sg: string;
	state: string;
	office: string;
	location: string;
	positions: string;
	type: string;
	priority: string;
	salaryMin: string;
	salaryMax: string;
	targetStart: string;
	approvedBy: string;
	managedBy: string;
	notes: string;
};

export function emptyForm(): FormState {
	return {
		role: "",
		sl: "",
		sg: "",
		state: "",
		office: "",
		location: "",
		positions: "1",
		type: "FT",
		priority: "medium",
		salaryMin: "",
		salaryMax: "",
		targetStart: "",
		approvedBy: "",
		managedBy: "",
		notes: "",
	};
}

export function roleToForm(r: HiringNeed): FormState {
	return {
		role: r.role,
		sl: r.sl ?? "",
		sg: r.sg ?? "",
		state: r.state ?? "",
		office: r.office ?? "",
		location: r.location ?? "",
		positions: r.positions?.toString() ?? "1",
		type: r.type ?? "FT",
		priority: r.priority ?? "medium",
		salaryMin: r.salaryMin?.toString() ?? "",
		salaryMax: r.salaryMax?.toString() ?? "",
		targetStart: r.targetStart ?? "",
		approvedBy: r.approvedBy ?? "",
		managedBy: r.managedBy ?? "",
		notes: r.notes ?? "",
	};
}

// ── Payload builder (exported — consumed by hiring.lazy.tsx) ──────────────────

export function formToPayload(form: FormState) {
	return {
		role: form.role,
		sl: form.sl || undefined,
		sg: form.sg || undefined,
		state: form.state || undefined,
		office: form.office || undefined,
		location: form.location || undefined,
		positions: form.positions ? Number(form.positions) : undefined,
		type: (form.type as "FT" | "PT" | "Contract") || undefined,
		priority:
			(form.priority as "critical" | "high" | "medium" | "low") || undefined,
		salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
		salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
		targetStart: form.targetStart || undefined,
		approvedBy: form.approvedBy || undefined,
		managedBy: form.managedBy || undefined,
		notes: form.notes || undefined,
	};
}

// ── Schema ────────────────────────────────────────────────────────────────────

const roleSchema = z.string().min(1, "Role title is required");

// ── Component ─────────────────────────────────────────────────────────────────

export function HiringDrawer({
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
	const [page, setPage] = useState(1);

	const form = useForm({
		defaultValues: initial,
		onSubmit: ({ value }) => {
			onSave(value);
		},
	});

	const isEdit = !!initial.role;

	return (
		<Sheet open={open} onOpenChange={(o) => !o && onClose()}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle className="text-lg">
						{isEdit ? "Edit Role" : "Log a Hiring Role"}
					</SheetTitle>
					<p className="text-muted-foreground text-sm">
						{page === 1
							? "Role information & classification"
							: "Compensation & additional details"}
					</p>
					<div className="flex items-center gap-2 pt-1">
						<div
							className={`h-1 flex-1 rounded-full ${page === 1 ? "bg-primary" : "bg-primary/30"}`}
						/>
						<div
							className={`h-1 flex-1 rounded-full ${page === 2 ? "bg-primary" : "bg-primary/30"}`}
						/>
					</div>
				</SheetHeader>

				<SheetPanel>
					{page === 1 ? (
						/* ── Page 1: Role info & classification ──────────── */
						<FormGrid columns={2}>
							<form.Field name="role" validators={{ onSubmit: roleSchema }}>
								{(field) => (
									<FormField
										field={field}
										label="Role Title"
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
											<SelectTrigger aria-label="Service line">
												<SelectValue placeholder="Select..." />
											</SelectTrigger>
											<SelectContent>
												{SERVICE_LINES.map((sl) => (
													<SelectItem key={sl.id} value={sl.id} label={sl.name}>
														{sl.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormField>
								)}
							</form.Field>

							<form.Subscribe selector={(s) => s.values.sl}>
								{(sl) => {
									const subgroups = getSubgroupsForSL(sl);
									return (
										<form.Field name="sg">
											{(field) => (
												<FormField field={field} label="Sub Group">
													{subgroups.length > 0 ? (
														<Select
															value={field.state.value || undefined}
															onValueChange={(v) => field.handleChange(v ?? "")}
														>
															<SelectTrigger aria-label="Sub group">
																<SelectValue placeholder="Select..." />
															</SelectTrigger>
															<SelectContent>
																{subgroups.map((sg) => (
																	<SelectItem
																		key={sg.id}
																		value={sg.id}
																		label={sg.name}
																	>
																		{sg.name}
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
															placeholder="--"
															disabled={!sl}
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
											<SelectTrigger aria-label="State">
												<SelectValue placeholder="Select..." />
											</SelectTrigger>
											<SelectContent>
												{STATES.map((s) => {
													const stateLabel = `${s.abbr} \u2014 ${s.name}`;
													return (
														<SelectItem
															key={s.id}
															value={s.id}
															label={stateLabel}
														>
															{stateLabel}
														</SelectItem>
													);
												})}
											</SelectContent>
										</Select>
									</FormField>
								)}
							</form.Field>

							<form.Subscribe selector={(s) => s.values.state}>
								{(stateVal) => {
									const offices = getOfficesForState(stateVal);
									return (
										<form.Field name="office">
											{(field) => (
												<FormField field={field} label="Office">
													{offices.length > 0 ? (
														<Select
															value={field.state.value || undefined}
															onValueChange={(v) => field.handleChange(v ?? "")}
														>
															<SelectTrigger aria-label="Office">
																<SelectValue placeholder="Select..." />
															</SelectTrigger>
															<SelectContent>
																{offices.map((o) => (
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
															placeholder="--"
															disabled={!stateVal}
														/>
													)}
												</FormField>
											)}
										</form.Field>
									);
								}}
							</form.Subscribe>

							<form.Field name="location">
								{(field) => (
									<FormField field={field} label="Location">
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="positions">
								{(field) => (
									<FormField field={field} label="Positions">
										<Input
											id={field.name}
											type="number"
											min={1}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											className="tabular-nums"
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="type">
								{(field) => (
									<FormField field={field} label="Type">
										<Select
											value={field.state.value}
											onValueChange={(v) => field.handleChange(v ?? "FT")}
										>
											<SelectTrigger aria-label="Employment type">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="FT" label="Full Time">
													Full Time
												</SelectItem>
												<SelectItem value="PT" label="Part Time">
													Part Time
												</SelectItem>
												<SelectItem value="Contract" label="Contract">
													Contract
												</SelectItem>
											</SelectContent>
										</Select>
									</FormField>
								)}
							</form.Field>

							<form.Field name="priority">
								{(field) => (
									<FormField field={field} label="Priority">
										<Select
											value={field.state.value}
											onValueChange={(v) => field.handleChange(v ?? "medium")}
										>
											<SelectTrigger aria-label="Priority">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="critical" label="Critical">
													Critical
												</SelectItem>
												<SelectItem value="high" label="High">
													High
												</SelectItem>
												<SelectItem value="medium" label="Medium">
													Medium
												</SelectItem>
												<SelectItem value="low" label="Low">
													Low
												</SelectItem>
											</SelectContent>
										</Select>
									</FormField>
								)}
							</form.Field>
						</FormGrid>
					) : (
						/* ── Page 2: Compensation & details ──────────────── */
						<FormGrid columns={2}>
							<form.Field name="salaryMin">
								{(field) => (
									<FormField field={field} label="Salary Min">
										<Input
											id={field.name}
											type="number"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="e.g. 65000"
											className="tabular-nums"
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="salaryMax">
								{(field) => (
									<FormField field={field} label="Salary Max">
										<Input
											id={field.name}
											type="number"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="e.g. 80000"
											className="tabular-nums"
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="targetStart">
								{(field) => (
									<FormField
										field={field}
										label="Target Start"
										className="col-span-2"
									>
										<DatePicker
											id={field.name}
											value={field.state.value}
											onChange={field.handleChange}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="approvedBy">
								{(field) => (
									<FormField field={field} label="Approved By">
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="managedBy">
								{(field) => (
									<FormField field={field} label="Managed By">
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="notes">
								{(field) => (
									<FormField field={field} label="Notes" className="col-span-2">
										<Textarea
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											rows={3}
										/>
									</FormField>
								)}
							</form.Field>
						</FormGrid>
					)}
				</SheetPanel>

				<SheetFooter>
					{page === 1 ? (
						<>
							<Button variant="outline" size="sm" onClick={onClose}>
								Cancel
							</Button>
							<form.Subscribe selector={(s) => s.values.role}>
								{(role) => (
									<Button size="sm" disabled={!role} onClick={() => setPage(2)}>
										Continue
									</Button>
								)}
							</form.Subscribe>
						</>
					) : (
						<>
							<Button variant="outline" size="sm" onClick={() => setPage(1)}>
								Back
							</Button>
							<form.Subscribe
								selector={(s) =>
									[s.values.role, s.canSubmit, s.isSubmitting] as const
								}
							>
								{([role, canSubmit, isSubmitting]) => (
									<Button
										size="sm"
										disabled={!role || !canSubmit || isSubmitting || saving}
										onClick={() => form.handleSubmit()}
									>
										{saving ? "Saving..." : "Save"}
									</Button>
								)}
							</form.Subscribe>
						</>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
