# Carbon WFP — Claude Code Audit Prompt

I have an existing Next.js + PostgreSQL app called Carbon Workforce Planner (Carbon WFP). Before we do any refactoring or new work, I want you to:

1. **Review the existing codebase** — look at the DB schema, API routes, and frontend pages/components as they currently exist
2. **Check them against the requirements below** — identify what's correctly built, what's partially built, and what's missing entirely
3. **Then recommend** the right coding patterns, folder structure, data fetching strategy, global state approach, and DB structure we should be following for this stack before we touch anything

Do not change any code yet. Just audit and report back with:

- What the DB is missing or has wrong vs the requirements
- What frontend features are missing or incomplete
- What architecture/pattern changes you recommend before we continue building
- A prioritised order of what to fix or build next

---

## DATABASE

### Must store:

- **Users** — id, name, email, hashed password, role (admin / practice_manager / service_line_lead / state_manager / read_only), created_at
- **Entities** — id, name, state, billing_multiplier, financial_year
- **Carbonites (Staff)** — id, full_name, job_title, service_line, seniority_grade (1–10), state, office, pod_id, employment_type (FT/PT/casual), contracted_hours (PT only), base_salary, entity_id, reports_to (self-referencing FK), is_partner (bool), performance_rating (1–5), billing_target, doer_reviewer_bd tag, promotion_flagged (yes/maybe/no), promotion_eta (date, nullable), is_active (soft delete)
- **Pods** — id, name, entity_id, budget_allocated
- **Pod Spend** — derived from sum of staff salaries assigned to that pod (not manually entered)
- **Revenue Targets** — id, entity_id, financial_year, target_amount, actual_amount
- **Headcount Targets** — id, entity_id, service_line, financial_year, target_count
- **Salary Brackets** — id, service_line, state, program_level, performance_band, employment_type, salary_min, salary_mid, salary_max
- **Salary Benchmarks** — id, service_line, state, market_min, market_max, carbon_average
- **Hiring Needs** — id, role, service_line, seniority_grade, state, office, positions (int), employment_type, priority (urgent/high/medium/low), salary_band_min, salary_band_max, target_start_date, approved_by, approval_status, status (open/in_progress/closed), closed_reason (filled/cancelled/deferred), hired_carbonite_id (nullable FK), notes
- **Scenarios** — id, name, description, entity_id, financial_year, created_by, created_at, is_live (bool)
- **Scenario Staff Overrides** — id, scenario_id, carbonite_id, override_salary, override_role, override_hours, override_status (added/removed/changed)
- **Financial Year Settings** — available FYs, active FY per entity
- **Audit Log** (optional but recommended) — who changed what and when

### Must be able to do:

- Soft delete staff (is_active flag, never hard delete)
- Calculate FTE from contracted_hours (e.g. 4 days = 0.8 FTE)
- Calculate pod spend dynamically from staff salaries (not stored separately)
- Calculate revenue capacity from salary × billing_multiplier
- Calculate billing capacity per staff adjusting for PT hours
- Flag attrition risk based on: low performance rating + underpaid vs bracket + no promotion flag
- Store multiple FY records per entity without overwriting prior years
- Scope all queries by financial_year and state filters
- RBAC at the query level — service line leads only see their SL, state managers only see their state

---

## FRONTEND

### Auth
- Login / logout with session cookies
- Role stored in session, enforced on every protected route
- Forgot password flow (needs email provider — not yet built)

### Dashboard (read-only)
- Pull all entities for selected FY + state filter
- Render 4 headline stat cards (total staff, FTE, revenue target, revenue actual)
- Render alerts panel — auto-generate from: overspend pods, attrition risk flags, hiring needs open > X days, headcount gaps
- Render grouped bar chart (target vs actual per entity), clickable to Capacity Plan
- Render entity cards grid with status colour indicators
- FY selector and state filter pills that re-fetch and re-render the whole page

### Capacity Plan
- Entity selector, FY selector, scenario selector
- Topline summary: revenue target, calculated capacity, gap
- Pod money buckets: budget vs spend progress bars, colour coded
- Staff table: each row shows name, role, salary, FTE, billing target, actual billing, performance rating, promotion flag, doer/reviewer/BD tag
- Inline editing of: billing target, performance rating, promotion flag + ETA, doer/reviewer/BD tag
- Headcount targets table: per service line, current vs target vs gap
- Salary benchmark panel: Carbon average vs market min/max per SL
- Scenario mode: load a scenario instead of live data, show delta vs live
- Auto-flag when a change creates a capacity shortfall (e.g. role change = "you'll be $100k short")

### Carbonites (People)
- Searchable, filterable staff directory (state, office, SL, seniority, employment type)
- Add / edit staff via modal — all fields including PT hours, partner flag, reports-to
- Soft delete (admin only)
- Org chart view from reports-to relationships

### Hiring
- Board view grouped by priority
- Filter by state, SL, priority
- Add / edit / close hiring needs inline
- Summary totals: open positions count, total salary exposure
- Closing a need captures: filled/cancelled/deferred + optional hired_carbonite link

### Scenarios
- Create named scenario scoped to entity + FY
- Clone live data into scenario as starting point
- Override individual staff: salary, role, hours, or remove/add people
- Compare scenario vs live: show delta in capacity, salary spend, headcount, target gap
- Scenarios never touch live data

### FY Report (read-only)
- Revenue target vs actual across all entities, broken down by SL
- Headcount summary + changes
- Salary spend total, vs prior year if available
- Billing performance average
- Hiring summary (filled / open / deferred)
- Attrition summary (flagged vs lost vs retained)
- Pod budget summary by office
- Salary vs market comparison
- Print to PDF via browser

### Settings (admin only)
- User management: invite, change role, remove
- Entity management: create (not yet built), edit multiplier + FY
- Salary bracket editor: update without code deploy
- Salary benchmark editor

---

## WHAT'S NOT YET BUILT — flag these specifically

- Entity creation from UI (edit only right now)
- Forgot password / email flow
- Email notifications for attrition flags and hiring approvals
- Scenario delta calculation UI
- Auto-flag capacity shortfall on role change
- Doer/reviewer/BD tag field on Carbonite
- Promotion flag as yes/maybe/no (may currently be boolean only)
- FTE auto-calculation from PT hours
- Audit log
