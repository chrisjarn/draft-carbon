/**
 * Core WFP calculations — ported from legacy `carbon-workforce-planner-v58-standalone.html`.
 *
 * These functions compute billing targets, entity billing capacity, and
 * revenue gaps. They are used by tRPC routers (server-side) and can be
 * imported by frontend code for client-side scenario simulations.
 */

// ── FT Hours Lookup ─────────────────────────────────────────────────────────
// Duplicated from apps/web/src/lib/constants.ts so the API package has no
// dependency on the web app. Keep in sync if values change.

const STATE_FT_HOURS: Record<string, number> = {
	nsw: 37.5,
	vic: 38,
	qld: 37.5,
	wa: 37.5,
	sa: 37.5,
};

const ENTITY_FT_HOURS: Record<string, number> = {
	"ent-bne": 38,
	"ent-bun": 38,
	"ent-gym": 38,
	"ent-too": 38,
	"ent-frc": 38,
	"ent-ips": 38,
};

const DEFAULT_FT_HOURS = 37.5;

export function getFTHours(
	stateId?: string | null,
	entityId?: string | null,
): number {
	if (entityId && entityId in ENTITY_FT_HOURS) {
		return ENTITY_FT_HOURS[entityId] ?? DEFAULT_FT_HOURS;
	}
	if (stateId && stateId in STATE_FT_HOURS) {
		return STATE_FT_HOURS[stateId] ?? DEFAULT_FT_HOURS;
	}
	return DEFAULT_FT_HOURS;
}

// ── Role Modifiers ──────────────────────────────────────────────────────────

const ROLE_MODIFIERS: Record<string, number> = {
	doer: 1.0,
	reviewer: 0.7,
	bd: 0.5,
};

/** Default billing multiplier when no entity-level override is set. */
export const DEFAULT_BILLING_MULTIPLIER = 3.5;

// ── Billing Target ──────────────────────────────────────────────────────────

export interface BillingTargetInput {
	/** Annual salary in dollars */
	salary: number;
	/** Weekly working hours (only used for PT staff) */
	hoursPerWeek?: number | null;
	/** Employment type — "PT" for part-time, anything else treated as full-time */
	type?: string | null;
	/** State code for FT hours lookup (e.g. "nsw", "vic") */
	stateId?: string | null;
	/** Entity ID for FT hours override (e.g. "ent-bne") */
	entityId?: string | null;
	/** Role tag: "doer" | "reviewer" | "bd" — affects billing modifier */
	roleTag?: string | null;
	/** Manually entered billing target — takes priority over auto-calculation */
	manualBillingTarget?: number | string | null;
}

/**
 * Calculates the expected billing target for a staff member.
 *
 * Formula: `salary × billingMultiplier × roleModifier × fte`
 *
 * - Manual override (`manualBillingTarget`) takes absolute priority.
 * - `roleModifier`: Doer = 1.0×, Reviewer = 0.7×, BD = 0.5×
 * - `fte`: 1.0 for full-time; `hoursPerWeek / ftHours` for part-time
 * - `billingMultiplier`: entity-level override or default (3.5×)
 */
export function calcBillingTarget(
	staff: BillingTargetInput,
	entityMultiplier?: number | string | null,
): number {
	// Manual override takes absolute priority
	if (staff.manualBillingTarget != null && staff.manualBillingTarget !== "") {
		const manual = Number(staff.manualBillingTarget);
		if (!Number.isNaN(manual) && manual > 0) return manual;
	}

	const salary = Number(staff.salary) || 0;
	if (salary <= 0) return 0;

	const multiplier =
		entityMultiplier != null && Number(entityMultiplier) > 0
			? Number(entityMultiplier)
			: DEFAULT_BILLING_MULTIPLIER;

	const roleTag = (staff.roleTag ?? "doer").toLowerCase();
	const roleMod = ROLE_MODIFIERS[roleTag] ?? 1.0;

	const isPT = staff.type === "PT";
	const ftHours = getFTHours(staff.stateId, staff.entityId);
	const fte = isPT ? (staff.hoursPerWeek ?? ftHours) / ftHours : 1.0;

	return Math.round(salary * multiplier * roleMod * fte);
}

// ── Entity Billing Capacity ─────────────────────────────────────────────────

/**
 * Sum of billing targets for all staff in an entity.
 * This represents the total revenue-generating capacity of the entity.
 */
export function calcEntityBillingCapacity(
	entityStaff: BillingTargetInput[],
	entityMultiplier?: number | string | null,
): number {
	return entityStaff.reduce(
		(sum, s) => sum + calcBillingTarget(s, entityMultiplier),
		0,
	);
}

// ── Revenue Gap ─────────────────────────────────────────────────────────────

/**
 * Calculates the revenue gap for an entity.
 *
 * `gap = revenueTarget - max(revenueActual, billingCapacity)`
 *
 * - Positive gap = shortfall (entity isn't generating enough revenue)
 * - Negative gap = surplus (entity is exceeding its target)
 * - Zero = exactly on target
 */
export function calcRevenueGap(
	revenueTarget: number,
	revenueActual: number,
	billingCapacity: number,
): number {
	return revenueTarget - Math.max(revenueActual, billingCapacity);
}

// ── Pod Budget Helpers ──────────────────────────────────────────────────────

/**
 * Returns the effective budget for a pod.
 * If no budget has been explicitly set, falls back to the sum of member
 * salaries so that the budget ratio is 1.0 (not 0, which would be misleading).
 */
export function getEffectivePodBudget(
	explicitBudget: number | null | undefined,
	totalStaffCost: number,
): { budget: number; hasBudgetSet: boolean } {
	const hasBudgetSet = explicitBudget != null && explicitBudget > 0;
	return {
		budget: hasBudgetSet ? explicitBudget : totalStaffCost,
		hasBudgetSet,
	};
}

/**
 * Returns the budget ratio (staff cost / budget).
 * Clamped to avoid NaN/Infinity when budget is 0.
 */
export function calcBudgetRatio(staffCost: number, budget: number): number {
	if (budget <= 0) return staffCost > 0 ? 1.0 : 0;
	return staffCost / budget;
}

// ── Attrition Risk Auto-Detection ───────────────────────────────────────────

export interface AttritionCandidate {
	id: string;
	name: string;
	isPartner?: boolean;
	seniority?: number | null;
	salary?: number | null;
}

export interface AutoDetectedRisk {
	carboniteId: string;
	name: string;
	riskLevel: "high" | "medium";
	reason: string;
	impact: string;
	score: number;
	factors: { label: string; impact: number }[];
}

/**
 * Auto-detects attrition risks based on seniority and salary thresholds.
 *
 * Thresholds (from legacy app):
 * - **High**: isPartner OR (seniority >= 7 AND salary >= $120,000)
 * - **Medium**: (seniority >= 5 AND salary >= $95,000) OR salary >= $120,000
 *
 * Score factors:
 * - Key person / partner: +3
 * - Senior staff (7+ years): +2
 * - High salary — counteroffers likely (>= $120k): +2
 * - Mid-senior + competitive salary (seniority >= 5, salary >= $95k): +1
 */
export function detectAttritionRisks(
	candidates: AttritionCandidate[],
): AutoDetectedRisk[] {
	const risks: AutoDetectedRisk[] = [];

	for (const cb of candidates) {
		const isPartner = cb.isPartner ?? false;
		const seniority = cb.seniority ?? 0;
		const salary = cb.salary ?? 0;

		const highSeniorHighSalary = seniority >= 7 && salary >= 120_000;
		const midSeniorMidSalary = seniority >= 5 && salary >= 95_000;
		const highSalary = salary >= 120_000;

		// Determine risk level (unchanged thresholds)
		let riskLevel: "high" | "medium" | null = null;
		if (isPartner || highSeniorHighSalary) {
			riskLevel = "high";
		} else if (midSeniorMidSalary || highSalary) {
			riskLevel = "medium";
		}
		if (!riskLevel) continue;

		// Compute contributing factors and numeric score
		const factors: { label: string; impact: number }[] = [];
		if (isPartner) factors.push({ label: "Key person / partner", impact: 3 });
		if (seniority >= 7)
			factors.push({ label: "Senior staff (7+ years)", impact: 2 });
		if (salary >= 120_000)
			factors.push({ label: "High salary — counteroffers likely", impact: 2 });
		if (seniority >= 5 && salary >= 95_000)
			factors.push({ label: "Mid-senior + competitive salary", impact: 1 });
		const score = factors.reduce((sum, f) => sum + f.impact, 0);

		risks.push({
			carboniteId: cb.id,
			name: cb.name,
			riskLevel,
			reason:
				isPartner
					? "Key person / partner dependency"
					: highSeniorHighSalary
						? "Senior staff — high market demand"
						: highSalary
							? "Above-market salary — counteroffers likely"
							: "Mid-senior staff — competitive market",
			impact: riskLevel === "high" ? "Critical" : "Significant",
			score,
			factors,
		});
	}

	return risks;
}

// ── Scenario Impact ─────────────────────────────────────────────────────────

export interface ScenarioRoleInput {
	salary: number;
	count: number;
	roleTag?: string | null;
}

export interface ScenarioImpact {
	/** Total new payroll from scenario roles */
	newPayroll: number;
	/** Total new billing capacity from scenario roles */
	newBillingCapacity: number;
	/** Total new headcount */
	newHeadcount: number;
	/** Base payroll + new payroll */
	revisedPayroll: number;
	/** Base billing capacity + new billing capacity */
	revisedBillingCapacity: number;
	/** Revised billing capacity / revised payroll */
	revisedMultiple: number;
	/** Revenue gap using revised billing capacity */
	revisedRevenueGap: number;
}

/**
 * Calculates the financial impact of adding scenario roles to an entity.
 */
export function calcScenarioImpact(
	roles: ScenarioRoleInput[],
	basePayroll: number,
	baseBillingCapacity: number,
	revenueTarget: number,
	revenueActual: number,
	billingMultiplier?: number | string | null,
): ScenarioImpact {
	const multiplier =
		billingMultiplier != null && Number(billingMultiplier) > 0
			? Number(billingMultiplier)
			: DEFAULT_BILLING_MULTIPLIER;

	let newPayroll = 0;
	let newBillingCapacity = 0;
	let newHeadcount = 0;

	for (const role of roles) {
		const count = role.count || 1;
		const salary = role.salary || 0;
		const roleMod =
			ROLE_MODIFIERS[(role.roleTag ?? "doer").toLowerCase()] ?? 1.0;

		newPayroll += salary * count;
		newBillingCapacity += Math.round(salary * multiplier * roleMod) * count;
		newHeadcount += count;
	}

	const revisedPayroll = basePayroll + newPayroll;
	const revisedBillingCapacity = baseBillingCapacity + newBillingCapacity;
	const revisedMultiple =
		revisedPayroll > 0 ? revisedBillingCapacity / revisedPayroll : 0;
	const revisedRevenueGap = calcRevenueGap(
		revenueTarget,
		revenueActual,
		revisedBillingCapacity,
	);

	return {
		newPayroll,
		newBillingCapacity,
		newHeadcount,
		revisedPayroll,
		revisedBillingCapacity,
		revisedMultiple,
		revisedRevenueGap,
	};
}
