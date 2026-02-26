import { db } from '../database.js';

export async function carbonitesRoutes(req, res, url) {
  const idMatch = url.pathname.match(/^\/api\/carbonites\/(.+)$/);
  const id = idMatch ? idMatch[1] : null;

  // GET /api/carbonites
  if (req.method === 'GET' && !id) {
    const { rows } = await db.query(
      'SELECT * FROM carbonites ORDER BY state, office, pod, seniority DESC'
    );
    return json(res, rows.map(parse));
  }

  // GET /api/carbonites/:id
  if (req.method === 'GET' && id) {
    const { rows } = await db.query('SELECT * FROM carbonites WHERE id = $1', [id]);
    if (!rows[0]) return notFound(res);
    return json(res, parse(rows[0]));
  }

  // POST /api/carbonites
  if (req.method === 'POST') {
    const d = await readBody(req);
    const newId = d.id || `c${Date.now()}`;
    await db.query(`
      INSERT INTO carbonites
        (id, name, role, sl, sg, state, office, pod, salary, type, seniority,
         location, hours, is_partner, reports_to, entity)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    `, [
      newId, d.name, d.role, d.sl, d.sg,
      d.state, d.office, d.pod, d.salary || 0, d.type || 'FT',
      d.seniority || 5, d.location, d.hours,
      d.isPartner ?? false, d.reportsTo || null, d.entity || null,
    ]);
    const { rows } = await db.query('SELECT * FROM carbonites WHERE id = $1', [newId]);
    return json(res, parse(rows[0]), 201);
  }

  // PATCH /api/carbonites/:id
  if (req.method === 'PATCH' && id) {
    const d = await readBody(req);
    const allowed = ['name','role','sl','sg','state','office','pod','salary','type',
                     'seniority','location','hours','reports_to','entity'];
    const fields = [];
    const vals   = [];
    let i = 1;
    for (const k of allowed) {
      if (k in d) { fields.push(`${k} = $${i++}`); vals.push(d[k]); }
    }
    if ('isPartner' in d) { fields.push(`is_partner = $${i++}`); vals.push(d.isPartner); }
    if ('reportsTo' in d) { fields.push(`reports_to = $${i++}`); vals.push(d.reportsTo); }
    if (!fields.length) return json(res, { error: 'No fields to update' }, 400);
    vals.push(id);
    await db.query(`UPDATE carbonites SET ${fields.join(', ')} WHERE id = $${i}`, vals);
    const { rows } = await db.query('SELECT * FROM carbonites WHERE id = $1', [id]);
    if (!rows[0]) return notFound(res);
    return json(res, parse(rows[0]));
  }

  // DELETE /api/carbonites/:id
  if (req.method === 'DELETE' && id) {
    await db.query('DELETE FROM carbonites WHERE id = $1', [id]);
    return json(res, { deleted: id });
  }

  return notFound(res);
}

const parse = (r) => ({ ...r, isPartner: !!r.is_partner, reportsTo: r.reports_to });

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
