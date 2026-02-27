# Carbon Workforce Planner - Migration

## What This Is
Internal workforce planning tool for Carbon Group (Australian accounting firm).
Migrating from a monolithic vanilla JS/Node.js app to a modern stack.
The legacy app lives in `legacy/` and is the source of truth for domain logic, schema, and UI requirements.

## Stack
- **Frontend:** React 19 + Vite + TanStack Router + TanStack Query
- **UI:** shadcn/ui + Tailwind CSS v4
- **Backend:** Hono + tRPC
- **Auth:** Better Auth (email/password, RBAC with 5 roles)
- **Database:** PostgreSQL + Drizzle ORM
- **Runtime:** Bun
- **Monorepo:** Turborepo
- **Linting:** Biome

## Architecture
```
apps/
  web/              # React SPA (Vite + TanStack Router)
  server/           # Hono API + tRPC + Better Auth
packages/
  api/              # tRPC routers (shared API layer)
  auth/             # Better Auth config
  db/               # Drizzle schema + migrations  ← NOT YET CREATED
  env/              # Env var validation (Zod)
  config/           # Shared TypeScript config
legacy/             # Original vanilla JS app (reference only)
```

## Dev Ports
| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:3001 |
| Backend (Hono) | http://localhost:3000 |
| tRPC endpoint | http://localhost:3000/trpc |
| Auth endpoint | http://localhost:3000/api/auth |

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
bun run db:studio    # Open Drizzle Studio (DB UI at localhost:4983)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
```

## Environment Variables

### Backend (`apps/server/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
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
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Min 32 chars, signs sessions |
| `BETTER_AUTH_URL` | Yes | Full URL of the backend server |
| `CORS_ORIGIN` | Yes | Frontend origin (for CORS + auth cookies) |
| `NODE_ENV` | No | `development` \| `production` \| `test` |
| `VITE_SERVER_URL` | Yes | Backend URL used by the React app |

## RBAC Roles (from existing app - must preserve)
| Role | Rank | Access |
|------|------|--------|
| `admin` | 100 | Full access + user management |
| `practice_manager` | 80 | Write access |
| `sl_lead` | 50 | Write access |
| `state_manager` | 50 | Write access |
| `readonly` | 10 | Read-only (default for new users) |

The `user` table has a `role TEXT NOT NULL DEFAULT 'readonly'` column. RBAC filtering applies to the sidebar nav and API procedures.

## Current State of the New App

### What exists
- Monorepo scaffold (Turborepo, Bun workspaces, Biome, TypeScript strict)
- `apps/server`: Hono server with tRPC and Better Auth wired up
- `apps/web`: React app with TanStack Router, TanStack Query, shadcn/ui, dark mode
- `packages/api`: tRPC router with `healthCheck`, `privateData`, and `todo` CRUD
- `packages/auth`: Better Auth configured (email/password, Drizzle adapter)
- `packages/env`: Zod-validated env vars for server and web
- Auth UI: sign-in and sign-up forms, session-aware user menu
- Routes: `/` (health check), `/login`, `/dashboard` (protected), `/todos`

### What is missing (critical)
- **`packages/db`** — Drizzle schema + client. Referenced everywhere but not created yet.
  All imports like `import { db } from "@carbon-wfp/db"` will fail until this exists.
  See _Domain Model_ below for the full schema to implement.

## Domain Model (Drizzle schema to create in `packages/db`)

The full PostgreSQL schema lives in `legacy/database.js`. Map it to Drizzle:

### Core tables

**`carbonites`** — Staff members
```
id TEXT PK, name TEXT, role TEXT, sl TEXT, sg TEXT,
state TEXT, office TEXT, pod TEXT, salary INTEGER,
type TEXT (FT/PT), seniority INTEGER, location TEXT,
hours INTEGER, is_partner BOOLEAN, entity TEXT,
reports_to TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

**`entities`** — Business units / offices
```
id TEXT PK, biz TEXT, tan TEXT, office_id TEXT, state TEXT,
phone TEXT, address TEXT, email TEXT,
sl JSONB (array), partners JSONB (array), updated_at TIMESTAMPTZ
```

**`pod_budgets`** — Budget per pod per office
```
PK (state, office, pod_name), budget INTEGER, updated_at TIMESTAMPTZ
```

**`hiring_needs`** — Hiring pipeline
```
id TEXT PK, role TEXT, sl TEXT, sg TEXT, state TEXT, office TEXT,
location TEXT, positions INTEGER, type TEXT, priority TEXT,
status TEXT (open/closed), salary_min INTEGER, salary_max INTEGER,
target_start TEXT, approved_by TEXT, managed_by TEXT,
notes TEXT, closed_how TEXT, closed_date TEXT, closed_name TEXT,
created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

### Auth tables (Better Auth managed)
```
user: id, name, email, emailVerified, image, createdAt, updatedAt, role
session: id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId FK
account: id, accountId, providerId, userId FK, accessToken, refreshToken,
         idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password,
         createdAt, updatedAt
verification: id, identifier, value, expiresAt, createdAt, updatedAt
```

### Extended tables

**`salary_brackets`**
```
id TEXT PK, div TEXT, sl TEXT, prog TEXT, role TEXT,
nsw/qld/sa/vic/wa JSONB (salary ranges by state),
bands JSONB (array), updated_at TIMESTAMPTZ
```

**`wfp_staff_meta`** — Per-staff WFP data
```
cb_id TEXT PK (FK → carbonites.id), billing_target NUMERIC,
perf_rating TEXT, promo_flag BOOLEAN, promo_eta TEXT,
staff_role TEXT, billing_actual NUMERIC, updated_at TIMESTAMPTZ
```

**`wfp_entity_settings`** — Entity billing config
```
ent_id TEXT PK (FK → entities.id), billing_multiplier NUMERIC (default 3.5),
fy TEXT (e.g. 'FY25-26'), updated_at TIMESTAMPTZ
```

**`wfp_revenue`** — Revenue targets/actuals
```
PK (ent_id, fy), target NUMERIC, actual NUMERIC, updated_at TIMESTAMPTZ
```

**`app_settings`** — Key-value config store
```
key TEXT PK, value JSONB, updated_at TIMESTAMPTZ
```

## tRPC Routers (current in `packages/api/src/routers/`)

| Router | Procedure | Type | Auth | Description |
|--------|-----------|------|------|-------------|
| root | `healthCheck` | query | public | Returns "OK" |
| root | `privateData` | query | protected | Returns session user info |
| `todo` | `getAll` | query | public | List all todos |
| `todo` | `create` | mutation | public | Create todo with text |
| `todo` | `toggle` | mutation | public | Toggle completed status |
| `todo` | `delete` | mutation | public | Delete by id |

Add new routers in `packages/api/src/routers/` and register them in `packages/api/src/routers/index.ts`.
Use `protectedProcedure` for any write operations on real domain data.

## Migration Priority (convert one page at a time)
1. **`packages/db`** — Create Drizzle schema (auth + all domain tables) — MUST DO FIRST
2. Auth shell + layout (sidebar nav, RBAC menu filtering)
3. Staff directory (`carbonites`) — core entity, everything references it
4. Entity/office management
5. Pod budget view with capacity indicators
6. Hiring pipeline
7. Salary brackets
8. WFP + FY planning (most complex, do last)

## Pages to Build
| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/dashboard` | Stats cards, KPI overview (partially built) |
| **Capacity** | `/capacity` | Pod capacity/budget tracking with status indicators |
| **Carbonites** | `/carbonites` | Staff directory with filterable table + detail panel |
| **Hiring** | `/hiring` | Hiring pipeline CRUD |
| **Workforce Planning** | `/wfp` | Billing targets, performance ratings, promotions |
| **FY Planning** | `/fy-planning` | Financial year revenue targets and actuals |
| **Admin** | `/admin` | User management (admin role only) |

## Adding shadcn/ui Components
```bash
# From apps/web directory
bunx --bun shadcn@latest add <component-name>
# e.g.: bunx --bun shadcn@latest add table dialog select badge tabs
```

## Reference
The original app lives in `legacy/` — do not modify it, only read from it:
- `legacy/public/index.html` — The entire old UI (~7200 lines of vanilla HTML/CSS/JS)
- `legacy/server.js` — Original Node.js HTTP server
- `legacy/database.js` — Full PostgreSQL schema (all `CREATE TABLE` statements)
- `legacy/auth.js` — Better Auth config with RBAC
- `legacy/routes/` — API route handlers (budgets, carbonites, entities, hiring)
- `legacy/seed.js` — Seed data for staff and entities
- `legacy/seed-salary.js` — Seed data for salary brackets

## Conventions
- TypeScript strict mode, no `any` types
- Biome for lint/format (not ESLint/Prettier) — run `bun run check`
- Bun for package management and runtime
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`
- Fetch docs before implementing with external libs (use context7 MCP)
- Check latest package versions before installing
- Use shadcn/ui components — don't build custom UI primitives
- Use TanStack Query for all data fetching (via tRPC hooks)
- Use Drizzle for all database operations
- Use tRPC for type-safe API layer
- `protectedProcedure` for any mutation or sensitive read
- Routes in `apps/web/src/routes/` use TanStack Router file-based routing
- Add route auth guards in `beforeLoad` (see `dashboard.tsx` for example)
- New tRPC routers go in `packages/api/src/routers/` — register in `routers/index.ts`
