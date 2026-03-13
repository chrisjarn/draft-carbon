# Build Plan — P2: Calculations, Simulator & Missing UI

> Generated from legacy gap analysis + Tremor template reference
> Stack: shadcn/ui + Recharts (via shadcn chart.tsx) + Tremor ports (ProgressCircle, CategoryBar)
> All charts use shadcn chart wrapper. All UI uses shadcn components. Icons: Hugeicons only.
> Handoff notes: `~/.claude/handoffs/carbon-wfp-p2-build-2026-03-04.md`

## Progress as of 2026-03-04

- [x] Phase 1.1 — `calcBillingTarget()` *(packages/api/src/lib/calculations.ts)*
- [x] Phase 1.2 — `calcEntityBillingCapacity()`
- [x] Phase 1.3 — `calcRevenueGap()`
- [x] Phase 1.4 — Pod budget fallback *(pod-budgets-tab.tsx)*
- [x] Phase 1.5 — Attrition auto-detect procedure *(wfp-extended.ts)*
- [x] Phase 1.6 — Wire billingCapacity into entityDetail *(types fixed, billingCapacity+revenueGap+meta wired)*
- [x] Phase 1.7 — Entity billing multiplier *(already existed)*
- [x] Phase 2 — Tremor ports *(ProgressCircle + CategoryBar ported to shadcn/zinc+emerald)*
- [x] Phase 3 — Scenario simulator *(split-panel comparison UI with calcScenarioImpact)*
- [x] Phase 4 — Entity detail sections *(Revenue Strip, CompBudget, SalaryBenchmarks, EntityStaff, AutoCalc tooltip, PlanningSettings)*
- [x] Phase 5 — Dashboard + Hiring + Admin gaps *(BudgetPayrollChart, SalaryBracketsPanel, EditEntityDialog, Attrition auto-detect, Global FY selector)*

---

## Overview

This plan closes the remaining gaps between the legacy HTML app and the modern rebuild. The work is organized into 5 phases, ordered by dependency chain:

```
Phase 1: Core Calculations (backend)     — unlocks everything
Phase 2: Tremor Component Ports           — UI primitives for phases 3-5
Phase 3: Scenario Simulator (split-panel) — the "simulator thing"
Phase 4: Entity Detail Sections           — CompBudget, Benchmarks, Staff
Phase 5: Dashboard + Hiring + Admin gaps  — remaining UI
```

---

## Phase 1 — Core Calculations (Backend)

The keystone. All downstream features depend on these formulas.

### 1.1 `calcBillingTarget()` utility

**Location:** `packages/api/src/lib/calculations.ts` (new file)

**Formula:**
```ts
function calcBillingTarget(staff: {
  salary: number
  hoursPerWeek?: number
  type?: "FT" | "PT"
  stateId?: string
  entityId?: string
  staffRole?: "Doer" | "Reviewer" | "BD"
  manualBillingTarget?: number | null
}, entityMultiplier?: number): number {
  // Manual override takes priority
  if (staff.manualBillingTarget) return staff.manualBillingTarget

  const multiplier = entityMultiplier ?? 3.5  // DEFAULT_BILLING_MULT
  const roleMod = { Doer: 1.0, Reviewer: 0.7, BD: 0.5 }[staff.staffRole ?? "Doer"] ?? 1.0
  const fte = staff.type === "PT"
    ? (staff.hoursPerWeek ?? 37.5) / getFTHours(staff.stateId, staff.entityId)
    : 1.0

  return Math.round(staff.salary * multiplier * roleMod * fte)
}
```

**Depends on:** `getFTHours()` — already exists in `apps/web/src/lib/constants.ts`. Need to extract to a shared location or duplicate in API package.

**Tests:** Unit tests for each role modifier, PT vs FT, manual override, entity multiplier override.

### 1.2 `calcEntityBillingCapacity()` utility

**Location:** Same file as above.

```ts
function calcEntityBillingCapacity(
  entityStaff: StaffWithMeta[],
  entityMultiplier?: number
): number {
  return entityStaff.reduce(
    (sum, s) => sum + calcBillingTarget(s, entityMultiplier), 0
  )
}
```

### 1.3 `calcRevenueGap()` utility

```ts
function calcRevenueGap(
  revenueTarget: number,
  revenueActual: number,
  billingCapacity: number
): number {
  return revenueTarget - Math.max(revenueActual, billingCapacity)
  // Positive = shortfall, Negative = surplus
}
```

### 1.4 `getPodBudget()` fallback logic

**Location:** `packages/api/src/routers/pod-budgets.ts`

**Change:** When no budget is set for a pod, fallback to sum of member salaries (ratio = 1.0, not 0). Add `hasBudgetSet: boolean` flag to the response so frontend can distinguish "no budget" from "$0 budget".

### 1.5 `regenAttritionRisks()` auto-detection

**Location:** `packages/api/src/routers/wfp-extended.ts`

**New procedure:** `attritionRisks.autoDetect` — runs the threshold logic:
- High: isPartner OR (seniority >= 7 AND salary >= $120k)
- Medium: (seniority >= 5 AND salary >= $95k) OR salary >= $120k

Returns suggested risks. Frontend merges with manually flagged ones.

### 1.6 Wire `billingCapacity` + `revenueGap` into `wfp.entityDetail` response

**Location:** `packages/api/src/routers/wfp.ts`

Add computed `billingCapacity` and `revenueGap` fields to the entity detail query response. Uses the new calc functions.

### 1.7 Entity billing multiplier storage

**Location:** DB schema — check if `wfp_entity_settings` table exists. If not, add `billingMultiplier` column to entities table or create a settings table.

**Default:** 3.5x. Per-entity override.

---

## Phase 2 — Tremor Component Ports

Port 2 components from `apps/web/template-overview-main/src/components/` into our shadcn component library. Restyle to zinc/emerald theme.

### 2.1 `ProgressCircle` component

**Source:** `template-overview-main/src/components/ProgressCircle.tsx`
**Target:** `apps/web/src/components/ui/progress-circle.tsx`

**Changes from Tremor:**
- Replace `tailwind-variants` with `cn()` (our utility)
- Replace color palette: blue → emerald (default), grey → zinc
- Remove `tremor-id` attribute
- Keep variants: default, neutral, warning, error, success

### 2.2 `CategoryBar` component

**Source:** `template-overview-main/src/components/CategoryBar.tsx`
**Target:** `apps/web/src/components/ui/category-bar.tsx`

**Changes from Tremor:**
- Replace `tailwind-variants` imports with `cn()`
- Use our Tooltip component (`@/components/ui/tooltip`) instead of Tremor's
- Restyle colors to zinc/emerald palette
- Remove `tremor-id` attribute
- Replace `@/lib/chartUtils` color system with a simpler color map for our use cases

---

## Phase 3 — Scenario Simulator (Split-Panel)

The "simulator thing." Replaces the current simple scenario cards with a full what-if financial planning tool.

### 3.1 Refactor `ScenarioWorkbenchSection`

**File:** `apps/web/src/components/capacity-plan/scenario-workbench-section.tsx`

**Current state:** Simple cards with name, roles list, totalPayroll, totalHeadcount.

**Target state — Split-Panel Layout:**

```
┌─────────────────────────────────────────────────┐
│ Controls                                         │
│ ┌─────────────────┐  ┌────────────────────────┐ │
│ │ Billing Mult.   │  │ SL toggles (checkboxes)│ │
│ │ [====|====] 3.5x │  │ ☑ Acc  ☑ BKK  ☑ Tax  │ │
│ └─────────────────┘  └────────────────────────┘ │
├─────────────────────┬───────────────────────────┤
│  CURRENT STATE      │  WITH SCENARIO            │
│                     │                           │
│  Payroll   $1.2M    │  Payroll    $1.45M  ↑$250k│
│  Billing   $4.2M    │  Billing    $5.1M   ↑$875k│
│  Multiple  3.5×     │  Multiple   3.52×   ↑0.02 │
│  Rev Gap   -$200k   │  Rev Gap    -$75k   ↑$125k│
│                     │                           │
│  ── CategoryBar ──  │  ── CategoryBar ──        │
│  [payroll|hiring|rem]│  [payroll|hiring|rem]     │
├─────────────────────┴───────────────────────────┤
│ Scenario Roles                                   │
│ ┌───────────┬──────┬────────┬───────┐           │
│ │ Role      │ SL   │ Salary │ Count │ [+Add]    │
│ │ Sr Acc    │ ACC  │ $95k   │ 2     │           │
│ │ Bkkpr     │ BKK  │ $65k   │ 1     │           │
│ └───────────┴──────┴────────┴───────┘           │
└─────────────────────────────────────────────────┘
```

**shadcn components used:**
- `Card` — outer container + metric panels
- `Slider` — billing multiplier adjustment
- `Checkbox` — SL include/exclude toggles
- `Badge` — delta indicators (↑$250k)
- `Table` — scenario roles list
- `CategoryBar` — budget breakdown bar (ported from Tremor in Phase 2)
- `Button` — Add Role, Reset, Delete
- `AppDialog` — Add/Edit scenario dialog (already exists)

**Key computation (client-side):**
```ts
const scenarioStats = useMemo(() => {
  const newPayroll = roles.reduce((s, r) => s + r.salary * r.count, 0)
  const newBilling = roles.reduce((s, r) =>
    s + calcBillingTarget({ salary: r.salary, staffRole: "Doer" }, multiplier) * r.count, 0)
  const revisedBillingCap = baseBillingCapacity + newBilling
  const revisedMultiple = revisedBillingCap / (basePayroll + newPayroll)
  const revisedRevGap = revenueTarget - Math.max(revenueActual, revisedBillingCap)
  return { newPayroll, newBilling, revisedBillingCap, revisedMultiple, revisedRevGap }
}, [roles, multiplier, baseBillingCapacity, basePayroll, revenueTarget, revenueActual])
```

---

## Phase 4 — Entity Detail Sections

New sections inside `EntityDetailPanel` (in `firm-tab.tsx`).

### 4.1 Expand Revenue Strip (2 new metrics)

**File:** `apps/web/src/components/capacity-plan/firm-tab.tsx`

Current: Actual / Target / %
Add: **Billing Capacity** and **Revenue Gap** (from the new `wfp.entityDetail` response).

Gap alert: If revenueGap > 0, show a small alert with hire recommendation text.

### 4.2 `CompBudgetSection`

**New file:** `apps/web/src/components/capacity-plan/comp-budget-section.tsx`

**Layout:** 4-metric row + CategoryBar
- Total Payroll (sum of salaries for entity)
- Open Hiring Cost (avg salary of open hiring roles for this entity)
- Projected Total (payroll + hiring cost)
- Billing Multiple (billingCapacity / projectedTotal)
- CategoryBar showing payroll vs hiring cost vs remaining capacity

**Backend:** Join hiring data into `wfp.entityDetail` — sum salaries of open roles for the entity's state/SLs.

### 4.3 `SalaryBenchmarksSection`

**New file:** `apps/web/src/components/capacity-plan/salary-benchmarks-section.tsx`

**Data source:** `salaryBrackets.getBySl` API (already exists, backend complete).

**Layout:** Collapsible section with table:
| Service Line | Benchmark Role | Market Min | Market Max | Carbon Avg | Source | Edit |

- Carbon Avg auto-calculated from entity's staff salaries per SL
- Color indicator: green if between min/max, red if above max
- Edit button opens `AppDialog` to override values

### 4.4 `EntityStaffSection`

**New file:** `apps/web/src/components/capacity-plan/entity-staff-section.tsx`

**Layout:** Collapsible section with billing table scoped to selected entity's carbonites.

**Columns (reuse from `staff-table-columns.tsx`):**
Name, Role, Billing Target (auto + override), Actual, Attainment %, Perf, Promo, Actions

**Data:** Filter from existing `wfp.entityDetail` staff data.

### 4.5 Staff table auto-calc indicator

**File:** `apps/web/src/components/capacity-plan/staff-table-columns.tsx`

**Change:** When a staff member has no manual `billingTarget` override, show the auto-calculated value (from `calcBillingTarget()`) in muted text. Bold when manually overridden. Tooltip: "Auto-calculated: $X" or "Manual override".

### 4.6 `EntityPlanningSettingsDialog`

**New file:** `apps/web/src/components/capacity-plan/entity-settings-dialog.tsx`

**Fields:**
- Billing Multiplier (number input, default 3.5)
- FY selector (dropdown)

**Trigger:** Small settings icon in entity detail header. Uses `AppDialog`.

---

## Phase 5 — Dashboard + Hiring + Admin Gaps

### 5.1 `BudgetPayrollChart` (Dashboard)

**New file:** `apps/web/src/components/dashboard/budget-payroll-chart.tsx`

**Chart type:** Grouped `BarChart` (Recharts via shadcn `chart.tsx`)
- X-axis: Service Lines
- Y-axis: Dollar amount
- Bars: Budget (grey/muted) + Payroll (SL color, red if over budget)
- Responds to existing SL filter pills

**Data:** New API field on `dashboard.stats` — budget vs payroll per SL.

### 5.2 `SalaryBracketsPanel` (Hiring)

**New file:** `apps/web/src/components/hiring/salary-brackets-panel.tsx`

**Layout:** Collapsible panel below hiring table (same pattern as TimeToHireContent).
- State filter dropdown
- Division tabs (Accounting / Bookkeeping-CFO)
- Table with expandable rows for performance band sub-rows (min/mid/max)
- Pure static data from constants — no API needed

### 5.3 `EditEntityDialog` (Admin)

**New dialog in:** `apps/web/src/routes/_app/admin.lazy.tsx` or extracted to `components/admin/`

**Fields:** Business Name, TAN, Phone, Email, Address, SL checkboxes (with SL color feedback)
**Backend:** New `entities.update` tRPC mutation.

### 5.4 Attrition auto-detect button

**File:** `apps/web/src/components/capacity-plan/attrition-risks-section.tsx`

**Change:** Add "Auto-detect Risks" button that calls `attritionRisks.autoDetect`. Results shown with a subtle "auto" badge to distinguish from manual entries. User can accept/dismiss each.

### 5.5 Global FY selector in topbar

**File:** `apps/web/src/components/shared/app-top-bar.tsx`

**Change:** Lift the FY `<Select>` from individual pages to the topbar. Propagate via URL search params so all pages respond.

---

## Dependency Graph

```
Phase 1.1 (calcBillingTarget) ──┬── Phase 3 (Simulator)
Phase 1.2 (billingCapacity)  ───┤
Phase 1.3 (revenueGap)      ───┤── Phase 4.1 (Revenue Strip)
Phase 1.6 (wire into API)   ───┘
Phase 1.7 (entity multiplier) ─── Phase 4.6 (Settings Dialog)
Phase 1.4 (pod budget fallback) ── standalone
Phase 1.5 (attrition auto)  ────── Phase 5.4 (auto-detect button)

Phase 2.1 (ProgressCircle)  ────── Phase 3 (optional gauge)
Phase 2.2 (CategoryBar)     ────── Phase 3 + Phase 4.2 (CompBudget)

Phase 4.2 (CompBudget)      ────── needs hiring cost data
Phase 4.3 (Benchmarks)      ────── standalone (backend exists)
Phase 4.4 (EntityStaff)     ────── needs calcBillingTarget for auto-calc
Phase 5.1 (BudgetPayrollChart) ── needs budget/payroll per SL data
Phase 5.2 (SalaryBrackets)  ────── standalone (static data)
Phase 5.3 (EditEntity)      ────── standalone
```

---

## Component Inventory

### New shadcn ports (2)
- `ui/progress-circle.tsx`
- `ui/category-bar.tsx`

### New feature components (8)
- `capacity-plan/comp-budget-section.tsx`
- `capacity-plan/salary-benchmarks-section.tsx`
- `capacity-plan/entity-staff-section.tsx`
- `capacity-plan/entity-settings-dialog.tsx`
- `dashboard/budget-payroll-chart.tsx`
- `hiring/salary-brackets-panel.tsx`
- `admin/edit-entity-dialog.tsx` (or inline)

### New backend files (1)
- `packages/api/src/lib/calculations.ts`

### Modified existing files
- `packages/api/src/routers/wfp.ts` — add billingCapacity, revenueGap
- `packages/api/src/routers/pod-budgets.ts` — fallback logic
- `packages/api/src/routers/wfp-extended.ts` — auto-detect attrition
- `packages/api/src/routers/entities.ts` — update mutation
- `apps/web/src/components/capacity-plan/scenario-workbench-section.tsx` — full rewrite
- `apps/web/src/components/capacity-plan/firm-tab.tsx` — add sections + revenue strip
- `apps/web/src/components/capacity-plan/staff-table-columns.tsx` — auto-calc indicator
- `apps/web/src/components/capacity-plan/attrition-risks-section.tsx` — auto-detect
- `apps/web/src/routes/_app/dashboard.tsx` — add chart
- `apps/web/src/routes/_app/hiring.lazy.tsx` — add panel
- `apps/web/src/routes/_app/admin.lazy.tsx` — add edit entity
- `apps/web/src/components/shared/app-top-bar.tsx` — global FY

---

## Estimated Effort

| Phase | Items | Estimate |
|-------|-------|----------|
| Phase 1 | 7 backend tasks | Medium |
| Phase 2 | 2 component ports | Low |
| Phase 3 | 1 major rewrite | High |
| Phase 4 | 6 sections/dialogs | Medium-High |
| Phase 5 | 5 UI additions | Medium |

---

## Verification

After each phase:
1. `bun run check-types` — must pass
2. `bun run check` — Biome lint/format
3. `bun run build` — must succeed
4. Manual verification of affected pages

---

## Not In Scope (Deferred)

- Bucket SVG liquid fill animation (legacy novelty, rebuild is better)
- 3-step cascading Add Carbonite wizard (current single dialog is better)
- FY headcount / payroll planning sections (lower priority)
- Invite user by email (Admin)
- Entity card partner avatar hover tooltip (cosmetic)
