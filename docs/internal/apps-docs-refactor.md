# Carbon WFP — Next Steps Prompt for Claude Code

## 1. Page Merge Decision

Merge `/capacity` and `/wfp` into a single unified route called `/capacity-plan`.

The WFP features (staff table, headcount targets, scenarios, revenue tracking, attrition flags) are the core of what this page needs to be. The pod budget bars from the current `/capacity` page should become one section within that unified page — not a separate route.

**Once merged, the page structure should be:**
1. Entity + FY + Scenario selectors at the top
2. Topline summary (revenue target / capacity / gap)
3. Pod money buckets (budget vs spend progress bars, colour coded)
4. Staff table with inline editing
5. Headcount targets per service line
6. Salary benchmarks
7. Attrition flags

Delete the `/wfp` route once all features are migrated across. Update the sidebar navigation to show one item: "Capacity Plan" pointing to `/capacity-plan`.

Do not do this merge yet — note it and include it in the plan. We will action it after P0 is complete.

---

## 2. Start P0 Only

Begin with P0 data integrity fixes only. Do not move to P1 or beyond until P0 is complete and confirmed.

**P0 tasks (in this order):**

1. Add `is_active` boolean column to `carbonites` table — default true. Convert all existing delete operations to set `is_active = false`. No hard deletes on carbonites from this point forward.
2. Add FK constraints across all domain tables — carbonites → entities, carbonites → pods, scenarios → entities, hiring_needs → carbonites (for hired_carbonite_id). Use Drizzle `.references()`.
3. Add `financial_year` to `headcount_targets` — update the composite PK to include it so multiple FY records can exist per entity/service line.
4. Add `financial_year` to `scenarios` table.
5. Fix role enum values — `readonly` should be `read_only`, add `service_line_lead` as a valid value. Use a pgEnum.

**For each P0 task:**
- Show me the migration SQL or Drizzle schema change before running it
- Wait for my confirmation before applying
- After applying, confirm what changed and that existing data is unaffected

---

## 3. Skills Instruction

Before writing any code for any part of this plan, check your loaded skills for the relevant package and follow those patterns exactly.

- **DB schema changes or queries** → use the Drizzle skill
- **Frontend components or pages** → use the Next.js and shadcn/ui skills
- **Auth or session work** → use the Better Auth skill
- **Data fetching or server state** → use the TanStack Query skill
- **Forms or validation** → use the relevant form/validation skill

If a skill exists for a package you are about to use, read it before writing any code. Do not fall back to your own default patterns if a skill is loaded. The skills define the correct patterns for this codebase.

---

## 4. Rules for This Session

- Do not change any code that is not part of the current task
- One task at a time — complete and confirm before moving to the next
- Show schema/migration changes before running them
- After each task, summarise what changed and why
- Do not refactor working code unless it is directly blocking the current task
- Commit points — flag when it is a good time to commit so we can checkpoint progress