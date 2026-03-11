import { CheckboxField, FormField } from "@/components/molecules/form-field";
import { FormGrid } from "@/components/molecules/form-grid";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { CreateForm } from "./carbonite-create-types";
import type { Carbonite } from "./types";

// ---------------------------------------------------------------------------
// Step 3 — "Pod & Pay": pod, reports-to, salary, partner flag
// ---------------------------------------------------------------------------

export function CreateStepPodPay({
	form,
	allData,
}: {
	form: CreateForm;
	allData: Carbonite[];
}) {
	return (
		<FormGrid>
			<form.Field name="pod">
				{(field) => (
					<FormField field={field} label="Pod name">
						<Input
							id={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="e.g. Parramatta A"
						/>
					</FormField>
				)}
			</form.Field>

			{/* reportsTo — filtered peers */}
			<form.Subscribe
				selector={(s) =>
					[s.values.state, s.values.office, s.values.sl] as const
				}
			>
				{([stateId, officeId, slId]) => {
					const peers = allData.filter(
						(c) =>
							c.state === stateId && c.office === officeId && c.sl === slId,
					);
					if (peers.length === 0) return null;
					return (
						<form.Field name="reportsTo">
							{(field) => (
								<FormField field={field} label="Reports to">
									<Select
										value={field.state.value || undefined}
										onValueChange={(v) => field.handleChange(v ?? "")}
									>
										<SelectTrigger id={field.name}>
											<SelectValue placeholder="Select manager\u2026" />
										</SelectTrigger>
										<SelectContent>
											{peers.map((c) => {
												const peerLabel = `${c.name}${c.role ? ` \u2014 ${c.role}` : ""}`;
												return (
													<SelectItem key={c.id} value={c.id} label={peerLabel}>
														{peerLabel}
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</FormField>
							)}
						</form.Field>
					);
				}}
			</form.Subscribe>

			{/* Salary + cost preview */}
			<form.Subscribe selector={(s) => s.values.salary}>
				{(salary) => {
					const n = salary ? Number(salary) : 0;
					const monthly = n ? Math.round(n / 12) : null;
					const quarterly = n ? Math.round(n / 4) : null;
					return (
						<div className="grid grid-cols-2 items-end gap-4">
							<form.Field name="salary">
								{(field) => (
									<FormField field={field} label="Salary (AUD)">
										<Input
											id={field.name}
											type="number"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="e.g. 75000"
										/>
									</FormField>
								)}
							</form.Field>
							{monthly && (
								<div className="space-y-0.5 pb-2 text-muted-foreground text-xs">
									<div>
										Monthly:{" "}
										<span className="font-medium text-foreground">
											${monthly.toLocaleString()}
										</span>
									</div>
									<div>
										Quarterly:{" "}
										<span className="font-medium text-foreground">
											${quarterly?.toLocaleString()}
										</span>
									</div>
								</div>
							)}
						</div>
					);
				}}
			</form.Subscribe>

			<form.Field name="isPartner">
				{(field) => <CheckboxField field={field} label="Partner" />}
			</form.Field>
		</FormGrid>
	);
}
