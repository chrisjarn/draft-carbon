# Carbon Workforce Planner — Client Handover

This document covers everything needed to take ownership of the codebase, run it locally, and deploy it to production on Railway.

---

## 1. What This Is

The Carbon Workforce Planner is an internal tool for Carbon Group to manage staff (Carbonites), office entities, pod budgets, hiring pipeline, salary brackets, and FY planning across Australian states. It is a React SPA backed by a Hono/tRPC API, using PostgreSQL via Neon and deployed on Railway.

---

## 2. Repository Structure

```
apps/
  web/              # React SPA (Vite + TanStack Router + shadcn/ui)
  server/           # Hono API + tRPC + Better Auth
packages/
  api/              # tRPC routers (12 routers, shared API layer)
  auth/             # Better Auth config (Drizzle adapter)
  db/               # Drizzle schema (16 tables), seed data, migrations
  env/              # Env var validation (Zod)
  config/           # Shared TypeScript config
legacy/             # Original vanilla JS app — reference only, DO NOT deploy
docs/
  internal/         # Internal planning docs from the migration — archive only
```

> `legacy/` is kept for historical reference. It is **not part of the deployed app** and should be ignored entirely.

---

## 3. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [Bun](https://bun.sh) | 1.x | Primary runtime + package manager |
| Node.js | 22 | Required by some tooling; Railway uses Node 22 |
| PostgreSQL | any | Recommend [Neon](https://neon.tech) (serverless, free tier available) |

---

## 4. Local Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd carbon-wfp-deploy

# 2. Install dependencies
bun install

# 3. Set up backend env
cp apps/server/.env.example apps/server/.env
# Edit apps/server/.env — fill in DATABASE_URL and BETTER_AUTH_SECRET

# 4. Set up frontend env
cp apps/web/.env.example apps/web/.env
# VITE_SERVER_URL=http://localhost:3000 is correct for local dev

# 5. Push Drizzle schema to your database
bun run db:push

# 6. (Optional) Seed the database with initial data
bun run seed

# 7. Start the dev server
bun run dev
```

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

---

## 5. Environment Variables

### Backend (`apps/server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `BETTER_AUTH_SECRET` | Random secret for session signing (min 32 chars) | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL of this backend server | `http://localhost:3000` |
| `CORS_ORIGIN` | Allowed frontend URL | `http://localhost:3001` |
| `NODE_ENV` | Environment | `development` or `production` |

### Frontend (`apps/web/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SERVER_URL` | Backend API URL | `http://localhost:3000` |

---

## 6. Database

The app uses [Neon](https://neon.tech) (serverless PostgreSQL) in production.

**First-time setup:**
1. Create a Neon project at https://neon.tech
2. Copy the connection string into `DATABASE_URL`
3. Run `bun run db:push` to create all tables
4. Run `bun run seed` to populate initial data (staff, salary brackets, etc.)

**Schema changes:**
- Use `bun run db:push` for development (applies schema diff directly — idempotent)
- For production type-cast migrations (e.g. `text → date`), generate the migration file and run the `ALTER` manually via the Neon SQL editor — see `CLAUDE.md` for details

**Useful DB commands:**
```bash
bun run db:push       # Apply schema to DB
bun run db:studio     # Open Drizzle Studio at localhost:4983
bun run db:generate   # Generate migration files
bun run db:migrate    # Run migration files
bun run seed          # Seed database
```

---

## 7. Deployment on Railway

The app deploys as **two separate Railway services** from the same repository. Both use nixpacks (auto-detected) with configuration from `railway.toml` files.

### Service 1 — Server (API)

| Setting | Value |
|---------|-------|
| Root Directory | `/` (repo root) |
| Config file | `railway.toml` (root) |
| Build command | `bun install --frozen-lockfile && bunx turbo build` |
| Start command | `bun --cwd packages/db run db:push && bun run apps/server/dist/index.mjs` |

**Environment variables to set in Railway:**
- `DATABASE_URL` — your Neon connection string
- `BETTER_AUTH_SECRET` — random 32+ char secret
- `BETTER_AUTH_URL` — `https://<your-server-service>.railway.app`
- `CORS_ORIGIN` — `https://<your-web-service>.railway.app`
- `NODE_ENV` — `production`

### Service 2 — Web (Frontend)

| Setting | Value |
|---------|-------|
| Root Directory | `/` (repo root) |
| Config file | `apps/web/railway.toml` — Railway must be told to use this file |
| Build command | `bun install --frozen-lockfile && bunx turbo build --filter=web...` |
| Start command | `bunx serve apps/web/dist --listen tcp://0.0.0.0:$PORT` |

**Environment variables to set in Railway:**
- `VITE_SERVER_URL` — `https://<your-server-service>.railway.app`

> **Important:** Railway injects `VITE_SERVER_URL` at build time (Vite embeds it). Set this variable before triggering a build.

### Deployment checklist

- [ ] Neon database created and `DATABASE_URL` confirmed working
- [ ] `BETTER_AUTH_SECRET` generated (`openssl rand -base64 32`)
- [ ] Server service deployed, health check passing at `/`
- [ ] Web service deployed, `VITE_SERVER_URL` pointing to server service URL
- [ ] First user registered (see Section 9)

---

## 8. Key Commands

```bash
bun run dev           # Start frontend + backend (concurrently)
bun run build         # Build all packages
bun run check-types   # TypeScript type check across all packages
bun run check         # Biome lint + format check
bun run db:push       # Apply Drizzle schema to DB (idempotent)
bun run seed          # Seed database with initial data
```

---

## 9. User Management

### Registering the first user

1. Open the app in a browser
2. Register a new account via the signup form
3. The first user is created with the `read_only` role by default

### Assigning the admin role

Roles are managed in the database. To promote the first user to `admin`:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
```

Run this via Drizzle Studio (`bun run db:studio`) or the Neon SQL editor.

### RBAC roles

| Role | Level | Capabilities |
|------|-------|-------------|
| `admin` | 100 | Full access — user management, all writes |
| `practice_manager` | 80 | Write access across all features |
| `service_line_lead` | 50 | Write access within service line |
| `state_manager` | 50 | Write access within state |
| `read_only` | 10 | View only — default for new users |

---

## 10. Support

For questions about the codebase, refer to:
- `CLAUDE.md` — full technical context, conventions, and known gotchas
- `README.md` — stack overview and quick-start
- `USER_GUIDE.md` — end-user documentation

The `legacy/` directory contains the original app for historical reference only.
