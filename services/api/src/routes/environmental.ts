import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { environmentalService } from "../services/environmental.service.js";
import { EnvironmentalObservationSchema } from "@tidemesh/contracts";

type Bindings = {
  DATABASE_URL?: string;
};

export const environmentalRouter = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/v1/environmental
 * Returns normalized environmental observations from P2 data-pipeline.
 * Supports query filters: source, start, end, limit.
 * Returns real P2 data (not hardcoded) via the adapter -> Neon flow.
 * Works without DATABASE_URL (falls back to P2 data files).
 */
environmentalRouter.get("/", async (c) => {
  try {
    const source = c.req.query("source");
    const start = c.req.query("start");
    const end = c.req.query("end");
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 1000;

    // Only get DB if DATABASE_URL is configured; otherwise service falls back to files
    const hasDbUrl = typeof process !== "undefined" && process.env.DATABASE_URL;
    const db = hasDbUrl ? getDb(c.env) : undefined;

    const observations = await environmentalService.listObservations(
      { source: source as any, start, end, limit },
      db
    );

    const validated = observations.map((o) =>
      EnvironmentalObservationSchema.parse(o)
    );

    return c.json({
      success: true,
      count: validated.length,
      observations: validated,
    });
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: "Failed to retrieve environmental observations",
        message: err.message,
      },
      500
    );
  }
});

/**
 * POST /api/v1/environmental/sync
 * Syncs P2 data-pipeline observations to Neon/PostGIS database.
 * Idempotent on (timestamp, source).
 */
environmentalRouter.post("/sync", async (c) => {
  try {
    const db = getDb(c.env);
    const result = await environmentalService.syncToDatabase(db);

    return c.json(
      {
        success: true,
        message: `Synced ${result.synced} environmental observations to Neon PostGIS`,
        data: result,
      },
      201
    );
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: `Failed to sync environmental data: ${err.message}`,
      },
      500
    );
  }
});