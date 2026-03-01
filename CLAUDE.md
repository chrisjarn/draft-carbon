# Carbon Workforce Planner

## What This Is
Internal workforce planning tool for Carbon Group (Australian accounting firm).
Migrated from a monolithic vanilla JS/Node.js app to a modern stack.
The legacy app lives in `legacy/` — read-only reference, do not modify.

## Stack
- **Frontend:** React 19 + Vite + TanStack Router + TanStack Query
- **UI:** shadcn/ui (base-maia style, zinc+emerald theme) + Tailwind CSS v4
- **Icons:** Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- **Backend:** Hono + tRPC v11
- **Auth:** Better Auth (email/password, RBAC with 5 roles, Drizzle adapter)
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **Runtime:** Bun | **Monorepo:** Turborepo | **Linting:** Biome
- **Deployment:** Railway (nixpacks, Node 22 + Bun)

## Architecture
```
apps/
  web/              # React SPA (Vite + TanStack Router)
  server/           # Hono API + tRPC + Better Auth
packages/
  api/              # tRPC routers (12 routers, shared API layer)
  auth/             # Better Auth config (Drizzle adapter)
  db/               # Drizzle schema (16 tables), seed data, migrations
  env/              # Env var validation (@t3-oss/env-core + Zod)
  config/           # Shared TypeScript config
legacy/             # Original vanilla JS app (reference only — DO NOT MODIFY)
```

## Commands
```bash
bun run dev          # Start frontend + backend concurrently
bun run build        # Build all packages
bun run check-types  # TypeScript type check across all packages
bun run check        # Biome lint + format
bun run db:push      # Apply Drizzle schema to DB
bun run db:studio    # Open Drizzle Studio (localhost:4983)
bun run seed         # Seed database
```

## Environment Variables
- **Backend** (`apps/server/.env`): `DATABASE_URL`, `BETTER_AUTH_SECRET` (min 32 chars), `BETTER_AUTH_URL`, `CORS_ORIGIN`, `NODE_ENV`
- **Frontend** (`apps/web/.env`): `VITE_SERVER_URL`

## RBAC Roles
`admin` (100) > `practice_manager` (80) > `service_line_lead` / `state_manager` (50) > `read_only` (10, default).
Server: `assertWriter()`, `assertAdmin()`. Client: `canWrite()`, `canAdminWrite()`.

## Web Routes
All under `/_app/` use `.lazy.tsx` code-splitting: `/dashboard`, `/carbonites`, `/capacity-plan`, `/hiring`, `/fy-planning`, `/admin`, `/todos`. Auth guard in `_app.tsx` `beforeLoad`.

## Shared Components (`apps/web/src/components/shared/`)
- **`PageHeader`** — All routes use `<PageHeader>` from `page-header.tsx`. Reads title/description from `@/lib/route-config.ts`. Accepts optional `description` override (ReactNode) and `children` for right-side actions. Renders with bottom border; route content goes in a sibling `div` below it.
- **`DataTable`** — Generic TanStack Table wrapper with sorting/filtering.
- **`DetailDisplay`** — `DetailSection` + `DetailRow` for sheet/panel detail views.
- **`SelectFilter`** — Reusable dropdown filter for list pages.

## Design System
- **Theme**: zinc + emerald, shadcn base-maia style, dark sidebar (`inverted` menu)
- **Icons**: Hugeicons only — `<HugeiconsIcon icon={IconNameIcon} />`. Never use lucide-react.
- **Font**: Outfit (variable weight), imported in `src/index.css`
- **Adding components**: `bunx --bun shadcn@latest add <name>` from `apps/web/`, then replace any lucide imports with Hugeicons

## Conventions
- TypeScript strict mode, no `any`
- Biome for lint/format (tabs, double quotes) — not ESLint/Prettier
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`
- Hugeicons for all icons — never lucide-react
- TanStack Query for data fetching (via tRPC hooks), Drizzle for DB
- `protectedProcedure` for mutations/sensitive reads
- File-based routing with `.lazy.tsx` code-splitting; auth guards in `beforeLoad`
- New routers in `packages/api/src/routers/` — register in `routers/index.ts`
- `legacy/` excluded from Biome and TypeScript

## Known Gotchas
- `drizzle-kit push` cannot handle `text → typed column` casts (no `USING` clause support). For any `text → date`, `text → enum`, or similar type conversions, generate the migration file and run the `ALTER` manually via the Neon SQL editor or `psql` with the Neon connection string, then verify with `db:push` that no diff remains.

## TODO — Post-P1 Cleanup
- **Pre-existing frontend type errors**: Files `staff-tab.tsx`, `wfp.lazy.tsx`, `capacity.lazy.tsx`, `chart.tsx` (shadcn chart component, Recharts 3.x incompatibility) have type errors unrelated to P0/P1 work. These should be fixed in a dedicated cleanup pass after P1 is complete to avoid scope creep during feature work.
