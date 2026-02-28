import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import "dotenv/config";

import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { initDb, initExtendedDb } from "./database.js";
import { budgetsRoutes } from "./routes/budgets.js";
import { carbonitesRoutes } from "./routes/carbonites.js";
import { entitiesRoutes } from "./routes/entities.js";
import { hiringRoutes } from "./routes/hiring.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME = {
	".html": "text/html",
	".js": "application/javascript",
	".css": "text/css",
	".json": "application/json",
	".png": "image/png",
	".ico": "image/x-icon",
};

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getSession(req, res, required = true) {
	try {
		const session = await auth.api.getSession({
			headers: Object.fromEntries(
				Object.entries(req.headers).map(([k, v]) => [
					k,
					Array.isArray(v) ? v[0] : v,
				]),
			),
		});
		if (!session && required) {
			res.writeHead(401, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Not authenticated" }));
			return null;
		}
		return session;
	} catch {
		if (required) {
			res.writeHead(401, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Not authenticated" }));
		}
		return null;
	}
}

const ROLE_RANK = {
	admin: 100,
	practice_manager: 80,
	sl_lead: 50,
	state_manager: 50,
	readonly: 10,
};
function hasRole(session, minRole) {
	return (ROLE_RANK[session?.user?.role] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
	const url = new URL(req.url, `http://localhost:${PORT}`);
	const p = url.pathname;

	// CORS
	res.setHeader(
		"Access-Control-Allow-Origin",
		process.env.TRUSTED_ORIGINS?.split(",")[0] || "*",
	);
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PATCH, DELETE, OPTIONS",
	);
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.setHeader("Access-Control-Allow-Credentials", "true");
	if (req.method === "OPTIONS") {
		res.writeHead(204);
		return res.end();
	}

	// ── Health check — public, used by Railway ───────────────────────────────
	if (p === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		return res.end(JSON.stringify({ status: "ok" }));
	}

	// ── Better Auth — handles all /api/auth/* routes ─────────────────────────
	if (p.startsWith("/api/auth")) {
		return toNodeHandler(auth)(req, res);
	}

	// ── Protected API routes ──────────────────────────────────────────────────
	if (p.startsWith("/api/")) {
		const session = await getSession(req, res, true);
		if (!session) return; // 401 already sent

		const isWrite = ["POST", "PATCH", "DELETE"].includes(req.method);
		if (isWrite && !hasRole(session, "sl_lead")) {
			res.writeHead(403, { "Content-Type": "application/json" });
			return res.end(JSON.stringify({ error: "Insufficient permissions" }));
		}

		if (p.startsWith("/api/carbonites")) return carbonitesRoutes(req, res, url);
		if (p.startsWith("/api/pod-budgets")) return budgetsRoutes(req, res, url);
		if (p.startsWith("/api/entities")) return entitiesRoutes(req, res, url);
		if (p.startsWith("/api/hiring")) return hiringRoutes(req, res, url);

		res.writeHead(404, { "Content-Type": "application/json" });
		return res.end(JSON.stringify({ error: "Unknown API route" }));
	}

	// ── Static files ──────────────────────────────────────────────────────────
	const filePath = p === "/" ? "/index.html" : p;
	const fullPath = join(__dirname, "public", filePath);

	if (existsSync(fullPath)) {
		const ext = extname(fullPath);
		res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
		return res.end(readFileSync(fullPath));
	}

	// SPA fallback
	const indexPath = join(__dirname, "public", "index.html");
	if (existsSync(indexPath)) {
		res.writeHead(200, { "Content-Type": "text/html" });
		return res.end(readFileSync(indexPath));
	}

	res.writeHead(404);
	res.end("Not found");
});

// ── Boot ──────────────────────────────────────────────────────────────────────
async function start() {
	await initDb();
	await initExtendedDb();
	server.listen(PORT, () => {
		console.log(`Carbon Planner running on port ${PORT}`);
	});
}

start().catch((err) => {
	console.error("Failed to start:", err);
	process.exit(1);
});
