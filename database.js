// database.js — PostgreSQL via pg Pool
// Replaces node:sqlite / DatabaseSync

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Railway injects DATABASE_URL automatically when you add a Postgres plugin.
// For local dev, add DATABASE_URL=postgres://... to your .env file.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }   // Railway uses self-signed certs
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

export const db = { query: (text, params) => pool.query(text, params) };

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS carbonites (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      role        TEXT,
      sl          TEXT,
      sg          TEXT,
      state       TEXT,
      office      TEXT,
      pod         TEXT,
      salary      INTEGER DEFAULT 0,
      type        TEXT DEFAULT 'FT',
      seniority   INTEGER DEFAULT 5,
      location    TEXT,
      hours       INTEGER,
      is_partner  BOOLEAN DEFAULT FALSE,
      entity      TEXT,
      reports_to  TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pod_budgets (
      state      TEXT NOT NULL,
      office     TEXT NOT NULL,
      pod_name   TEXT NOT NULL,
      budget     INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
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
      sl         JSONB DEFAULT '[]',
      partners   JSONB DEFAULT '[]',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hiring_needs (
      id           TEXT PRIMARY KEY,
      role         TEXT NOT NULL,
      sl           TEXT,
      sg           TEXT,
      state        TEXT,
      office       TEXT,
      location     TEXT,
      positions    INTEGER DEFAULT 1,
      type         TEXT,
      priority     TEXT,
      status       TEXT DEFAULT 'open',
      salary_min   INTEGER,
      salary_max   INTEGER,
      target_start TEXT,
      approved_by  TEXT,
      managed_by   TEXT,
      notes        TEXT,
      closed_how   TEXT,
      closed_date  TEXT,
      closed_name  TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "user" (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      email            TEXT NOT NULL UNIQUE,
      "emailVerified"  BOOLEAN NOT NULL DEFAULT FALSE,
      image            TEXT,
      "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      role             TEXT NOT NULL DEFAULT 'readonly'
    );

    CREATE TABLE IF NOT EXISTS "session" (
      id           TEXT PRIMARY KEY,
      "expiresAt"  TIMESTAMPTZ NOT NULL,
      token        TEXT NOT NULL UNIQUE,
      "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "ipAddress"  TEXT,
      "userAgent"  TEXT,
      "userId"     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "account" (
      id                       TEXT PRIMARY KEY,
      "accountId"              TEXT NOT NULL,
      "providerId"             TEXT NOT NULL,
      "userId"                 TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accessToken"            TEXT,
      "refreshToken"           TEXT,
      "idToken"                TEXT,
      "accessTokenExpiresAt"   TIMESTAMPTZ,
      "refreshTokenExpiresAt"  TIMESTAMPTZ,
      scope                    TEXT,
      password                 TEXT,
      "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "verification" (
      id           TEXT PRIMARY KEY,
      identifier   TEXT NOT NULL,
      value        TEXT NOT NULL,
      "expiresAt"  TIMESTAMPTZ NOT NULL,
      "createdAt"  TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt"  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'carbonites_updated_at') THEN
        CREATE TRIGGER carbonites_updated_at
          BEFORE UPDATE ON carbonites
          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'hiring_updated_at') THEN
        CREATE TRIGGER hiring_updated_at
          BEFORE UPDATE ON hiring_needs
          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      END IF;
    END $$;
  `);
  console.log('PostgreSQL schema ready');
}

export default pool;
