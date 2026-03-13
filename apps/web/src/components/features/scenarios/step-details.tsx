import { FormField } from "@/components/molecules/form-field";
import { FormGrid } from "@/components/molecules/form-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { PRESET_COLORS } from "./scenario-card";
import type { StepDetailsProps } from "./wizard-types";

export function StepDetails({ form }: StepDetailsProps) {
	return (
		<FormGrid>
			<form.Field name="name">
				{(field) => (
					<FormField field={field} label="Scenario Name" required>
						<Input
							id={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="e.g. Q3 Growth Plan"
							autoFocus
						/>
					</FormField>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<FormField field={field} label="Description">
						<Input
							id={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Optional \u2014 brief context for this scenario"
						/>
					</FormField>
				)}
			</form.Field>

			<div className="flex flex-col gap-1.5">
				<Label className="text-text-soft-400">Color</Label>
				<form.Field name="color">
					{(field) => (
						<div className="flex items-center gap-2">
							{PRESET_COLORS.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => field.handleChange(c)}
									className={cn(
										"size-6 rounded-full border-2 transition-colors",
										field.state.value === c
											? "border-foreground"
											: "border-transparent",
									)}
									style={{ backgroundColor: c }}
									aria-label={`Select color ${c}`}
								/>
							))}
						</div>
					)}
				</form.Field>
			</div>
		</FormGrid>
	);
}
