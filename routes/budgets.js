import { db } from '../database.js';

export async function budgetsRoutes(req, res) {
  // GET /api/pod-budgets
  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT * FROM pod_budgets');
    return json(res, rows);
  }

  // POST /api/pod-budgets  (upsert)
  if (req.method === 'POST') {
    const d = await readBody(req);
    await db.query(`
      INSERT INTO pod_budgets (state, office, pod_name, budget)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (state, office, pod_name)
      DO UPDATE SET budget = EXCLUDED.budget, updated_at = NOW()
    `, [d.state, d.office, d.pod_name, d.budget]);
    return json(res, { state: d.state, office: d.office, pod_name: d.pod_name, budget: d.budget });
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
