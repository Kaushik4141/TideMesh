import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { checkDatabaseHealth } from "../services/health.service.js";

type Bindings = {
  DATABASE_URL?: string;
};

export const healthRouter = new Hono<{ Bindings: Bindings }>();

/**
 * Basic API liveness check
 * GET /api/v1/health
 */
healthRouter.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "tidemesh-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Database & PostGIS connectivity check
 * GET /api/v1/health/db
 */
healthRouter.get("/db", async (c) => {
  try {
    const db = getDb(c.env);
    const health = await checkDatabaseHealth(db);

    if (health.status === "ok") {
      return c.json(health, 200);
    } else {
      return c.json(health, 503);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Database connection could not be established";
    return c.json(
      {
        status: "error",
        database: "disconnected",
        postgis: "unavailable",
        error: message.replace(/:\/\/[^@]+@/, "://***:***@"),
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});
