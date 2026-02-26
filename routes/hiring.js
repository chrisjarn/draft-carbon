import { db } from '../database.js';

export async function hiringRoutes(req, res, url) {
  const idMatch = url.pathname.match(/^\/api\/hiring\/(.+)$/);
  const id = idMatch ? idMatch[1] : null;

  // GET /api/hiring
  if (req.method === 'GET' && !id) {
    const { rows } = await db.query(
      'SELECT * FROM hiring_needs ORDER BY priority, target_start'
    );
    return json(res, rows);
  }

  // POST /api/hiring
  if (req.method === 'POST') {
    const d = await readBody(req);
    const newId = d.id || `h${Date.now()}`;
    await db.query(`
      INSERT INTO hiring_needs
        (id, role, sl, sg, state, office, location, positions, type, priority,
         status, salary_min, salary_max, target_start, approved_by, managed_by, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    `, [
      newId, d.role, d.sl, d.sg, d.state, d.office, d.location,
      d.positions || 1, d.type, d.priority, d.status || 'open',
      d.salary_min, d.salary_max, d.target_start, d.approved_by,
      d.managed_by || null, d.notes,
    ]);
    const { rows } = await db.query('SELECT * FROM hiring_needs WHERE id = $1', [newId]);
    return json(res, rows[0], 201);
  }

  // PATCH /api/hiring/:id
  if (req.method === 'PATCH' && id) {
    const d = await readBody(req);
    const allowed = ['role','sl','sg','state','office','location','positions','type',
                     'priority','status','salary_min','salary_max','target_start',
                     'approved_by','managed_by','notes','closed_how','closed_date','closed_name'];
    const fields = [];
    const vals   = [];
    let i = 1;
    for (const k of allowed) {
      if (k in d) { fields.push(`${k} = $${i++}`); vals.push(d[k]); }
    }
    if (!fields.length) return json(res, { error: 'No fields to update' }, 400);
    vals.push(id);
    await db.query(`UPDATE hiring_needs SET ${fields.join(', ')} WHERE id = $${i}`, vals);
    const { rows } = await db.query('SELECT * FROM hiring_needs WHERE id = $1', [id]);
    return json(res, rows[0]);
  }

  // DELETE /api/hiring/:id
  if (req.method === 'DELETE' && id) {
    await db.query('DELETE FROM hiring_needs WHERE id = $1', [id]);
    return json(res, { deleted: id });
  }

  return notFound(res);
}

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
