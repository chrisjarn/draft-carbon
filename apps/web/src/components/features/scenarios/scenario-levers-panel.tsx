import {
	ArrowLeft01Icon,
	Delete02Icon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

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
import type { ScenarioData } from "./scenario-card";
import type { ScenarioRoleValues } from "./wizard-types";

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

// ── Types ───────────────────────────────────────────────────────────────────

type EntityDetail = {
	totalPayroll: number;
	billingCapacity: number;
	revenueGap: number;
	staff: { id: string }[];
} | null;

type SaveData = {
	name: string;
	description?: string;
	status: "draft" | "active";
	roles: {
		roleTitle: string;
		sl?: string;
		salary: number;
		count: number;
		employmentType?: string;
		startMonth?: string;
	}[];
};

type Props = {
	scenario: ScenarioData & { entityId: string };
	entityName: string;
	entityDetail: EntityDetail;
	billingMultiplier: string | null;
	hires: ScenarioRoleValues[];
	onHiresChange: (hires: ScenarioRoleValues[]) => void;
	onSave: (data: SaveData) => void;
	isSaving: boolean;
	canWrite: boolean;
};

// ── Component ───────────────────────────────────────────────────────────────

export function ScenarioLeversPanel({
	scenario,
	entityName,
	entityDetail,
	hires,
	onHiresChange,
	onSave,
	isSaving,
	canWrite,
}: Props) {
	const navigate = useNavigate();
	const submitIntent = useRef<"draft" | "active">("draft");

	const headcount = entityDetail?.staff.length ?? 0;
	const basePayroll = entityDetail?.totalPayroll ?? 0;
	const baseBillingCap = entityDetail?.billingCapacity ?? 0;
	const baseRevGap = entityDetail?.revenueGap ?? 0;

	const form = useForm({
		defaultValues: {
			name: scenario.name,
			description: scenario.description ?? "",
			roles:
				hires.length > 0
					? hires
					: [{ roleTitle: "", sl: "", salary: "", count: "1", employmentType: "", startMonth: "" }],
		},
		onSubmit: ({ value }) => {
			const validRoles = value.roles
				.filter((r) => r.roleTitle && r.salary)
				.map((r) => ({
					roleTitle: r.roleTitle,
					sl: r.sl || undefined,
					salary: Number(r.salary),
					count: Number(r.count) || 1,
					employmentType: r.employmentType || undefined,
					startMonth: r.startMonth || undefined,
				}));
			onSave({
				name: value.name,
				description: value.description || undefined,
				status: submitIntent.current,
				roles: validRoles,
			});
		},
	});

	// Sync hires state upward when form roles change
	useEffect(() => {
		const unsub = form.store.subscribe(() => {
			const roles = form.store.state.values.roles;
			onHiresChange(roles);
		});
		return unsub;
	}, [form, onHiresChange]);

	return (
		<div className="flex flex-col overflow-hidden border-r bg-bg-white-0">
			{/* Sticky header */}
			<div className="sticky top-0 z-10 flex items-center justify-between border-b bg-bg-white-0 px-4 py-3">
				<button
					type="button"
					className="flex items-center gap-1.5 text-sm text-text-soft-400 hover:text-text-strong-950"
					onClick={() =>
						void navigate({
							to: "/scenarios",
							search: { entity: scenario.entityId },
						})
					}
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					Back
				</button>
				{/* Read-only entity selector */}
				<Select value={scenario.entityId} disabled>
					<SelectTrigger size="sm" className="w-44 text-xs opacity-70">
						<SelectValue>{entityName}</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={scenario.entityId}>{entityName}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Current state chip strip */}
			{entityDetail && (
				<div className="flex flex-wrap gap-3 border-b bg-bg-weak-50/50 px-4 py-3">
					<MetricCell label="Headcount" value={String(headcount)} />
					<MetricCell label="Payroll" value={fmtDollar(basePayroll)} />
					<MetricCell label="Billing Cap" value={fmtDollar(baseBillingCap)} />
					<MetricCell
						label="Rev Gap"
						value={fmtDollar(Math.abs(baseRevGap))}
						valueClass={baseRevGap > 0 ? "text-red-400" : "text-emerald-400"}
					/>
				</div>
			)}

			{/* Scrollable body */}
			<div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
				{/* Hire blocks */}
				<div>
					<Label className="mb-2 block font-medium text-sm text-text-soft-400 text-xs uppercase tracking-wider">
						Add a Hire
					</Label>
					<form.Field name="roles" mode="array">
						{(rolesField) => (
							<div className="space-y-2">
								{rolesField.state.value.map((_, idx) => (
									<div key={idx} className="space-y-2 rounded-lg border p-3">
										<div className="flex items-center gap-1.5">
											<form.Field name={`roles[${idx}].roleTitle`}>
												{(field) => (
													<Input
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														className="h-8 flex-1 text-sm"
														placeholder="Role title"
														disabled={!canWrite}
													/>
												)}
											</form.Field>
											{rolesField.state.value.length > 1 && canWrite && (
												<Button
													type="button"
													variant="ghost"
													size="icon-sm"
													className="text-red-400 hover:text-red-300"
													onClick={() => rolesField.removeValue(idx)}
												>
													<HugeiconsIcon
														icon={Delete02Icon}
														className="size-3"
													/>
												</Button>
											)}
										</div>
										<div className="flex items-center gap-1.5">
											<form.Field name={`roles[${idx}].sl`}>
												{(field) => (
													<Select
														value={field.state.value || undefined}
														onValueChange={(v) => field.handleChange(v ?? "")}
														disabled={!canWrite}
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
											<form.Field name={`roles[${idx}].employmentType`}>
												{(field) => (
													<Select
														value={field.state.value || undefined}
														onValueChange={(v) => field.handleChange(v ?? "")}
														disabled={!canWrite}
													>
														<SelectTrigger size="sm" className="w-16 text-xs">
															<SelectValue placeholder="FT/PT" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="FT">FT</SelectItem>
															<SelectItem value="PT">PT</SelectItem>
														</SelectContent>
													</Select>
												)}
											</form.Field>
											<form.Field name={`roles[${idx}].startMonth`}>
												{(field) => (
													<Select
														value={field.state.value || undefined}
														onValueChange={(v) => field.handleChange(v ?? "")}
														disabled={!canWrite}
													>
														<SelectTrigger size="sm" className="w-20 text-xs">
															<SelectValue placeholder="Month" />
														</SelectTrigger>
														<SelectContent>
															{MONTHS.map((m) => (
																<SelectItem key={m} value={m}>
																	{m}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												)}
											</form.Field>
										</div>
										<div className="flex items-center gap-1.5">
											<form.Field name={`roles[${idx}].salary`}>
												{(field) => (
													<Input
														type="number"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														className="h-8 w-24 text-sm"
														placeholder="Salary"
														disabled={!canWrite}
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
														disabled={!canWrite}
													/>
												)}
											</form.Field>
										</div>
									</div>
								))}
								{canWrite && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											rolesField.pushValue({
												roleTitle: "",
												sl: "",
												salary: "",
												count: "1",
												employmentType: "",
												startMonth: "",
											})
										}
									>
										<HugeiconsIcon icon={PlusSignIcon} className="mr-1 size-3" />
										Add Role
									</Button>
								)}
							</div>
						)}
					</form.Field>
				</div>

				{/* Scenario name */}
				<div>
					<Label className="mb-2 block font-medium text-text-soft-400 text-xs uppercase tracking-wider">
						Scenario Name
					</Label>
					<form.Field name="name">
						{(field) => (
							<Input
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className="text-sm"
								placeholder="Scenario name"
								disabled={!canWrite}
							/>
						)}
					</form.Field>
				</div>
			</div>

			{/* Sticky footer */}
			{canWrite && (
				<div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-bg-white-0 px-4 py-3">
					<Button
						variant="outline"
						size="sm"
						disabled={isSaving}
						onClick={() => {
							submitIntent.current = "draft";
							void form.handleSubmit();
						}}
					>
						{isSaving ? "Saving..." : "Save Draft"}
					</Button>
					<Button
						size="sm"
						disabled={isSaving}
						onClick={() => {
							submitIntent.current = "active";
							void form.handleSubmit();
						}}
					>
						Activate
					</Button>
				</div>
			)}
		</div>
	);
}
