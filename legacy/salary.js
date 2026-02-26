import { db } from '../database.js';

export async function salaryRoutes(req, res, url) {
  try {
    // GET /api/salary-brackets
    if (req.method === 'GET') {
      const { rows } = await db.query('SELECT * FROM salary_brackets ORDER BY sl, prog::int NULLS LAST');
      // Parse JSONB fields back to objects
      return json(res, rows.map(r => ({
        ...r,
        nsw: r.nsw, qld: r.qld, sa: r.sa, vic: r.vic, wa: r.wa, bands: r.bands
      })));
    }

    // PUT /api/salary-brackets/:id  (update a single bracket row)
    const idMatch = url.pathname.match(/^\/api\/salary-brackets\/(.+)$/);
    const id = idMatch?.[1] ?? null;

    if (req.method === 'PUT' && id) {
      const d = await readBody(req);
      const row = await db.queryOne(`
        UPDATE salary_brackets
        SET nsw=$1, qld=$2, sa=$3, vic=$4, wa=$5, bands=$6, updated_at=NOW()
        WHERE id=$7 RETURNING *`,
        [JSON.stringify(d.nsw), JSON.stringify(d.qld), JSON.stringify(d.sa),
         JSON.stringify(d.vic), JSON.stringify(d.wa), JSON.stringify(d.bands), id]
      );
      if (!row) return notFound(res);
      return json(res, row);
    }

    return notFound(res);
  } catch (err) {
    console.error('salary route error:', err);
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
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
