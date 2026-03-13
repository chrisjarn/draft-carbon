# Feature Progress — Legacy UI Gap Closure

> Tracking implementation of missing UI features identified in `legacy/UI_GAP_ANALYSIS.md`.
> Follows the priority order from that analysis. All work must respect the rules in `REFACTOR.md`.

---

## Phase 1 — High impact, contained (COMPLETE)

### P1.1 — Pod Budgets: salary-dollar tracking

**Files:** `apps/web/src/components/capacity-plan/pod-budgets-tab.tsx`

- `BudgetCell` display now shows `fmtDollar(budget)` instead of raw integers; `—` when budget is 0
- `BudgetSummary` cards use `fmtDollar()` for Total Budget, Total Staff Cost, and Variance
- Column header "Actual" renamed to "Staff Cost"
- Column grid widths widened `80px → 100px` to fit dollar amounts
- `PodRowComponent` variance now computed from `pod.budget - pod.totalSalary` (dollars, not headcount)
- `CapacityBar` and `StatusBadge` now use `pod.totalSalary` vs `pod.budget`
- Added `totalSalary` rollup to `OfficeGroup` and `StateGroup` types
- `OfficeSection` and `StateSection` header rows display `fmtDollar()` for budget/staff cost/variance
- Top subheader updated: "Pod salary vs budget" with formatted dollar amounts
- `BudgetSummary` cards receive salary totals, not headcount

### P1.2 — Hiring: 4-status tabs with count badges

**Files:** `apps/web/src/routes/_app/hiring.tsx`, `apps/web/src/routes/_app/hiring.lazy.tsx`, `packages/api/src/routers/hiring.ts`

- **Router:** `status: "open"` now filters to exactly `status === "open"` (was all non-closed)
- **Route search schema:** expanded to `"open" | "active" | "offer" | "closed"`
- Single `status: "all"` query fetches counts; per-tab query fetches the table rows
- All 4 `TabsTrigger` items show count badges (hidden when count is 0)
- Added `HiringStatusBadge` component with per-status colours (sky/blue/violet/muted)
- `DetailSheet` header now shows status badge alongside priority and type
- `isOpen` logic updated: close/reopen buttons appear for any non-closed role (active, offer, open)
- `invalidate()` clears all 5 cache keys (open, active, offer, closed, all)

### P1.3 — Hiring: Time-to-Hire reference panel

**Files:** `apps/web/src/routes/_app/hiring.lazy.tsx`

- Collapsible `TimeToHirePanel` below the roles table, collapsed by default
- Summary strip: avg hire weeks, avg notice weeks, total lead time
- Division switcher (Accounting / Bookkeeping CFO) with per-role hire range and notice period table
- Data sourced entirely from existing `TIME_TO_HIRE` / `TTH_SUMMARY` constants — no API needed

### P1.4 — EntityCard: budget bar

**Files:** `packages/api/src/routers/dashboard.ts`, `apps/web/src/components/dashboard/entity-card.tsx`

- `entitySummaries` query now fetches all `podBudgets`, sums by `state||officeId`, returns `totalBudget` per entity
- `EntitySummary` type updated with `totalBudget: number`
- `BudgetBar` component: ratio-coloured progress bar (green < 90%, amber 90–100%, red > 100%) + "X remaining" / "X over" label
- Hidden when entity has no budget set (`totalBudget <= 0`)

### P1.5 — PodStaffSheet: tier grouping

**Files:** `apps/web/src/components/capacity-plan/pod-budgets-tab.tsx`

- `Carbonite` type extended with `isPartner` and `reportsTo` fields (already in DB/API)
- Extracted `StaffRow` sub-component for reuse
- Pod staff list now groups into **Partners** / **Pod Leads** / **Staff** tiers with section labels
- Falls back to flat list when no tier distinction exists (all members are regular staff)

### Bonus fix

- Added missing `Calendar` import in `hiring.lazy.tsx` (pre-existing type error)

---

## Phase 2 — Medium impact, more build effort (IN PROGRESS)

### P2.1 — SL filter buttons on Dashboard (COMPLETE)

**Files:** `apps/web/src/routes/_app/dashboard.tsx`, `apps/web/src/routes/_app/dashboard.lazy.tsx`, `packages/api/src/routers/dashboard.ts`

- `SlFilterPills` component in `PageToolbar` — "All SLs" + one pill per service line
- Active SL pill uses the SL colour as background (`style={{ backgroundColor: sl.color }}`), white text
- "All" active uses `bg-muted text-foreground` (neutral, doesn't compete with SL colours)
- Inactive pills: `text-muted-foreground`, transparent bg, `hover:bg-muted/50`
- Styling: `text-xs font-semibold rounded-full px-3 py-1` — matches existing pill/chip conventions
- Placement: `PageToolbar` left side, `SearchBarTrigger` moved to right side
- URL param: `?sl=acc` added to dashboard search schema
- **Backend:** `stats` query now groups `staffByState` by both `state` and `sl` (was state-only), enabling KPI filtering by SL
- **Backend:** `revenueByEntity` response now includes `sls: string[]` per entry for frontend SL filtering
- **KPIs filter by SL** — all 4 headline stats (Carbonites, FTE, Revenue Target, Actual) respond to the SL filter
- **Entity cards filter by SL** — entities are filtered by `entity.sls.includes(slFilter)`
- **Revenue chart filters by SL** — revenue entries filtered by matching entity SL membership
- **SL breakdown table filters by SL** — shows only the selected SL row when filter is active
- Clicking an active SL pill toggles it off (returns to "All")

### P2.2 — Billing Capacity + Revenue Gap in entity revenue strip

The Firm tab entity detail shows Revenue Actual/Target/%. Missing: Billing Capacity (sum of `calcBillingTarget()` for entity staff) and Revenue Gap (target − max(actual, billingCapacity)).

**Scope:** Needs `billingCapacity` field added to `wfp.entityDetail` response. Frontend adds 2 metrics to the revenue strip.

### P2.3 — WFP Team table scoped to selected entity

The Staff tab has the full billing table (target, actual, attainment, perf, promo, role type) at firm level. The entity-scoped version is missing from the Firm tab entity detail panel.

**Scope:** Add a collapsible `EntityStaffSection` inside `EntityDetailPanel` pulling from the `wfp.entityDetail` query, filtered to the selected entity's carbonites.

### P2.4 — Edit Entity modal

Admin page can add entities but not edit them. Need a dialog with fields: Business Name, TAN, Phone, Email, Address, SL checkboxes + an `entities.update` tRPC mutation.

**Scope:** New dialog component + new mutation. Reuse `Field` / `AppDialog` shared components.

### P2.5 — Scenarios page decision

The standalone `/scenarios` route is an empty stub. The Scenario Workbench is built inside the Capacity Plan → Firm tab (`ScenarioWorkbenchSection`).

**Decision needed:** Populate the Scenarios page with a cross-entity scenario view, or remove it from the nav.

---

## Phase 3 — Lower priority / reference features (FUTURE)

1. Salary brackets panel (Hiring) — static reference data
2. Salary benchmarks section (WFP entity detail) — per-SL market rate comparison
3. Comp Budget 4-metric row (open hiring cost, projected total, billing multiple)
4. Salary column in Staff tab — column visibility toggle
5. FY headcount / payroll planning sections
6. Invite user by email (Admin)

---

## Type check status

Only pre-existing `chart.tsx` errors remain (Recharts 3.x type incompatibility with shadcn chart component). Documented in `CLAUDE.md` as known issue.
