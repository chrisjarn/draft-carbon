import type {
	FormAsyncValidateOrFn,
	FormValidateOrFn,
	ReactFormExtendedApi,
} from "@tanstack/react-form";

import type { calcScenarioImpact } from "./scenario-card";

// ── Wizard shared types & constants ─────────────────────────────────────────

export type WizardStep = 0 | 1 | 2;

export const STEP_LABELS = ["Context", "Details", "Roles"] as const;

export type EntityOption = { id: string; biz: string; state: string | null };

export type WizardProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Pre-fill from page-level selectors */
	initialEntityId?: string;
	initialFy?: string;
	entities: EntityOption[];
};

// ── Form values ─────────────────────────────────────────────────────────────

export type ScenarioRoleValues = {
	roleTitle: string;
	sl: string;
	salary: string;
	count: string;
};

export type WizardFormValues = {
	entityId: string;
	fy: string;
	name: string;
	description: string;
	color: string;
	roles: ScenarioRoleValues[];
};

export function defaultWizardValues(
	initialEntityId?: string,
	initialFy?: string,
	defaultFy?: string,
	defaultColor?: string,
): WizardFormValues {
	return {
		entityId: initialEntityId ?? "",
		fy: initialFy ?? defaultFy ?? "",
		name: "",
		description: "",
		color: defaultColor ?? "#4CAF50",
		roles: [{ roleTitle: "", sl: "", salary: "", count: "1" }],
	};
}

// ── Shared form type ────────────────────────────────────────────────────────

type V = FormValidateOrFn<WizardFormValues> | undefined;
type A = FormAsyncValidateOrFn<WizardFormValues> | undefined;

export type WizardForm = ReactFormExtendedApi<
	WizardFormValues,
	V, // TOnMount
	V, // TOnChange
	A, // TOnChangeAsync
	V, // TOnBlur
	A, // TOnBlurAsync
	V, // TOnSubmit
	A, // TOnSubmitAsync
	V, // TOnDynamic
	A, // TOnDynamicAsync
	A, // TOnServer
	unknown // TSubmitMeta
>;

// ── Step prop types ─────────────────────────────────────────────────────────

export type StepContextProps = {
	form: WizardForm;
	entities: EntityOption[];
	basePayroll: number;
	baseBillingCapacity: number;
	baseMultiple: number;
	baseRevGap: number;
	hasDetail: boolean;
};

export type StepDetailsProps = {
	form: WizardForm;
};

export type StepRolesProps = {
	form: WizardForm;
	impact: ReturnType<typeof calcScenarioImpact>;
	hasValidRoles: boolean;
};

// ── Shared sub-component props ──────────────────────────────────────────────

export type MetricCellProps = {
	label: string;
	value: string;
	valueClass?: string;
};
