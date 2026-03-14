import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	Delete02Icon,
	PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBar } from "@/components/ui/category-bar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DEFAULT_BILLING_MULT } from "@/lib/constants";
import { fmtDollar } from "@/lib/format";
import { cn } from "@/lib/utils";


// ── Types ───────────────────────────────────────────────────────────────────

export type ScenarioRole = {
	id: string;
	roleTitle: string;
	sl: string | null;
	salary: number;
	count: number;
	employmentType?: string | null;
	startMonth?: string | null;
};

export type ScenarioData = {
	id: string;
	name: string;
	description: string | null;
	color: string | null;
	roles: ScenarioRole[];
};

export type ScenarioImpact = {
	newPayroll: number;
	newBilling: number;
	revisedPayroll: number;
	revisedBillingCap: number;
	revisedMultiple: number;
	revisedRevGap: number;
	deltaPayroll: number;
	deltaBilling: number;
	deltaMultiple: number;
	deltaRevGap: number;
	headcount: number;
};

// ── Constants ───────────────────────────────────────────────────────────────

export const PRESET_COLORS = [
	"#4CAF50",
	"#2196F3",
	"#FF8C00",
	"#7B2FBE",
	"#F76707",
	"#F5C518",
	"#e84040",
	"#12B886",
];

// ── Impact Calculation ──────────────────────────────────────────────────────

export function calcScenarioImpact(
	roles: { salary: number; count: number }[],
	basePayroll: number,
	baseBillingCapacity: number,
	revenueTarget: number,
	revenueActual: number,
	billingMultiplier: string | null,
): ScenarioImpact {
	const multiplier = Number(billingMultiplier) || DEFAULT_BILLING_MULT;
	const newPayroll = roles.reduce((s, r) => s + r.salary * r.count, 0);
	const newBilling = roles.reduce(
		(s, r) => s + Math.round(r.salary * multiplier) * r.count,
		0,
	);
	const revisedPayroll = basePayroll + newPayroll;
	const revisedBillingCap = baseBillingCapacity + newBilling;
	const revisedMultiple =
		revisedPayroll > 0 ? revisedBillingCap / revisedPayroll : 0;
	const baseMultiple = basePayroll > 0 ? baseBillingCapacity / basePayroll : 0;
	const baseRevGap =
		revenueTarget - Math.max(revenueActual, baseBillingCapacity);
	const revisedRevGap =
		revenueTarget - Math.max(revenueActual, revisedBillingCap);
	const headcount = roles.reduce((s, r) => s + r.count, 0);

	return {
		newPayroll,
		newBilling,
		revisedPayroll,
		revisedBillingCap,
		revisedMultiple,
		revisedRevGap,
		deltaPayroll: newPayroll,
		deltaBilling: newBilling,
		deltaMultiple: revisedMultiple - baseMultiple,
		deltaRevGap: revisedRevGap - baseRevGap,
		headcount,
	};
}

// ── Format Helpers ──────────────────────────────────────────────────────────

function fmtMultiple(v: number): string {
	return `${v.toFixed(2)}\u00D7`;
}

function fmtDelta(v: number): string {
	return fmtDollar(v);
}

function fmtMultipleDelta(v: number): string {
	return `${v.toFixed(2)}`;
}

// ── Delta Badge ─────────────────────────────────────────────────────────────

export function DeltaBadge({
	value,
	formatter,
	invertColor = false,
}: {
	value: number;
	formatter: (v: number) => string;
	/** When true, positive = bad (red), negative = good (green). E.g. rev gap. */
	invertColor?: boolean;
}) {
	if (value === 0) return null;
	const isPositive = value > 0;
	const isGood = invertColor ? !isPositive : isPositive;
	const Icon = isPositive ? ArrowUp01Icon : ArrowDown01Icon;

	return (
		<Badge
			variant="outline"
			size="sm"
			className={cn(
				"gap-0.5 font-normal tabular-nums",
				isGood
					? "border-emerald-500/30 text-emerald-500"
					: "border-red-500/30 text-red-500",
			)}
		>
			<HugeiconsIcon icon={Icon} className="size-2.5" />
			{formatter(Math.abs(value))}
		</Badge>
	);
}

// ── Metric Row ──────────────────────────────────────────────────────────────

export function MetricRow({
	label,
	baseValue,
	revisedValue,
	delta,
	formatter,
	suffix,
	invertDeltaColor = false,
}: {
	label: string;
	baseValue: string;
	revisedValue: string;
	delta: number;
	formatter: (v: number) => string;
	suffix?: string;
	invertDeltaColor?: boolean;
}) {
	return (
		<div className="grid grid-cols-2 gap-4">
			<div className="flex items-center justify-between">
				<span className="text-text-soft-400 text-xs">{label}</span>
				<span className="font-medium text-sm tabular-nums">
					{baseValue}
					{suffix}
				</span>
			</div>
			<div className="flex items-center justify-between gap-1.5">
				<span className="text-text-soft-400 text-xs">{label}</span>
				<span className="flex items-center gap-1.5">
					<span className="font-medium text-sm tabular-nums">
						{revisedValue}
						{suffix}
					</span>
					<DeltaBadge
						value={delta}
						formatter={formatter}
						invertColor={invertDeltaColor}
					/>
				</span>
			</div>
		</div>
	);
}

// ── Scenario Card ───────────────────────────────────────────────────────────

export function ScenarioCard({
	scenario: sc,
	basePayroll,
	baseBillingCapacity,
	baseMultiple,
	baseRevGap,
	revenueTarget,
	revenueActual,
	billingMultiplier,
	hasWriteAccess,
	onDelete,
	onEdit,
}: {
	scenario: ScenarioData;
	basePayroll: number;
	baseBillingCapacity: number;
	baseMultiple: number;
	baseRevGap: number;
	revenueTarget: number;
	revenueActual: number;
	billingMultiplier: string | null;
	hasWriteAccess: boolean;
	onDelete: () => void;
	onEdit?: () => void;
}) {
	const impact = useMemo(
		() =>
			calcScenarioImpact(
				sc.roles,
				basePayroll,
				baseBillingCapacity,
				revenueTarget,
				revenueActual,
				billingMultiplier,
			),
		[
			sc.roles,
			basePayroll,
			baseBillingCapacity,
			revenueTarget,
			revenueActual,
			billingMultiplier,
		],
	);

	// CategoryBar values — normalized to the higher of the two totals for scale
	const currentBarTotal = baseBillingCapacity || 1;
	const revisedBarTotal = impact.revisedBillingCap || 1;
	const maxBarValue = Math.max(currentBarTotal, revisedBarTotal);

	// Current state bar: [payroll | remaining capacity]
	const currentBarValues = [
		basePayroll,
		Math.max(0, baseBillingCapacity - basePayroll),
	];
	// Pad to match max scale
	if (baseBillingCapacity < maxBarValue) {
		currentBarValues.push(maxBarValue - baseBillingCapacity);
	}

	// Revised bar: [base payroll | new payroll | remaining capacity]
	const revisedRemainingCap = Math.max(
		0,
		impact.revisedBillingCap - impact.revisedPayroll,
	);
	const revisedBarValues = [
		basePayroll,
		impact.newPayroll,
		revisedRemainingCap,
	];
	if (impact.revisedBillingCap < maxBarValue) {
		revisedBarValues.push(maxBarValue - impact.revisedBillingCap);
	}

	return (
		<Card
			className={cn(
				"relative overflow-hidden rounded-xl border border-stroke-soft-200/80 transition-all duration-150",
				"hover:border-stroke-soft-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
				"dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
			)}
		>
			<div
				className="absolute top-0 left-0 h-full w-1"
				style={{ backgroundColor: sc.color ?? "#666" }}
			/>

			{/* Header */}
			<CardHeader className="pb-2 pl-5">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-semibold">{sc.name}</CardTitle>
					<div className="flex items-center gap-1">
						{onEdit && (
							<Button variant="ghost" size="icon-xs" onClick={onEdit}>
								<HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
							</Button>
						)}
						{hasWriteAccess && (
							<Button
								variant="ghost"
								size="icon-xs"
								className="text-red-400 hover:text-red-300"
								onClick={onDelete}
							>
								<HugeiconsIcon icon={Delete02Icon} className="size-3" />
							</Button>
						)}
					</div>
				</div>
				{sc.description && (
					<p className="text-text-soft-400 text-xs">{sc.description}</p>
				)}
			</CardHeader>

			<CardContent className="space-y-3 pl-5">
				{/* Split-Panel Comparison */}
				<div className="rounded-lg border border-stroke-soft-200/60 dark:border-neutral-800">
					{/* Column Headers */}
					<div className="grid grid-cols-2 gap-4 border-b border-stroke-soft-200/60 bg-neutral-50/50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-800/30">
						<span className="font-medium text-[10px] text-text-soft-400 uppercase tracking-wider">
							Current State
						</span>
						<span className="font-medium text-[10px] text-text-soft-400 uppercase tracking-wider">
							With Scenario
						</span>
					</div>

					{/* Metrics */}
					<div className="space-y-2 px-3 py-2.5">
						<MetricRow
							label="Payroll"
							baseValue={fmtDollar(basePayroll)}
							revisedValue={fmtDollar(impact.revisedPayroll)}
							delta={impact.deltaPayroll}
							formatter={fmtDelta}
						/>
						<MetricRow
							label="Billing Cap"
							baseValue={fmtDollar(baseBillingCapacity)}
							revisedValue={fmtDollar(impact.revisedBillingCap)}
							delta={impact.deltaBilling}
							formatter={fmtDelta}
						/>
						<MetricRow
							label="Multiple"
							baseValue={fmtMultiple(baseMultiple)}
							revisedValue={fmtMultiple(impact.revisedMultiple)}
							delta={impact.deltaMultiple}
							formatter={fmtMultipleDelta}
						/>
						<MetricRow
							label="Rev Gap"
							baseValue={fmtDollar(baseRevGap)}
							revisedValue={fmtDollar(impact.revisedRevGap)}
							delta={impact.deltaRevGap}
							formatter={fmtDelta}
							invertDeltaColor
						/>
					</div>

					{/* CategoryBar comparison */}
					<div className="grid grid-cols-2 gap-4 border-t border-stroke-soft-200/60 px-3 py-2.5 dark:border-neutral-800">
						<div>
							<CategoryBar
								values={currentBarValues}
								colors={
									baseBillingCapacity < maxBarValue
										? ["emerald", "gray", "gray"]
										: ["emerald", "gray"]
								}
								showLabels={false}
							/>
							<div className="mt-1 flex items-center gap-2 text-[10px] text-text-soft-400">
								<span className="flex items-center gap-1">
									<span className="inline-block size-1.5 rounded-full bg-emerald-500" />
									Payroll
								</span>
								<span className="flex items-center gap-1">
									<span className="inline-block size-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
									Capacity
								</span>
							</div>
						</div>
						<div>
							<CategoryBar
								values={revisedBarValues}
								colors={
									impact.revisedBillingCap < maxBarValue
										? ["emerald", "amber", "gray", "gray"]
										: ["emerald", "amber", "gray"]
								}
								showLabels={false}
							/>
							<div className="mt-1 flex items-center gap-2 text-[10px] text-text-soft-400">
								<span className="flex items-center gap-1">
									<span className="inline-block size-1.5 rounded-full bg-emerald-500" />
									Base
								</span>
								<span className="flex items-center gap-1">
									<span className="inline-block size-1.5 rounded-full bg-amber-500" />
									New
								</span>
								<span className="flex items-center gap-1">
									<span className="inline-block size-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
									Capacity
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Roles Table */}
				{sc.roles.length > 0 && (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Role</TableHead>
								<TableHead>SL</TableHead>
								<TableHead className="text-right">Salary</TableHead>
								<TableHead className="text-right">Count</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sc.roles.map((role) => (
								<TableRow key={role.id}>
									<TableCell className="text-sm">{role.roleTitle}</TableCell>
									<TableCell className="text-sm text-text-soft-400">
										{role.sl || "\u2014"}
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{fmtDollar(role.salary)}
									</TableCell>
									<TableCell className="text-right text-sm tabular-nums">
										{role.count}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}

				{/* Summary footer */}
				<div className="flex items-center gap-4 text-xs">
					<span className="text-text-soft-400">
						Payroll:{" "}
						<span className="font-medium text-text-strong-950 tabular-nums">
							+{fmtDollar(impact.newPayroll)}
						</span>
					</span>
					<span className="text-text-soft-400">
						Headcount:{" "}
						<span className="font-medium text-text-strong-950 tabular-nums">
							+{impact.headcount}
						</span>
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
