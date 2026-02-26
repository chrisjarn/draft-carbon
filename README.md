# Carbon Workforce Planner

Internal workforce planning tool for Carbon Group. Manages staff (Carbonites), entities/offices, pod budgets, hiring pipeline, salary brackets, and workforce/FY planning across Australian states.

## What happened here

The original app was a monolithic vanilla JS/Node.js app (single 7200-line HTML file, raw `pg` queries, no TypeScript). It's been moved to `legacy/` for reference.

This branch (`refactor/modern-stack`) has a fresh scaffold using [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) ready for migration. The production app on Railway is **untouched** - it runs from `main`.

## New Stack

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

### 1. Clone and checkout

```bash
git clone https://github.com/jonteoneil-cloud/carbon-wfp-deploy.git
cd carbon-wfp-deploy
git checkout refactor/modern-stack
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

## Using Claude Code

This repo includes a `CLAUDE.md` with full context: domain model, RBAC roles, migration priorities, and conventions. Claude will pick it up automatically.

### Recommended skills to install

```bash
# shadcn/ui component patterns
npx skills add google-labs-code/stitch-skills --skill shadcn-ui --global

# Better Auth integration guides (6 skills)
npx skills add better-auth/skills --global

# React best practices + composition patterns (Vercel)
npx skills add vercel-labs/agent-skills --global

# UI polish and accessibility fixes
npx skills add ibelick/ui-skills --global

# Postgres optimization patterns
npx skills add supabase/agent-skills --global
```

### How to work on the migration

Each page should be migrated independently. The priority order is in `CLAUDE.md`. The general approach for each page:

1. Read the relevant section in `legacy/public/index.html` to understand the UI and business logic
2. Define the Drizzle schema in `packages/db/src/schema/` (reference `legacy/database.js` for table structures)
3. Create the tRPC router in `packages/api/src/routers/`
4. Build the React page with shadcn/ui components in `apps/web/src/routes/`
5. Wire up data fetching with TanStack Query via the tRPC client

The `legacy/seed.js` and `legacy/seed-salary.js` files contain real seed data that should be converted to work with Drizzle.

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

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production - deployed on Railway (DO NOT push breaking changes) |
| `refactor/modern-stack` | Migration work - new stack scaffold + legacy reference |
