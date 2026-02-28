# Carbon Workforce Planner v58 - Standalone Application Review

## Overview

A single-file (~6900 lines) vanilla HTML/CSS/JS workforce planning application for Carbon Group, an Australian accounting firm. The entire app -- styles, markup, and logic -- lives in one HTML file with no build tools, no framework, and no module system. All state is held in global JavaScript variables. In standalone mode, API calls are stubbed out and data is seeded inline.

The app manages staff ("Carbonites"), business entities/offices, pod-based team structures, hiring pipelines, salary benchmarking, and financial year planning across 5 Australian states and 6 service lines.

---

## Architecture

### Routing

There is no client-side router. Navigation is handled by a `setPage(p)` function that toggles `.active` on `<div class="section">` elements by ID. The sidebar nav items call `setPage()` on click.

```
setPage('dashboard')  -> #page-dashboard
setPage('capacity')   -> #page-capacity
setPage('carbonites') -> #page-carbonites
setPage('hiring')     -> #page-hiring
setPage('workforce')  -> #page-workforce
setPage('fy')         -> #page-fy
```

### State Management

All application state lives in global variables. There is no reactivity system -- the app re-renders entire sections by replacing `innerHTML` after mutations.

**Primary data stores:**

| Variable | Type | Description |
|----------|------|-------------|
| `CARBONITES` | Array | Staff members (seeded with ~60 records) |
| `ENTITIES` | Array | Business entities/offices (seeded with ~15 records) |
| `PODS` | Array | Derived from CARBONITES via `buildPodsFromCarbonites()` |
| `POD_BUDGETS` | Object | Budget per pod keyed by `state::office::podName` |
| `POD_FEES` | Object | Fees per pod, same key structure |
| `HIRING_NEEDS` | Array | Hiring pipeline entries |
| `SALARY_BRACKETS` | Array | ~40 role definitions with state-specific salary ranges |
| `WFP_REVENUE` | Object | Revenue targets/actuals keyed by `entityId::fy` |
| `WFP_STAFF_META` | Object | Per-staff billing/performance data keyed by carbonite ID |
| `WFP_ENTITY_SETTINGS` | Object | Billing multiplier per entity |
| `SCENARIOS` | Array | What-if hiring scenarios |
| `HEADCOUNT_TARGETS` | Array | Headcount goals per service line |
| `SALARY_BENCHMARKS` | Array | Market salary benchmarks |
| `ATTRITION_RISKS` | Array | Staff flight risk flags |
| `PRIOR_YEAR_DATA` | Object | Imported FY comparison data |

**Reference constants:**

| Variable | Description |
|----------|-------------|
| `SERVICE_LINES` | 6 service lines with colors and sub-groups |
| `STATES` | 5 Australian states (NSW, VIC, QLD, WA, SA) with offices |
| `OFFICE_DATA` | Seed tuples: [state, office, sl, sg, headcount, budget, staffCost] |

### Persistence

In standalone mode, all `api()` calls are no-ops. The connected version would POST to endpoints like `/api/carbonites`, `/api/budgets`, etc. A `persist(type, payload)` helper wraps these calls but does nothing in standalone.

### Rendering Pattern

Every mutation follows the same pattern:
1. Modify global variable
2. Call `renderAll()` or a specific render function
3. The render function replaces `innerHTML` of a container element
4. Event listeners are attached inline via `onclick` attributes in template literals

`renderAll()` calls all page renderers plus `buildPodsFromCarbonites()` to keep derived state in sync.

---

## Routes / Pages

### 1. Dashboard (`page-dashboard`)

**Renderer:** `renderEntityDashboard()`

**Purpose:** High-level overview of all business entities with live financial KPIs.

**Components:**

#### Entity Cards
Each entity gets a card showing:
- **Header:** Entity name (e.g., "Carbon Sydney") with a colored accent border
- **Stats row:** Headcount, FTE count, total salary cost (formatted as `$XXXk`)
- **Revenue strip:** If WFP revenue data exists, shows target vs actual with a progress bar and variance percentage (green if positive, red if negative)
- **Service line breakdown:** Horizontal bar chart showing staff distribution across the 6 service lines, color-coded
- **Partner badges:** Lists partners associated with the entity
- **Pod count:** Number of pods within the entity

Cards are rendered by iterating `ENTITIES` and aggregating CARBONITES per entity. Clicking a card navigates to that entity's detail in the Workforce Planning page.

#### Dashboard Alerts
`renderAlerts()` scans data for actionable items:
- Pods over budget (staffCost > budget)
- Hiring roles open for 30+ days
- Staff with no pod assignment
- Entities with no revenue target set

Alerts appear as dismissible banners at the top of the dashboard.

#### Stats Summary Bar
Top-level KPIs across the entire org:
- Total headcount
- Total FTE
- Total salary cost
- Number of open hiring roles
- Number of entities

---

### 2. Capacity Plan (`page-capacity`)

**Renderer:** `renderCapacity()`

**Purpose:** Visualize pod-level staffing capacity across states and offices. This is the most visually complex page.

**Components:**

#### State Accordion
Collapsible sections per state (NSW, VIC, QLD, WA, SA). Each state header shows aggregate headcount and budget.

#### Office Groups
Within each state, offices are grouped. Each office shows:
- Office name and total headcount
- Pod cards for each pod in that office

#### Pod Cards (`renderPodCard()`)
Each pod card contains:
- **Pod name** with service line color indicator
- **Bucket visualization:** An SVG "container" filled with an animated liquid level representing budget utilization (staffCost / budget). Color transitions from green (<80%) to amber (80-100%) to red (>100%)
- **Staff list:** Names of carbonites in the pod with role badges (Partner, Manager, Senior, etc.)
- **Budget summary:** Budget amount, staff cost, variance
- **Headcount:** Current count vs budget-implied capacity
- **Click action:** Opens the slide-out budget panel

#### Budget Panel (`renderPanelForPod()`)
A slide-out right panel triggered by clicking a pod card:
- **Pod header** with state/office/service line context
- **Budget editor:** Inline editable budget amount
- **Fee editor:** Inline editable fee amount
- **Staff table:** All carbonites in the pod with:
  - Name, role, salary, FTE hours
  - Edit button (opens edit carbonite modal)
  - Remove from pod button
- **Add staff button:** Search and assign existing carbonites to this pod
- **Totals row:** Sum of salaries, average salary, total FTE
- **Close button:** Slides panel closed

#### Add Pod Modal (`modal-pod`)
Form to create a new pod:
- Pod name (text input)
- State (dropdown)
- Office (dropdown, filtered by state)
- Service line (dropdown)
- Sub-group (dropdown, filtered by service line)
- Partner assignment (dropdown of partners)

---

### 3. Carbonites (`page-carbonites`)

**Renderer:** `renderCarboniteCards()`

**Purpose:** Staff directory with search, filter, and CRUD operations.

**Components:**

#### Filter Bar
- **Search input:** Filters by name (case-insensitive substring match)
- **State filter:** Dropdown
- **Office filter:** Dropdown (filtered by selected state)
- **Service line filter:** Dropdown
- **Role filter:** Dropdown
- **Type filter:** FT/PT toggle
- **Clear filters button**
- **Headcount badge:** Shows filtered count vs total

#### Staff Cards
Grid of cards, each showing:
- **Name** (bold)
- **Role** and **seniority level** badges
- **Service line** with color dot
- **State / Office / Pod** location info
- **Type badge:** FT (blue) or PT (amber)
- **Salary:** Formatted as currency
- **Hours:** Weekly hours
- **Entity:** Which business entity they belong to
- **Reports to:** Manager name
- **Edit button:** Opens edit modal
- **Delete button:** Opens delete confirmation modal

#### Add Carbonite Modal (`modal-add`)
A 3-step wizard:

**Step 1 - Who:**
- Name (text)
- Role (dropdown from SALARY_BRACKETS roles)
- Seniority (1-5 scale)
- Type (FT/PT radio)
- Hours (number, default varies by state)
- Is Partner (checkbox)

**Step 2 - Where & What:**
- State (dropdown)
- Office (dropdown, filtered by state)
- Entity (dropdown)
- Service line (dropdown)
- Sub-group (dropdown, filtered by SL)
- Reports to (dropdown of existing carbonites)
- Location (Metro/Regional radio)

**Step 3 - Pod & Pay:**
- Pod (dropdown of existing pods in selected office, or "New Pod")
- Salary (number input, with bracket suggestion based on role/state/location)
- Salary bracket reference display (shows min/mid/max for selected role)

On submit: generates UUID, pushes to CARBONITES, calls `renderAll()`.

#### Edit Carbonite Modal
Same fields as Add but pre-populated. Updates the existing record in CARBONITES by index.

#### Delete Confirmation Modal (`modal-delete`)
Confirmation dialog with carbonite name. On confirm: splices from CARBONITES array, calls `renderAll()`.

---

### 4. Hiring (`page-hiring`)

**Renderer:** `renderHiring()`

**Purpose:** Track hiring pipeline -- open roles, time-to-hire, and outcomes.

**Components:**

#### Hiring KPIs Bar
- **Open roles count**
- **Closed (filled) this quarter**
- **Average time to hire** (days, calculated from created_at to closed_date)
- **Total positions needed** (sum of `positions` field across open roles)

#### Filter Bar
- State filter
- Office filter
- Service line filter
- Status filter (Open / Closed / All)
- Priority filter (Critical / High / Medium / Low)

#### Hiring Table
Sortable table with columns:
- Role title
- Service line (with color badge)
- Sub-group
- State / Office
- Positions (number)
- Type (FT/PT)
- Priority (color-coded badge: Critical=red, High=orange, Medium=blue, Low=gray)
- Status (Open=green, Closed=gray)
- Target start date
- Salary range (min-max formatted)
- Approved by
- Managed by
- Actions: Edit, Close, Delete

#### Add Role Modal (`modal-add-role`)
Form fields:
- Role (dropdown from salary brackets)
- Service line / Sub-group
- State / Office
- Location (Metro/Regional)
- Positions (number)
- Type (FT/PT)
- Priority (Critical/High/Medium/Low)
- Salary min / Salary max (with bracket suggestion)
- Target start date
- Approved by (text)
- Managed by (text)
- Notes (textarea)

#### Edit Role Modal (`modal-edit-role`)
Same as Add Role but pre-populated for editing.

#### Close Role Modal (`modal-close-role`)
Records outcome when a role is filled:
- Closed how (Hired External / Promoted Internal / Contracted / Cancelled / On Hold)
- Closed date
- Closed name (who filled it, if applicable)
- Notes

Sets status to "closed" and records metadata.

---

### 5. Workforce Planning (`page-workforce`)

**Renderer:** `renderWorkforce()`

**Purpose:** The most complex page. Per-entity workforce analysis covering billing targets, performance ratings, promotions, revenue, and scenario planning.

**Components:**

#### Entity Selector
Dropdown listing all entities. Selecting one calls `renderEntityDetail(entityId)`.

#### Entity Overview Strip
When an entity is selected:
- Entity name and state/office
- Headcount and FTE
- Total salary cost
- Billing multiplier (from WFP_ENTITY_SETTINGS, default 3.5x)
- Active financial year

#### Revenue Strip
- Revenue target and actual (from WFP_REVENUE)
- Progress bar with variance
- Edit button opens Revenue Target modal

#### Settings Button
Opens Entity Settings modal to configure:
- Billing multiplier (numeric, e.g., 3.2x)
- Active FY (e.g., "FY25-26")

#### Team Structure Table
All carbonites in the selected entity, grouped by service line, showing:
- Name
- Role and seniority
- Pod assignment
- Salary
- **Billing target** (calculated: salary x multiplier x role modifier x FTE fraction)
  - Role modifiers: Doer=1.0, Reviewer=0.7, BD=0.5 (derived from role name patterns)
- **Billing actual** (from WFP_STAFF_META, manually entered)
- **Billing variance** (actual - target, color coded)
- **Performance rating** (from WFP_STAFF_META: Exceeds/Meets/Below/New)
- **Promotion flag** (from WFP_STAFF_META: Ready Now/6 Months/12 Months/Not Yet)
- **Promotion ETA** text
- **Edit button** opens Staff Meta modal

#### Billing Calculations
The `calcBillingTarget(cb)` function:
```
billingTarget = salary * multiplier * roleModifier * (hours / fullTimeHours)
```
Where:
- `multiplier` comes from WFP_ENTITY_SETTINGS (default 3.5)
- `roleModifier`: 1.0 for "doer" roles, 0.7 for "reviewer/manager", 0.5 for "BD/partner"
- `fullTimeHours` is state-specific (defaults to 38)

#### Entity Pods Table
Pods within the entity showing:
- Pod name, service line
- Member count
- Total salary, total billing target
- Budget vs actual comparison

#### Headcount Targets Section
Table of target headcounts per service line:
- Service line name
- Current headcount (calculated)
- Target headcount (from HEADCOUNT_TARGETS)
- Variance
- Edit button opens Edit Headcount Target modal

#### Salary Benchmarks Section
Market salary comparison:
- Role name
- Current average salary (calculated from CARBONITES)
- Benchmark salary (from SALARY_BENCHMARKS)
- Variance (% above/below market)
- Edit button opens Edit Salary Benchmark modal

#### Attrition Risk Flags
Staff flagged as flight risks:
- Name, role, entity
- Risk level (High/Medium/Low)
- Reason text
- Date flagged
- Flag button to add new / edit existing

#### Scenario Workbench
What-if analysis tool:
- List of saved scenarios with name, description
- Each scenario has: hire N roles at salary X in service line Y
- Impact preview: shows change to total headcount, salary cost, billing capacity
- Add/edit/delete scenarios

**Modals on this page:**

#### Staff Meta Modal (`modal-staff-meta`)
Per-carbonite workforce data:
- Billing target (auto-calculated, shown as reference)
- Billing actual (number input)
- Performance rating (dropdown: Exceeds/Meets/Below/New)
- Promotion flag (checkbox)
- Promotion ETA (dropdown: Ready Now/6 Months/12 Months/Not Yet)
- Staff role override (text, e.g., "Doer", "Reviewer", "BD")

#### Revenue Target Modal (`modal-wfp-revenue`)
- Entity name (read-only)
- Financial year (text, e.g., "FY25-26")
- Revenue target (number)
- Revenue actual (number)

#### Entity Settings Modal (`modal-wfp-settings`)
- Entity name (read-only)
- Billing multiplier (number, step 0.1)
- Active FY (text)

#### Scenario Modal (`modal-scenario`)
- Scenario name (text)
- Description (textarea)
- Roles to add (repeatable row): Role, SL, Count, Avg Salary
- Preview impact calculations

#### Edit Headcount Target Modal (`modal-edit-target`)
- Service line (read-only)
- Target headcount (number)

#### Edit Salary Benchmark Modal (`modal-edit-benchmark`)
- Role (read-only)
- Benchmark salary (number)

#### Flag Attrition Risk Modal (`modal-attrition`)
- Staff member (dropdown)
- Risk level (High/Medium/Low)
- Reason (textarea)

---

### 6. FY Reports (`page-fy`)

**Renderer:** `renderFYReport()`

**Purpose:** Financial year comparison and reporting.

**Components:**

#### FY Selector
Dropdown to select financial year (e.g., "FY25-26").

#### Import Prior Year Button
Opens import modal to paste or upload prior year data (JSON format). Stored in `PRIOR_YEAR_DATA`.

#### Entity Comparison Table
Per-entity rows showing:
- Entity name
- Current year: Headcount, FTE, Salary Cost, Revenue Target, Revenue Actual
- Prior year (if imported): Same metrics
- Year-over-year variance (absolute and percentage)
- Billing efficiency (revenue / salary cost ratio)

#### Service Line Breakdown
Aggregated view by service line:
- Headcount per SL
- Salary cost per SL
- Billing target per SL
- Revenue contribution per SL

#### Summary Totals
Bottom row with organization-wide totals and averages.

---

## Sidebar Navigation

### Structure
Fixed left sidebar (250px wide, dark background) with:

1. **App logo/title** -- "Carbon WFP" at top
2. **Main nav links:**
   - Dashboard (grid icon)
   - Capacity Plan (layers icon)
   - Carbonites (users icon)
   - Hiring (briefcase icon)
   - Workforce Planning (chart icon)
   - FY Reports (calendar icon)
3. **State/Office tree** (below main nav):
   - Collapsible state headers (NSW, VIC, QLD, WA, SA)
   - Under each state: office links that filter the Capacity page
   - Under each office: service line links

Active nav item gets a left border accent and background highlight.

---

## Shared UI Patterns

### Toast Notifications
A `showToast(message, type)` function renders temporary notifications:
- Success (green), Error (red), Info (blue)
- Auto-dismisses after 3 seconds
- Stacks vertically in bottom-right corner

### Modal System
All modals share a common pattern:
- Fixed overlay with backdrop blur
- Centered card with header, body, footer
- Close button (X) in header
- Cancel and primary action buttons in footer
- `openModal(id)` / `closeModal(id)` toggle display
- Form inputs use `id` attributes, values read via `document.getElementById().value`

### Number Formatting
- `fmt(n)` -- Formats numbers with commas (e.g., 150000 -> "150,000")
- `fmtK(n)` -- Formats as abbreviated (e.g., 150000 -> "$150k")
- Currency values displayed with `$` prefix

### UUID Generation
`crypto.randomUUID()` used for all new record IDs.

---

## Salary Bracket Reference Data

The `SALARY_BRACKETS` array contains ~40 role definitions, each with:
- `div` (division/service line)
- `sl` (service line code)
- `prog` (progression level)
- `role` (title, e.g., "Graduate Accountant", "Senior Manager")
- State-specific ranges: `nsw`, `qld`, `sa`, `vic`, `wa` -- each an object with `metro` and `regional` sub-objects containing `min`, `mid`, `max`
- `bands` array with 4 performance tiers, each having per-state salary ranges

This data is used for:
1. Suggesting salary ranges when adding/editing carbonites
2. Salary benchmarking on the WFP page
3. Hiring role salary range suggestions

---

## Business Logic

### Pod Derivation
`buildPodsFromCarbonites()` groups CARBONITES by a composite key of `pod + "::" + state + "::" + office`, creating POD objects with aggregated headcount and salary totals. This means pods are not independently stored -- they exist only as groupings of staff.

### FTE Calculation
FTE is calculated as `hours / fullTimeHours` where `fullTimeHours` defaults to 38 (standard Australian full-time hours) but can vary by entity settings.

### Budget Utilization
For each pod: `utilization = totalStaffCost / budget`. The bucket visualization maps this to a fill level (0-100%) with color coding:
- Green: < 80%
- Amber: 80-100%
- Red: > 100% (overspend)

### Billing Target Formula
```
target = salary * billingMultiplier * roleModifier * fteFraction
```
- `billingMultiplier`: per-entity setting, typically 3.0-3.5x
- `roleModifier`: Doer=1.0, Reviewer=0.7, BD/Partner=0.5
- `fteFraction`: hours / fullTimeHours

---

## Code Quality Assessment

### Strengths
- Comprehensive domain coverage -- covers the full workforce planning lifecycle
- Self-contained -- works completely offline as a single file
- Consistent UI patterns across all pages
- Detailed salary bracket data with geographic specificity

### Issues

#### Critical
- **No data persistence in standalone mode.** All data resets on page refresh. The `api()` function is a stub.
- **Global mutable state.** All data lives in unprotected global variables. Any function can mutate any data at any time with no validation.
- **innerHTML injection everywhere.** Template literals are inserted via `innerHTML` with no sanitization. User-entered text (names, notes) could contain HTML/script tags. This is an XSS vector.
- **No input validation.** Form values are read and stored without type checking, range validation, or sanitization. Salary fields accept negative numbers, text fields accept empty strings.
- **No error handling.** No try/catch blocks, no error boundaries, no fallback UI. A single bad data value can break rendering for an entire page.

#### Structural
- **6900 lines in one file.** No separation of concerns, no modules, no components. Extremely difficult to maintain or test.
- **No type safety.** Pure JavaScript with no TypeScript, no JSDoc, no runtime type checks.
- **Render-by-replacement.** Every state change re-renders entire sections via `innerHTML`, destroying DOM state (scroll position, focus, input values).
- **Inline event handlers.** `onclick` attributes in template strings create implicit global function dependencies and make refactoring dangerous.
- **Duplicated code.** Filter bars, modal open/close logic, form reading patterns are copy-pasted across pages.
- **Magic strings everywhere.** Role names, status values, service line names are hardcoded strings with no central enum or constant.
- **No responsive design.** Fixed widths (250px sidebar, hardcoded card widths) will break on mobile.

#### Data Model
- **Pods are derived, not stored.** Renaming or reorganizing pods requires editing every carbonite in that pod.
- **No referential integrity.** Deleting an entity doesn't clean up carbonites referencing it. Deleting a carbonite doesn't clean up WFP_STAFF_META, ATTRITION_RISKS, etc.
- **Inconsistent ID handling.** Some IDs are UUIDs, some are composite keys (state::office::pod), some are array indices.
- **Date handling is strings.** All dates are stored as plain strings with no consistent format.

---

## Migration Notes

When converting to the new stack (React + Hono + tRPC + Drizzle), consider:

1. **Each page maps to a TanStack Router route.** The 6 `setPage()` targets become 6 route files.
2. **Global stores become tRPC queries.** CARBONITES, ENTITIES, HIRING_NEEDS, etc. should be fetched via tRPC and cached in TanStack Query.
3. **Derived data (PODS) should be computed server-side** or via TanStack Query `select` transforms.
4. **Modals become shadcn/ui Dialog components** with React Hook Form for validation.
5. **The budget panel becomes a Sheet component** (shadcn/ui slide-out).
6. **Salary brackets should be a DB table** (already in the Drizzle schema plan), not a hardcoded constant.
7. **The bucket SVG visualization** is custom and will need to be ported as a React component.
8. **RBAC is absent in standalone** but exists in the connected version via Better Auth. The new app already has this scaffolded.
9. **All filter bars** can be consolidated into a reusable FilterBar component with consistent patterns.
10. **Inline `onclick` handlers** become React event handlers with proper closures.

### Component Extraction Map

| Legacy Pattern | New Component |
|---------------|---------------|
| Entity card in dashboard | `<EntityCard />` |
| Pod card with bucket SVG | `<PodCard />` with `<BucketVisualization />` |
| Budget slide-out panel | `<BudgetSheet />` (shadcn Sheet) |
| Carbonite card | `<CarboniteCard />` |
| Filter bar (repeated 4x) | `<FilterBar />` (shared) |
| Hiring table row | `<HiringTable />` (TanStack Table) |
| WFP team structure table | `<TeamStructureTable />` (TanStack Table) |
| 3-step add carbonite wizard | `<AddCarboniteDialog />` with step state |
| Toast notifications | shadcn `<Toaster />` (already available) |
| State/office accordion | `<StateAccordion />` (shadcn Accordion) |
| Stats KPI bar | `<StatsBar />` |
| Revenue progress bar | `<RevenueProgress />` |
