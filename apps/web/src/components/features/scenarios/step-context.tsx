import { FormField } from "@/components/molecules/form-field";
import { FormGrid } from "@/components/molecules/form-grid";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FY_OPTIONS } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";

import { MetricCell } from "./metric-cell";
import type { StepContextProps } from "./wizard-types";

export function StepContext({
	form,
	entities,
	basePayroll,
	baseBillingCapacity,
	baseMultiple,
	baseRevGap,
	hasDetail,
}: StepContextProps) {
	return (
		<FormGrid>
			<form.Field name="entityId">
				{(field) => (
					<FormField field={field} label="Entity">
						<Select
							value={field.state.value || undefined}
							onValueChange={(v) => field.handleChange(v ?? "")}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select entity..." />
							</SelectTrigger>
							<SelectContent>
								{entities.map((e) => {
									const label = `${e.biz}${e.state ? ` (${e.state.toUpperCase()})` : ""}`;
									return (
										<SelectItem key={e.id} value={e.id} label={label}>
											{label}
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</FormField>
				)}
			</form.Field>

			<form.Field name="fy">
				{(field) => (
					<FormField field={field} label="Financial Year">
						<Select
							value={field.state.value}
							onValueChange={(v) => field.handleChange(v ?? field.state.value)}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{FY_OPTIONS.map((f) => (
									<SelectItem key={f} value={f}>
										{f}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormField>
				)}
			</form.Field>

			{/* Baseline card — only when entity selected */}
			<form.Subscribe selector={(s) => s.values.entityId}>
				{(entityId) =>
					entityId && hasDetail ? (
						<div className="space-y-2 rounded-md border  bg-bg-weak-50/20 p-3">
							<span className="font-medium text-text-soft-400 text-xs uppercase tracking-wider">
								Current Baseline
							</span>
							<div className="grid grid-cols-2 gap-3">
								<MetricCell label="Payroll" value={fmtDollar(basePayroll)} />
								<MetricCell
									label="Billing Cap"
									value={fmtDollar(baseBillingCapacity)}
								/>
								<MetricCell
									label="Multiple"
									value={`${baseMultiple.toFixed(2)}\u00D7`}
								/>
								<MetricCell
									label="Rev Gap"
									value={fmtDollar(Math.abs(baseRevGap))}
									valueClass={
										baseRevGap > 0
											? "text-red-400"
											: baseRevGap < 0
												? "text-emerald-400"
												: undefined
									}
								/>
							</div>
						</div>
					) : null
				}
			</form.Subscribe>
		</FormGrid>
	);
}
