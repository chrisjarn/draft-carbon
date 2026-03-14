# Carbon Workforce Planner — Project Overview

> Internal workforce planning tool for **Carbon Group**, an Australian accounting firm operating across 5 states, ~15 business entities, and 6 service lines.

---

## What It Does

Carbon WFP replaces a monolithic single-file HTML/JS app with a modern, multi-user, role-based web application. It gives practice managers and leadership visibility over:

- **Who works where** — staff directory across all offices, states, and service lines
- **What they cost** — pod-level salary budgets vs actual payroll
- **How they bill** — billing targets, actuals, and attainment per staff member and entity
- **Who to hire** — recruitment pipeline with priority, salary ranges, and time-to-hire benchmarks
- **What the plan is** — scenario planning for headcount and payroll impact
- **How the FY is tracking** — revenue targets vs actuals per entity, with year-over-year pod budget comparisons

The app is used daily by Practice Managers and reviewed periodically by Service Line Leads and State Managers. All data is persisted to a PostgreSQL database (Neon) — no more data loss on page refresh.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + TanStack Router + TanStack Query |
| **UI Library** | shadcn/ui (base-maia style) + Tailwind CSS v4 |
| **Icons** | Hugeicons (`@hugeicons/react`) |
| **Backend** | Hono + tRPC v11 |
| **Auth** | Better Auth (email/password, RBAC with 5 roles, Drizzle adapter) |
| **Database** | PostgreSQL via Neon + Drizzle ORM |
| **Runtime** | Bun |
| **Monorepo** | Turborepo |
| **Linting** | Biome (not ESLint/Prettier) |
| **Deployment** | Railway (nixpacks, Node 22 + Bun) |

---

## Architecture

```
apps/
  web/              # React SPA (Vite + TanStack Router)
  server/           # Hono API + tRPC + Better Auth
packages/
  api/              # tRPC routers (shared API layer)
  auth/             # Better Auth config + Drizzle adapter
  db/               # Drizzle schema (16 tables), seed data, migrations
  env/              # Env var validation (@t3-oss/env-core + Zod)
  config/           # Shared TypeScript config
legacy/             # Original vanilla JS app — read-only reference
```

**Data flow:** React → tRPC (type-safe) → Hono → Drizzle → Neon PostgreSQL. TanStack Query handles caching and cache invalidation on mutations.

**Routing:** File-based with TanStack Router. All app routes under `/_app/` use `.lazy.tsx` code-splitting. Auth guard in `_app.tsx` `beforeLoad`.

---

## User Roles & Access Control

The app uses RBAC with 5 roles. All users can read; write access is gated by role rank.

| Role | Rank | Can Read | Can Write | Can Admin Write |
|------|------|----------|-----------|-----------------|
| Admin | 100 | ✅ | ✅ | ✅ |
| Practice Manager | 80 | ✅ | ✅ | ✅ |
| Service Line Lead | 50 | ✅ | ✅ | — |
| State Manager | 50 | ✅ | ✅ | — |
| View Only | 10 | ✅ | — | — |

**Admin Write** gates: FY revenue editing, user management, entity CRUD.  
**Write** gates: carbonite add/edit/delete, hiring CRUD, pod budgets, staff meta, scenarios, attrition flags.

> Users are created via registration and then assigned a role by an Admin. There is no email invite flow.

---

## Complete Feature Reference

### Navigation

The sidebar contains 6 main routes (visible to all authenticated users) plus an admin-only Settings section:

| Route | Label | Purpose |
|-------|-------|---------|
| `/dashboard` | Dashboard | Firm-wide overview |
| `/capacity-plan` | Capacity Plan | Workforce planning + pod budgets |
| `/carbonites` | Carbonites | Staff directory |
| `/hiring` | Hiring | Recruitment pipeline |
| `/scenarios` | Scenarios | What-if planning |
| `/fy-planning` | FY Report | Revenue + pod budget planning |
| `/admin` | Settings | Users + entities (admin only) |

---

### 1. Dashboard

**Purpose:** Firm-wide snapshot for leadership. All data responds to state and service line filters — no page reload required.

**Filters**
- **State tabs** — All / NSW / VIC / QLD / WA / SA (URL param `?state=`)
- **Service Line pills** — All + 6 SLs (A&T / BKK / F&L / WM / R&D / INS) (URL param `?sl=`)
- **FY selector** — switches the revenue figures shown (URL param `?fy=`)

**KPI Cards** — 3 large cards that respond to both filters:
- Total Carbonites + FTE
- Revenue Target (with actual)
- Revenue Attainment % (with progress circle)

**Charts**
- **Revenue by Entity** — Recharts bar chart (target vs actual); clickable bars navigate to the entity in Capacity Plan
- **Service Line Breakdown** — per-SL headcount with relative bars and % of firm
- **Budget vs Payroll** — grouped bars per SL; budget (grey) vs payroll (SL colour); shows where spend is over/under

**Alerts Panel** — auto-generated flags for:
- Pods over budget
- Urgent unfilled hiring roles
- Entities with data issues

**Entity Cards** — one card per entity, showing:
- Business name + revenue attainment badge
- Staff initials avatars with overflow indicator
- Service line chips
- Budget bar (payroll / total pod budget, coloured red → amber → green by ratio)
- "$X remaining" or "$X over budget" text
- Payroll/yr stat + pod count
- Clicking a card navigates to that entity in Capacity Plan

---

### 2. Capacity Plan

Three tabs: **Firm**, **Staff**, **Pod Budgets**. All three share an entity filter and FY selector in the toolbar.

#### Firm Tab — Workforce Planning

Entity selector grid on the left; sticky detail panel on the right.

**Firm-level KPIs:**
- Total Headcount
- Total Payroll
- Avg Salary
- At-Risk count (staff flagged as attrition risks)

**Entity Detail Panel** — shown when an entity is selected. Sections:

| Section | What it shows |
|---------|--------------|
| Entity header | Business name, state, open hiring badge, settings button |
| Revenue strip | Actual / Target / attainment %; billing capacity (sum of all billing targets); revenue gap (shortfall or surplus) |
| Revenue gap alert | Advisory message when gap > 0, recommending capacity action |
| Compensation Budget | Current payroll + estimated open hiring cost + projected total + billing multiple |
| Pods table | All pods in the entity: name / headcount / salary total |
| Entity Staff (WFP Team) | Per-person: billing target (auto-calc or override) / billing actual / attainment % / promo flag / role type |
| Salary Benchmarks | Per service line: benchmark role / market min / market max / Carbon avg (auto-calculated or manual override) / source |
| Headcount Targets | Per service line: current count vs target; visual bar; edit target inline |
| Attrition Risks | Flags for high/medium risk staff — auto-generated based on seniority + salary thresholds, plus manual entries |
| Entity Planning Settings | Billing multiplier (default 3.5×) + active FY (dialog) |

**Billing target calculation:**
```
billingTarget = salary × billingMultiplier × roleModifier × fteFraction

Role modifiers: Doer = 1.0×  |  Reviewer = 0.7×  |  BD = 0.5×
FT hours: NSW/QLD/WA/SA = 37.5 hrs  |  VIC = 38 hrs
```

**Auto-attrition risk thresholds:**
- High: is partner, or (seniority ≥ 7 AND salary ≥ $120k)
- Medium: (seniority ≥ 5 AND salary ≥ $95k) OR salary ≥ $120k

#### Staff Tab — Firm-Wide Billing Table

Full billing table scoped to the selected entity (or all entities):

| Column | Details |
|--------|---------|
| Name | Staff member + initials avatar |
| Role | Job title |
| SL | Service line badge |
| Office | Office location |
| Billing Target | Auto-calc or manual override; formatted dollar |
| Billing Actual | Manually entered; coloured by attainment |
| Attainment % | Actual / target, with progress bar |
| Perf Rating | Preset values: 50 / 75 / 90 / 100 / 110 / 125 / 150% |
| Promo | No / Maybe / Yes (+ ETA month if set) |
| Role Type | Doer / Reviewer / BD |
| Actions | Edit → Staff Meta dialog |

**Filters:** Service Line (faceted) · Office (faceted) · Promotion flag (faceted) · Column visibility toggle

**Staff Meta Dialog** — editable fields per staff member:
- Billing Target override (blank = auto-calc)
- Billing Actual
- Performance rating (preset picker)
- Role type (Doer / Reviewer / BD)
- Promotion flag (No / Maybe / Yes) + ETA month

**Stats bar:** Total staff · Total billing target · Total billing actual

#### Pod Budgets Tab

Hierarchical table: State → Office → Pod rows.

**Per pod row:**
- Pod name + dominant SL badge
- Status badge: Over Budget / Near Limit / On Track / Empty
- People count
- Budget (inline editable — click pencil, type, Enter to save, Escape to cancel)
- Staff Cost (sum of member salaries)
- Remaining (coloured red/amber/green)
- Load % (with coloured bar)
- Prior Year budget + YoY change (when prior year data is imported)

**Pod Staff Sheet** — slide-in panel showing all members of a pod:
- Member list with name / role / FT|PT badge / salary
- Total staff cost footer

**Add Pod Dialog** — creates a new pod with: state / office / pod name / SL / entity / optional budget

**Delete Pod** — with confirm dialog

**Summary stats:** Total Budget · Total Staff Cost · Variance · Utilisation %

---

### 3. Carbonites (Staff Directory)

**Purpose:** The master staff register. Create, view, edit, and delete staff members ("Carbonites").

**Table columns:** Name · Role · SL · Office · State · Type (FT/PT) · Seniority · Salary · Pod · Entity

**Filters:** Search (name, role) · State · Service Line · Office · FT/PT type

**Carbonite Detail Sheet** — click any row to see a full profile:
- Name, role, SL, entity, state, office, pod, type, hours, salary, seniority, start date, reports-to

**Add Carbonite Dialog** — all fields in a grouped form:
- Name, employment type (FT/PT/Contract), hours per week (PT only)
- State, office, service line, sub-group, pod
- Role, seniority, salary, reports-to, start date, is-partner flag, entity

**Edit Carbonite** — same dialog, pre-filled

**Delete Carbonite** — confirm dialog; does not affect other records beyond pod membership

---

### 4. Hiring (Recruitment Pipeline)

**Purpose:** Track all open and closed hiring roles across the firm, from initial approval through to outcome.

**Pipeline Tabs** — URL-driven, with live count badges:

| Tab | Meaning |
|-----|---------|
| Open | Role approved, recruiting not yet started |
| Active | Shortlisting or interviewing in progress |
| Offer | Offer extended |
| Closed | Filled, cancelled, or deferred |

**Roles Table:** Role · SL · State · Priority · Target Start · Salary Range · Days Open (coloured vs 42-day benchmark) · Closed How (on Closed tab)

**KPI Stats (Open/Active/Offer):** Total positions · Salary budget · Avg days open  
**KPI Stats (Closed):** Closed this FY · Avg time to close · Hired rate

**Detail Sheet** — click any row: full role details, approval info, notes, closure info

**Add / Edit Role** — 2-step slide-in drawer:
- Step 1: Role title, SL, sub-group, state, office, location, positions, type, priority
- Step 2: Salary min/max, target start, approved by, managed by, notes

**Close Role Dialog** — records outcome: Hired / Cancelled / Deferred · closed date · hired name (if hired)

**Reopen Role** — re-activates a closed role back to Open status

**Delete Role** — with confirm dialog

**Time-to-Hire Reference Drawer** — slide-in panel, opened from the header button:
- Avg hire weeks / notice weeks / total lead time summary
- SL tabs: Accounting & Tax · Bookkeeping & CFO
- TTH table: Role / hire time / notice period by seniority band
- Salary Brackets table: Role / Level / Min / Mid / Max

---

### 5. Scenarios (What-If Planning)

**Purpose:** Model the impact of hiring decisions before they're made — see how new roles affect payroll, billing capacity, and revenue gap.

**Entity + FY filters** — auto-selects first entity on load

**KPI Cards:**
- Billing Capacity (with CategoryBar: payroll vs available)
- Revenue Performance (ProgressCircle: actual vs target)
- Billing Multiple + Revenue Gap (with ProgressBar)

**Scenario Cards** — each saved scenario shows:
- Name, description, colour
- Roles list (title / SL / salary / count)
- **Live impact analysis:** new payroll · new billing capacity · revised total billing cap · revised billing multiple · new revenue gap vs current

**New Scenario Wizard** — multi-step sheet:
- Step 1: Name, description, colour, FY, entity
- Step 2: Role builder — add roles (title / SL / salary / count), live impact preview updates as you add
- Step 3: Review and confirm

**Delete scenario** — with toast confirmation

---

### 6. FY Report (Financial Year Planning)

**Purpose:** Set revenue targets and track actuals per entity. Compare pod budgets year-over-year.

**FY Selector** — switches all data to the selected financial year

**Revenue Table** — hierarchical: State → Entity rows

| Column | Details |
|--------|---------|
| Entity | Business name (indented under state) |
| Target | Editable inline (click pencil, Enter to save) |
| Actual | Editable inline |
| Variance | +/- from target, coloured green/red |
| Progress | Mini bar chart |
| Attainment | % of target, coloured by threshold |

State-level rows show aggregate totals. Footer row shows firm-wide totals.

**Pod Budget Comparison Table** — compares current year pod budgets vs prior year:

| Column | Details |
|--------|---------|
| State / Office / Pod | Pod identification |
| People | Headcount from Carbonites |
| Budget | Current year budget |
| Staff Cost | Sum of member salaries |
| Remaining | Budget - staff cost, coloured |
| Load % | Staff cost / budget |
| Prior Year | Budget from imported prior year data |
| YoY Change | +/- dollar change, coloured |

**CSV Import** — paste prior year pod budgets in format `state,office,pod_name,budget` with live preview table before confirming

**CSV Exports:**
- Revenue report CSV (entity / state / target / actual / variance / attainment%)
- Pod report CSV (pod / office / state / headcount / budget / staff cost / remaining / load% / prior year / YoY)

---

### 7. Settings / Admin

**Access:** Admin role only (rank 100)

#### Users Tab

| Feature | Details |
|---------|---------|
| User list | Name, email, role badge, verification status, joined date |
| Change role | Inline select dropdown per user |
| Delete user | With confirm dialog; cannot delete yourself |
| Stats bar | Total users · Admins · Pending verification |

**Roles available:** Admin · Practice Manager · Service Line Lead · State Manager · View Only

#### Entities Tab

| Feature | Details |
|---------|---------|
| Entity list | Business name, TAN, state, service lines, staff count |
| Add Entity | Name + state — creates a new entity record |
| Edit Entity | Full edit: business name / TAN / phone / email / address / state / service line assignments |
| Delete Entity | With confirm dialog |

---

### 8. Todos

A lightweight personal task list. Not shown in the main sidebar navigation (accessible at `/todos`).

- Add todo (text input)
- Toggle completed (checkbox)
- Delete todo
- Stats: total · completed · pending

---

## Feature Gap Analysis — Legacy App vs Rebuild

The legacy app (`carbon-workforce-planner-v58-standalone.html`, 6,894 lines) was a single-file vanilla JS/HTML app with no persistence, no auth, and no type safety. The items below are features present in the legacy app that are **not yet fully implemented** in the rebuild.

> **Note on "Workplace Learning" tab:** A "Workplace Learning" tab does **not exist** in the legacy app. The legacy navigation has exactly 6 items: Dashboard / Capacity Plan / Carbonites / Hiring / Workforce Planning / FY Reports. If this feature is planned, it is not documented in the legacy source.

---

### Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented |
| ⚠️ | Partially implemented |
| ❌ | Not built |
| 🆕 | New — doesn't exist in legacy |

---

### Dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| 4-KPI strip (Carbonites, FTE, Revenue, Attainment) | ✅ | |
| State filter tabs | ✅ | |
| Service Line filter pills (All + 6 SLs) | ✅ | |
| Filters propagate to all cards and charts | ✅ | Client-side, instant |
| Entity cards with budget bar | ✅ | Red/amber/green by payroll/budget ratio |
| Remaining / over budget text on entity card | ✅ | |
| Revenue attainment badge on entity card | ✅ | |
| Budget vs Payroll chart (per SL) | ✅ | |
| Revenue by Entity chart (clickable) | ✅ | |
| Service Line breakdown bars | ✅ | |
| Alerts panel (over-budget pods, urgent hires) | ✅ | |
| Entity card budget status border accent | ❌ | Legacy turned the card border red (>100%) or orange (>88%). New cards do not change border colour |
| Alert click → deep link to specific pod panel | ⚠️ | Navigates to the right page, but doesn't open the specific pod's detail |

---

### Carbonites

| Feature | Status | Notes |
|---------|--------|-------|
| Staff directory with search and filters | ✅ | |
| Add / Edit / Delete Carbonite | ✅ | |
| Carbonite detail sheet | ✅ | |
| 3-step cascading wizard (state → office → SL → role) | ⚠️ | New dialog is a single grouped form. No cascading role dropdown based on SL selection |
| Salary benchmark hint when adding (live $Xk – $Yk range) | ❌ | Legacy showed a salary range hint from `SALARY_BRACKETS` based on selected role + state + metro during salary entry |
| Remote location visual badge on card | ⚠️ | Location stored; not shown as a distinct coloured badge in list view |

---

### Hiring

| Feature | Status | Notes |
|---------|--------|-------|
| Pipeline tabs with count badges | ✅ | Open / Active / Offer / Closed |
| Roles table with all fields | ✅ | |
| Add / Edit / Delete / Close / Reopen role | ✅ | |
| Time-to-Hire reference drawer | ✅ | |
| Salary brackets reference (simplified) | ⚠️ | Min / Mid / Max for Acc and BKK only. Missing: state-specific ranges (metro vs regional), performance band expansion (Rank 1&2 / 3 / 4&5 sub-rows), all 6 SLs |
| Salary brackets: state filter (NSW/VIC/QLD/WA/SA) | ❌ | |
| Salary brackets: performance band row expansion | ❌ | |
| Hiring pipeline projection chart | ❌ | Legacy showed a bar chart of estimated hiring cost over time for open roles |
| Legacy 7-tab granularity (Shortlisted, Interviewing, Offered, Filled) | ⚠️ | New app merges: Shortlisted + Interviewing → Active; Offered → Offer; Filled + Closed → Closed. Same data model, fewer tabs |

---

### Capacity Plan — Pod Budgets Tab

| Feature | Status | Notes |
|---------|--------|-------|
| State → Office → Pod hierarchy | ✅ | |
| Pod budget inline edit | ✅ | |
| Status badge (Over / Near / On Track / Empty) | ✅ | |
| Pod staff sheet (slide-in, member list) | ✅ | |
| Add / delete pod | ✅ | |
| Member tier sorting (Partners → Pod Leads → Staff) | ❌ | Pod staff sheet lists members flat. Legacy grouped by tier with labelled sections |
| Person inline edit from pod sheet | ❌ | Legacy let you click any person to edit name / role / salary / type / location inline. Current sheet is read-only |
| Remove person from pod (unassign, not delete) | ❌ | No way to clear `pod = null` without deleting the carbonite |
| Add person to pod from pod sheet | ❌ | No "+ Add" in the pod sheet. Must go to Carbonites page and edit the person |
| Fee Revenue field on pod creation | ❌ | Legacy had an optional fee revenue input that auto-generated a staffing capacity insight |

---

### Capacity Plan — Firm Tab

| Feature | Status | Notes |
|---------|--------|-------|
| Entity selector grid | ✅ | |
| Revenue strip (actual / target / %) | ✅ | |
| Billing Capacity metric | ✅ | |
| Revenue Gap (shortfall or surplus) | ✅ | |
| Revenue gap hire recommendation alert | ✅ | |
| Compensation Budget section | ✅ | Payroll + hiring cost + projected total + billing multiple |
| Pods table | ✅ | |
| Entity Staff billing table (WFP Team) | ✅ | |
| Staff Meta edit dialog | ✅ | |
| Salary Benchmarks section | ✅ | |
| Headcount Targets section | ✅ | |
| Attrition Risks section | ✅ | |
| Entity Planning Settings (multiplier, FY) | ✅ | |
| Set Revenue Target shortcut in entity detail | ❌ | Legacy had an inline "📊 Set Revenue Target" button. New app requires navigating to FY Report page |
| Add Staff to Entity from entity detail | ❌ | Legacy had a "+ Add Staff" action (search existing or create new). New app requires going to Carbonites |
| Edit Entity shortcut from entity detail | ❌ | Legacy had an "✎ Edit Entity" button. New app: entity editing is only in Admin/Settings |

---

### Capacity Plan — Staff Tab

| Feature | Status | Notes |
|---------|--------|-------|
| Firm-wide billing table with all columns | ✅ | |
| Faceted filters (SL, Office, Promo) | ✅ | |
| Staff Meta edit dialog | ✅ | |
| Salary column | ❌ | Not shown. Useful for checking billing target vs salary ratio |
| Seniority column | ❌ | Not shown |
| Filter Staff Tab by entity | ❌ | Staff tab is firm-wide. No entity scope without switching to Firm tab |

---

### FY Report

| Feature | Status | Notes |
|---------|--------|-------|
| Revenue table (State → Entity) with inline edit | ✅ | |
| Pod Budget comparison table | ✅ | |
| Prior year YoY columns | ✅ | |
| CSV import (prior year pod budgets) | ✅ | |
| CSV export (revenue + pod reports) | ✅ | |
| Headcount planning section | ❌ | No per-entity headcount projection for future FY |
| Payroll planning section | ❌ | No payroll projection by entity or SL |

---

### Admin / Settings

| Feature | Status | Notes |
|---------|--------|-------|
| User list + role management | ✅ | |
| Delete user | ✅ | |
| Entity list + Add + Edit + Delete | ✅ | Full CRUD |
| Email invite flow | ❌ | Users must self-register; admin then assigns their role |

---

### New Features (Not in Legacy)

| Feature | Notes |
|---------|-------|
| 🆕 Real authentication + RBAC | Better Auth; 5 roles; legacy was hardcoded as "Nathan M." |
| 🆕 PostgreSQL persistence | All data persists; legacy reset on every page refresh |
| 🆕 Scenarios as a standalone route | Legacy had scenarios embedded in WFP entity detail only |
| 🆕 Reopen hiring role | Legacy could only close roles |
| 🆕 Days Open column with benchmark colouring | 42-day target; red when overdue |
| 🆕 Revenue editing inline in FY table | Legacy used a modal |
| 🆕 URL-driven filter state | All filters live in URL params — bookmarkable, shareable |
| 🆕 Todos page | Lightweight task list at `/todos` |
| 🆕 Column visibility toggle on tables | Show/hide columns per preference |

---

### What Was Intentionally Changed (Better in Rebuild)

| Legacy | Rebuild | Why |
|--------|---------|-----|
| Right-side sliding budget panel (380px) | Sticky inline entity detail panel | Less disorienting; no layout shift |
| Bucket SVG liquid fill animation on pod cards | `CapacityBar` progress strip in table | Denser, more legible; bucket was novelty |
| 3-step cascading modal for adding Carbonites | Single grouped form | All fields visible at once; less friction |
| CSS-only bar chart on dashboard | Recharts `BarChart` with tooltips | Proper chart library; interactive and accessible |
| Custom `showToast()` function | Sonner toasts | Better accessibility, stacking, dismiss |
| `innerHTML` string injection everywhere | React — no innerHTML | Secure by default (no XSS risk) |
| Global mutable JS variables | TanStack Query + server state | Cache invalidation, stale handling, optimistic updates |
| No error handling | Error boundaries + query error states | App doesn't crash on bad data |
| No responsive design | Tailwind responsive utilities throughout | Works on smaller screens |

---

## Priority Backlog

Items from the gap analysis, ordered by user impact.

### P1 — High impact, low–medium effort

| # | Gap | Notes |
|---|-----|-------|
| 1 | **Pod staff sheet: member tier sorting** | Data has `isPartner` + `reportsTo`; just needs UI grouping |
| 2 | **Pod staff sheet: remove person from pod** | `PATCH carbonite` with `pod: null` |
| 3 | **Pod staff sheet: add person to pod** | Search existing carbonites + assign |
| 4 | **Entity card: budget status border accent** | CSS only — data already available |
| 5 | **Set Revenue Target shortcut** in entity detail | Small dialog or link to FY Report pre-scoped to entity |

### P2 — Medium impact, medium effort

| # | Gap | Notes |
|---|-----|-------|
| 6 | **Pod staff sheet: person inline edit** | Inline form fields for name/role/salary/type + `PATCH carbonite` |
| 7 | **Edit Entity shortcut** in WFP entity detail | Reuse Admin's edit dialog; pass `entityId` |
| 8 | **Add Staff to Entity** from entity detail | Search/create modal, scoped to entity |
| 9 | **Salary column** in Staff Tab | Add to DataTable column config with visibility toggle |
| 10 | **Salary benchmark hint** when adding Carbonite | Hook into `SALARY_BRACKETS` constants on salary field |

### P3 — Lower priority / reference features

| # | Gap | Notes |
|---|-----|-------|
| 11 | **Salary brackets: state filter + performance bands** | Expand TTH drawer table with state tabs and expandable band rows |
| 12 | **Hiring pipeline projection chart** | Bar chart of projected cost over time |
| 13 | **FY headcount / payroll planning sections** | New data model + UI |
| 14 | **Email invite flow** in Admin | Depends on Better Auth email support |
| 15 | **Entity filter on Staff Tab** | Scope billing table to one entity |
| 16 | **Fee Revenue on pod creation** | Optional field + staffing capacity insight |
| 17 | **Alert deep-link to specific pod** | Open pod sheet directly from alert click |

---

## Key Business Concepts

| Term | Meaning |
|------|---------|
| **Carbonite** | A staff member. All employees are "Carbonites" — Carbon Group's internal term |
| **Pod** | A logical team grouping of Carbonites within an office. Derived from the `pod` field on each Carbonite; not stored separately |
| **Entity** | A business entity / legal entity / office location (e.g. "Carbon Sydney", "Carbon Brisbane CBD") |
| **Service Line** | One of 6 divisions: Accounting & Tax · Bookkeeping & CFO · Finance & Lending · Wealth Management · R&D Tax & Grants · Insurance |
| **Billing Target** | Expected fee revenue a staff member should generate = `salary × multiplier × role modifier × FTE fraction` |
| **Billing Multiple** | The ratio of billing capacity to payroll for an entity. Target is ~3.2–3.5× |
| **Revenue Gap** | `target − max(actual, billingCapacity)`. Positive = shortfall (need to hire or improve rates) |
| **FTE** | Full-time equivalent. Part-time staff are calculated as `hoursPerWeek / standardHours` where standard hours are state-specific (37.5 hrs in most states, 38 hrs in VIC) |
| **Attrition Risk** | Auto-flagged: partners, high-seniority + high-salary staff, or above-market earners. Can be manually overridden |
| **Prior Year Data** | Imported pod budgets from the previous FY, used for year-over-year comparison in FY Report |
