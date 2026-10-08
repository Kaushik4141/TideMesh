import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { simulationService } from "../services/simulation.service.js";

type Bindings = {
  DATABASE_URL?: string;
  ML_API_URL?: string;
};

export const simulationRouter = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/v1/simulations
 * Lists available hydrodynamic simulation events.
 */
simulationRouter.get("/", async (c) => {
  try {
    const list = await simulationService.listSimulations();
    return c.json({
      success: true,
      count: list.length,
      simulations: list,
    });
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: "Failed to list simulation events",
        message: err.message,
      },
      500
    );
  }
});

/**
 * GET /api/v1/simulations/:eventId/forecast
 * Returns normalized FloodPrediction adhering strictly to TideMesh contract.
 */
simulationRouter.get("/:eventId/forecast", async (c) => {
  const eventId = c.req.param("eventId");
  const zoneId = c.req.query("zoneId") || "zone-mangaluru-coastal";

  try {
    const forecast = await simulationService.getForecast(eventId, zoneId);
    return c.json({
      success: true,
      forecast,
    });
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: `Failed to retrieve forecast for event: ${eventId}`,
        message: err.message,
      },
      404
    );
  }
});

/**
 * GET /api/v1/simulations/:eventId/extent
 * Returns GeoJSON FeatureCollection of the flood polygon in EPSG:4326.
 */
simulationRouter.get("/:eventId/extent", async (c) => {
  const eventId = c.req.param("eventId");

  try {
    const extent = await simulationService.getFloodExtent(eventId);
    return c.json(extent);
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: `Failed to retrieve flood extent for event: ${eventId}`,
        message: err.message,
      },
      404
    );
  }
});

/**
 * POST /api/v1/simulations/:eventId/sync
 * Syncs and persists normalized prediction into Neon PostgreSQL (PostGIS geometry).
 */
simulationRouter.post("/:eventId/sync", async (c) => {
  const eventId = c.req.param("eventId");
  const zoneId = c.req.query("zoneId") || "zone-mangaluru-coastal";

  try {
    const db = getDb(c.env);
    const result = await simulationService.syncToDatabase(db, eventId, zoneId);

    return c.json({
      success: true,
      message: `Simulation ${eventId} successfully synced to Neon PostGIS database`,
      data: result,
    }, 201);
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: `Failed to sync simulation to database: ${err.message}`,
      },
      500
    );
  }
});
