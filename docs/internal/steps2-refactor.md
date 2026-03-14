# Carbon WFP — P1 Prompt for Claude Code

P0 is complete and committed. All data integrity fixes are in place. Now start P1 — core gaps that block the main workflows.

## Skills — Mandatory

Before writing any code for each task, check your loaded skills and read the relevant skill file first. Do not skip this step.

- DB schema changes → Drizzle skill
- API / router changes → tRPC skill + Hono skill
- Auth, sessions, roles → Better Auth skill
- Data fetching, query params, invalidation → TanStack Query skill
- URL search params, routing → TanStack Router skill
- Frontend components, modals, selects → shadcn/ui skill
- Charts → Recharts skill (if loaded, otherwise check before installing)
- Any Railway / infra changes → Railway skill

If a skill exists for what you are about to write, read it first. If you are unsure whether a skill exists, check before writing code. Do not fall back to your own default patterns when a skill is loaded. This applies to every single task in this list without exception.

---

## Rules

Same rules as P0:
- One task at a time — complete and confirm before moving to the next
- Show schema/migration changes before running them, wait for confirmation before applying
- Check loaded skills before writing code for any package
- Do not touch code outside the current task
- Flag commit points after each completed task

---

## P1 Task Order

### Task 1 — promoFlag enum (DB + frontend)

**DB:**
Convert `promo_flag` on `wfp_staff_meta` from boolean to a pgEnum with values `yes`, `maybe`, `no`.
- Show the schema change and migration SQL before applying
- UPDATE existing data: `true` → `yes`, `false` → `no` before pushing the type change
- Update the tRPC schema (Zod) to accept `"yes" | "maybe" | "no"` instead of boolean

**Frontend:**
- Update `MetaDialog` in `staff-tab.tsx` — the promotion checkbox becomes a 3-way Select: Yes / Maybe / No
- Update any `promoFlag` boolean checks in `staff-tab.tsx`, `shared.tsx`, and `types.ts`
- The promo filter button (currently "Promo only") should show staff where promoFlag is `yes` or `maybe`

---

### Task 2 — promotion_eta type fix (DB)

Convert `promo_eta` on `wfp_staff_meta` from text to a proper date column.
- Show migration SQL before applying
- Existing text values like "Q2 FY26" will need to be cleared or nulled — confirm approach before applying
- Update the tRPC Zod schema to accept a date string (ISO format)
- Update the MetaDialog input to a date picker or ISO date input

---

### Task 3 — doer_reviewer_bd tag (DB + frontend)

Add a `staff_role_tag` column to `wfp_staff_meta` (or `carbonites` if more appropriate — recommend the right table).
- pgEnum: `doer`, `reviewer`, `bd`
- Nullable — not every staff member needs a tag
- Show schema change before applying
- Add to the `getStaffWithMeta` query response
- Add to `MetaDialog` in `staff-tab.tsx` as a Select (Doer / Reviewer / BD / None)
- Add as a column in the staff table in `staff-tab.tsx`

---

### Task 4 — hired_carbonite_id on hiring_needs (DB)

Add `hired_carbonite_id` as a nullable FK column on `hiring_needs` referencing `carbonites.id` with `onDelete: SET NULL`.
- Show schema change and migration SQL before applying
- Update the `close` mutation in `hiring.ts` to accept an optional `hiredCarboniteId`
- Add validation: if provided, check the carbonite exists before updating
- No frontend changes needed in this task — just the DB and router

---

### Task 5 — getStaffWithMeta filtering (API)

Add `entityId` and `fy` as optional input params to `wfp.getStaffWithMeta`.
- If `entityId` is provided, filter staff by that entity
- If `fy` is provided, filter the meta join by that FY (if the meta table is FY-scoped)
- Update the query to use `and()` correctly when combining filters
- In `staff-tab.tsx`, pass the current entity + FY from the shell-level selectors down to this query
- This is the fix that scopes the staff table to the selected entity instead of showing all 42 staff firm-wide

---

### Task 6 — RBAC query-level filtering (API)

This is the most important security task in P1. Currently all queries return full firm data regardless of role.

Add role-aware filtering to every router query that returns carbonites, entities, or financial data:
- `state_manager` — all queries filter by the user's assigned state
- `service_line_lead` — all queries filter by the user's assigned service line
- `practice_manager` and `admin` — no filter, full access

Implementation approach:
- Add `state` and `serviceLine` fields to the `user` table (nullable — only set for state_manager and service_line_lead roles)
- Create a helper function `getRoleFilter(user)` that returns the appropriate WHERE clause additions
- Apply to: `getStaffWithMeta`, `firmKPIs`, `entityOverview`, `entityDetail`, `getAttritionRisks`, `dashboard` queries
- Show the user table schema change and the helper function before applying anything

---

### Task 7 — Dashboard stat cards + FY/state filters (Frontend)

Fix the 4 headline stat cards on the dashboard — currently showing wrong metrics.

**Correct metrics:**
1. Total Carbonites (active staff count)
2. Total FTE (sum of FTE across all active staff — full time = 1.0, part time = contracted_hours / 5)
3. Business Revenue Target (sum of all entity revenue targets for selected FY)
4. Business Revenue Actual (sum of all entity revenue actuals for selected FY, with % to target)

**Filters:**
- Add FY selector at the top of the dashboard — toggles all data on the page
- Add state filter pills: All / QLD / NSW / VIC / SA / WA — filters entity cards and stat cards
- Both filters should update the dashboard query params and re-fetch

**Chart:**
- Add a grouped bar chart (Target vs Actual) per entity for the selected FY
- Use Recharts
- Colour code: green (≥95% of target), amber (80–94%), red (<80%)
- Clicking a bar navigates to `/capacity-plan?entity=<id>&fy=<fy>`

---

### Task 8 — Capacity Plan entity + FY selectors (Frontend)

Wire up the entity and FY selectors at the shell level (`capacity-plan.lazy.tsx`) and pass them down to all tabs.

- Entity selector: dropdown of all 23 entities (filtered by user's RBAC scope)
- FY selector: dropdown of available financial years
- Both values stored as URL search params (`?entity=id&fy=FY25-26`) — already partially in place via `validateSearch`
- Pass `entityId` and `fy` as props to `FirmTab`, `StaffTab`, `PodBudgetsTab`
- Each tab uses these to scope its queries
- When navigating from the dashboard entity card, the entity + FY should auto-select

---

### Task 9 — Carbonites delete button (Frontend)

Add a soft delete button to the Carbonites page.
- Admin only — only visible when `userRole === "admin"`
- Each staff row gets a delete icon button
- Clicking opens a confirmation dialog: "Are you sure you want to deactivate [name]? They will be removed from all active views."
- On confirm, calls `trpc.carbonites.delete` mutation
- On success, invalidates the carbonites query and shows a toast
- Do not add a restore UI yet — that is P2

---

### Task 10 — Entity creation (Frontend + API)

Currently entities can only be edited, not created.
- Add a `create` mutation to the entities router
- Add an "Add Entity" button to the admin Settings page
- Opens a modal with fields: name, state, billing multiplier, financial year
- On save, creates the entity and invalidates the entities query
- Validation: name and state are required

---

## What Stays Out of P1

These are confirmed P2 — do not start them during P1:
- Hiring board view (currently table view — leave for P2)
- Salary brackets editor UI
- Org chart view for carbonites
- Show inactive staff toggle + restore button
- Scenario delta comparison UI
- FY Report missing sections
- Audit log
- Forgot password / email flow
- Auto-flag capacity shortfall on role change
- Print to PDF for FY Report