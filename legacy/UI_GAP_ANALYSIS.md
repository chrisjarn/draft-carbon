# UI Gap Analysis — Legacy vs Rebuild

> Compared: `legacy/carbon-workforce-planner-v58-standalone.html` vs current React app  
> Scope: UI features only — what is missing, partial, or needs a new component variant  
> Component strategy: use existing shared components where possible; add variants or new components where the design diverges meaningfully

---

## How to Read This

**Status key:**
- ✅ Done — exists and works
- ⚠️ Partial — exists but missing something notable
- ❌ Missing — not built at all
- 🔧 Needs variant — component exists but needs a new prop/variant to match legacy behaviour

---

## 1. Dashboard

### KPI Strip
| Feature | Status | Notes |
|---------|--------|-------|
| 4-KPI strip | ✅ | `InlineStat` 4-column grid — Carbonites, FTE, Revenue Target, Actual |
| SL filter buttons | ❌ | Legacy has 7 pill buttons (All + 6 SLs) that filter the entire dashboard — entity grid, KPIs, chart. Current app only has state-tab filter |
| KPIs respond to SL filter | ❌ | Depends on SL filter above |

**What to build:** Add a horizontal `ToggleGroup` row of SL filter pills to the Dashboard `PageToolbar`, wired to a URL param `?sl=acc`. Pass to the entity grid, KPI cards, and chart queries.

---

### Entity Cards (`EntityCard`)
| Feature | Status | Notes |
|---------|--------|-------|
| Business name, state badge, contact details | ✅ | |
| Staff avatars with overflow tooltip | ✅ | `StaffAvatars` component |
| SL chips | ✅ | |
| Payroll stat in `CardStatBar` | ✅ | |
| **Budget bar** (payroll vs budget with %, coloured by status) | ❌ | Legacy shows a progress bar: payroll/budget fill, coloured red/orange/green. Current card has no bar — just a flat `CardStatBar` with numbers |
| **Remaining / Over budget text** | ❌ | Legacy shows `$X remaining` or `$X over budget` below the bar |
| **Budget status border** | ❌ | Legacy card border turns red (over) or orange (near limit) |
| Partner avatar cluster with tooltips | ⚠️ | `StaffAvatars` exists but is used for staff initials, not specifically partner-only cluster. Needs to confirm partner avatars are being passed correctly |

**What to build:** Add a `budgetBar` variant/slot to `EntityCard`. It needs: payroll value, budget value, ratio-coloured `<Progress>`, remaining/over text, and status-based card border. Can add `totalBudget` and `budgetRatio` to the `EntitySummary` type and render inline in the card — no new component needed, just new card section + prop.

---

### Alerts Panel
| Feature | Status | Notes |
|---------|--------|-------|
| Alerts panel renders when data exists | ✅ | `AlertsPanel` component |
| Over-budget pod alerts | ✅ | Assumed from `trpc.dashboard.alerts` |
| Urgent unfilled hire alerts | ✅ | |
| **Underspent pod alerts** (capacity available) | ❓ | Unclear if the `alerts` query surfaces underspent pods (ratio < 0.65). Needs verification |
| Alert click navigates to relevant page | ⚠️ | Exists but unknown if deep-links to specific pod budget panel |

---

### Budget vs Payroll Chart
| Feature | Status | Notes |
|---------|--------|-------|
| `RevenueChart` — bar chart by entity | ✅ | Recharts `BarChart`, Target vs Actual, clickable bars |
| **Per-SL grouped bars (Budget vs Payroll)** | ❌ | Legacy shows one group per service line with two bars: Budget (grey) and Payroll (SL colour). Current chart is per-entity revenue only — a different axis entirely |

**What to build:** The legacy chart is a staff cost / salary budget chart grouped by SL. This is a separate insight from the revenue chart. Decide whether to: (a) add a second chart below `RevenueChart` for the payroll/budget view, or (b) add a toggle on the existing chart. The data needed is `sum(salary)` and `sum(pod budgets)` per SL.

---

## 2. Hiring

### Status Tabs
| Feature | Status | Notes |
|---------|--------|-------|
| Open / Closed tabs | ✅ | URL-param driven `<Tabs>` |
| **Additional status stages** (Shortlisted, Interviewing, Offered) | ❌ | Legacy has 7 tabs: All / Open / Shortlisted / Interviewing / Offered / Filled / Closed. Current app only has Open / Closed. The data model has more statuses (`active`, `offer`) but no tab UI for them |

**What to build:** Expand the tabs to match the legacy 7-state pipeline. The `HIRING_STATUS` constant and DB schema already support the additional statuses. Only the tab UI + filter query param needs updating.

---

### Roles Table
| Feature | Status | Notes |
|---------|--------|-------|
| Role, SL, State, Office, Priority, Salary Range, Status | ✅ | |
| Target Start column | ✅ | |
| Closed How column (closed tab) | ✅ | |
| Edit / Close / Delete actions | ✅ | |
| **Count badge on each tab** | ❌ | Legacy shows count next to each tab label (e.g. `Open (4)`). Current tabs have no counts |

**What to build:** Pass per-status counts to the tab labels. Fetch counts alongside the list query or derive from the full list.

---

### Time-to-Hire Reference Panel
| Feature | Status | Notes |
|---------|--------|-------|
| Panel exists | ❌ | `TIME_TO_HIRE` and `TTH_SUMMARY` data is fully defined in `constants.ts` but **never rendered anywhere in the UI** |
| Division toggle (Acc vs BKK) | ❌ | |
| 6-band summary strip (Junior → Director) | ❌ | |
| Detailed roles table (Role / App→Start / Market Notes) | ❌ | |

**What to build:** Add a collapsible `TimeToHirePanel` below the roles table on the Hiring page. Pure display — reads from `TIME_TO_HIRE` / `TTH_SUMMARY` in `constants.ts`. No API needed. Starts collapsed. Toggle shows/hides. This is a high-value reference tool for practice managers.

Component: new `TimeToHirePanel` in `src/components/hiring/` or inline in the route. No new shared component needed.

---

### Salary Brackets Panel
| Feature | Status | Notes |
|---------|--------|-------|
| Panel exists | ❌ | Not built. Data would need to come from `SALARY_BRACKETS` in constants or a new DB table |

**What to build:** A collapsible `SalaryBracketsPanel` on the Hiring page. State filter + division tabs + table with expandable performance band rows. This is a large but purely static reference — no API needed if data stays in constants. Lower priority than Time-to-Hire.

---

## 3. Capacity Plan — Pod Budgets Tab

### Current state
The `PodBudgetsTab` uses a **hierarchical table** (State → Office → Pod rows) with a thin `CapacityBar` progress strip. This is a functional but minimal design. The legacy app uses **card-style pod cards** with a bucket SVG visual.

The table approach is actually cleaner for dense data. The key question is: does the current design communicate budget status clearly enough for the primary users?

| Feature | Status | Notes |
|---------|--------|-------|
| State → Office → Pod hierarchy (collapsible) | ✅ | |
| Pod budget inline edit | ✅ | `BudgetCell` with pencil icon, Enter/Escape |
| Pod SL badge | ✅ | Dominant SL per pod |
| Status badge (Under/At/Over/Empty) | ✅ | |
| Thin capacity bar | ✅ | `CapacityBar` |
| Add Pod dialog | ✅ | State, Office, Pod Name, Budget |
| Pod staff sheet (right slide-in) | ✅ | Shows staff list + total salary |
| Summary KPI cards (Total Budget, Actual, Variance, Utilisation) | ✅ | |
| **Budget column showing $dollars, not headcount** | ⚠️ | Current `BudgetCell` renders the raw integer value without currency formatting (no `fmtDollar`). The "Budget" column shows raw numbers like `500000` not `$500,000` |
| **Salary-based budget tracking** | ⚠️ | Current system tracks budget vs headcount (integer counts). Legacy tracks budget (salary dollars) vs staff cost (sum of salaries). The current Pod Staff Sheet shows `Staff Cost` in dollars, but the main table Budget/Actual/Variance columns are headcount integers — this is a fundamental difference in what "capacity" means |
| **Pod team drawer on card** | ❌ | Legacy pod cards have a collapsible team drawer showing members in 3 tiers (Partners / Leads / Staff). The current `PodStaffSheet` is a full right-side sheet rather than an inline drawer |
| **Member tier sorting** (Partners → Leads → Staff) | ❌ | Current staff sheet lists members flat. No tier grouping |
| **Person inline edit in panel** | ❌ | Legacy budget panel lets you click a person and edit name/role/salary/type/location inline. Current sheet is read-only |
| **Remove person from pod** (unassign, not delete) | ❌ | No way to clear `cb.pod` from pod panel |
| **"+ New Pod" empty card at end of office** | ⚠️ | Add Pod button exists as a ghost row but no visual empty card placeholder |

**What to build:**
1. Fix `BudgetCell` to use `fmtDollar()` for display
2. Add tier grouping (Partners / Pod Leads / Staff) to `PodStaffSheet`
3. Add an edit mode to `PodStaffSheet` — click a person row → shows inline form fields for salary/role/type. This requires a `PATCH /carbonites/:id` mutation (check if it exists)
4. The headcount vs salary-dollar tracking difference is a **product decision** — raise with stakeholders

---

## 4. Capacity Plan — Firm Tab (Workforce Planning)

### Entity Detail Panel
The current `EntityDetailPanel` is an **inline expansion** within the page. The legacy app opens a right-side sliding panel. The inline approach is acceptable and arguably better for a dense tool.

| Feature | Status | Notes |
|---------|--------|-------|
| Entity selector grid | ✅ | Clickable entity buttons |
| Revenue strip (actual / target / %) | ✅ | `<Progress>` bar |
| Compensation Budget (total payroll) | ⚠️ | Shows payroll as a plain number. Legacy has: payroll + open hiring cost + projected total + billing multiple as 4-metric row with stacked bar |
| Pods table (Pod / Headcount / Salary Total) | ✅ | |
| Headcount Targets (per-SL progress bars) | ✅ | `HeadcountTargetsSection` |
| Attrition Risks section | ✅ | `AttritionRisksSection` |
| Scenario Workbench | ✅ | `ScenarioWorkbenchSection` |
| **WFP Team Table** (billing target, actual, perf %, promo, role type) | ❌ | The Staff tab has this, but it's a separate tab — not embedded in the entity detail panel. Legacy shows all staff for the selected entity inline within the entity detail |
| **Salary benchmarks section** | ❌ | Not built. No market rate comparison anywhere |
| **4-metric Revenue Strip** (Target / Actual / Billing Cap / Revenue Gap) | ⚠️ | Current strip shows Actual/Target/%. Missing: Billing Capacity (sum of `calcBillingTarget()` for entity staff) and Revenue Gap |
| **Set Revenue Target action** | ⚠️ | Revenue is set via FY Planning page (`fy-planning.lazy.tsx`), not via the entity detail. Whether a shortcut button is needed here is a UX call |
| **Edit Entity action** | ❌ | No way to edit entity details (biz name, TAN, phone, email, address, SL assignments) from the entity detail panel |
| **Add Staff to Entity** | ❌ | No quick-add from entity detail. Must go to Carbonites page |
| **Flag Attrition Risk button** | ✅ | In `AttritionRisksSection` |
| **Open Hiring badge** | ✅ | Shows count if > 0 |

**What to build:**
1. **WFP Team table in entity detail** — billing target, actual, attainment %, promo flag, role type. This may belong as a collapsible section in `EntityDetailPanel` pulling from the same `wfp.entityDetail` query. The Staff tab currently covers this at the firm level; the entity-scoped version is what's missing.
2. **Billing Capacity metric** in revenue strip — add `billingCapacity` to `wfp.entityDetail` response and show it alongside target/actual
3. **Revenue Gap** — computed from target − max(actual, billingCapacity)
4. **Edit Entity modal** — fields: Business Name, TAN, Phone, Email, Address, SL checkboxes. Add `entities.update` tRPC mutation if not already present
5. **Salary benchmarks section** — per-SL: Benchmark Role / Market Min / Market Max / Carbon Avg (auto-calc) / Source / edit. Lower priority.

---

## 5. Capacity Plan — Staff Tab

| Feature | Status | Notes |
|---------|--------|-------|
| Full billing table (target, actual, attainment, perf, promo, role type) | ✅ | |
| Faceted filters (Tag, SL, Office, Promo) | ✅ | |
| Staff Meta edit dialog | ✅ | `MetaDialog` |
| Summary bar (staff count, total target, total actual, promo count) | ✅ | |
| **Salary column** | ❌ | Not shown in the Staff tab table. Useful for spotting billing target vs salary ratio |
| **Seniority column** | ❌ | Not shown |
| **Entity filter** | ❌ | Can't filter the Staff tab by entity. The entity is selected in the Firm tab — the Staff tab is firm-wide only |

**What to build:** Adding Salary as an optional column (toggle via DataTable column visibility) is low-effort and high-value. Entity filter is medium effort.

---

## 6. FY Planning

| Feature | Status | Notes |
|---------|--------|-------|
| Hierarchical revenue table (State → Entity) | ✅ | |
| Inline edit for Target and Actual | ✅ | |
| Revenue bar + attainment % | ✅ | |
| Pod Budget Comparison table (current vs prior year, YoY) | ✅ | |
| CSV import/export | ✅ | |
| **Headcount planning section** | ❌ | Legacy FY Reports page is focused on pod budgets. The current FY Planning page covers revenue and pod budgets but has no headcount target planning row |
| **Payroll planning section** | ❌ | No payroll projection by entity/SL for future FY |

These are lower priority — the current FY Planning page covers the critical path.

---

## 7. Hiring → Scenarios Page

| Feature | Status | Notes |
|---------|--------|-------|
| Scenarios page | ❌ | Completely empty stub — "coming soon" placeholder |

The Scenario Workbench is built inside the Capacity Plan → Firm tab (in `ScenarioWorkbenchSection`). The standalone Scenarios route is a dead stub. **Decide:** populate the Scenarios page with the scenario workbench (cross-entity view), or remove it from the nav and let the firm tab be the only entry point.

---

## 8. Admin

| Feature | Status | Notes |
|---------|--------|-------|
| User role management | ✅ | |
| Entity list + Add Entity | ✅ | |
| **Edit Entity** | ❌ | Can only add entities, not edit name/state/details |
| **Delete Entity** | ❌ | No delete action on entities |
| **Invite user by email** | ❌ | No email invite flow — role management only applies to already-authenticated users |

---

## 9. Cross-Cutting / Shared Components

### Missing component variants or new components needed

| Gap | Approach |
|-----|----------|
| **Budget progress bar on entity card** | Add `budgetBar?: { budget: number; payroll: number }` prop to `EntityCard`. Render a coloured `<Progress>` + remaining text between contact section and stat bar. Status colour: `budget > 0 && payroll/budget > 1` = red, `> 0.88` = amber, `< 0.65` = teal, else green. |
| **Status-coloured card border** | `EntityCard` currently has no border variant. Add `borderAccent?: "danger" \| "warn" \| "default"` or use a CSS variable driven approach matching the `CapacityBar` colours. |
| **Tab count badges** | The `<Tabs>` / `<TabsTrigger>` component has no count badge slot. Add a `count?: number` prop to `TabsTrigger` that renders a small `<Badge>` after the label. Alternatively, format label in the caller as `Open (4)`. |
| **Tier-grouped staff list** | Used in pod staff sheet and entity detail. Extract a `TieredStaffList` component: takes `staff[]` with `isPartner` and `reportsTo` fields, renders 3 labelled tiers. Can live in `components/shared/` or `components/capacity-plan/shared.tsx`. |
| **SL filter pill group** | A row of toggleable SL filter pills. Similar to state tabs on dashboard. Could use `<ToggleGroup>` from shadcn. Reusable across Dashboard and potentially other pages. |
| **Inline person edit form** | Currently no shared component for editing a Carbonite's key fields (salary, role, type) inline within a sheet. Could be a lightweight `PersonEditForm` that takes `carboniteId` + `onSave`. Requires a `PATCH carbonite` endpoint. |

---

## Priority Order

Based on user impact and how visible each gap is to a Practice Manager using the app daily:

### P1 — High impact, relatively contained
1. **Hiring status tabs with counts** — expand from 2 to 7 tabs; count badges on each
2. **Time-to-Hire reference panel** — data already in constants, just needs rendering
3. **Budget bar on entity cards** — `EntityCard` needs payroll/budget ratio bar
4. **fmtDollar on Pod Budget column** — one-line fix in `BudgetCell`
5. **Staff tier grouping in Pod Staff Sheet** — Partners / Pod Leads / Staff sections

### P2 — Medium impact, more build effort
6. **SL filter buttons on Dashboard** — URL param, filter propagation to queries
7. **Billing Capacity + Revenue Gap in entity revenue strip** — needs backend field
8. **WFP Team table scoped to selected entity** in Firm tab entity detail
9. **Edit Entity modal** — new dialog + `entities.update` mutation
10. **Scenarios page** — decide: populate with cross-entity scenario workbench or remove from nav

### P3 — Lower priority / reference features
11. **Salary brackets panel** (Hiring) — static reference data, no API needed
12. **Salary benchmarks section** (WFP entity detail) — per-SL market rate comparison
13. **Comp Budget 4-metric row** (open hiring cost, projected total, billing multiple)
14. **Salary column in Staff tab** — column visibility toggle
15. **FY headcount / payroll planning sections**
16. **Invite user by email** (Admin)

---

## What Does NOT Need to Change

These legacy features were implemented differently in the rebuild, and the rebuild's approach is **better** — no change needed:

| Legacy | Rebuild | Why rebuild is better |
|--------|---------|----------------------|
| Right-side sliding budget panel (380px) | Inline `EntityDetailPanel` expansion | Less disorienting for dense data; no margin-right layout shift |
| Bucket SVG liquid fill animation | Thin `CapacityBar` progress strip | Cleaner, more information-dense. The bucket is a novelty but adds no data clarity |
| 3-step cascading modal wizard for adding Carbonites | Direct form in `CarboniteDialog` | Less friction; all fields visible at once with section grouping |
| CSS-only bar chart on dashboard | Recharts `BarChart` with tooltips | Proper chart library with interactions |
| Toast via custom JS | Sonner toasts | Better a11y, stacking, dismiss behaviour |
| Hardcoded "Nathan M. / Practice Manager" user | Real auth with `UserDropdown` | Obviously correct |
| In-memory data only | PostgreSQL + Drizzle + tRPC | Obviously correct |
