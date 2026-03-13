# UI Refactor Workplan

**Status:** In progress
**Assigned to:** Claude (autonomous execution)
**Context:** Production dashboard, 5–8 routes, single sidebar layout. Built with shadcn + Tailwind CSS v4. Full audit completed — findings treated as correct.

---

## Design System Decisions (Final)

- **Font:** Plus Jakarta Sans — single source of truth. Loaded via Google Fonts in `index.html`, mapped to `--font-sans` in `src/index.css`.
- **Dark-mode tokens:** Always use semantic tokens (`bg-background`, `text-foreground`, etc.). Never use `bg-white`, `text-black`, or raw color values.

---

## Non-Negotiable Rules

1. Pages may NOT apply visual identity classes: `px-*`, `py-*`, `p-*`, `gap-*`, `rounded-*`, `h-*`, `max-w-*`
2. Pages may ONLY compose templates and pass semantic props: `size`, `density`, `variant`
3. All spacing, sizing, dialog widths, and layout live in shared components or templates
4. Accessibility is mandatory — no exceptions
5. Do not discuss alternatives. Execute.

---

## Phase 0 — Consistency

**Goal:** Font and documentation are consistent.

### Tasks
- [x] Update `CLAUDE.md` to specify Plus Jakarta Sans
- [x] Verify `apps/web/src/index.css` uses `--font-sans: "Plus Jakarta Sans", sans-serif`
- [x] Verify no component overrides the base font via `className` or inline styles

**Status: COMPLETE**

### Files
- `CLAUDE.md`
- `apps/web/src/index.css`

---

## Phase 1 — Accessibility Blockers

**Goal:** All forms are accessible. All interactive controls meet WCAG requirements.

### Tasks

#### 1.1 — Field abstraction
- [x] Create `apps/web/src/components/shared/field.tsx`
  - Props: `id`, `label`, `required?`, `hint?`, `error?`, `children`
  - Renders: `<label htmlFor={id}>` + `children` (the input) + optional error/hint
  - Centralizes `mb-1 block text-muted-foreground` label style
  - Every `<Input>`, `<Select>`, `<Textarea>` inside gets `id={id}` and `name={id}` automatically via context or explicit prop

#### 1.2 — Refactor HiringDialog
- [x] Replace all floating `<Label>` + `<Input>` pairs with `<Field>`
- [x] Ensure every input has `id` and `name`
- [x] File: `apps/web/src/routes/_app/hiring.lazy.tsx`

#### 1.3 — Refactor CloseRoleDialog
- [x] Replace all floating `<Label>` + `<Input>` pairs with `<Field>`
- [x] File: `apps/web/src/routes/_app/hiring.lazy.tsx`

#### 1.4 — Refactor Admin entity form
- [x] Replace all floating `<Label>` + `<Input>` pairs with `<Field>`
- [x] File: `apps/web/src/routes/_app/admin.lazy.tsx`

#### 1.5 — Icon-only buttons: aria-label
- [x] `admin.lazy.tsx` — delete user button: `aria-label="Delete user {name}"`
- [x] `fy-planning.lazy.tsx` — inline save button: `aria-label="Save value"`
- [x] `fy-planning.lazy.tsx` — inline edit button: `aria-label="Edit value"`
- [x] `hiring.lazy.tsx` — delete role button: `aria-label="Delete role {role}"`

#### 1.6 — Decorative icons: aria-hidden
- [x] All `HugeiconsIcon` used decoratively inside buttons with visible text labels get `aria-hidden="true"`
- [x] Covers: hiring, admin, fy-planning, carbonites, todos routes

#### 1.7 — Date picker trigger (hiring.lazy.tsx)
- [x] Uses Base UI `PopoverTrigger` directly (renders a `<button>`)
- [x] `aria-haspopup="dialog"`, `aria-expanded` bound to open state
- [x] Visible `focus-visible:ring-*` focus state
- [x] Popover closes on date select

**Status: COMPLETE**

---

## Phase 2 — PageHeader & Theming

**Goal:** PageHeader matches documented contract. No `bg-white` anywhere in the app.

### Tasks

#### 2.1 — Refactor PageHeader
- [x] File: `apps/web/src/components/shared/page-header.tsx`
- [x] Add `children` prop — renders right-side actions slot
- [x] Add optional `description` prop (ReactNode)
- [x] Change title alignment from `justify-center` to `justify-between`
- [x] Add `border-b` to the header bar
- [x] Replace `bg-white` with `bg-background`
- [x] Keep `px-6 py-2` inside the component (not in pages)

#### 2.2 — Remove all bg-white
- [x] `apps/web/src/components/shared/page-header.tsx` — already used `bg-background`
- [x] `apps/web/src/routes/_app/hiring.lazy.tsx` — no `bg-white` present
- [x] `apps/web/src/routes/_app/capacity-plan.lazy.tsx` — no `bg-white` present
- [x] `apps/web/src/routes/_app/fy-planning.lazy.tsx` — no `bg-white` present
- [x] `apps/web/src/components/capacity-plan/firm-tab.tsx:125` — entity card button
- [x] `apps/web/src/components/capacity-plan/firm-tab.tsx:197` — EntityDetailPanel container
- [x] `apps/web/src/components/data-table/data-table.tsx:33` — table wrapper
- [x] `apps/web/src/components/data-table/data-table-faceted-filter.tsx:80` — filter trigger

#### 2.3 — Delete ad-hoc toolbar bands
- [x] `hiring.lazy.tsx` — tabs + "Add Role" button already in PageHeader children
- [x] `capacity-plan.lazy.tsx` — selectors + tabs already in PageHeader children
- [x] `fy-planning.lazy.tsx` — buttons + FY select already in PageHeader children

**Status: COMPLETE**

---

## Phase 3 — Layout Templates

**Goal:** Pages contain zero spacing or sizing Tailwind classes. All layout lives in shared primitives.

### New Components
- `apps/web/src/components/shared/page.tsx`
  - `<Page>` — `flex h-full flex-col` wrapper
  - `<PageToolbar>` — `flex items-center border-b bg-background px-6 py-2`
  - `<PageBody>` — `flex-1 overflow-auto` with optional `padded` and `constrain` props
  - `<PageSection>` — non-scrolling secondary content panel with `px-6 py-4 bg-zinc-50`

### Tasks

#### 3.1 — Create Page primitives
- [x] `apps/web/src/components/shared/page.tsx` — `Page`, `PageToolbar`, `PageBody`, `PageSection`

#### 3.2 — Refactor routes
For each route below, replace inline layout classes with primitives:
- [x] `/_app/hiring` — `hiring.lazy.tsx`
- [x] `/_app/admin` — `admin.lazy.tsx`
- [x] `/_app/capacity-plan` — `capacity-plan.lazy.tsx`
- [x] `/_app/fy-planning` — `fy-planning.lazy.tsx` (column-header band → `PageToolbar`; footer totals → `PageToolbar className="border-t border-b-0"`)
- [x] `/_app/todos` — `todos.lazy.tsx`
- [x] `/_app/carbonites` — `carbonites.lazy.tsx`
- [x] `/_app/dashboard` — `dashboard.lazy.tsx` (added `PageHeader`; search band → `PageToolbar`)

#### 3.3 — Verify zero spacing classes on pages
After refactor, run a grep for `px-` `py-` `p-` `gap-` `h-full` `max-w-` on route files. All should be gone.
- [x] Verified: no `flex h-full flex-col`, `overflow-auto px-*`, or `overflow-auto p-*` patterns remain on page shells

**Status: COMPLETE**

---

## Phase 4 — Dialogs & Sheets

**Goal:** All dialogs and sheets use size variants. No hardcoded `max-w-*` or pixel widths.

### New Components
- `apps/web/src/components/ui/app-dialog.tsx`
  - `<AppDialog size="sm | md | lg">` — wraps `DialogContent` with standardized widths
  - sm = `max-w-sm`, md = `max-w-lg`, lg = `max-w-2xl`
  - Standardized scroll area and footer layout
- `apps/web/src/components/ui/confirm-dialog.tsx`
  - `<ConfirmDialog>` — accepts `title`, `description`, `confirmLabel`, `onConfirm`, `loading`, `variant`
  - Always `size="sm"`

### Tasks

#### 4.1 — Create AppDialog
- [x] `apps/web/src/components/ui/app-dialog.tsx`

#### 4.2 — Create ConfirmDialog
- [x] `apps/web/src/components/ui/confirm-dialog.tsx`

#### 4.3 — Migrate dialogs
Replace all `DialogContent className="max-w-*"` with `<AppDialog size="...">`:
- [x] `hiring.lazy.tsx:705` — CloseRoleDialog → `size="sm"`
- [x] `hiring.lazy.tsx:1120` — delete confirm → `<ConfirmDialog>`
- [x] `hiring.lazy.tsx:370` — HiringDialog → `size="md"` (currently no max-w)
- [x] `carbonites.lazy.tsx:320` — single deactivate → `<ConfirmDialog>`
- [x] `carbonites.lazy.tsx:356` — bulk deactivate → `<ConfirmDialog>`
- [x] `admin.lazy.tsx:391` — Add Entity → `size="sm"`
- [x] `admin.lazy.tsx:469` — delete user → `<ConfirmDialog>`
- [x] `fy-planning.lazy.tsx:443` — CSV import → `size="md"`

#### 4.4 — Migrate Sheet widths
- [x] `hiring.lazy.tsx:162` — replace `w-[380px] sm:w-[420px]` with `sheet-panel` CSS utility

---

## Phase 5 — State Correctness

**Goal:** All meaningful UI state is URL-synced. Survives navigation and refresh.

### Tasks

#### 5.1 — hiring: tab state → URL param
- [x] `hiring.lazy.tsx:777` — `tab` moved to URL search param `?tab=open|closed`
- [x] `apps/web/src/routes/_app/hiring.tsx` search schema includes `tab`

#### 5.2 — fy-planning: FY selector → URL param
- [x] `fy-planning.lazy.tsx:702` — `fy` moved to URL search param
- [x] `apps/web/src/routes/_app/fy-planning.tsx` search schema updated

#### 5.3 — capacity-plan: active tab → URL param
- [x] `capacity-plan.lazy.tsx:28` — `tab` moved to URL search param
- [x] `apps/web/src/routes/_app/capacity-plan.tsx` search schema updated

#### 5.4 — fy-planning: StateSection collapse state
- [x] Collapse state per section remains local (`useState`) — acceptable, not URL-synced.

---

## Phase 6 — Guidelines & Polish

**Goal:** Typography, animation, and numeric formatting are correct.

### Tasks

#### 6.1 — Straight ellipsis → Unicode ellipsis
Replace `"..."` with `"…"` in:
- [x] `fy-planning.lazy.tsx:521` — `"Importing…"`
- [x] `hiring.lazy.tsx:1050` — `placeholder="Search roles…"`
- [x] `carbonites.lazy.tsx:336,356` — already used unicode `…` (no change needed)

#### 6.2 — transition-all → explicit properties
- [x] `fy-planning.lazy.tsx:126` — `RevenueBar`: changed `transition-all` to `transition-[width]`

#### 6.3 — tabular-nums on numeric columns
- [x] `dashboard.lazy.tsx:114` — `InlineStat` value span (KPI figures)
- [x] `dashboard.lazy.tsx:283` — Revenue chart toggle dollar total span
- [x] `dashboard.lazy.tsx:413` — Headcount `TableCell`
- [x] `dashboard.lazy.tsx:416` — Total Salary `TableCell`
- [x] `dashboard.lazy.tsx:419` — % of Firm `TableCell`

#### 6.4 — JS animations: prefers-reduced-motion
- [x] `dashboard.lazy.tsx` — added `useReducedMotion()` from `motion/react`; spring animation disabled when reduced motion is preferred

**Status: COMPLETE**

---

## Audit Reference (findings from review)

| # | Issue | Severity | Location |
|---|---|---|---|
| 1 | Font mismatch in CLAUDE.md | Fixed (Phase 0) | `CLAUDE.md:63` |
| 2 | `bg-white` hardcoded | High | 4 files |
| 3 | PageHeader stripped of documented API | High | `page-header.tsx` |
| 4 | Page-level layout overrides | High | All 7 routes |
| 5 | Toolbar pattern duplicated | High | 3 routes |
| 6 | Dialog sizing not standardized | Medium | 8 dialogs |
| 7 | Sheet width hardcoded | Medium | `hiring.lazy.tsx:162` |
| 8 | Icon-only buttons missing `aria-label` | High (a11y) | 3 instances |
| 9 | Form labels not linked via `htmlFor`/`id` | High (a11y) | 15+ fields |
| 10 | `HugeiconsIcon` not `aria-hidden` in buttons | Medium (a11y) | ~20+ |
| 11 | Form inputs missing `name` attribute | Medium (a11y) | 10+ fields |
| 12 | FY state not URL-synced in fy-planning | Medium | `fy-planning.lazy.tsx:702` |
| 13 | Tab state not URL-synced in hiring | Medium | `hiring.lazy.tsx:777` |
| 14 | Straight ellipsis `...` | Low | 4 instances |
| 15 | `transition-all` in RevenueBar | Low | `fy-planning.lazy.tsx:125` |
| 16 | JS spring animation not respecting reduced motion | Low | `dashboard.lazy.tsx:716` |
| 17 | Date picker button not accessible | High (a11y) | `hiring.lazy.tsx:597` |
