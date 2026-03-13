import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
import { initials } from "@/lib/format";
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
};

// ── Tremor-style sheet primitives ─────────────────────────────────────────────

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
										<SheetTitle className="text-lg leading-tight">
											{carbonite.name}
										</SheetTitle>
										<p className="text-text-soft-400 text-sm">
											{carbonite.role ?? "—"}
										</p>
									</div>
								</div>
								{carbonite.salary ? (
									<span className="shrink-0 font-semibold text-text-strong-950 text-sm tabular-nums">
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
										<RiskBadge level={attritionRisk.riskLevel} />
									</Row>
									<Row label="Reason" value={attritionRisk.reason} />
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
