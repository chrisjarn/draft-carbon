# Carbon Workforce Planner

Internal workforce planning tool for Carbon Group. Manages staff (Carbonites), entities/offices, pod budgets, hiring pipeline, salary brackets, and workforce/FY planning across Australian states.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TanStack Router + TanStack Query |
| UI | shadcn/ui + Tailwind CSS |
| Backend | Hono + tRPC |
| Auth | Better Auth (email/password + RBAC) |
| Database | PostgreSQL + Drizzle ORM |
| Runtime | Bun |
| Monorepo | Turborepo |
| Lint/Format | Biome |

## Getting Started

### 1. Clone

```bash
git clone <your-repo-url>
cd carbon-wfp-deploy
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

Copy the example env to both apps:

```bash
# Backend
cp .env.example apps/server/.env
# Edit apps/server/.env - fill in DATABASE_URL and generate a BETTER_AUTH_SECRET

# Frontend
cp .env.example apps/web/.env
# The frontend only needs VITE_SERVER_URL=http://localhost:3000
```

| Variable | Where | Description |
|----------|-------|-------------|
| `BETTER_AUTH_SECRET` | `apps/server/.env` | Random secret for session signing |
| `BETTER_AUTH_URL` | `apps/server/.env` | Backend URL (default: `http://localhost:3000`) |
| `CORS_ORIGIN` | `apps/server/.env` | Frontend URL (default: `http://localhost:3001`) |
| `DATABASE_URL` | `apps/server/.env` | PostgreSQL connection string |
| `VITE_SERVER_URL` | `apps/web/.env` | Backend API URL (default: `http://localhost:3000`) |

### 4. Set up the database

You need a running PostgreSQL instance. Then push the Drizzle schema:

```bash
bun run db:push
```

### 5. Run the dev server

```bash
bun run dev
```

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

## Commands

```bash
bun run dev          # Start frontend + backend
bun run build        # Build all packages
bun run check        # Biome lint + format
bun run db:push      # Apply Drizzle schema to DB
bun run db:studio    # Open Drizzle Studio (DB browser)
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
```

## Project Structure

```
apps/
  web/              # React SPA (Vite + TanStack Router + shadcn/ui)
  server/           # Hono API server + tRPC + Better Auth
packages/
  api/              # tRPC routers (shared API definition)
  auth/             # Better Auth configuration
  db/               # Drizzle schema, migrations, DB client
  env/              # Env var validation with Zod
  config/           # Shared TypeScript config
legacy/             # Original vanilla JS app (reference only)
```

## Legacy Reference

The original app is in `legacy/` for reference:

| File | What it contains |
|------|-----------------|
| `legacy/public/index.html` | Entire old UI (~7200 lines - HTML, CSS, JS all-in-one) |
| `legacy/server.js` | Node.js HTTP server with auth middleware |
| `legacy/database.js` | PostgreSQL schema (all CREATE TABLE statements) |
| `legacy/auth.js` | Better Auth config with 5-role RBAC |
| `legacy/routes/` | API route handlers (carbonites, budgets, entities, hiring) |
| `legacy/seed.js` | Seed data for ~40 staff across 5 states |
| `legacy/seed-salary.js` | Seed data for 50+ salary bracket rows |
| `legacy/wfp.js` | WFP routes (staff meta, entity settings, revenue, app settings) |

