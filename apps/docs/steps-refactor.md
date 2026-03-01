# Capacity Plan Refactor — Steps Checklist

## Phase 1: Merge /capacity + /wfp → /capacity-plan

- [x] **Step 1** — Create `components/capacity-plan/types.ts` (shared types: StaffWithMeta, MetaForm, EntityDetailData)
- [x] **Step 2** — Create `components/capacity-plan/shared.tsx` (PerfBadge, EditableCell, KpiCard, pct, unique)
- [x] **Step 3** — Create `components/capacity-plan/headcount-targets-section.tsx` (lines 650-831 from wfp.lazy.tsx)
- [x] **Step 4** — Create `components/capacity-plan/attrition-risks-section.tsx` (lines 833-1217 from wfp.lazy.tsx)
- [x] **Step 5** — Create `components/capacity-plan/scenario-workbench-section.tsx` (lines 1219-1583 from wfp.lazy.tsx)
- [x] **Step 6** — Create `components/capacity-plan/firm-tab.tsx` (FirmTab + EntityDetailPanel, imports sections from 3-5)
- [x] **Step 7** — Create `components/capacity-plan/staff-tab.tsx` (StaffTab + MetaDialog)
- [x] **Step 8** — Create `components/capacity-plan/pod-budgets-tab.tsx` (all capacity.lazy.tsx components as a tab)
- [x] **Step 9** — Create `routes/_app/capacity-plan.tsx` (eager route file with entity search param validation)
- [x] **Step 10** — Create `routes/_app/capacity-plan.lazy.tsx` (shell: 3 tabs, PageHeader, entity deep-link)
- [x] **Step 11** — Update `lib/route-config.ts` (remove /capacity + /wfp, add /capacity-plan)
- [x] **Step 12** — Update `sidebar-02/app-sidebar.tsx` (single "Capacity Plan" nav item, minRank 50)
- [x] **Step 13** — Update `dashboard.lazy.tsx` (entity card link → /capacity-plan)
- [x] **Step 14** — Delete old files (wfp.tsx, wfp.lazy.tsx, capacity.tsx, capacity.lazy.tsx)
- [x] **Step 15** — Run check-types + build (both pass)
- [ ] **Step 16** — Commit and push

## Phase 2: P0 — Data Integrity (after merge)

- [ ] Add `is_active` to carbonites + convert delete to soft delete
- [ ] Add FK constraints across domain tables
- [ ] Add `financial_year` to headcount_targets (update composite PK)
- [ ] Add `financial_year` to scenarios
- [ ] Fix role enum values (readonly → read_only, add service_line_lead, use pgEnum)
