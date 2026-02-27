import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// ── Diagnose missing DATABASE_URL immediately ─────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  console.error('   In Railway: go to your app service → Variables tab');
  console.error('   → Add Variable Reference → select Postgres → DATABASE_URL');
  console.error('');
  console.error('   All current env vars:', Object.keys(process.env).filter(k =>
    ['DATABASE', 'POSTGRES', 'PG', 'RAILWAY', 'NODE', 'PORT', 'BETTER'].some(p => k.startsWith(p))
  ));
  process.exit(1);
}

console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL.replace(/:\/\/.*@/, '://***@'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

export const db = {
  query:    (text, params) => pool.query(text, params),
  queryOne: async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows[0] ?? null;
  },
};

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
  `);
  console.log('✅ Database schema ready');
}

export default pool;

// ── Additional tables added for salary brackets + WFP persistence ─────────
// Appended to initDb() via separate call in server.js boot
export async function initExtendedDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS salary_brackets (
      id          TEXT PRIMARY KEY,
      div         TEXT NOT NULL,
      sl          TEXT NOT NULL,
      prog        TEXT,
      role        TEXT NOT NULL,
      nsw         JSONB NOT NULL DEFAULT '{}',
      qld         JSONB NOT NULL DEFAULT '{}',
      sa          JSONB NOT NULL DEFAULT '{}',
      vic         JSONB NOT NULL DEFAULT '{}',
      wa          JSONB NOT NULL DEFAULT '{}',
      bands       JSONB NOT NULL DEFAULT '[]',
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wfp_staff_meta (
      cb_id          TEXT PRIMARY KEY,
      billing_target NUMERIC,
      perf_rating    TEXT,
      promo_flag     BOOLEAN DEFAULT FALSE,
      promo_eta      TEXT,
      staff_role     TEXT,
      billing_actual NUMERIC,
      updated_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wfp_entity_settings (
      ent_id             TEXT PRIMARY KEY,
      billing_multiplier NUMERIC DEFAULT 3.5,
      fy                 TEXT DEFAULT 'FY25-26',
      updated_at         TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wfp_revenue (
      ent_id     TEXT NOT NULL,
      fy         TEXT NOT NULL,
      target     NUMERIC DEFAULT 0,
      actual     NUMERIC DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (ent_id, fy)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Extended schema ready');
}
