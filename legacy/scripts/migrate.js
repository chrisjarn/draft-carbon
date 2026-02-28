/**
 * scripts/migrate.js
 * Creates (or resets) all database tables for Carbon Workforce Planner.
 *
 * Usage:
 *   node scripts/migrate.js          — create tables (safe, won't overwrite)
 *   node scripts/migrate.js --reset  — DROP and recreate all tables (destructive!)
 */

import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const reset = process.argv.includes("--reset");

const client = new Client({
	connectionString: process.env.DATABASE_URL,
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: false }
			: false,
});

const DROP_ALL = `
  DROP TABLE IF EXISTS pod_budgets    CASCADE;
  DROP TABLE IF EXISTS hiring_needs   CASCADE;
  DROP TABLE IF EXISTS carbonites     CASCADE;
  DROP TABLE IF EXISTS entities       CASCADE;
  DROP TABLE IF EXISTS sessions       CASCADE;
  DROP TABLE IF EXISTS accounts       CASCADE;
  DROP TABLE IF EXISTS verifications  CASCADE;
  DROP TABLE IF EXISTS users          CASCADE;
`;

const CREATE_ALL = `
  -- ── Better Auth tables ───────────────────────────────────────────────────

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    image         TEXT,
    role          TEXT NOT NULL DEFAULT 'read',
    -- role options: 'admin' | 'practice_manager' | 'sl_lead' | 'state_manager' | 'read'
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id             TEXT PRIMARY KEY,
    expires_at     TIMESTAMPTZ NOT NULL,
    token          TEXT NOT NULL UNIQUE,
    ip_address     TEXT,
    user_agent     TEXT,
    user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id                      TEXT PRIMARY KEY,
    account_id              TEXT NOT NULL,
    provider_id             TEXT NOT NULL,
    user_id                 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token            TEXT,
    refresh_token           TEXT,
    id_token                TEXT,
    access_token_expires_at TIMESTAMPTZ,
    refresh_token_expires_at TIMESTAMPTZ,
    scope                   TEXT,
    password                TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS verifications (
    id         TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value      TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- ── App tables ────────────────────────────────────────────────────────────

  CREATE TABLE IF NOT EXISTS carbonites (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT,
    sl          TEXT,
    sg          TEXT,
    state       TEXT,
    office      TEXT,
    pod         TEXT,
    salary      INTEGER NOT NULL DEFAULT 0,
    type        TEXT NOT NULL DEFAULT 'FT',
    seniority   INTEGER NOT NULL DEFAULT 5,
    location    TEXT,
    hours       INTEGER,
    is_partner  BOOLEAN NOT NULL DEFAULT false,
    entity      TEXT,
    reports_to  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS pod_budgets (
    state      TEXT NOT NULL,
    office     TEXT NOT NULL,
    pod_name   TEXT NOT NULL,
    budget     INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (state, office, pod_name)
  );

  CREATE TABLE IF NOT EXISTS entities (
    id         TEXT PRIMARY KEY,
    biz        TEXT NOT NULL,
    tan        TEXT,
    office_id  TEXT,
    state      TEXT,
    phone      TEXT,
    address    TEXT,
    email      TEXT,
    sl         JSONB NOT NULL DEFAULT '[]',
    partners   JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS hiring_needs (
    id            TEXT PRIMARY KEY,
    role          TEXT NOT NULL,
    sl            TEXT,
    sg            TEXT,
    state         TEXT,
    office        TEXT,
    location      TEXT,
    positions     INTEGER NOT NULL DEFAULT 1,
    type          TEXT,
    priority      TEXT,
    status        TEXT NOT NULL DEFAULT 'open',
    salary_min    INTEGER,
    salary_max    INTEGER,
    target_start  TEXT,
    approved_by   TEXT,
    managed_by    TEXT,
    notes         TEXT,
    closed_how    TEXT,
    closed_date   TEXT,
    closed_name   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- ── Indexes ────────────────────────────────────────────────────────────────

  CREATE INDEX IF NOT EXISTS idx_carbonites_state    ON carbonites(state);
  CREATE INDEX IF NOT EXISTS idx_carbonites_sl       ON carbonites(sl);
  CREATE INDEX IF NOT EXISTS idx_carbonites_entity   ON carbonites(entity);
  CREATE INDEX IF NOT EXISTS idx_hiring_status       ON hiring_needs(status);
  CREATE INDEX IF NOT EXISTS idx_hiring_state        ON hiring_needs(state);
  CREATE INDEX IF NOT EXISTS idx_sessions_token      ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user       ON sessions(user_id);
`;

async function migrate() {
	await client.connect();
	console.log("✅ Connected to PostgreSQL");

	if (reset) {
		console.log("⚠️  --reset flag detected. Dropping all tables...");
		await client.query(DROP_ALL);
		console.log("✅ All tables dropped");
	}

	await client.query(CREATE_ALL);
	console.log("✅ All tables created / verified");

	await client.end();
	console.log("✅ Migration complete");
}

migrate().catch((err) => {
	console.error("❌ Migration failed:", err.message);
	process.exit(1);
});
