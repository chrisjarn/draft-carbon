import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";

import { PerfBadge } from "@/components/molecules/perf-badge";
import { RiskBadge } from "@/components/molecules/risk-badge";
import {
	SheetGroup as Group,
	SheetRow as Row,
} from "@/components/molecules/sheet-detail";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDollar, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import type { Carbonite } from "./types";
import {
	officeLabel,
	seniorityLabel,
	sgLabel,
	slLabel,
	stateName,
} from "./types";

type StaffMeta = {
	perfRating: string | null;
	billingTarget: string | null;
	billingActual: string | null;
	roleTag: string | null;
	promoFlag: string | null;
	promoEta: string | null;
};

type AttritionRisk = {
	riskLevel: string;
	reason: string | null;
	action: string | null;
	score?: number;
	factors?: { label: string; impact: number }[];
};

// ── Internal types for salary bracket data ────────────────────────────────────

type StateRange = {
	m: [number, number] | null;
	r: [number, number];
} | null;

type BracketRow = {
	id: string;
	sl: string;
	role: string;
	nsw: StateRange;
	qld: StateRange;
	sa: StateRange;
	vic: StateRange;
	wa: StateRange;
};

function getBracketMarketRange(
	bracket: BracketRow,
	state: string | null,
): { min: number; max: number } | null {
	if (!state) return null;
	const stateKey = state.toLowerCase() as keyof Pick<
		BracketRow,
		"nsw" | "qld" | "sa" | "vic" | "wa"
	>;
	const range = bracket[stateKey];
	if (!range) return null;
	if (range.m) return { min: range.m[0], max: range.m[1] };
	return { min: range.r[0], max: range.r[1] };
}

// ── SalaryMarketBar ───────────────────────────────────────────────────────────

function SalaryMarketBar({
	salary,
	sl,
	state,
}: {
	salary: number;
	sl: string;
	state: string | null;
}) {
	const bracketsQuery = useQuery({
		...trpc.salaryBrackets.getBySl.queryOptions({ sl }),
		enabled: !!sl,
	});

	if (bracketsQuery.isPending) {
		return <Skeleton className="h-2 w-full rounded-full" />;
	}

	const brackets = (bracketsQuery.data ?? []) as BracketRow[];

	// Find first bracket with a valid range for this state
	let market: { min: number; max: number } | null = null;
	for (const b of brackets) {
		const range = getBracketMarketRange(b, state);
		if (range) {
			market = range;
			break;
		}
	}

	if (!market) {
		return (
			<span className="text-text-soft-400 text-xs">No benchmark data</span>
		);
	}

	const { min, max } = market;
	const midpoint = (min + max) / 2;
	const range = max - min;
	const pct =
		range === 0
			? 0
			: Math.max(0, Math.min(100, ((salary - min) / range) * 100));

	const dotColor =
		salary < min
			? "bg-red-500"
			: salary >= midpoint
				? "bg-green-500"
				: "bg-yellow-500";

	const belowBy = min - salary;
	const label =
		salary < min
			? `Below market by $${Math.round(belowBy / 1_000)}k`
			: salary > max
				? "Above market median"
				: "Within market range";

	const labelColor =
		salary < min
			? "text-red-600"
			: salary < midpoint
				? "text-amber-600"
				: "text-text-soft-400";

	return (
		<div className="flex w-full flex-col gap-1.5">
			<div className="relative h-2 w-full rounded-full bg-bg-weak-50">
				<div
					className={cn(
						"absolute size-3 rounded-full border-2 border-bg-white-0 shadow-sm",
						dotColor,
					)}
					style={{ left: `${pct}%`, top: "50%", transform: "translate(-50%, -50%)" }}
				/>
			</div>
			<div className="flex justify-between text-[10px] text-text-soft-400 tabular-nums">
				<span>{fmtDollar(min)}</span>
				<span>{fmtDollar(max)}</span>
			</div>
			<p className={cn("text-pretty text-xs", labelColor)}>{label}</p>
		</div>
	);
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

export function CarboniteDetailSheet({
	carbonite,
	onClose,
	onEdit,
	onDelete,
	canWriteAccess,
	canAdminAccess,
	staffMeta,
	attritionRisk,
	entitiesMap,
	carbonitesMap,
}: {
	carbonite: Carbonite | null;
	onClose: () => void;
	onEdit: (c: Carbonite) => void;
	onDelete: (c: Carbonite) => void;
	canWriteAccess: boolean;
	canAdminAccess: boolean;
	staffMeta?: StaffMeta | null;
	attritionRisk?: AttritionRisk | null;
	/** entity id → business name */
	entitiesMap?: Map<string, string>;
	/** carbonite id → name, for resolving reportsTo */
	carbonitesMap?: Map<string, string>;
}) {
	const billingPct = (() => {
		if (!staffMeta?.billingTarget || !staffMeta?.billingActual) return null;
		const t = Number(staffMeta.billingTarget);
		const a = Number(staffMeta.billingActual);
		return t > 0 ? Math.round((a / t) * 100) : null;
	})();

	return (
		<Sheet open={!!carbonite} onOpenChange={(open) => !open && onClose()}>
			<SheetContent>
				{carbonite && (
					<>
						{/* ── Header: avatar + name + role, salary right ── */}
						<SheetHeader>
							<div className="flex items-start justify-between gap-3 pr-6">
								<div className="flex items-center gap-3">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-text-strong-950 font-semibold text-bg-white-0 text-sm ring-2 ring-emerald-500/30">
										{initials(carbonite.name)}
									</div>
									<div className="min-w-0">
										<SheetTitle className="text-balance text-lg leading-tight">
											{carbonite.name}
										</SheetTitle>
										<p className="text-sm text-text-soft-400">
											{carbonite.role ?? "—"}
										</p>
									</div>
								</div>
								{carbonite.salary ? (
									<span className="shrink-0 font-semibold text-sm text-text-strong-950 tabular-nums">
										${carbonite.salary.toLocaleString()}
									</span>
								) : null}
							</div>
						</SheetHeader>

						{/* ── Body ── */}
						<SheetPanel>
							<Group title="Organisation">
								<Row label="Service Line" value={slLabel(carbonite.sl)} />
								<Row
									label="Sub Group"
									value={sgLabel(carbonite.sl, carbonite.sg)}
								/>
								<Row label="State" value={stateName(carbonite.state)} />
								<Row label="Office" value={officeLabel(carbonite.office)} />
								<Row label="Pod" value={carbonite.pod} />
								<Row
									label="Entity"
									value={
										carbonite.entity
											? (entitiesMap?.get(carbonite.entity) ?? carbonite.entity)
											: undefined
									}
								/>
								<Row
									label="Reports To"
									value={
										carbonite.reportsTo
											? (carbonitesMap?.get(carbonite.reportsTo) ??
												carbonite.reportsTo)
											: undefined
									}
								/>
							</Group>

							<Group title="Employment">
								<Row label="Type" value={carbonite.type} />
								<Row label="Location" value={carbonite.location} />
								<Row label="Hours / week" value={carbonite.hours} />
								<Row
									label="Seniority"
									value={`${carbonite.seniority} — ${seniorityLabel(carbonite.seniority)}`}
								/>
								<Row
									label="Partner"
									value={carbonite.isPartner ? "Yes" : "No"}
								/>
								{carbonite.sl && carbonite.salary ? (
									<Row label="vs Market">
										<SalaryMarketBar
											salary={carbonite.salary}
											sl={carbonite.sl}
											state={carbonite.state}
										/>
									</Row>
								) : null}
							</Group>

							{staffMeta && (
								<Group title="Performance">
									<Row label="Perf Rating">
										<PerfBadge rating={staffMeta.perfRating} />
									</Row>
									<Row
										label="Billing Target"
										value={
											staffMeta.billingTarget
												? `$${Number(staffMeta.billingTarget).toLocaleString()}`
												: undefined
										}
									/>
									<Row
										label="Billing Actual"
										value={
											staffMeta.billingActual
												? `$${Number(staffMeta.billingActual).toLocaleString()}${billingPct !== null ? ` (${billingPct}%)` : ""}`
												: undefined
										}
									/>
									<Row label="Role Tag" value={staffMeta.roleTag} />
									<Row label="Promo Flag" value={staffMeta.promoFlag} />
									<Row label="Promo ETA" value={staffMeta.promoEta} />
								</Group>
							)}

							{attritionRisk && (
								<Group title="Attrition Risk">
									<Row label="Risk Level">
										<div className="flex items-center gap-2">
											<RiskBadge level={attritionRisk.riskLevel} />
											{attritionRisk.score != null && (
												<span className="text-text-soft-400 text-xs tabular-nums">
													Score: {attritionRisk.score}
												</span>
											)}
										</div>
									</Row>

									{attritionRisk.factors &&
										attritionRisk.factors.length > 0 && (
											<Row label="Factors">
												<div className="flex flex-wrap justify-end gap-1.5">
													{attritionRisk.factors.map((f) => (
														<span
															key={f.label}
															className={cn(
																"inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
																f.impact > 0
																	? "border-red-200 bg-red-50 text-red-700"
																	: "border-green-200 bg-green-50 text-green-700",
															)}
														>
															{f.impact > 0 ? "↑" : "↓"} {f.label}
															<span className="tabular-nums opacity-70">
																({f.impact > 0 ? "+" : ""}
																{f.impact})
															</span>
														</span>
													))}
												</div>
											</Row>
										)}

									<Row label="Action Plan" value={attritionRisk.action} />
								</Group>
							)}
						</SheetPanel>

						{/* ── Footer ── */}
						{canWriteAccess && (
							<SheetFooter>
								<Button
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => onEdit(carbonite)}
								>
									<HugeiconsIcon
										icon={PencilEdit01Icon}
										className="mr-1.5 size-3.5"
										aria-hidden="true"
									/>
									Edit
								</Button>
								{canAdminAccess && (
									<Button
										size="sm"
										variant="destructive"
										onClick={() => onDelete(carbonite)}
									>
										<HugeiconsIcon
											icon={Delete02Icon}
											className="size-3.5"
											aria-hidden="true"
										/>
									</Button>
								)}
							</SheetFooter>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}
