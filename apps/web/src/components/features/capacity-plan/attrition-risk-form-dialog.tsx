import { useForm } from "@tanstack/react-form";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { RiskLevel } from "./types";

// ── Schema ────────────────────────────────────────────────────────────────────

const requiredString = z.string().min(1, "Required");

// ── Types ─────────────────────────────────────────────────────────────────────

type StaffOption = {
	id: string;
	name: string;
	role: string | null;
};

export type FlagRiskPayload = {
	carboniteId: string;
	riskLevel: RiskLevel;
	reason: string | undefined;
	action: string | undefined;
};

export type EditRiskPayload = {
	riskLevel: RiskLevel;
	reason: string | undefined;
	action: string | undefined;
};

// ── Flag Risk Dialog ──────────────────────────────────────────────────────────

export function FlagRiskDialog({
	open,
	onOpenChange,
	availableStaff,
	isPending,
	onSubmit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	availableStaff: StaffOption[];
	isPending: boolean;
	onSubmit: (payload: FlagRiskPayload) => void;
}) {
	const form = useForm({
		defaultValues: {
			staff: "",
			level: "medium" as RiskLevel,
			reason: "",
			action: "",
		},
		onSubmit: ({ value }) => {
			onSubmit({
				carboniteId: value.staff,
				riskLevel: value.level,
				reason: value.reason || undefined,
				action: value.action || undefined,
			});
		},
	});

	return (
		<AppDialog open={open} onOpenChange={onOpenChange}>
			<AppDialogContent size="sm">
				<AppDialogHeader>
					<AppDialogTitle className="text-base">
						Flag Attrition Risk
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
						<form.Field name="staff" validators={{ onSubmit: requiredString }}>
							{(field) => (
								<FormField field={field} label="Staff Member" required>
									<Select
										value={field.state.value || undefined}
										onValueChange={(v) => field.handleChange(v ?? "")}
									>
										<SelectTrigger className="text-sm">
											<SelectValue placeholder="Select staff" />
										</SelectTrigger>
										<SelectContent>
											{availableStaff.map((s) => {
												const staffLabel = `${s.name} (${s.role ?? "N/A"})`;
												return (
													<SelectItem
														key={s.id}
														value={s.id}
														label={staffLabel}
													>
														{staffLabel}
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</FormField>
							)}
						</form.Field>

						<form.Field name="level">
							{(field) => (
								<FormField field={field} label="Risk Level">
									<Select
										value={field.state.value}
										onValueChange={(v) => {
											if (v === "low" || v === "medium" || v === "high") {
												field.handleChange(v);
											}
										}}
									>
										<SelectTrigger className="text-sm">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="low" label="Low">
												Low
											</SelectItem>
											<SelectItem value="medium" label="Medium">
												Medium
											</SelectItem>
											<SelectItem value="high" label="High">
												High
											</SelectItem>
										</SelectContent>
									</Select>
								</FormField>
							)}
						</form.Field>

						<form.Field name="reason">
							{(field) => (
								<FormField field={field} label="Reason">
									<Textarea
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="text-sm"
										rows={2}
									/>
								</FormField>
							)}
						</form.Field>

						<form.Field name="action">
							{(field) => (
								<FormField field={field} label="Action">
									<Textarea
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="text-sm"
										rows={2}
									/>
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
									disabled={!canSubmit || isSubmitting || isPending}
								>
									{isPending ? "Saving..." : "Save"}
								</Button>
							)}
						</form.Subscribe>
					</AppDialogFooter>
				</form>
			</AppDialogContent>
		</AppDialog>
	);
}

// ── Edit Risk Dialog ──────────────────────────────────────────────────────────

export function EditRiskDialog({
	open,
	onOpenChange,
	initialLevel,
	initialReason,
	initialAction,
	isPending,
	onSubmit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialLevel: RiskLevel;
	initialReason: string;
	initialAction: string;
	isPending: boolean;
	onSubmit: (payload: EditRiskPayload) => void;
}) {
	const form = useForm({
		defaultValues: {
			level: initialLevel,
			reason: initialReason,
			action: initialAction,
		},
		onSubmit: ({ value }) => {
			onSubmit({
				riskLevel: value.level,
				reason: value.reason || undefined,
				action: value.action || undefined,
			});
		},
	});

	return (
		<AppDialog open={open} onOpenChange={onOpenChange}>
			<AppDialogContent size="sm">
				<AppDialogHeader>
					<AppDialogTitle className="text-base">
						Edit Attrition Risk
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
						<form.Field name="level">
							{(field) => (
								<FormField field={field} label="Risk Level">
									<Select
										value={field.state.value}
										onValueChange={(v) => {
											if (v === "low" || v === "medium" || v === "high") {
												field.handleChange(v);
											}
										}}
									>
										<SelectTrigger className="text-sm">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="low" label="Low">
												Low
											</SelectItem>
											<SelectItem value="medium" label="Medium">
												Medium
											</SelectItem>
											<SelectItem value="high" label="High">
												High
											</SelectItem>
										</SelectContent>
									</Select>
								</FormField>
							)}
						</form.Field>

						<form.Field name="reason">
							{(field) => (
								<FormField field={field} label="Reason">
									<Textarea
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="text-sm"
										rows={2}
									/>
								</FormField>
							)}
						</form.Field>

						<form.Field name="action">
							{(field) => (
								<FormField field={field} label="Action">
									<Textarea
										id={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="text-sm"
										rows={2}
									/>
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
									disabled={!canSubmit || isSubmitting || isPending}
								>
									{isPending ? "Saving..." : "Save"}
								</Button>
							)}
						</form.Subscribe>
					</AppDialogFooter>
				</form>
			</AppDialogContent>
		</AppDialog>
	);
}
