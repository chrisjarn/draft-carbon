import { db } from "../database.js";

export async function entitiesRoutes(req, res, url) {
	const idMatch = url.pathname.match(/^\/api\/entities\/(.+)$/);
	const id = idMatch ? idMatch[1] : null;

	// GET /api/entities
	if (req.method === "GET" && !id) {
		const { rows } = await db.query(
			"SELECT * FROM entities ORDER BY state, biz",
		);
		return json(res, rows.map(parse));
	}

	// PATCH /api/entities/:id
	if (req.method === "PATCH" && id) {
		const d = await readBody(req);
		const allowed = [
			"biz",
			"tan",
			"office_id",
			"state",
			"phone",
			"address",
			"email",
		];
		const fields = [];
		const vals = [];
		let i = 1;
		for (const k of allowed) {
			if (k in d) {
				fields.push(`${k} = $${i++}`);
				vals.push(d[k]);
			}
		}
		// JSONB columns — pg handles native objects directly
		if ("sl" in d) {
			fields.push(`sl = $${i++}`);
			vals.push(JSON.stringify(d.sl));
		}
		if ("partners" in d) {
			fields.push(`partners = $${i++}`);
			vals.push(JSON.stringify(d.partners));
		}
		if (!fields.length) return json(res, { error: "No fields to update" }, 400);
		vals.push(id);
		await db.query(
			`UPDATE entities SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${i}`,
			vals,
		);
		const { rows } = await db.query("SELECT * FROM entities WHERE id = $1", [
			id,
		]);
		if (!rows[0]) return notFound(res);
		return json(res, parse(rows[0]));
	}

	return notFound(res);
}

function parse(row) {
	return {
		...row,
		sl: Array.isArray(row.sl) ? row.sl : tryParse(row.sl, []),
		partners: Array.isArray(row.partners)
			? row.partners
			: tryParse(row.partners, []),
	};
}
function tryParse(v, fallback) {
	try {
		return v ? JSON.parse(v) : fallback;
	} catch {
		return fallback;
	}
}
function json(res, data, status = 200) {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
}
function notFound(res) {
	res.writeHead(404, { "Content-Type": "application/json" });
	res.end(JSON.stringify({ error: "Not found" }));
}
function readBody(req) {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk) => (body += chunk));
		req.on("end", () => {
			try {
				resolve(JSON.parse(body));
			} catch (e) {
				reject(e);
			}
		});
		req.on("error", reject);
	});
}
