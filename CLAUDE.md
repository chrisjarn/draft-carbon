# Carbon Workforce Planner

## What This Is
Internal workforce planning tool for Carbon Group (Australian accounting firm).
Migrated from a monolithic vanilla JS/Node.js app to a modern stack.
The legacy app lives in `legacy/` — read-only reference, do not modify.

## Stack
- **Frontend:** React 19 + Vite + TanStack Router + TanStack Query
- **UI:** shadcn/ui (base-maia style, zinc+emerald theme, 55 components) + Tailwind CSS v4
- **Icons:** Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- **Font:** Outfit (`@fontsource-variable/outfit`)
- **Backend:** Hono + tRPC v11
- **Auth:** Better Auth (email/password, RBAC with 5 roles, Drizzle adapter)
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **Runtime:** Bun
- **Monorepo:** Turborepo
- **Linting:** Biome (tabs, double quotes, sorted Tailwind classes)
- **Deployment:** Railway (nixpacks, Node 22 + Bun)
- **Scaffolded from:** Better-T-Stack v3.21.7

## Architecture
```
apps/
  web/              # React SPA (Vite + TanStack Router)
  server/           # Hono API + tRPC + Better Auth
packages/
  api/              # tRPC routers (12 routers, shared API layer)
  auth/             # Better Auth config (email/password, Drizzle adapter)
  db/               # Drizzle schema (16 tables), seed data, migrations
  env/              # Env var validation (@t3-oss/env-core + Zod)
  config/           # Shared TypeScript config (tsconfig.base.json)
legacy/             # Original vanilla JS app (reference only — DO NOT MODIFY)
```

### Package Dependency Chain
```
config → env → db → auth → api → server
               env → web
```

## Dev Ports
| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:3001 |
| Backend (Hono) | http://localhost:3000 |
| tRPC endpoint | http://localhost:3000/trpc |
| Auth endpoint | http://localhost:3000/api/auth |
| Drizzle Studio | http://localhost:4983 |

## Commands
```bash
bun install          # Install all deps (run from repo root)
bun run dev          # Start frontend + backend concurrently
bun run dev:web      # Frontend only
bun run dev:server   # Backend only
bun run build        # Build all packages
bun run check-types  # TypeScript type check across all packages
bun run check        # Biome lint + format
bun run db:push      # Apply Drizzle schema to DB (no migration files)
bun run db:studio    # Open Drizzle Studio
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
bun run seed         # Seed database (entities, carbonites, hiring, salary brackets)
```

## Environment Variables

### Backend (`apps/server/.env`)
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
BETTER_AUTH_SECRET=your-secret-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development
```

### Frontend (`apps/web/.env`)
```env
VITE_SERVER_URL=http://localhost:3000
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (SSL via query param) |
| `BETTER_AUTH_SECRET` | Yes | Min 32 chars, signs sessions |
| `BETTER_AUTH_URL` | Yes | Full URL of the backend server |
| `CORS_ORIGIN` | Yes | Frontend origin (for CORS + auth cookies) |
| `NODE_ENV` | No | `development` \| `production` \| `test` |
| `VITE_SERVER_URL` | Yes | Backend URL used by the React app |

## RBAC Roles
| Role | Rank | Access |
|------|------|--------|
| `admin` | 100 | Full access + user management |
| `practice_manager` | 80 | Write access |
| `sl_lead` | 50 | Write access |
| `state_manager` | 50 | Write access |
| `readonly` | 10 | Read-only (default for new users) |

Enforced server-side via `assertWriter()` and `assertAdmin()` in tRPC procedures.
Client-side via `canWrite()` and `canAdminWrite()` for UI gating.

## Database Schema (packages/db)

### Auth tables (Better Auth managed)
- `user` — id, name, email, emailVerified, image, role, createdAt, updatedAt
- `session` — id, expiresAt, token, userId FK, ipAddress, userAgent
- `account` — id, accountId, providerId, userId FK, tokens, password
- `verification` — id, identifier, value, expiresAt

### Domain tables
- `carbonites` — Staff members (40 seeded). Core entity, everything references it.
- `entities` — Business units/offices (24 seeded). JSONB for SL array and partners.
- `pod_budgets` — Budget per pod per office. Composite PK (state, office, podName).
- `hiring_needs` — Hiring pipeline (12 seeded). Status: open/active/offer/closed.
- `salary_brackets` — Salary ranges by state (43 seeded). Complex JSONB per state with market/recommended ranges and performance bands.
- `wfp_staff_meta` — Per-staff WFP data (billing targets, perf ratings, promo flags).
- `wfp_entity_settings` — Entity billing config (multiplier, FY).
- `wfp_revenue` — Revenue targets/actuals per entity per FY.
- `headcount_targets` — Headcount targets per entity.
- `attrition_risks` — Staff attrition risk tracking.
- `scenarios` / `scenario_roles` — WFP scenario workbench.
- `prior_year_data` — Historical data for YoY comparison.
- `app_settings` — Key-value JSON config store.
- `todo` — Demo/scaffolding table.

Schema files: `packages/db/src/schema/*.ts`
Seed data: `packages/db/seed.ts` (~3100 lines)

## tRPC Routers (packages/api/src/routers/)

| Router | Key Procedures | Auth |
|--------|---------------|------|
| root | `healthCheck`, `privateData` | public / protected |
| `todo` | `getAll`, `create`, `toggle`, `delete` | public / protected |
| `carbonites` | `getAll`, `create`, `update`, `delete` | protected |
| `entities` | `getAll`, `getById`, `update` | protected |
| `podBudgets` | `getAll`, `upsert` | protected |
| `hiring` | `getAll`, `create`, `update`, `close`, `reopen`, `delete` | protected |
| `salaryBrackets` | `getAll`, `getBySl` | protected |
| `wfp` | `firmKPIs`, `entityOverview`, `entityDetail`, `updateStaffMeta`, `updateEntitySettings` | protected |
| `wfpExtended` | `headcountTargets`, `attritionRisks`, `scenarios`, CRUD | protected |
| `priorYear` | `getAll`, `import` | protected |
| `dashboard` | `stats` | protected |
| `admin` | `listUsers`, `setRole`, `deleteUser` | protected (admin) |

Register new routers in `packages/api/src/routers/index.ts`.

## Web Routes (apps/web/src/routes/)

All routes under `/_app/` use lazy loading (`.lazy.tsx` files) for code-splitting.

| Route | File | Description |
|-------|------|-------------|
| `/` | `index.tsx` | Redirect to /dashboard or /login |
| `/login` | `login.tsx` + `login.lazy.tsx` | Email/password auth forms |
| `/_app` | `_app.tsx` | Auth guard + sidebar layout |
| `/_app/dashboard` | `dashboard.lazy.tsx` | KPI cards, entity grid, SL breakdown, alerts |
| `/_app/carbonites` | `carbonites.lazy.tsx` | Staff directory with card grid, filters, CRUD, detail sheet |
| `/_app/capacity` | `capacity.lazy.tsx` | Pod capacity: budget vs actual, state>office>pod tree |
| `/_app/hiring` | `hiring.lazy.tsx` | Hiring pipeline: DataTable, open/closed tabs, close/reopen |
| `/_app/wfp` | `wfp.lazy.tsx` | WFP: firm KPIs, entity detail, staff meta, scenarios |
| `/_app/fy-planning` | `fy-planning.lazy.tsx` | FY revenue targets/actuals, CSV import/export |
| `/_app/admin` | `admin.tsx` + `admin.lazy.tsx` | User/role management (admin-only, has beforeLoad guard) |
| `/_app/todos` | `todos.lazy.tsx` | Demo todo CRUD |

## Adding shadcn/ui Components
```bash
# From apps/web directory
bunx --bun shadcn@latest add <component-name>
```
Note: After adding a new shadcn component, replace any `lucide-react` imports with the equivalent Hugeicons. See the icon mapping table in `MIGRATION-SUMMARY.md` (Phase 6).

## Reference (legacy/)
Read-only reference material — do not modify:
- `legacy/public/index.html` — The entire old UI (~7200 lines of vanilla HTML/CSS/JS)
- `legacy/server.js` — Original Node.js HTTP server
- `legacy/database.js` — Full PostgreSQL schema (all CREATE TABLE statements)
- `legacy/auth.js` — Better Auth config with RBAC
- `legacy/routes/` — API route handlers
- `legacy/seed.js` / `legacy/seed-salary.js` — Seed data

## Design System

**Theme**: zinc base color + emerald primary, configured via shadcn base-maia style.

**shadcn config** (`apps/web/components.json`):
- Style: `base` with `maia` sub-style
- Base color: `zinc`, theme accent: `emerald`
- Icon library: `hugeicons`
- Menu: `inverted` color + `bold` accent (dark sidebar)
- Sidebar: `floating` variant
- Radius: `0.625rem` (default)

**Icons — Hugeicons (not lucide-react)**:
- `lucide-react` has been fully removed from the project
- Use `@hugeicons/react` wrapper + `@hugeicons/core-free-icons` icon data
- Pattern: `<HugeiconsIcon icon={IconNameIcon} />` (NOT `<IconName />`)
- Icon data type: `IconSvgElement` from `@hugeicons/react`
- `HugeiconsIcon` extends `SVGProps<SVGSVGElement>` — supports `className`, `data-*`, `aria-*`, spread props
- shadcn's `[&_svg]:size-4` selectors work with HugeiconsIcon

**Font**: Outfit (variable weight), imported via CSS `@import` in `src/index.css`.

**CSS variables**: Defined in `apps/web/src/index.css` with full light/dark mode support. Emerald primary values use oklch color space.

## Conventions
- TypeScript strict mode, no `any` types
- Biome for lint/format (not ESLint/Prettier) — run `bun run check`
- Bun for package management and runtime
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`
- Fetch docs before implementing with external libs
- Check latest package versions before installing
- Use shadcn/ui components — don't build custom UI primitives
- Use Hugeicons for all icons — never use lucide-react
- Use TanStack Query for all data fetching (via tRPC hooks)
- Use Drizzle for all database operations
- Use tRPC for type-safe API layer
- `protectedProcedure` for any mutation or sensitive read
- Routes use TanStack Router file-based routing with `.lazy.tsx` code-splitting
- Route auth guards go in `beforeLoad` (non-lazy file)
- New tRPC routers go in `packages/api/src/routers/` — register in `routers/index.ts`
- `legacy/` is excluded from Biome linting and TypeScript checking
