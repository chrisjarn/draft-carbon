import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import type { HiringNeed } from "@/components/features/hiring/hiring-table-columns";
import {
	AppDialog,
	AppDialogContent,
	AppDialogFooter,
	AppDialogHeader,
	AppDialogTitle,
} from "@/components/molecules/app-dialog";
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

// ── Schema ────────────────────────────────────────────────────────────────────

const outcomeValues = ["hired", "cancelled", "deferred"] as const;
type Outcome = (typeof outcomeValues)[number];

const dateSchema = z.string().min(1, "Required");
const nameSchema = z.string().min(1, "Name is required when outcome is Hired");

// ── CloseRoleDialog ───────────────────────────────────────────────────────────

export function CloseRoleDialog({
	role,
	onClose,
	onConfirm,
	saving,
}: {
	role: HiringNeed | null;
	onClose: () => void;
	onConfirm: (how: Outcome, date: string, name: string) => void;
	saving: boolean;
}) {
	const form = useForm({
		defaultValues: {
			how: "hired" as Outcome,
			date: new Date().toISOString().slice(0, 10),
			name: "",
		},
		onSubmit: ({ value }) => {
			onConfirm(value.how, value.date, value.name);
		},
	});

	return (
		<AppDialog open={!!role} onOpenChange={(o) => !o && onClose()}>
			<AppDialogContent size="sm">
				<AppDialogHeader>
					<AppDialogTitle>Close Role &mdash; {role?.role}</AppDialogTitle>
				</AppDialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FormGrid>
						<form.Field name="how">
							{(field) => (
								<FormField field={field} label="Outcome">
									<Select
										value={field.state.value}
										onValueChange={(v) => field.handleChange(v as Outcome)}
									>
										<SelectTrigger aria-label="Outcome">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="hired" label="Hired">
												Hired
											</SelectItem>
											<SelectItem value="cancelled" label="Cancelled">
												Cancelled
											</SelectItem>
											<SelectItem value="deferred" label="Deferred">
												Deferred
											</SelectItem>
										</SelectContent>
									</Select>
								</FormField>
							)}
						</form.Field>

						<form.Field name="date" validators={{ onSubmit: dateSchema }}>
							{(field) => (
								<FormField field={field} label="Date" required>
									<DatePicker
										id={field.name}
										value={field.state.value}
										onChange={field.handleChange}
									/>
								</FormField>
							)}
						</form.Field>

						<form.Subscribe selector={(s) => s.values.how}>
							{(how) =>
								how === "hired" ? (
									<form.Field name="name" validators={{ onSubmit: nameSchema }}>
										{(field) => (
											<FormField field={field} label="Hired Name" required>
												<Input
													id={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="Full name"
												/>
											</FormField>
										)}
									</form.Field>
								) : null
							}
						</form.Subscribe>
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
									disabled={!canSubmit || isSubmitting || saving}
								>
									{saving ? "Closing\u2026" : "Close Role"}
								</Button>
							)}
						</form.Subscribe>
					</AppDialogFooter>
				</form>
			</AppDialogContent>
		</AppDialog>
	);
}
