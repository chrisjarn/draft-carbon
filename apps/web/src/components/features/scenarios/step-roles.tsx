import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SERVICE_LINES } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";

import { MetricCell } from "./metric-cell";
import type { StepRolesProps } from "./wizard-types";

export function StepRoles({ form, impact, hasValidRoles }: StepRolesProps) {
	return (
		<div className="space-y-4">
			<div>
				<Label className="mb-1.5 block text-muted-foreground text-sm">
					Roles
				</Label>
				<form.Field name="roles" mode="array">
					{(rolesField) => (
						<div className="space-y-2">
							{rolesField.state.value.map((_, idx) => (
								<div key={idx} className="flex items-center gap-1.5">
									<form.Field name={`roles[${idx}].roleTitle`}>
										{(field) => (
											<Input
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												className="h-8 flex-1 text-sm"
												placeholder="Role title"
											/>
										)}
									</form.Field>
									<form.Field name={`roles[${idx}].sl`}>
										{(field) => (
											<Select
												value={field.state.value || undefined}
												onValueChange={(v) => field.handleChange(v ?? "")}
											>
												<SelectTrigger size="sm" className="w-28 text-xs">
													<SelectValue placeholder="SL" />
												</SelectTrigger>
												<SelectContent>
													{SERVICE_LINES.map((sl) => (
														<SelectItem
															key={sl.id}
															value={sl.id}
															label={sl.short}
														>
															{sl.short}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									</form.Field>
									<form.Field name={`roles[${idx}].salary`}>
										{(field) => (
											<Input
												type="number"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												className="h-8 w-24 text-sm"
												placeholder="Salary"
											/>
										)}
									</form.Field>
									<form.Field name={`roles[${idx}].count`}>
										{(field) => (
											<Input
												type="number"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												className="h-8 w-14 text-sm"
												placeholder="#"
												min={1}
											/>
										)}
									</form.Field>
									{rolesField.state.value.length > 1 && (
										<Button
											variant="ghost"
											size="icon-sm"
											className="text-red-400 hover:text-red-300"
											onClick={() => rolesField.removeValue(idx)}
										>
											<HugeiconsIcon icon={Delete02Icon} className="size-3" />
										</Button>
									)}
								</div>
							))}
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									rolesField.pushValue({
										roleTitle: "",
										sl: "",
										salary: "",
										count: "1",
									})
								}
							>
								<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
								Add Role
							</Button>
						</div>
					)}
				</form.Field>
			</div>

			{/* Live impact preview */}
			{hasValidRoles && (
				<div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
					<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
						Projected Impact
					</span>
					<div className="grid grid-cols-3 gap-3">
						<MetricCell
							label="New Payroll"
							value={`+${fmtDollar(impact.newPayroll)}`}
						/>
						<MetricCell
							label="New Billing"
							value={`+${fmtDollar(impact.newBilling)}`}
						/>
						<MetricCell label="Headcount" value={`+${impact.headcount}`} />
					</div>
					<div className="grid grid-cols-2 gap-3">
						<MetricCell
							label="Revised Multiple"
							value={`${impact.revisedMultiple.toFixed(2)}\u00D7`}
						/>
						<MetricCell
							label="Revised Rev Gap"
							value={fmtDollar(Math.abs(impact.revisedRevGap))}
							valueClass={
								impact.revisedRevGap > 0
									? "text-red-400"
									: impact.revisedRevGap < 0
										? "text-emerald-400"
										: undefined
							}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
