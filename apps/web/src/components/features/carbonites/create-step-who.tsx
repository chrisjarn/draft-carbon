import z from "zod";

import { DatePicker } from "@/components/molecules/date-picker";
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
import { DEFAULT_FT_HOURS, STATE_FT_HOURS } from "@/lib/constants";
import type { CreateForm } from "./carbonite-create-types";

// ---------------------------------------------------------------------------
// Step 1 — "Who": name, employment type, start date, PT hours, location
// ---------------------------------------------------------------------------

export function CreateStepWho({ form }: { form: CreateForm }) {
	return (
		<FormGrid>
			<div className="grid grid-cols-2 gap-4">
				<form.Field
					name="firstName"
					validators={{ onSubmit: z.string().min(1, "Required") }}
				>
					{(field) => (
						<FormField field={field} label="First name" required>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								autoFocus
							/>
						</FormField>
					)}
				</form.Field>

				<form.Field
					name="lastName"
					validators={{ onSubmit: z.string().min(1, "Required") }}
				>
					{(field) => (
						<FormField field={field} label="Last name" required>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
						</FormField>
					)}
				</form.Field>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<form.Field name="type">
					{(field) => (
						<FormField field={field} label="Employment type">
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

				<form.Field name="startDate">
					{(field) => (
						<FormField field={field} label="Start date">
							<DatePicker
								id={field.name}
								value={field.state.value}
								onChange={field.handleChange}
							/>
						</FormField>
					)}
				</form.Field>
			</div>

			{/* PT hours + FTE preview */}
			<form.Subscribe
				selector={(s) =>
					[s.values.type, s.values.hours, s.values.state] as const
				}
			>
				{([type, hours, stateId]) => {
					if (type !== "PT") return null;
					const ftHours = stateId
						? (STATE_FT_HOURS[stateId] ?? DEFAULT_FT_HOURS)
						: DEFAULT_FT_HOURS;
					const fte = hours ? (Number(hours) / ftHours).toFixed(2) : null;
					return (
						<div className="grid grid-cols-2 items-end gap-4">
							<form.Field name="hours">
								{(field) => (
									<FormField field={field} label="Hours / week">
										<Input
											id={field.name}
											type="number"
											min={1}
											max={40}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>
							{fte && (
								<div className="pb-2 text-muted-foreground text-sm">
									≈{" "}
									<span className="font-medium text-foreground">{fte} FTE</span>
								</div>
							)}
						</div>
					);
				}}
			</form.Subscribe>

			<form.Field name="location">
				{(field) => (
					<FormField field={field} label="Location (suburb / city)">
						<Input
							id={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="e.g. Parramatta"
						/>
					</FormField>
				)}
			</form.Field>
		</FormGrid>
	);
}
