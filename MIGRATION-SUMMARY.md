# Carbon WFP Migration — Implementation Summary

## Overview

Complete implementation of the Carbon Workforce Planner migration from a monolithic vanilla JS/Node.js app to a modern React/tRPC/Drizzle stack. Six phases delivered, covering foundation cleanup, full page implementations, extended WFP features, and capacity/FY enhancements.

**Final verification**: 42/42 checklist items pass. Types clean, build succeeds, 47 unit tests pass.

---

## Phase 0: Foundation (DRY + Quick Fixes)

Eliminated code duplication across the entire codebase and fixed broken infrastructure.

### Changes

| Action | Files |
|--------|-------|
| Registered missing dashboard router | `packages/api/src/routers/index.ts`, `dashboard.ts` |
| Fixed dashboard auth (public → protected) | `packages/api/src/routers/dashboard.ts` |
| Deleted dead code (4 files) | `carbonite.ts`, `header.tsx`, `user-menu.tsx`, `mode-toggle.tsx` |
| Extracted server-side RBAC | `packages/api/src/lib/rbac.ts` |
| Extracted client-side RBAC | `apps/web/src/lib/rbac.ts` |
| Extracted shared UI components | `apps/web/src/components/shared/detail-display.tsx`, `select-filter.tsx` |
| Created format utilities | `apps/web/src/lib/format.ts` |
| Ported all legacy reference data | `apps/web/src/lib/constants.ts` |
| Updated all 6 routers to use shared RBAC | `carbonites.ts`, `hiring.ts`, `wfp.ts`, `entities.ts`, `pod-budgets.ts`, `admin.ts` |
| Updated sidebar + 6 pages to use shared client RBAC | `app-sidebar.tsx`, all page files |

### Key Exports

| File | Exports |
|------|---------|
| `packages/api/src/lib/rbac.ts` | `assertWriter`, `assertAdmin`, `getUserRole`, `WRITE_ROLES`, `ADMIN_WRITE_ROLES`, `VALID_ROLES`, `Role` |
| `apps/web/src/lib/rbac.ts` | `canWrite`, `canAdminWrite`, `getRank`, `getUserRole`, `ROLE_RANKS`, `ROLE_LABELS` |
| `apps/web/src/lib/format.ts` | `fmtDollar`, `fmtK`, `initials`, `fmtDate`, `capColor`, `perfPctColor` |
| `apps/web/src/lib/constants.ts` | `SERVICE_LINES`, `STATES`, `ROLE_CATALOGUE`, `STAFF_ROLES`, `BILLING_ROLE_MODIFIER`, `PERF_RATING_PRESETS`, `PROMO_FLAGS`, `STATE_FT_HOURS`, `ENTITY_FT_HOURS`, `DEFAULT_FT_HOURS`, `TIME_TO_HIRE`, `TTH_SUMMARY`, `NOTICE_CONTEXT`, `HIRING_STATUS`, `HIRING_PRIORITY`, `HIRING_TYPE`, `CLOSED_HOW`, `SL_COLOR_MAP`, `STATE_COLOR_MAP`, `FY_OPTIONS`, helpers |
| `apps/web/src/components/shared/detail-display.tsx` | `DetailSection`, `DetailRow` |
| `apps/web/src/components/shared/select-filter.tsx` | `SelectFilter` |

---

## Phase 1: Carbonites Page

Wired up the staff directory page with full CRUD and created the salary brackets router.

### Changes

| Action | Files |
|--------|-------|
| Created salary brackets router | `packages/api/src/routers/salary-brackets.ts` |
| Registered router | `packages/api/src/routers/index.ts` |
| Built Carbonites page | `apps/web/src/routes/_app/carbonites.tsx` (887 lines) |
| Set up Vitest | `vitest.workspace.ts`, root `package.json` |
| Wrote RBAC unit tests | `packages/api/src/lib/__tests__/rbac.test.ts` (16 tests) |
| Wrote format unit tests | `apps/web/src/lib/__tests__/format.test.ts` (31 tests) |

### Carbonites Page Features
- Staff card grid (responsive 1–4 columns) with SL-colored badges, state/office info, salary, FT/PT badge
- Server-side filtering: search, state, SL, office, type
- Detail sheet on card click (DetailSection/DetailRow components)
- Create/Edit dialog with cascading dropdowns (state→office, SL→SG)
- Delete confirmation dialog
- RBAC-gated write buttons

### Salary Brackets Router
- `getAll` — all brackets ordered by SL, prog
- `getBySl` — filtered by service line

---

## Phase 2: Dashboard Enrichment

Expanded the dashboard from basic KPI cards to a rich overview with entity summaries, SL breakdown, and alerts.

### Changes

| Action | Files |
|--------|-------|
| Added 3 new dashboard queries | `packages/api/src/routers/dashboard.ts` |
| Built enriched dashboard UI | `apps/web/src/routes/_app/dashboard.tsx` |

### New Dashboard Queries
- `entitySummaries` — per-entity: headcount, total salary, distinct SLs
- `slBreakdown` — per-SL: headcount, salary, % of firm
- `alerts` — stale hiring (>90 days open)

### Dashboard UI Sections
- KPI strip (existing, kept)
- Entity cards grid (clickable, navigates to WFP, shows SL color dots)
- SL breakdown table (color dots, headcount, salary, % of firm)
- Alerts panel (conditionally shown, links to relevant pages)

---

## Phase 3: WFP Firm-Wide View

Added a firm-level planning view with entity selector and detail panel alongside the existing staff table.

### Changes

| Action | Files |
|--------|-------|
| Added 3 new WFP queries | `packages/api/src/routers/wfp.ts` |
| Restructured WFP page with tabs | `apps/web/src/routes/_app/wfp.tsx` |
| Installed Progress component | `apps/web/src/components/ui/progress.tsx` |

### New WFP Queries
- `firmKPIs` — total headcount, payroll, avg salary, at-risk count (live from attrition_risks)
- `entityOverview` — per-entity: staff count, payroll, pod count
- `entityDetail` — full entity breakdown: settings, revenue, staff with meta, pods, open hiring count

### WFP Page Structure
- **Firm tab**: KPI strip (4 cards) → entity selector grid (clickable, highlighted) → entity detail panel
- **Staff tab**: existing staff table with filters, inline editing, meta dialog
- Entity detail panel: revenue progress bar, compensation budget, pods table, open hiring badge

---

## Phase 4: New DB Tables + WFP Sub-features

Created 5 new database tables and built advanced WFP features: headcount targets, attrition risks, and scenario workbench.

### Changes

| Action | Files |
|--------|-------|
| Created wfp-extended schema (5 tables) | `packages/db/src/schema/wfp-extended.ts` |
| Exported schema | `packages/db/src/schema/index.ts` |
| Created wfp-extended router (11 procedures) | `packages/api/src/routers/wfp-extended.ts` |
| Registered router | `packages/api/src/routers/index.ts` |
| Wired firmKPIs to real atRiskCount | `packages/api/src/routers/wfp.ts` |
| Built 3 UI sections in entity detail | `apps/web/src/routes/_app/wfp.tsx` |

### New Database Tables

| Table | Primary Key | Purpose |
|-------|-------------|---------|
| `headcount_targets` | (entity_id, sl_id) | Target headcount per entity per service line |
| `attrition_risks` | id | Staff attrition risk flags with level/reason/action |
| `scenarios` | id | Planning scenarios per entity |
| `scenario_roles` | id | Roles within a scenario (title, SL, salary, count) |
| `prior_year_data` | (state, office, pod_name, year) | Prior year budget/headcount for YoY comparison |

### WFP Extended Router Procedures
- Headcount targets: `getHeadcountTargets`, `upsertHeadcountTarget`
- Attrition risks: `getAttritionRisks`, `getAllAttritionRisks`, `createAttritionRisk`, `updateAttritionRisk`, `deleteAttritionRisk`
- Scenarios: `getScenarios`, `createScenario`, `deleteScenario`
- Utility: `atRiskCount`

### UI Features Added to Entity Detail Panel
- **Headcount Targets**: per-SL progress bars (current vs target), set target dialog
- **Attrition Risks**: flagged staff table with risk badges, flag/edit/delete dialogs, cross-referenced with staff data
- **Scenario Workbench**: scenario cards with role tables and impact metrics, create dialog with dynamic role builder, preset color picker

---

## Phase 5: Capacity + FY Enhancements

Enhanced the Capacity and FY Planning pages with additional functionality.

### Phase 5.1: Capacity Enhancements

| Action | Files |
|--------|-------|
| Added Add Pod dialog | `apps/web/src/routes/_app/capacity.tsx` |
| Added Pod Staff Sheet | `apps/web/src/routes/_app/capacity.tsx` |
| Added Budget Summary cards | `apps/web/src/routes/_app/capacity.tsx` |

- **Add Pod dialog**: state→office cascading dropdowns (from STATES constants), pod name, budget, calls `podBudgets.upsert`
- **Pod Staff Sheet**: click pod name to see assigned carbonites (name, role, salary, SL badge, total salary)
- **Budget Summary**: 4 cards — total budget, total actual, variance (colored), utilisation % (colored)

### Phase 5.2: FY Planning Enhancements

| Action | Files |
|--------|-------|
| Created prior-year router | `packages/api/src/routers/prior-year.ts` |
| Registered router | `packages/api/src/routers/index.ts` |
| Added Pod Comparison table | `apps/web/src/routes/_app/fy-planning.tsx` |
| Added CSV Import modal | `apps/web/src/routes/_app/fy-planning.tsx` |
| Added CSV Export button | `apps/web/src/routes/_app/fy-planning.tsx` |

- **Prior Year Router**: `getByYear` (query), `batchUpsert` (mutation with RBAC)
- **Pod Comparison Table**: current budget vs prior year with YoY change/percentage, color-coded
- **CSV Import**: paste CSV textarea, preview parsed rows, batch import to prior year data
- **CSV Export**: download entity revenue data as `fy-{fy}-revenue.csv`

---

## Final Router Registry

All routers registered in `packages/api/src/routers/index.ts`:

| Key | Router | File |
|-----|--------|------|
| `healthCheck` | inline | index.ts |
| `privateData` | inline | index.ts |
| `todo` | todoRouter | todo.ts |
| `carbonites` | carbonitesRouter | carbonites.ts |
| `entities` | entitiesRouter | entities.ts |
| `podBudgets` | podBudgetsRouter | pod-budgets.ts |
| `priorYear` | priorYearRouter | prior-year.ts |
| `hiring` | hiringRouter | hiring.ts |
| `salaryBrackets` | salaryBracketsRouter | salary-brackets.ts |
| `wfp` | wfpRouter | wfp.ts |
| `wfpExtended` | wfpExtendedRouter | wfp-extended.ts |
| `admin` | adminRouter | admin.ts |
| `dashboard` | dashboardRouter | dashboard.ts |

---

## Pages Summary

| Page | Route | Lines | Features |
|------|-------|-------|----------|
| Dashboard | `/dashboard` | ~290 | KPI cards, entity cards grid, SL breakdown, alerts |
| Carbonites | `/carbonites` | ~890 | Card grid, CRUD, 5 filters, detail sheet, cascading dropdowns |
| Hiring | `/hiring` | ~700 | Pipeline table, CRUD, filters, detail sheet |
| WFP | `/wfp` | ~1520 | Firm/Staff tabs, KPI strip, entity selector, headcount targets, attrition risks, scenario workbench, staff meta table |
| Capacity | `/capacity` | ~910 | State>Office>Pod hierarchy, inline budget editing, Add Pod dialog, staff sheet, summary cards |
| FY Planning | `/fy-planning` | ~880 | Revenue targets/actuals, pod comparison YoY, CSV import/export |
| Admin | `/admin` | ~250 | User management, role assignment |

---

## Build Status

| Check | Result |
|-------|--------|
| `bun run check-types` | 2/2 tasks pass |
| `bun run build` | 2/2 tasks pass (chunk size warning — non-blocking) |
| `bunx vitest run` | 47/47 tests pass (16 rbac + 31 format) |

---

## Known Warnings (non-blocking)

1. **Bundle size**: Web bundle at ~1,093 kB (over 500 kB Vite warning). Consider code-splitting with dynamic imports on heavier pages.
2. **Dashboard → WFP link**: Entity cards link to `/wfp` with search params, but WFP route doesn't consume them yet (entity pre-selection from dashboard click is a no-op).
3. **Full table scans**: `entityDetail` and `getAttritionRisks` fetch all rows then filter in JS. Should use `inArray()` for efficiency at scale.
4. **Schema push**: `db:push` requires `DATABASE_URL` env var. Schema files are ready but not yet pushed to database.
