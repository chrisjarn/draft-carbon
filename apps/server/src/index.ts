import { createContext } from "@carbon-wfp/api/context";
import { appRouter } from "@carbon-wfp/api/routers/index";
import { auth } from "@carbon-wfp/auth";
import { env } from "@carbon-wfp/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import path from "node:path";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

// Serve frontend static files
const distPath = path.resolve(import.meta.dir, "../../web/dist");

app.use(
  "/assets/*",
  serveStatic({ root: distPath, rewriteRequestPath: (p) => p }),
);

app.get("*", serveStatic({ root: distPath, path: "/index.html" }));

export default app;
