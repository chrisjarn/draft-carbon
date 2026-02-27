import { db } from '../database.js';

export async function wfpRoutes(req, res, url) {
  const p = url.pathname;
  try {

    // ── WFP STAFF META ─────────────────────────────────────────────────────
    // GET  /api/wfp/staff-meta          → all rows as { cbId: {...} }
    // POST /api/wfp/staff-meta          → upsert one row
    if (p === '/api/wfp/staff-meta') {
      if (req.method === 'GET') {
        const { rows } = await db.query('SELECT * FROM wfp_staff_meta');
        const out = {};
        rows.forEach(r => { out[r.cb_id] = {
          billingTarget: r.billing_target, perfRating: r.perf_rating,
          promoFlag: r.promo_flag, promoEta: r.promo_eta,
          staffRole: r.staff_role, billingActual: r.billing_actual
        }; });
        return json(res, out);
      }
      if (req.method === 'POST') {
        const d = await readBody(req);
        const row = await db.queryOne(`
          INSERT INTO wfp_staff_meta (cb_id, billing_target, perf_rating, promo_flag, promo_eta, staff_role, billing_actual)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (cb_id) DO UPDATE SET
            billing_target=EXCLUDED.billing_target, perf_rating=EXCLUDED.perf_rating,
            promo_flag=EXCLUDED.promo_flag, promo_eta=EXCLUDED.promo_eta,
            staff_role=EXCLUDED.staff_role, billing_actual=EXCLUDED.billing_actual,
            updated_at=NOW()
          RETURNING *`,
          [d.cbId, d.billingTarget??null, d.perfRating??null, d.promoFlag??false,
           d.promoEta??null, d.staffRole??null, d.billingActual??null]
        );
        return json(res, row);
      }
    }

    // ── WFP ENTITY SETTINGS ────────────────────────────────────────────────
    // GET  /api/wfp/entity-settings     → all rows as { entId: {...} }
    // POST /api/wfp/entity-settings     → upsert one row
    if (p === '/api/wfp/entity-settings') {
      if (req.method === 'GET') {
        const { rows } = await db.query('SELECT * FROM wfp_entity_settings');
        const out = {};
        rows.forEach(r => { out[r.ent_id] = { billingMultiplier: r.billing_multiplier, fy: r.fy }; });
        return json(res, out);
      }
      if (req.method === 'POST') {
        const d = await readBody(req);
        await db.query(`
          INSERT INTO wfp_entity_settings (ent_id, billing_multiplier, fy)
          VALUES ($1,$2,$3)
          ON CONFLICT (ent_id) DO UPDATE SET
            billing_multiplier=EXCLUDED.billing_multiplier, fy=EXCLUDED.fy, updated_at=NOW()`,
          [d.entId, d.billingMultiplier??3.5, d.fy??'FY25-26']
        );
        return json(res, { ok: true });
      }
    }

    // ── WFP REVENUE ────────────────────────────────────────────────────────
    // GET  /api/wfp/revenue             → all rows as { 'entId|FY': {...} }
    // POST /api/wfp/revenue             → upsert one row
    if (p === '/api/wfp/revenue') {
      if (req.method === 'GET') {
        const { rows } = await db.query('SELECT * FROM wfp_revenue');
        const out = {};
        rows.forEach(r => { out[`${r.ent_id}|${r.fy}`] = { target: r.target, actual: r.actual }; });
        return json(res, out);
      }
      if (req.method === 'POST') {
        const d = await readBody(req);
        await db.query(`
          INSERT INTO wfp_revenue (ent_id, fy, target, actual)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (ent_id, fy) DO UPDATE SET
            target=EXCLUDED.target, actual=EXCLUDED.actual, updated_at=NOW()`,
          [d.entId, d.fy, d.target??0, d.actual??0]
        );
        return json(res, { ok: true });
      }
    }

    // ── APP SETTINGS (headcount targets + salary benchmarks) ───────────────
    // GET  /api/wfp/app-settings
    // POST /api/wfp/app-settings
    if (p === '/api/wfp/app-settings') {
      if (req.method === 'GET') {
        const { rows } = await db.query('SELECT * FROM app_settings');
        const out = {};
        rows.forEach(r => { out[r.key] = r.value; });
        return json(res, out);
      }
      if (req.method === 'POST') {
        const d = await readBody(req);
        // d is { key: value, key: value, ... }
        for (const [key, value] of Object.entries(d)) {
          await db.query(`
            INSERT INTO app_settings (key, value)
            VALUES ($1,$2)
            ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`,
            [key, JSON.stringify(value)]
          );
        }
        return json(res, { ok: true });
      }
    }

    return notFound(res);
  } catch (err) {
    console.error('wfp route error:', err);
    return serverError(res, err);
  }
}

// ── User management ────────────────────────────────────────────────────────
// GET  /api/users           → list all users (admin only)
// PATCH /api/users/:id      → update role (admin only)
// DELETE /api/users/:id     → delete user (admin only)
export async function usersRoutes(req, res, url) {
  try {
    // Admin check
    if (!req.session?.user || req.session.user.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Admin only' }));
    }

    const idMatch = url.pathname.match(/^\/api\/users\/(.+)$/);
    const id = idMatch?.[1] ?? null;

    if (req.method === 'GET' && !id) {
      const { rows } = await db.query(`SELECT id, name, email, role, "createdAt" FROM "user" ORDER BY "createdAt"`);
      return json(res, rows);
    }

    if (req.method === 'PATCH' && id) {
      const { role } = await readBody(req);
      const validRoles = ['admin','practice_manager','sl_lead','state_manager','readonly'];
      if (!validRoles.includes(role)) return json(res, { error: 'Invalid role' }, 400);
      await db.query(`UPDATE "user" SET role=$1, "updatedAt"=NOW() WHERE id=$2`, [role, id]);
      return json(res, { ok: true });
    }

    if (req.method === 'DELETE' && id) {
      await db.query(`DELETE FROM "user" WHERE id=$1`, [id]);
      return json(res, { deleted: id });
    }

    return notFound(res);
  } catch (err) {
    console.error('users route error:', err);
    return serverError(res, err);
  }
}

function json(res, data, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }
function notFound(res) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Not found' })); }
function serverError(res, err) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}
