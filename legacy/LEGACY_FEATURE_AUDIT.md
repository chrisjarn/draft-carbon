# Carbon Workforce Planner — Legacy App Feature Audit

> Source: `carbon-workforce-planner-v58-standalone.html` (6,894 lines)
> Purpose: Complete reference for the modern rebuild — every page, card, action, input, formula, and modal documented.

---

## Table of Contents

1. [App Architecture](#1-app-architecture)
2. [Navigation & Sidebar](#2-navigation--sidebar)
3. [Data Structures](#3-data-structures)
4. [Dashboard Page](#4-dashboard-page)
5. [Capacity Plan Page](#5-capacity-plan-page)
6. [Carbonites Page](#6-carbonites-page)
7. [Hiring Page](#7-hiring-page)
8. [Workforce Planning Page](#8-workforce-planning-page)
9. [FY Reports Page](#9-fy-reports-page)
10. [Pod System](#10-pod-system)
11. [All Modals & Dialogs](#11-all-modals--dialogs)
12. [All Calculations & Formulas](#12-all-calculations--formulas)
13. [Missing / Not Yet Implemented in Rebuild](#13-missing--not-yet-implemented-in-rebuild)

---

## 1. App Architecture

### File
Single HTML file, ~6,894 lines. All HTML, CSS, JavaScript, and seed data are inline. No build process, no external JS libraries, no frameworks. Only external dependency: Google Fonts (`Nunito Sans` + `Caveat`).

### Layout Structure
```
body
├── .sidebar (fixed left, 248px wide, z-index 100)
│   ├── .logo-area  — Carbon logo + tagline "Financial people. Entrepreneurial spirit."
│   ├── .nav        — scrollable 6-item nav
│   └── .sidebar-btm — user card (hardcoded "Nathan M. / Practice Manager")
├── .main (margin-left: 248px; transitions margin-right when panel opens)
│   ├── .topbar (sticky top, z-index 50)
│   │   ├── .breadcrumb — "Dashboard" or "Dashboard / PageName"
│   │   └── .topbar-r   — FY selector + context-sensitive action button
│   ├── .content
│   │   ├── #page-dashboard   .section.active (default)
│   │   ├── #page-capacity    .section
│   │   ├── #page-carbonites  .section
│   │   ├── #page-hiring      .section
│   │   ├── #page-workforce   .section
│   │   └── #page-fy          .section
│   └── #toast (fixed bottom-right, 3s auto-dismiss)
├── #budget-panel (fixed right, 380px, slides in/out)
└── 17 modal overlays (position:fixed, display:none by default)
```

### CSS Design Tokens
```css
--green: #6DB33F          /* primary action, on-track status */
--green-light: #e8f5db
--teal: #3ABFCC           /* secondary / billing capacity */
--teal-light: #e0f7f9
--grey-dark: #3a3f44      /* sidebar bg, primary text */
--grey: #555d62           /* secondary text */
--grey-light: #f0f2f4     /* backgrounds */
--grey-mid: #dce1e7       /* borders */
--off-white: #f7f9fb      /* page background */
--warn: #f5a623           /* near-limit warning */
--danger: #e84040         /* over-budget / urgent */
--font: 'Nunito Sans', sans-serif
--script: 'Caveat', cursive   /* eyebrow / tagline text */
--sidebar-w: 248px
--panel-w: 380px
```

### Persistence Layer (Stubs)
The standalone file has no real persistence. All async DB functions are no-ops:
```js
async function saveCarbonite(cb) { /* standalone */ }
async function deleteCarboniteFromDb(id) { /* standalone */ }
async function savePodBudgetToDb(state, office, podName, budget) { /* standalone */ }
async function saveEntityToDb(entity) { /* standalone */ }
async function saveHiringNeedToDb(h) { /* standalone */ }
async function api(method, path, body) { /* standalone */ }
```
The rebuild replaces these with tRPC mutations backed by Drizzle + Neon PostgreSQL.

### Boot Sequence
```
loadData()
  → normalise CARBONITES (isPartner ← is_partner, reportsTo ← reports_to)
  → regenAttritionRisks()
  → renderSidebar()
  → renderEntityDashboard()
  → renderAlerts()
  → renderChart()
  → renderCarbonites()
  → renderHiring()
  → renderWorkforce()
  → renderFYReport()
  → console.log('Loaded: N staff, N entities')
```

### renderAll() — Full Re-render Orchestrator
Called after every mutation:
```
renderAll()
  → buildPodsFromCarbonites()
  → regenAttritionRisks()
  → renderEntityDashboard()
  → renderAlerts()
  → renderChart()
  → renderCapacity()
  → renderCarbonites()
  → renderHiring()
  → renderWorkforce()
  → renderFYReport()
```

---

## 2. Navigation & Sidebar

### Nav Items (flat, no sub-hierarchy in sidebar)
```
▣  Dashboard          → setPage('dashboard')
◈  Capacity Plan      → setPage('capacity')
◉  Carbonites         → setPage('carbonites')
＋  Hiring             → setPage('hiring')
◑  Workforce Planning → setPage('workforce')
── [separator]
◎  FY Reports         → setPage('fy')
```

### Bottom User Card
- Initials avatar (green circle): "NM"
- Name: "Nathan M."
- Role: "Practice Manager"

### Topbar — Right Side
**FY Selector** (`<select .fy-sel>`):
- `FY 2025-26`
- `FY 2024-25`
- `Q1 2026`

**Context-Sensitive Action Button** (controlled by `updateTopbarBtn(page)`):

| Page | Button Label | Action |
|------|-------------|--------|
| dashboard | hidden | — |
| capacity | `+ Add Location` | `openAddLocationModal()` |
| carbonites | `+ Add Carbonite` | `openModal()` |
| hiring | `＋ Add Role` | `openAddRoleModal()` |
| workforce | hidden | actions are inline in entity detail |
| fy | hidden | download is inline on the page |

### Page Switching (`setPage(p)`)
1. Removes `active` from all `.section` elements, adds to `#page-{p}`
2. Updates nav item active highlight
3. Updates breadcrumb text
4. Calls that page's render function
5. Calls `updateTopbarBtn(p)`

---

## 3. Data Structures

### SERVICE_LINES (6 entries, constant)

| id | name | short | color | subgroups |
|----|------|-------|-------|-----------|
| `acc` | Accounting & Tax | A&T | #4CAF50 | e.g. Business Advisory, Private Clients |
| `bkcfo` | Bookkeeping & CFO | BKK | #2196F3 | — |
| `fin` | Finance & Lending | F&L | #FF8C00 | — |
| `wm` | Wealth Management | WM | #7B2FBE | — |
| `rd` | R&D Tax & Grants | R&D | #F5C518 | — |
| `ins` | Insurance | INS | #e84040 | — |

### STATES (5 entries, constant)

| id | abbr | name | color | Known Offices |
|----|------|------|-------|---------------|
| `nsw` | NSW | New South Wales | #4A90D9 | Parramatta, St Leonards |
| `vic` | VIC | Victoria | #5C7CFA | Elsternwick, Mornington, Mt Waverley, Moonee Ponds |
| `qld` | QLD | Queensland | #12B886 | Brisbane CBD, Bundaberg, Toowoomba |
| `wa` | WA | Western Australia | #A855F7 | Osborne Park (×2), Clarebrook, Wangara |
| `sa` | SA | South Australia | #e84040 | Adelaide |

### CARBONITES (staff roster, ~80+ entries)
```ts
{
  id:           string      // 'c01', 'cb-{timestamp}'
  name:         string      // Full name
  role:         string      // Job title
  sl:           string      // Service line id
  sg?:          string      // Subgroup id (optional)
  state:        string      // State id
  office:       string      // Office id
  pod:          string|null // Pod name string (null = no pod)
  salary:       number      // Annual salary
  type:         'FT'|'PT'
  hoursPerWeek?: number     // PT only
  seniority:    number      // 1–10 integer
  location?:    string      // Remote work location (nullable)
  is_partner:   boolean     // Legacy field
  isPartner:    boolean     // Normalised alias (set in loadData)
  reports_to:   string|null // Carbonite id (legacy field)
  reportsTo:    string|null // Normalised alias (set in loadData)
  entity:       string|null // Entity id
  util?:        number      // Utilisation % (80 default)
  startDate?:   string      // ISO date
}
```

### ENTITIES (~15 entries)
```ts
{
  id:       string    // 'ent-par', 'ent-bne', etc.
  biz:      string    // Business name
  tan:      string    // TAN / entity code
  officeId: string    // Office id
  state:    string    // State id
  phone:    string
  address:  string
  email:    string
  sl:       string[]  // Array of service line ids
  partners: string[]  // Array of partner name strings
}
```

### HIRING_NEEDS
```ts
{
  id:          string
  role:        string    // Job title
  sl:          string    // Service line id
  status:      'open'|'shortlisted'|'interviewing'|'offered'|'filled'|'closed'
  priority:    'urgent'|'normal'|'low'
  location:    string    // Display string
  state:       string    // State id
  salary_min:  number
  salary_max:  number
  approved_by: string
  closed_how?: string    // Set when closed/filled
  notes?:      string
}
```

### POD_BUDGETS
```ts
// Keyed by "state||office||podName"
{ "wa||osborne-park||WA ACC Pod": 500000 }
```
Only explicitly-set budgets exist. If key not present, `getPodBudget()` falls back to staff cost (ratio = 1.0).

### POD_FEES
```ts
// Projected fee revenue per pod (mostly empty in seed data)
{ "wa||osborne-park||WA ACC Pod": 1800000 }
```

### WFP_REVENUE
```ts
// Keyed by "entId|FY"
{ "ent-par|FY25-26": { target: 480000, actual: 484800 } }
```

### WFP_STAFF_META
```ts
// Keyed by carboniteId
{
  "c01": {
    billingTarget: 317000,    // Manual override (null/undefined = auto-calc)
    billingActual: 304320,
    perfRating: "80%",        // From PERF_RATING_PRESETS
    promoFlag: "No",          // 'No' | 'Maybe' | 'Yes'
    promoEta: "",             // "YYYY-MM" or empty
    staffRole: "Reviewer"     // 'Doer' | 'Reviewer' | 'BD'
  }
}
```

`PERF_RATING_PRESETS = [50, 75, 90, 100, 110, 125, 150]` (percentage values)

### WFP_ENTITY_SETTINGS
```ts
// Keyed by entId
{ "ent-par": { billingMultiplier: 3.2, fy: "FY25-26" } }
```
Default billing multiplier = **3.5**. All seed entities use 3.2.

### HEADCOUNT_TARGETS
```ts
// Keyed by "entId:slId" or just slId (global)
{ "acc": { target: null, notes: "" } }
```

### SALARY_BENCHMARKS
```ts
// Keyed by service line id
{
  "acc": {
    role:         string|null  // e.g. "Senior Accountant"
    market_min:   number|null  // Hays/SEEK market data
    market_max:   number|null
    carbon_avg:   number|null  // Auto-calculated from CARBONITES
    override_avg: number|null  // Manual override (takes priority over auto-calc)
    source:       string       // e.g. "Hays 2025"
  }
}
```

### ATTRITION_RISKS
```ts
// Array; auto-regenerated by regenAttritionRisks() on every renderAll()
// Manual entries also stored here
[{
  cbId:   string   // Carbonite id
  name:   string   // Denormalised name
  risk:   'high'|'medium'
  reason: string   // Auto-generated or manual
  impact: 'Critical'|'Significant'
  action?: string  // Retention action (manual entries only)
}]
```

### SCENARIOS
```ts
[{
  id:          string   // 'sc' + timestamp
  name:        string
  description: string
  color:       string   // Hex colour
  roles: [{
    role:    string
    sl:      string
    salary:  number
    count:   number
  }]
  entity: string|null   // Scoped to active WFP entity
}]
```

### PRIOR_YEAR_DATA
```ts
// Keyed by pod name; populated via Import Prior Year modal
{ "WA ACC Pod": { year: "FY24-25", budget: 450000 } }
```

### TIME_TO_HIRE (static reference, 2 divisions)
```ts
// Keyed by division: 'acc' | 'bkcfo'
{
  acc: [{
    role:    string      // e.g. "Graduate / Junior"
    hire:    [min, max]  // weeks to hire
    notice:  [min, max]  // notice period weeks
    buffer:  number      // weeks buffer
    start:   [min, max]  // total weeks app→start (or null for Director)
    notes:   string      // Market context
    special?: string     // Override display e.g. "6–12+ months"
  }]
}
```

`TTH_SUMMARY` — 6 seniority bands with label, range string, and colour for the summary strip.

### SALARY_BRACKETS (large static lookup table)
```ts
[{
  div:  string   // Division group name e.g. "Accounting", "Bookkeeping"
  sl:   string   // Service line id
  role: string   // Specific role title
  prog: number   // Career level (for "L3" badge)
  nsw:  { m: [lo, hi], r: [lo, hi] }  // metro and regional ranges ($k)
  vic:  { m, r }
  qld:  { m, r }
  wa:   { m, r }
  sa:   { m, r }
  bands: [{
    perf:  '1 & 2'|'3'|'4 & 5'
    label: string
    nsw:   { m, r }
    vic:   { m, r }
    qld:   { m, r }
    wa:    { m, r }
    sa:    { m, r }
  }]
}]
```

### PODS (derived, not stored)
```ts
// Global array; rebuilt by buildPodsFromCarbonites() on every renderAll()
[{
  name:    string    // Pod name (or 'Ungrouped')
  state:   string
  office:  string
  sl:      string    // From first member
  entity:  string|null
  members: Carbonite[]
}]
```

---

## 4. Dashboard Page

**HTML id:** `#page-dashboard`

### Banner (hero card)
Dark gradient card (`--grey-dark` to `#2d3238`) with green circle watermark decoration.

| Element | Content |
|---------|---------|
| Eyebrow (Caveat font) | "FY 2025–26" |
| Title | "Carbon Group" |
| Subtitle | "FY 2025–26 · {N} States · {N} offices · {N} service lines" (live) |
| Stat 1 | **Total Carbonites** — count |
| Stat 2 | **Offices** — unique office count |
| Stat 3 | **Service Lines** — count (always 6) |

### KPI Strip (`#kpi-strip`) — 4 cards
Each card has a coloured top border (3px) matching the active SL filter. Cards are animated with staggered `animation-delay` (0.05s, 0.1s, 0.15s, 0.2s).

| # | Label | Value | Sub-label |
|---|-------|-------|-----------|
| 1 | Total Carbonites | count scoped to SL filter | `N entities nationwide` or SL name |
| 2 | Total Partners | unique partner count | `Across all entities` or `N entities` |
| 3 | Total Payroll | `$X` (formatted) | `Live from pod salaries` or `{SL} payroll` |
| 4 | Active Pods | pod count | `N staff with salary set` |

Card colour classes: `kg` (green), `kt` (teal), `kw` (warn), `kd` (danger).

### Service Line Filter (`#sl-filter-btns`)
7 buttons: `All` + 6 SL short names (`A&T`, `BKK`, `F&L`, `WM`, `R&D`, `INS`).
- Active button gets SL colour background (white text)
- Calls `setEntFilter(slId)` — persists in `window._entSLFilter`
- Filter propagates to: KPI strip, entity grid, alerts, chart

### Entity Search (`#entity-search`)
Text input. Live filter (`oninput`) by: biz name, partner names, TAN.

### Entity Grid (`#entity-grid`)
Responsive CSS grid (auto-fill, ~300px column min). Animated cards (`fadeUp` + delay).

**Entity Card anatomy:**
```
[SL accent colour stripe — 3px top border]
[Business name — bold 14px]  [TAN — italic 10px]
[State badge — coloured pill]  [Budget status badge — Over / Near limit]
[Address — 📍 icon, 10px]
[Phone link] · [Email link]
[Partner avatars — initials circles, 26px, green bg]
  → hover: tooltip with full name
  → "No partners listed" if empty
[SL chips — coloured badges, dimmed if not matching filter]
[Budget section]
  [Payroll value — coloured by status]  [Label: "Payroll/yr"]
  [Sub: "N% of budget · $X cap" | "$X payroll · N staff" | "N staff"]
  [Right: "N people · N pods"]
  [Progress bar — payroll/budget, coloured by status]
  [Remaining text: "$X remaining" | "$X over budget"]
```

Budget status colours on entity card:
- Over (ratio > 1.0): `--danger` red text + red border
- Near limit (ratio > 0.88): `--warn` orange text + orange border
- Default: standard (no override)

### Alerts Section (`#alerts-list`)
Collapsible card. Header badge: `N urgent · N watch` or `All clear ✓`.

**3 auto-generated alert types:**

| Type | Trigger | Badge | Action |
|------|---------|-------|--------|
| Over-budget pod | `ratio > 1.0` | Red | `setPage('capacity')` + open budget panel |
| Urgent unfilled hire | `status !== 'filled'/'closed'` + `priority === 'urgent'` | Orange | `setPage('hiring')` |
| Underspent pod | `ratio < 0.65` | Teal/blue | `setPage('capacity')` + open budget panel |

Alert item anatomy: icon + name (bold) + location sub-text + message + action button.

### Budget vs Payroll Chart (`#bar-chart`)
Pure CSS/HTML grouped bar chart (no canvas, no SVG library).
- One group per service line (only SLs with data shown)
- Two bars per group: Budget (grey) vs Payroll (SL colour, or red if over)
- Bar heights proportional to max value across all SLs (138px max)
- Hover tooltip on each bar (via `title` attribute)
- X-axis labels: SL short names
- Y-axis: implied (no axis labels, visual only)

---

## 5. Capacity Plan Page

**HTML id:** `#page-capacity`

### Summary Pills (`#cap-summary`)
Live pills above the accordion:
- `N pods` (always shown)
- `N people` (always shown)
- `N over budget` (red pill, only shown if count > 0)

### State Accordion Layout
States rendered alphabetically. `toggleCapState(stId)` collapses/expands. **All states start open.**

**State header row:**
- Coloured dot (state colour) + state name
- Pills: `N people`, `N pods`, `N over` (red), `N near` (orange)

Inside each state: office sections.

**Office section header:**
- `📍 Office Name` (bold)
- Horizontal divider
- Pods grid below

### Pod Grid
CSS grid (`auto-fill`, min-width ~280px). Each office ends with a `+ New Pod` empty card → `openAddPodModal(stId, ofId)`.

### Pod Card
Animated with staggered `animation-delay` (40ms × index). Hover: `translateY(-2px)` + shadow.

```
[Left coloured stripe — 3px, SL colour or --danger if over budget]
[Header row]
  [Pod name — bold 14px]
  [SL badge — SL short name, SL colour background]
  [Status badge — see thresholds below]
[Bucket visual — SVG with animated liquid fill]
  [Bucket SVG: 190px height, liquid fill from bottom]
  [Liquid colour: SL colour → orange (fill<20%) → red (over budget)]
  [Wave SVG path at liquid surface]
  [No budget set: shows staff cost as placeholder, no liquid animation]
[Metrics row]
  [$X Staff cost]  [/ $Y Budget or "— set one"]  [N% used]
[Footer row]
  [N people pill]  [▼ Team button → togglePodTeam(cardId)]  [View → button → openPanelForPod(podKey)]
[Team Drawer — collapsible, id="drawer-{cardId}"]
  [Partners section — isPartner === true]
  [Pod Leads section — reportsTo falsy AND not partner]
  [Staff section — has reportsTo]
  Each row: [initials avatar] [name] [role] [FT/PT badge] [$salary]
```

**Pod Budget Status Thresholds:**

| Condition | Status label | Colour |
|-----------|-------------|--------|
| `ratio > 1.0` | Over budget | `--danger` (#e84040) |
| `ratio > 0.88` | Near limit | `--warn` (#f5a623) |
| `ratio < 0.65` | Underspent | `--teal` (#3ABFCC) |
| otherwise | On track | SL colour |

Where `ratio = staffCost / budget`.

### Budget Panel (Right Sliding Panel)
Fixed right panel, `380px` wide. Slides in alongside content (`.main` gets `margin-right: 380px`).

**Triggers:**
- Pod card `View →` button → `openPanelForPod(podKey)`
- Alert click (over-budget / underspent pod)
- WFP entity pods `View →` button

**Panel anatomy:**
```
[Coloured stripe top — SL colour or danger/warn override]
[Eyebrow: SL name (Caveat font)]
[Pod title — large bold]
[Sub: Office · State · N people]

[Budget Display Zone]
  [Pod Budget — clickable label "✎" → show edit form]
  [Staff Costs — $X]
  [Remaining or Over — $X remaining (green/teal) or $X over (red)]
  [Inline edit form — shown when pencil clicked]
    [Input: number field, pre-filled with current budget]
    [Live preview: previewBudgetEdit(val) → updates bucket fill + remaining label]
    [Enter key or Save button → saveBudgetEdit() → setPodBudget() → renderAll()]
    [Escape or Cancel → cancelBudgetEdit()]

[Bucket Visual — large, 190px, animated liquid fill]

[People Zone]
  [Header: Pod name + member count + "+ Add" button → openAddPersonToPod(podKey)]
  [Member rows — Pod Lead shown first (not indented)]
    [↳ Connector line for reports (indented)]
    Each row: [avatar (SL colour)] [name] [FT/PT badge] [role] [remote badge] [salary bar] [$X / yr]
    Click row → shows inline person edit panel

[Person Edit Inline Panel — appears when member clicked]
  Fields:
    Name (text input)
    Role (text input)
    Salary ($) (number input)
    Employment Type (FT/PT select)
    Location (remote, text input)
  Buttons: [Save changes → savePersonEdit()] [Remove → removePersonFromPod()] [Cancel]
```

`closePanel()`: slides panel out, clears `window._activePod`, clears `activePodKey`.

---

## 6. Carbonites Page

**HTML id:** `#page-carbonites`

### Search Bar
Input (`.srch`). `oninput` → `renderCarbonites(searchValue)` → `renderCarboniteCards(filter)`. Searches: name, role, SL name, office name.

### Layout
Same state accordion as Capacity Plan. States expanded by default. Inside each state: office groups. Inside each office: staff card grid.

Each office group header has `+ Add` button (top-right) → `openModal()` (Add Carbonite modal).

### Staff Card
```
[Initials avatar — SL colour background, 36px circle]
[Name — bold 14px]  [FT/PT type badge]
[Role title — 12px]
[Remote location badge — 📍 orange, only if c.location set]
[Seniority indicator — e.g. seniority dots or level label]
[$X / yr — or "Salary TBD" if salary = 0]
[Edit button → openEditCb(id)]
[Delete button → openDeleteModal(id)]
```

### Add / Edit Carbonite Modal (`modal-add`)
3-step wizard. Navigation: Back / Next → / ✓ Save Carbonite.

**Step tabs shown at top of modal (not clickable — sequential only).**

**Step 1 — Who**

| Field | Type | Notes |
|-------|------|-------|
| First Name | text | Required |
| Last Name | text | Required |
| Employment Type | select | Full-time / Part-time |
| Hours per week | number | Shown only when PT selected |
| FTE preview | label | Live: "0.53 FTE" — `hoursPerWeek / ftHours` |
| Location (remote) | text | Optional |

**Step 2 — Where & What**

| Field | Type | Notes |
|-------|------|-------|
| State | select | `onchange` → `updateMOffices()` repopulates Office |
| Office | select | `onchange` → `updateMServiceLines()` repopulates SL |
| Service Line | select | `onchange` → `updateMRoles()` repopulates Role and Subgroup |
| Subgroup | select | Optional; populated from `SL.subgroups` |
| Role | select | Each `<option>` has `data-level` attribute for seniority |
| Seniority preview | label | Live: "Level N" — read from `data-level` on selected option |

**Step 3 — Pod & Pay**

| Field | Type | Notes |
|-------|------|-------|
| Pod | text/select | Shows existing pods for office+SL; can type new name |
| Reports To | select | Carbonites in same office; `populateMReportsTo()` called on entering step 3 |
| Annual Salary ($) | number | `onchange` → `updateSalaryBenchmark()` |
| Salary benchmark hint | label | Live from `SALARY_BRACKETS` — shows range for role+state+metro |

**`saveCb()` logic:**
1. Validates name (step 1); state + office + SL (step 2)
2. Derives entity: `ENTITIES.find(e => e.state === stId && e.officeId === ofId)`
3. Creates or updates Carbonite object
4. `buildPodsFromCarbonites()` → `closeModal()` → `renderCarbonites()` → `renderAll()`
5. Toast: `✓ {Name} added` or `✓ {Name} updated`

**`openEditCb(id)` pre-fill sequence:**
Uses cascading `setTimeout` delays (~50ms each) to wait for dynamic selects to populate before setting values. Sequence: state → (wait) → office → (wait) → SL → (wait) → role/subgroup → pod/reportsTo/salary.

---

## 7. Hiring Page

**HTML id:** `#page-hiring`

### KPI Strip — 4 cards

| # | Label | Value | Notes |
|---|-------|-------|-------|
| 1 | Open Roles | count | `status !== 'filled' && status !== 'closed'` |
| 2 | Urgent | count | `priority === 'urgent'` AND not filled/closed |
| 3 | Avg Salary Range | `$X` | avg of `(salary_min + salary_max) / 2` across open roles |
| 4 | Est. Annual Cost | `$X` | sum of avg salaries for all open roles |

### Status Filter Tabs
Buttons with count badge: `All` · `Open` · `Shortlisted` · `Interviewing` · `Offered` · `Filled` · `Closed`

Active tab highlighted. Filters the roles table below.

### Roles Table

Columns: **Role** | **Service Line** | **Location** | **Priority** | **Salary Range** | **Status** | **Actions**

| Column | Details |
|--------|---------|
| Role | Name (bold) |
| Service Line | SL chip (SL colour background) |
| Location | Location string |
| Priority | Badge: `Urgent` (red) / `Normal` (teal) / `Low` (grey) |
| Salary Range | `$Xk – $Yk` |
| Status | Colour-coded badge per status value |
| Actions | `Edit` → `openEditRoleModal(id)` / `Close` → `openCloseRoleModal(id)` |

Rows are clickable. Filled/Closed rows shown with reduced opacity.

### Hiring Pipeline Projection Chart
CSS bar chart. Shows estimated hiring cost over time from open roles. Display only (not interactive).

### Time-to-Hire Reference Panel
Toggle: `toggleTimeToHire()`. **Starts collapsed.**

**Division toggle:** `Accounting & Tax` | `BKK & CFO`

**Summary strip — 6 seniority bands:**

| Band | Range | Colour |
|------|-------|--------|
| Junior | 6–10 weeks | green |
| Intermediate | 8–12 weeks | teal |
| Senior | 9–12 weeks | teal |
| Manager | 11–15 weeks | orange |
| Senior Manager | 17–21 weeks | yellow/orange |
| Associate Director | 19–27 weeks | red |
| Director | 6–12+ months | purple |

**Roles table (3 columns):** Role | App→Start (coloured badge) | Market Notes

### Salary Brackets Reference Panel
Toggle: `toggleSalaryBrackets()`. **Starts collapsed.**

**State filter:** `All States` | `NSW` | `QLD` | `SA` | `VIC` | `WA`
**Division tabs:** Dynamically built from `SALARY_BRACKETS[].div` field.

**Table columns:** Role | Level (L-badge: e.g. `L3`) | Metro | Regional (per selected state, or all states paired if "All States")

- Clicking a row expands performance band sub-rows
- Performance bands: `Rank 1 & 2` (grey) | `Rank 3` (teal) | `Rank 4 & 5` (green)
- Data format: `$Xk – $Yk` or `$Xk` if min = max

---

## 8. Workforce Planning Page

**HTML id:** `#page-workforce`

### Firm-Wide KPI Strip (`#wfp-firm-kpis`) — 5 cards

| # | Label | Value | Sub | Colour rule |
|---|-------|-------|-----|-------------|
| 1 | Total Headcount | all Carbonites count | `Across N entities` | — |
| 2 | Total Payroll | `fmt(sum all salaries)` | `All entities combined` | — |
| 3 | Avg Salary | mean salary (salary > 0) | `Firm-wide average` | — |
| 4 | Avg Tenure | mean of `seniority` (1 decimal) | `Firm-wide seniority` | — |
| 5 | Attrition Risk | high-risk count | `N flagged` or `None flagged` | Red if > 0 |

### Entity Selector Grid (`#wfp-entity-grid`)
Card grid of entities that have at least 1 pod. Sorted: state then biz name.

Each card shows: biz name, state badge, SL colour dots, staff count, pod count, payroll, attrition-at-risk count.

Clicking → `selectWFPEntity(entId)` → sets `window._wfpEntity` → re-renders → scrolls to detail.

A note below the grid lists entities with no staff assigned (excluded from grid).

### Entity Detail (`#wfp-entity-detail`)
Shown when entity selected. Contains 8 sub-sections.

#### Action Bar
6 inline action buttons:

| Button | Label | Action |
|--------|-------|--------|
| 1 | `📊 Set Revenue Target` | `openWFPRevenueModal(entId)` |
| 2 | `⚑ Flag Risk` | `openAddAttritionModal()` |
| 3 | `⊕ New Scenario` | `openScenarioModal()` |
| 4 | `+ Add Staff` | `openAddStaffToEntityModal(entId)` |
| 5 | `✎ Edit Entity` | `openEditEntityModal(entId)` |
| 6 | `✕ Close` | `deselectWFPEntity()` |

#### Entity Header
- Business name (large, bold, 20px)
- TAN + state name (sub-label)
- SL chips (coloured badges)
- Stat tiles: Staff count | Annual Payroll | Billing Capacity | At Risk count (if > 0)
- **Billing multiplier tile** (clickable → `openWFPSettingsModal(entId)`) showing `N×`

#### Revenue Strip — `renderRevenueStrip(entId)`
Shown only when revenue target is set for entity. 4-metric grid:

| Metric | Value | Notes |
|--------|-------|-------|
| Target | `fmt(rev.target)` | |
| Actual YTD | `fmt(rev.actual)` | Green if ≥ target |
| Team Billing Cap. | `fmt(capacity)` | Teal; sum of `calcBillingTarget()` for all entity staff |
| Revenue Gap | `fmt(gap)` | Red if gap > 0 (shortfall); green if capacity ≥ target |

- Progress bar: `actual / target × 100%`
- Billing capacity bar: `capacity / target × 100%`
- Gap alert: if gap > 0, `renderRevenueGapAlert(entId)` shows warning with hire count recommendation

#### WFP Team Table — `renderWFPTeam(entId)`
Members grouped into 3 tiers (Partners | Pod Leads | Staff).

Columns: **Name** | **Role** | **Billing Target** | **Actual** | **Perf %** | **Promo** | **Role Type** | **Actions**

| Column | Details |
|--------|---------|
| Name | Initials avatar (SL colour) + full name |
| Role | Job title |
| Billing Target | `fmt(billingTarget)` — coloured badge; green if manual override, teal if auto-calc |
| Actual | `fmt(billingActual)` — coloured badge; green if ≥ target |
| Perf % | Percentage string + coloured progress bar (`pct / 1.5` mapped to bar width, 150% = full) |
| Promo | `Yes` (green) / `Maybe` (orange) / `No` (grey) |
| Role Type | `Doer` / `Reviewer` / `BD` |
| Actions | Edit button → `openStaffMetaModal(cbId)` |

**Totals row:** sum billing targets | sum actuals | average performance %

#### Compensation Budget — `renderCompBudget(entId, payroll, hiringCost)`
4-metric row:

| Metric | Value |
|--------|-------|
| Current Payroll | `fmt(payroll)` |
| Open Hiring Cost | `fmt(hiringCost)` — avg salary ranges for open roles in same state |
| Projected Total | `fmt(payroll + hiringCost)` |
| Billing Multiple | `(billingCap / totalCost).toFixed(1)×` |

Stacked progress bar: payroll segment (SL colour) + hiring segment (warn orange).

#### Headcount Chart — `renderHeadcountChart(entId, entSls)`
For each SL present in entity:
- SL name + colour
- Current count (from CARBONITES) vs Target (from HEADCOUNT_TARGETS)
- Gap = `target - current` (shown as pill)
- Bar: current fill (SL colour) + target marker line
- Edit button → `openEditTargetModal(slId, entId)`

#### Attrition Section — `renderAttritionSection(entId)`
Scoped to entity staff (filter ATTRITION_RISKS by cbId membership).

Each risk row:
- Name (bold) + risk badge: `High Risk` (red) | `Medium Risk` (orange)
- Reason text
- Action/retention plan text (if set)
- Impact: `Critical` | `Significant`

Section header has `+ Flag Risk` button → `openAddAttritionModal()`.

#### Entity Pods Mini-Cards — `renderEntityPods(entId)`
Compact pod cards for all pods belonging to this entity. Each shows:
- Pod name + SL badge
- Member count + payroll
- Budget status bar
- `View →` button → `openPanelForPod(podKey)` → `setPage('capacity')`

#### Salary Benchmarks — `renderBenchmarks(entSls)`
Scoped to SLs of selected entity. Auto-calculates Carbon avg from CARBONITES.

Table columns: **Service Line** | **Benchmark Role** | **Market Min** | **Market Max** | **Carbon Avg** | **Source** | **Actions**

- Carbon Avg: green if within market min–max range; red if above market max
- Edit button → `openEditBenchmarkModal(slId)`

#### Scenario Workbench — `renderScenarios(entId)`
List of scenarios scoped to this entity (+ global scenarios with `entity === null`).

Each scenario card:
- Name + description
- Colour swatch
- Roles list: `Nx RoleName ($Y/yr)` per role, SL badge
- **Impact analysis (computed live):**
  - New payroll added: `fmt(sum(salary × count))`
  - New billing capacity: `fmt(sum(salary × count × multiplier))`
  - Revised billing capacity total
  - Revised billing multiple
- Delete button (removes from SCENARIOS array, re-renders)

---

## 9. FY Reports Page

**HTML id:** `#page-fy`

### FY Tab Selector
Two buttons: `FY 2025–26` (active, dark bg) | `FY 2024–25`. Visual toggle only — data always reflects current FY.

### Pod Budget Snapshot Table
Columns vary depending on whether prior year data is imported.

**Standard columns:**

| Column | Details |
|--------|---------|
| Pod | SL coloured dot + pod name (clickable → opens budget panel) |
| Location | Office name |
| SL | SL badge chip |
| People | Member count |
| Budget | `$X` or `—` if unset |
| Staff Cost | `$X` |
| Remaining | `$X remaining` or `−$X over` (coloured red/orange/green) |
| Load % | Mini bar + percentage |

**Additional columns when prior year data imported:**

| Column | Details |
|--------|---------|
| Prior Year Budget | `$X` (grey, from PRIOR_YEAR_DATA) |
| YoY Change | `+$X` (green) or `−$X` (red) |

**Totals row:** TOTAL label | total people | total budget | total staff cost | total remaining | weighted avg load | (total prior budget + total YoY if applicable)

### Prior Year Data Card (`#fy-prior-card`)
Shown only when prior year data imported. Lists all imported pod → budget pairs.

### Action Buttons
- `⬆ Import Prior Year` → `openImportFYModal()`
- `⬇ Download Report` → `downloadFYReport()`

### Download Report (`downloadFYReport()`)
Generates and downloads a CSV file.
- Filename: `Carbon_Pod_Report_FY2025-26_{YYYY-MM-DD}.csv`
- Columns: Pod, Location, State, Service Line, People, Budget, Staff Cost, Remaining, Load%, [Prior Year Budget, YoY Change if data present]
- Final row: TOTAL summary

---

## 10. Pod System

### Definition
A **pod** is a logical grouping of Carbonites that share the same `pod` name string, `state`, and `office`. Pods are **not a separate entity** — they are derived dynamically from CARBONITES.

### `buildPodsFromCarbonites()`
```js
CARBONITES.forEach(c => {
  const key = (c.pod || 'Ungrouped') + '||' + c.state + '||' + c.office;
  if (!podMap[key]) podMap[key] = {
    name: c.pod || 'Ungrouped', state: c.state, office: c.office,
    sl: c.sl, entity: c.entity || null, members: []
  };
  if (!podMap[key].entity && c.entity) podMap[key].entity = c.entity;
  podMap[key].members.push(c);
});
PODS = Object.values(podMap).sort(/* by state, office, then name */);
```
Carbonites with `pod === null` → placed in an `'Ungrouped'` pod.

### Budget Key Format
`"state||office||podName"` — note: state first, double-pipe separator.

### Budget Functions
```js
// Returns explicitly set budget, OR falls back to sum(member.salary)
getPodBudget(pod) → POD_BUDGETS[key] ?? staffCost

// Returns true ONLY if budget was explicitly set (not fallback)
hasPodBudgetSet(pod) → POD_BUDGETS[key] !== undefined

// Sets budget; persists to DB stub
setPodBudget(pod, val) → POD_BUDGETS[key] = val; savePodBudgetToDb(...)
```

**Critical:** `hasPodBudgetSet()` is used to distinguish between "no budget set" and an actual zero budget. When unset: ratio = 1.0 exactly, pod appears 100% full.

### Pod Ratio
```js
ratio = staffCost / getPodBudget(pod)
// staffCost = pod.members.reduce((s, m) => s + (m.salary || 0), 0)
```

### Pod Status Thresholds
| Condition | Status | Colour |
|-----------|--------|--------|
| `ratio > 1.0` | Over budget | `--danger` #e84040 |
| `ratio > 0.88` | Near limit | `--warn` #f5a623 |
| `ratio < 0.65` | Underspent | `--teal` #3ABFCC |
| otherwise | On track | SL colour |

### Bucket Liquid Fill Formula
```js
remaining  = budget - staffCost
fillPct    = Math.max(0, Math.min(100, (remaining / budget) * 100))
liquidH    = Math.round(fillPct / 100 * 190)  // pixels, max 190px total bucket height
```
Liquid colour transitions:
- Normal: SL colour
- Low fill (< 20%): orange (`--warn`)
- Over budget (staffCost > budget): red (`--danger`)

Wave SVG path animated at liquid surface.

### Pod Member Tier Sorting
```
Tier 1: Partners        — isPartner === true
Tier 2: Pod Leads       — reportsTo is null/falsy AND not partner
Tier 3: Staff           — reportsTo is set (has a manager)
```
Within each tier: sorted by `seniority` descending.

### Pod Actions Summary

| Action | Trigger | Function |
|--------|---------|----------|
| View pod detail | Pod card `View →` button | `openPanelForPod(podKey)` |
| Create new pod | `+ New Pod` empty card | `openAddPodModal(stId, ofId)` |
| Add person to pod | `+ Add` in budget panel | `openAddPersonToPod(podKey)` |
| Edit person inline | Click person row in panel | Shows `#person-edit-panel` |
| Remove person from pod | `Remove` in person edit panel | `removePersonFromPod()` — sets `cb.pod = null`, NOT delete |
| Edit pod budget | Click pencil in panel | Shows inline budget input |
| Save budget | Enter key or Save button | `saveBudgetEdit()` → `setPodBudget()` → `renderAll()` |
| Live budget preview | Typing in budget input | `previewBudgetEdit(val)` — updates bucket + remaining label |
| Toggle team drawer | `▼ Team` button on pod card | `togglePodTeam(cardId)` |

---

## 11. All Modals & Dialogs

### 1. Add / Edit Carbonite (`modal-add`)
- **Open (create):** `openModal()` from topbar button or office group `+ Add`
- **Open (edit):** `openEditCb(id)` — sets `window._editingCbId`
- **Structure:** CSS `open` class toggle (not display style); 3-step wizard

See [Section 6 (Carbonites Page)](#6-carbonites-page) for full field listing.

**Validation:**
- Step 1: First name required (alert + focus if missing)
- Step 2: State + Office + Service Line required (alert + go to step 2 if missing)
- Step 3: No required fields

**Backdrop click:** closes modal.

---

### 2. Add Hiring Role (`modal-add-role`)
**Trigger:** topbar `＋ Add Role` button on Hiring page

| Field | Type | Required |
|-------|------|----------|
| Role / Title | text | Yes |
| Service Line | select | — |
| Location | text | — |
| State | select | — |
| Priority | select: Normal / Urgent / Low | — |
| Salary Min ($) | number | — |
| Salary Max ($) | number | — |
| Approved By | text | — |
| Notes | textarea | — |

**Save:** `saveAddRole()` → push to `HIRING_NEEDS` → `renderHiring()` → toast

---

### 3. Edit Hiring Role (`modal-edit-role`)
**Trigger:** `openEditRoleModal(id)` from table row Edit button

Same fields as Add Role, pre-filled. **Save:** `saveEditRole()` → update in-place → `renderHiring()`

---

### 4. Close Role (`modal-close-role`)
**Trigger:** `openCloseRoleModal(id)` from table row Close button

| Field | Type | Options |
|-------|------|---------|
| How was it closed? | select | Filled internally / External hire / Role cancelled / Deferred / Other |
| Notes | textarea | — |

**Save:** `saveCloseRole()` → sets `status = 'closed'` (or `'filled'` if filled option) + stores `closed_how`

---

### 5. New Scenario (`modal-scenario`)
**Trigger:** `openScenarioModal()` from WFP action bar

| Field | Type | Required |
|-------|------|----------|
| Scenario Name | text | Yes |
| Description | textarea | — |
| Colour | color picker (hex) | — |

**Role Builder (inline, repeating):**

| Field | Type | Notes |
|-------|------|-------|
| Role Title | text | |
| Service Line | select | |
| Annual Salary ($) | number | |
| Count | number | Default 1 |
| `+ Add Role` button | | Calls `addScenarioRole()` |

After adding, roles appear as a list with Remove buttons. **Totals strip** shows:
- `Total new payroll: $X`
- `New billing capacity: +$Y` (uses entity's `billingMultiplier`)

**Save (`saveScenario()`):**
- Validates name
- Pushes to `SCENARIOS` with `entity = window._wfpEntity`
- Clears `window._scRoles`
- `renderScenarios(window._wfpEntity)`
- Toast: `✓ Scenario "Name" saved`

**Backdrop click:** closes modal.

---

### 6. Staff Details / Staff Meta (`modal-staff-meta`)
**Trigger:** `openStaffMetaModal(cbId)` from WFP team table Edit button
**Pre-fills from:** `WFP_STAFF_META[cbId]`

| Field | Type | Notes |
|-------|------|-------|
| Billing Target ($) | number | Blank = auto-calculated from salary × multiplier × roleMod × fte |
| Billing Actual ($) | number | |
| Performance Rating | select/radio | Presets: 50, 75, 90, 100, 110, 125, 150 (as %) |
| Staff Role Type | select | Doer / Reviewer / BD |
| Promotion Flag | select | No / Maybe / Yes |
| Promotion ETA | month picker | `YYYY-MM`; shown only when flag is Maybe or Yes |

**Save:** `saveStaffMeta()` → `setStaffMeta(cbId, updates)` → `renderEntityDetail(window._wfpEntity)`

---

### 7. Revenue Target (`modal-wfp-revenue`)
**Trigger:** `openWFPRevenueModal(entId)` from WFP action bar

| Field | Type | Notes |
|-------|------|-------|
| FY | info label | Shows current FY (e.g. "FY 2025–26") |
| Revenue Target ($) | number | |
| Actual YTD ($) | number | |

**Save:** `saveRevenueTarget()` → `setRevenue(entId, fy, target, actual)` → `renderEntityDetail(entId)`

---

### 8. Entity Planning Settings (`modal-wfp-settings`)
**Trigger:** `openWFPSettingsModal(entId)` — clicking the billing multiplier tile in entity header

| Field | Type | Notes |
|-------|------|-------|
| Billing Multiplier | number | Default 3.5; seed data uses 3.2 |
| Financial Year | select | FY25-26 / FY24-25 |

**Save:** `saveWFPSettings()` → updates `WFP_ENTITY_SETTINGS[entId]` → `renderEntityDetail(entId)`

---

### 9. Edit Headcount Target (`modal-edit-target`)
**Trigger:** `openEditTargetModal(slId, entId)` from headcount chart Edit button

| Field | Type | Notes |
|-------|------|-------|
| Service Line | label | Read-only display |
| Headcount Target | number | |
| Notes | textarea | |

**Save:** updates `HEADCOUNT_TARGETS[key]` → re-renders headcount chart

---

### 10. Edit Salary Benchmark (`modal-edit-benchmark`)
**Trigger:** `openEditBenchmarkModal(slId)` from benchmarks table Edit button

| Field | Type | Notes |
|-------|------|-------|
| Service Line | label | Read-only display |
| Benchmark Role | text | e.g. "Senior Accountant" |
| Market Min ($) | number | |
| Market Max ($) | number | |
| Carbon Avg Override ($) | number | Blank = auto-calculated from CARBONITES |
| Source | text | e.g. "Hays 2025" |

**Save:** `saveEditBenchmark()` → updates `SALARY_BENCHMARKS[slId]` → `refreshBenchmarkActuals()` → re-renders

---

### 11. Flag Attrition Risk (`modal-attrition`)
**Trigger (create):** `openAddAttritionModal()` from WFP action bar or attrition section header
**Trigger (edit):** `openEditAttritionModal(idx)`

| Field | Type | Notes |
|-------|------|-------|
| Carbonite | select | From CARBONITES |
| Risk Level | select | High / Medium / Low |
| Reason | text | |
| Action / Retention Plan | textarea | |

**Save:** `saveAttritionRisk()` → push/update `ATTRITION_RISKS` → `renderAttritionSection(entId)`

---

### 12. Import Prior Year Data (`modal-import-fy`)
**Trigger:** `openImportFYModal()` from FY Reports page

| Field | Type | Notes |
|-------|------|-------|
| Financial Year | select | FY24-25 / FY23-24 / FY22-23 |
| Per-pod budget inputs | number | One row per pod in `PODS`, pre-filled if data exists |
| CSV Paste | textarea | Format: `PodName,BudgetAmount` per line |
| `Parse CSV` button | — | `parseFYCSV()` — fuzzy-matches pod names |

**Save:** `saveImportFY()` → populates `PRIOR_YEAR_DATA` → `renderFYReport()`

---

### 13. Add Location (`modal-location`)
**Trigger:** Capacity Plan topbar `+ Add Location` → `openAddLocationModal()`

| Field | Type | Notes |
|-------|------|-------|
| Location Name | text | |
| State | select | |
| Office Association | select | Link to existing office or create new |

**Save:** `saveLocation()` → pushes to state's offices → `renderCapacity()`

---

### 14. Create a Pod (`modal-pod`)
**Trigger:** `openAddPodModal(stId, ofId)` from `+ New Pod` empty card in Capacity Plan

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Pod Name | text | Yes | |
| Service Line | select | — | |
| Entity | select | — | Filtered by state/office |
| State | read-only | — | Pre-filled from context |
| Office | read-only | — | Pre-filled from context |
| Budget ($) | number | — | Optional |
| Fee Revenue ($) | number | — | Optional; triggers staffing insight |
| Staffing insight | label | — | Live: `Staff capacity: $X to $Y` (fees/5 to fees/3) |

**Save (`savePod()`):**
1. Finds entity from state/office
2. Registers budget via `setPodBudget()` if entered
3. `buildPodsFromCarbonites()` → `renderAll()`

---

### 15. Delete Carbonite (`modal-delete`)
**Trigger:** Delete button on staff card → `openDeleteModal(id)`

Confirmation dialog showing the person's name.

**Confirm (`deleteCb(id)`):** removes from `CARBONITES` → `buildPodsFromCarbonites()` → `renderAll()` → toast
**Backdrop click:** closes modal.

---

### 16. Add Staff to Entity (`modal-add-staff-entity`)
**Trigger:** `openAddStaffToEntityModal(entId)` from WFP action bar `+ Add Staff`

**Dual-mode: search existing OR create new.**

**Search section:**
- Text search input → `filterASEResults()` → live dropdown of Carbonites not already in this entity
- Each result: initials avatar + name + role + SL + `Assign →` button → `assignCarboniteToEntity(cbId)`

**Create New section:**

| Field | Type | Notes |
|-------|------|-------|
| First Name | text | Required |
| Last Name | text | |
| Employment Type | select | Full-time / Part-time |
| Hours per week | number | Shown only when PT selected |
| Service Line | select | |
| Role / Title | text | |
| Seniority Level (1–10) | number | |
| Annual Salary ($) | number | |
| Start Date | date | |

**Save (create):** `saveAddStaffToEntity()` → push to `CARBONITES` → `buildPodsFromCarbonites()` → `renderEntityDetail()` → `renderCarbonites()`
**Save (assign):** `assignCarboniteToEntity(cbId)` → sets `cb.entity = entId` and `cb.office = ent.officeId` → re-renders

---

### 17. Edit Entity (`modal-edit-entity`)
**Trigger:** `openEditEntityModal(entId)` from WFP action bar `✎ Edit Entity`

| Field | Type | Notes |
|-------|------|-------|
| Business Name | text | |
| TAN / Entity Code | text | |
| Phone | tel | |
| Email | email | |
| Address | text | |
| Service Lines | checkbox group | All 6 SLs; border + bg update to SL colour on check (`updateEntSLStyle()`) |

**Save (`saveEntityEdit()`):** updates entity in ENTITIES → `saveEntityToDb(ent)` → `renderAll()` → `renderEntityDetail(entId)`

---

## 12. All Calculations & Formulas

### FTE Calculation
```js
function getFTHours(cb) {
  // CABC entities in QLD → 38 hrs
  // VIC → 38 hrs
  // NSW / QLD / WA / SA → 37.5 hrs
}

fte = (cb.type === 'PT') ? (cb.hoursPerWeek / getFTHours(cb)) : 1.0
```

### Billing Target
```js
const DEFAULT_BILLING_MULT = 3.5

function calcBillingTarget(cb) {
  const meta = WFP_STAFF_META[cb.id]

  // Manual override takes priority
  if (meta?.billingTarget) return meta.billingTarget

  const settings = getEntitySettings(cb.entity)
  const multiplier = settings.billingMultiplier || DEFAULT_BILLING_MULT

  const roleMod = {
    Doer:     1.0,
    Reviewer: 0.7,
    BD:       0.5,
  }[meta?.staffRole || 'Doer'] ?? 1.0

  const fte = cb.type === 'PT' ? (cb.hoursPerWeek / getFTHours(cb)) : 1.0

  return Math.round(cb.salary * multiplier * roleMod * fte)
}
```

**Role modifiers:** Doer = 1.0× | Reviewer = 0.7× | BD = 0.5×

**Default multiplier = 3.5** (seed entities use 3.2, configurable per entity)

### Entity Billing Capacity
```js
function calcEntityBillingCapacity(entId) {
  return CARBONITES
    .filter(cb => cb.entity === entId)
    .reduce((s, cb) => s + calcBillingTarget(cb), 0)
}
```

### Revenue Gap
```js
function calcRevenueGap(entId, fy) {
  const rev = getRevenue(entId, fy)       // { target, actual }
  const capacity = calcEntityBillingCapacity(entId)
  return rev.target - Math.max(rev.actual, capacity)
  // Positive = shortfall; Negative = surplus
}
```

### Pod Staff Cost
```js
staffCost = pod.members.reduce((s, m) => s + (m.salary || 0), 0)
```

### Pod Budget Ratio
```js
ratio = staffCost / getPodBudget(pod)
// getPodBudget falls back to staffCost if no budget set → ratio = 1.0 when unset
```

### Bucket Liquid Fill
```js
remaining = budget - staffCost
fillPct   = Math.max(0, Math.min(100, (remaining / budget) * 100))
liquidH   = Math.round(fillPct / 100 * 190)  // px, 190px = full bucket height
// Over budget: liquidH = 0 (empty bucket), stripe + border turn red
```

### Performance Bar Width
```js
barWidth = Math.min(100, Math.round(perfPct / 1.5))
// Maps 0–150% performance → 0–100% bar fill
// 100% performance = 67% bar width
// 150% performance = 100% bar width (full)
```

### Billing Actual Performance %
```js
perfPct = (billingActual / billingTarget) * 100
// Stored as string e.g. "80%", "105%"
// Presets: [50, 75, 90, 100, 110, 125, 150]
```

### Benchmark Auto-Calculation (Carbon Avg)
```js
function refreshBenchmarkActuals() {
  SERVICE_LINES.forEach(sl => {
    const staff = CARBONITES.filter(c => c.sl === sl.id && c.salary > 0)
    if (!SALARY_BENCHMARKS[sl.id].override_avg) {
      SALARY_BENCHMARKS[sl.id].carbon_avg = staff.length
        ? Math.round(staff.reduce((s, c) => s + c.salary, 0) / staff.length)
        : null
    }
  })
}
// Called after saveEditBenchmark() and on every renderBenchmarks()
```

### Attrition Risk Auto-Generation
```js
function regenAttritionRisks() {
  ATTRITION_RISKS = []
  CARBONITES.forEach(cb => {
    const isPartner  = cb.isPartner || cb.is_partner
    const highSenior = (cb.seniority || 0) >= 7
    const highSalary = (cb.salary   || 0) >= 120000
    const midSenior  = (cb.seniority || 0) >= 5 && (cb.salary || 0) >= 95000

    let risk = null
    if (isPartner || (highSenior && highSalary))  risk = 'high'
    else if (midSenior || highSalary)              risk = 'medium'

    if (risk) ATTRITION_RISKS.push({
      cbId:   cb.id,
      name:   cb.name,
      risk,
      reason: isPartner    ? 'Key person / partner dependency'
              : highSenior ? 'Senior staff — high market demand'
                           : 'Above-market salary — counteroffers likely',
      impact: risk === 'high' ? 'Critical' : 'Significant'
    })
  })
}

// Thresholds:
// High:   isPartner OR (seniority >= 7 AND salary >= $120,000)
// Medium: (seniority >= 5 AND salary >= $95,000) OR salary >= $120,000
```

Called on every `renderAll()` — **overwrites manual entries**. Manual entries added via the Attrition modal are merged in a separate pass.

### Pod Fee-to-Staff Insight (Pod Creation Modal)
```js
staffCapacityLow  = feeRevenue / 5   // staff cost floor for healthy ratio
staffCapacityHigh = feeRevenue / 3   // staff cost ceiling for healthy ratio
// Healthy: fee revenue / staff cost should be 3× – 5×
// Insight shown: "Staff capacity: $X to $Y"
```

### Scenario Impact Calculation
```js
totalNewPayroll = roles.reduce((s, r) => s + (r.salary || 0) * (r.count || 1), 0)
totalNewBilling = roles.reduce((s, r) => s + (r.salary || 0) * (r.count || 1) * billingMultiplier, 0)
revisedBillingCap = baseBillingCapacity + totalNewBilling
revisedMultiple   = revisedBillingCap / (basePayroll + totalNewPayroll)
```

### Dashboard Entity Budget Bar
```js
payroll = sum(entStaff.salary)
budget  = sum(entPods.map(p => POD_BUDGETS[key] ?? (staffCost for that pod)))
ratio   = payroll / budget
barW    = Math.min(100, Math.round(ratio * 100))
isOver  = (budget - payroll) < 0
isWarn  = !isOver && ratio > 0.88
// If no budget at all: budget = payroll * 1.1 (10% buffer estimate)
```

### Dashboard Chart Bar Heights
```js
maxV = Math.max(...data.map(d => Math.max(d.budget, d.spent)), 1)
spH  = Math.round((spent  / maxV) * 138)  // 138px max bar height
buH  = Math.round((budget / maxV) * 138)
// Budget bar = grey; Payroll bar = SL colour (or red if over budget)
// If no POD_BUDGETS set: budget = payroll * 1.1 for chart display
```

### Salary Bar in Budget Panel (Relative to Pod Max)
```js
maxSalary = Math.max(...pod.members.map(m => m.salary || 0), 1)
barW      = Math.round((member.salary / maxSalary) * 100)
// Highest earner = 100% bar width; others proportional
```

### Time-to-Hire Urgency Colour
```js
function urgColor(startRange) {
  if (!startRange[0]) return '#7B2FBE'            // Director → purple
  const mid = (startRange[0] + startRange[1]) / 2
  if (mid <= 11) return 'var(--green)'            // Junior–Senior
  if (mid <= 15) return 'var(--teal)'             // Manager
  if (mid <= 21) return '#FF8C00'                 // Senior Manager
  if (mid <= 27) return '#e84040'                 // Associate Director
  return '#7B2FBE'                                // Director fallback
}
```

### FY Report YoY Change
```js
yoyDiff = currentBudget - priorBudget
// +$X shown in green (growth); −$X shown in red (reduction)
```

---

## 13. Missing / Not Yet Implemented in Rebuild

Features confirmed present in the legacy app that need to be verified or built in the modern rebuild. Grouped by area.

### Core Pod System
- [ ] **`buildPodsFromCarbonites()`** — pods derived from staff `pod` field; no separate pod table
- [ ] **`hasPodBudgetSet(pod)`** — distinguish between explicit $0 budget vs unset (fallback to staffCost)
- [ ] **`getPodBudget()` fallback** — when no budget set, fallback = staffCost (ratio = 1.0, not 0)
- [ ] **Bucket SVG liquid fill animation** — animated liquid with wave path, colour transitions (green → orange → red), 190px total height
- [ ] **Live bucket preview on budget typing** — `previewBudgetEdit(val)` updates bucket fill + remaining label in real time
- [ ] **Pod budget inline edit within panel** — pencil icon toggle, Enter key to save, Escape to cancel
- [ ] **Remove person from pod** — sets `cb.pod = null`, does NOT delete the Carbonite
- [ ] **Pod member tier sorting** — Partners | Pod Leads (no reportsTo) | Staff (has reportsTo)
- [ ] **Ungrouped pod** — Carbonites with `pod === null` auto-grouped into an `'Ungrouped'` pod per office

### Dashboard
- [ ] **Service line filter buttons** — 7 buttons (All + 6 SLs), propagate to KPIs + entity grid + chart
- [ ] **KPI cards filtered by active SL** — all 4 cards respond to SL filter
- [ ] **Entity card budget bar** — payroll vs budget, with over/near-limit colour states
- [ ] **Entity card partner avatar cluster** — initials circles with hover tooltip (full name)
- [ ] **Entity card remaining/over text** — `$X remaining` or `$X over budget` below bar
- [ ] **Alerts section** — 3 auto-generated types: over-budget pods, urgent unfilled roles, underspent pods
- [ ] **Alert click navigation** — pod alerts → Capacity page + open budget panel; hiring alerts → Hiring page
- [ ] **Budget vs Payroll chart** — per-SL grouped bars (budget grey, payroll = SL colour or red)
- [ ] **Banner stats** — total Carbonites, offices, service lines (live counts)

### Capacity Plan
- [ ] **Summary pills** — `N pods`, `N people`, `N over budget` (live, above accordion)
- [ ] **State accordion** — collapsible, starts open; `toggleCapState(stId)`
- [ ] **Office groupings** within each state
- [ ] **Pod card — left coloured stripe** — SL colour, or `--danger` if over budget
- [ ] **Pod card — bucket visual** (full SVG + animation, see above)
- [ ] **Pod card — status badge** (Over budget / Near limit / On track / Underspent)
- [ ] **Pod card — team drawer** — 3-tier accordion (Partners / Leads / Staff), toggled by `▼ Team` button
- [ ] **Pod card — `View →` button** — opens right panel for that pod
- [ ] **`+ New Pod` empty card** — at end of each office section, opens pod creation modal
- [ ] **Budget panel people zone** — member list with avatar, FT/PT badge, role, remote badge, salary bar
- [ ] **Budget panel person edit panel** — inline form: name, role, salary, type, location; Save + Remove + Cancel

### Carbonites
- [ ] **State → Office accordion** — same nested pattern as Capacity Plan
- [ ] **Staff card — remote location badge** — `📍` orange indicator when `c.location` is set
- [ ] **Staff card — seniority indicator** — visual level display (dots or label)
- [ ] **3-step Add Carbonite wizard** — cascading selects: state → office → SL → role; FTE preview; salary benchmark hint
- [ ] **Edit Carbonite** — pre-fills all 3 steps using cascading setTimeout delays for dynamic selects
- [ ] **Delete Carbonite** — confirm modal; removes from array, rebuilds pods

### Hiring
- [ ] **Status filter tabs with live counts** — All / Open / Shortlisted / Interviewing / Offered / Filled / Closed
- [ ] **Close Role modal** — sourcing outcome dropdown (Filled internally / External hire / Cancelled / Deferred / Other)
- [ ] **Time-to-Hire reference panel** — collapsible; division toggle (Acc vs BKK); 6-band summary strip + detailed table
- [ ] **Salary Brackets reference panel** — collapsible; state filter; division tabs; expandable performance band rows
- [ ] **Hiring cost derivation for Comp Budget** — avg salary of open roles in same state feeds the WFP Comp Budget section

### Workforce Planning
- [ ] **Entity selector grid** — entities without pods excluded; sorted by state → biz name
- [ ] **Entity detail — Revenue strip** — 4-metric grid + progress bars + gap alert with hire recommendation
- [ ] **Entity detail — WFP Team table** — billing target (auto vs override), actual, perf % with bar, promo flag, role type, per-row edit
- [ ] **Entity detail — Comp Budget** — payroll + hiring cost + projected total + billing multiple + stacked bar
- [ ] **Entity detail — Headcount chart** — per-SL current vs target bars with gap pill; edit target inline
- [ ] **Entity detail — Attrition section** — auto-generated risks per entity + manual risks; `+ Flag Risk` button
- [ ] **Entity detail — Entity Pods mini-cards** — compact pod cards with `View →` linking to Capacity Plan
- [ ] **Entity detail — Salary benchmarks** — auto-calc Carbon avg vs market min/max; colour indicator (within/above market)
- [ ] **Entity detail — Scenario workbench** — create scenarios with role builder; live impact analysis (payroll, billing cap, revised multiple)
- [ ] **Staff Meta modal** — billing target override, perf rating presets (7 values), promo flag + ETA, role type (Doer/Reviewer/BD)
- [ ] **Revenue Target modal** — per-entity, per-FY; target + actual YTD
- [ ] **Entity Planning Settings modal** — billing multiplier + FY selector; accessible via clicking the `×` multiplier tile
- [ ] **Add Staff to Entity modal** — search existing Carbonites OR create new; `Assign →` for existing
- [ ] **Edit Entity modal** — biz name, TAN, phone, email, address, SL checkboxes with colour feedback
- [ ] **`regenAttritionRisks()`** — auto-runs on every `renderAll()`; thresholds: partner or (seniority ≥ 7 AND salary ≥ $120k) = high; (seniority ≥ 5 AND salary ≥ $95k) OR salary ≥ $120k = medium

### FY Reports
- [ ] **FY tab selector** — visual toggle between years
- [ ] **Clickable pod rows** — click → opens budget panel for that pod
- [ ] **Prior year comparison columns** — appear only when `PRIOR_YEAR_DATA` has entries
- [ ] **Import Prior Year modal** — per-pod budget inputs + CSV paste with fuzzy pod name matching + FY selector
- [ ] **CSV download** — correct 8-column structure (+ 2 YoY columns if data present); totals row

### Cross-Cutting
- [ ] **Toast notification system** — 3-second auto-dismiss; `showToast(msg)` called after every mutation
- [ ] **`renderAll()` orchestrator** — mutations must trigger full cross-page re-render
- [ ] **FY selector in topbar** — functional `<select>` for FY 2025-26 / FY 2024-25 / Q1 2026; propagates to all revenue + FY report calculations
- [ ] **Billing multiple defaults** — default = 3.5×; entity-level override stored in WFP_ENTITY_SETTINGS
- [ ] **FT hours by state** — NSW/QLD/WA/SA = 37.5 hrs; VIC = 38 hrs; CABC entities in QLD = 38 hrs
- [ ] **Role modifier for billing** — Doer = 1.0×, Reviewer = 0.7×, BD = 0.5× (applied in billing target calc)
- [ ] **Performance bar scale** — 0–150% maps to 0–100% bar width (i.e. `barWidth = min(100, pct / 1.5)`)
- [ ] **Budget status thresholds** — >100% = danger, >88% = warn, <65% = underspent; used consistently in pod cards, entity cards, alerts, panel
- [ ] **Benchmark "within market" indicator** — Carbon avg green if between market_min and market_max; red if above market_max
- [ ] **Entity card — partner avatar hover tooltip** — full partner name appears above avatar on hover
- [ ] **Salary benchmark hint in Add Carbonite** — live `$Xk – $Yk` hint from `SALARY_BRACKETS` on step 3 based on role + state + metro

---

*Audit completed: all 6,894 lines of `carbon-workforce-planner-v58-standalone.html` read and documented.*
