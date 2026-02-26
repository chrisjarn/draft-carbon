# Carbon Workforce Planner - Migration

## What This Is
Internal workforce planning tool for Carbon Group (Australian accounting firm).
Migrating from a monolithic vanilla JS/Node.js app to a modern stack.

## Stack
- **Frontend:** React 19 + Vite + TanStack Router + TanStack Query
- **UI:** shadcn/ui + Tailwind CSS
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
  db/               # Drizzle schema + migrations
  env/              # Env var validation (Zod)
  config/           # Shared TypeScript config
legacy/             # Original vanilla JS app (reference only)
```

## Commands
```bash
bun install          # Install all deps
bun run dev          # Start frontend + backend
bun run build        # Build all packages
bun run db:push      # Apply Drizzle schema to DB
bun run db:studio    # Open Drizzle Studio (DB UI)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
bun run check        # Biome lint + format
```

## RBAC Roles (from existing app - must preserve)
| Role | Rank | Access |
|------|------|--------|
| admin | 100 | Full access + user management |
| practice_manager | 80 | Write access |
| sl_lead | 50 | Write access |
| state_manager | 50 | Write access |
| readonly | 10 | Read-only (default for new users) |

## Domain Model (existing tables to migrate into Drizzle schema)
- **carbonites** - Staff members across 5 AU states (NSW, VIC, QLD, WA, SA)
- **entities** - Business units / offices
- **pod_budgets** - Budget per pod per office
- **hiring_needs** - Hiring pipeline
- **salary_brackets** - Salary ranges by role/state/performance
- **wfp_staff_meta** - Per-staff billing targets, perf ratings
- **wfp_entity_settings** - Entity-level billing multipliers
- **wfp_revenue** - Revenue targets/actuals by entity + FY
- **app_settings** - Key-value app config

## Migration Priority (convert one page at a time)
1. Auth shell + layout (sidebar nav, RBAC menu filtering)
2. Staff directory (carbonites) - core entity, everything references it
3. Entity/office management
4. Pod budget view with capacity indicators
5. Hiring pipeline
6. Salary brackets
7. WFP + FY planning (most complex, do last)

## Pages to Build
- **Dashboard** - stats cards, KPI overview
- **Capacity** - pod capacity/budget tracking with status indicators
- **Carbonites** - staff directory with filterable table + detail panel
- **Hiring** - hiring pipeline CRUD
- **Workforce Planning** - billing targets, performance ratings, promotions
- **FY Planning** - financial year revenue targets and actuals
- **Admin** - user management (admin role only)

## Reference
The original app lives in `legacy/` for reference:
- `legacy/public/index.html` - The entire old UI (~7200 lines of vanilla HTML/CSS/JS)
- `legacy/server.js` - Original Node.js HTTP server
- `legacy/database.js` - PostgreSQL schema (CREATE TABLE statements)
- `legacy/auth.js` - Better Auth config with RBAC
- `legacy/routes/` - API route handlers
- `legacy/seed.js` - Seed data for staff and entities

## Conventions
- TypeScript strict mode, no `any` types
- Biome for lint/format (not ESLint/Prettier)
- Bun for package management and runtime
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`
- Fetch docs before implementing with external libs (use context7 MCP)
- Check latest package versions before installing
- Server components by default, `'use client'` only when needed
- Use shadcn/ui components - don't build custom UI primitives
- Use TanStack Query for all data fetching
- Use Drizzle for all database operations
- Use tRPC for type-safe API layer
