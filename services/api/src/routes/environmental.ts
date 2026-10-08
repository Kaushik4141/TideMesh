import { Hono } from "hono";
import { getDb } from "../db/index.js";
import {
  environmentalService,
  type EnvironmentalQueryFilters,
} from "../services/environmental.service.js";

type Bindings = {
  DATABASE_URL?: string;
};

export const environmentalRouter = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/v1/environmental-observations
 * Queries normalized environmental observations with filtering.
 */
environmentalRouter.get("/", async (c) => {
  const start = c.req.query("start");
  const end = c.req.query("end");
  const source = c.req.query("source");
  const dataQuality = c.req.query("dataQuality") as any;
  const minRainfall = c.req.query("minRainfall")
    ? Number(c.req.query("minRainfall"))
    : undefined;
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 100;

  try {
    const db = getDb(c.env);
    const observations = await environmentalService.getObservations(db, {
      start,
      end,
      source,
      dataQuality,
      minRainfall,
      limit,
    });

    return c.json({
      success: true,
      count: observations.length,
      observations,
    });
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: "Failed to query environmental observations",
        message: err.message,
      },
      500
    );
  }
});

/**
 * POST /api/v1/environmental-observations/ingest
 * Ingests and normalizes P2 raw feeds into Neon PostgreSQL + PostGIS.
 */
environmentalRouter.post("/ingest", async (c) => {
  try {
    const db = getDb(c.env);
    const report = await environmentalService.ingestToDatabase(db);

    return c.json(
      {
        success: true,
        message: "Environmental observations ingested and deduplicated successfully",
        report,
      },
      201
    );
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: "Failed to ingest environmental observations",
        message: err.message,
      },
      500
    );
  }
});

/**
 * GET /api/v1/environmental-observations/sfincs-forcing
 * Returns SFINCS-compatible rainfall forcing time series.
 */
environmentalRouter.get("/sfincs-forcing", async (c) => {
  const start = c.req.query("start");
  const end = c.req.query("end");
  const source = c.req.query("source") || "open-meteo";

  try {
    const db = getDb(c.env);
    const forcing = await environmentalService.prepareSfincsRainfallSeries(db, {
      start,
      end,
      source,
    });

    return c.json({
      success: true,
      forcing,
    });
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: "Failed to generate SFINCS rainfall forcing",
        message: err.message,
      },
      500
    );
  }
});

/**
 * Event-specific router for GET /api/v1/events/:eventId/environment
 */
export const eventEnvironmentRouter = new Hono<{ Bindings: Bindings }>();

eventEnvironmentRouter.get("/:eventId/environment", async (c) => {
  const eventId = c.req.param("eventId");

  try {
    const db = getDb(c.env);
    const eventEnv = await environmentalService.getEventEnvironment(db, eventId);

    return c.json({
      success: true,
      eventEnvironment: eventEnv,
    });
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: `Failed to retrieve environment for event: ${eventId}`,
        message: err.message,
      },
      500
    );
  }
});
