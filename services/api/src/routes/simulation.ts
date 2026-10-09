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
 * GET /api/v1/simulations/capabilities
 * Reports whether a bounded solver runner is enabled. This endpoint is
 * intentionally read-only; it never starts Docker or SFINCS.
 */
simulationRouter.get("/capabilities", (c) => c.json(simulationService.getRunnerCapabilities()));

/**
 * GET /api/v1/simulations/live/forecast
 *
 * Keep this literal route before /:eventId/forecast. Hono matches routes in
 * registration order, so otherwise `live` is interpreted as an event ID.
 */
simulationRouter.get("/live/forecast", async (c) => {
  try {
    // The current truth-preserving live forecast loader does not require a DB.
    // It returns an explicit unavailable response until a validated artifact
    // is published, without starting a solver or reusing replay geometry.
    const forecast = await simulationService.getLiveForecast();
    return c.json(forecast);
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: `Failed to generate operational live forecast: ${err.message}`,
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

/** GET /api/v1/simulations/:eventId/frames */
simulationRouter.get("/:eventId/frames", async (c) => {
  const eventId = c.req.param("eventId");
  try {
    return c.json(await simulationService.getScenarioArtifacts(eventId));
  } catch (error) {
    const err = error as Error;
    return c.json({ success: false, error: `Failed to retrieve frames for event: ${eventId}`, message: err.message }, 404);
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

/**
 * POST /api/v1/simulations/run
 * Manual trigger / on-demand bounded SFINCS artifact endpoint.
 * It delegates to the configured ML runner and does not persist credentials or
 * start a process in this Node service.
 */
simulationRouter.post("/run", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));

    // Solver artifacts are retrieved from the ML service; this endpoint does
    // not require database credentials or persist anything as a side effect.
    const result = await simulationService.runSimulation(undefined, {
      eventId: body.eventId,
      zoneId: body.zoneId || "zone-mangaluru-coastal",
      rainfallRateMmHr:
        body.rainfallRateMmHr != null
          ? Number(body.rainfallRateMmHr)
          : undefined,
      rainfallSeries: body.rainfallSeries,
      surgeLevelM:
        body.surgeLevelM != null ? Number(body.surgeLevelM) : undefined,
      durationHours:
        body.durationHours != null ? Number(body.durationHours) : 6,
      scenarioName: body.scenarioName,
      // Dashboard runs must use explicit bounded inputs; live forcing is not
      // enabled by this request path.
      useLiveWeather: false,
    });

    return c.json(
      {
        success: true,
        message: result.status === "queued"
          ? "SFINCS solver job accepted"
          : "SFINCS hydrodynamic simulation completed",
        eventId: result.eventId,
        status: result.status,
        executionTimeMs: result.executionTimeMs,
        simulation: result.simulation,
        persistedRecord: result.dbRecord?.prediction,
      },
      result.status === "queued" ? 202 : 201
    );
  } catch (error) {
    const err = error as Error;
    const disabled = err.message === "Bounded local SFINCS solver is disabled";
    return c.json(
      {
        success: false,
        error: `Simulation run failed: ${err.message}`,
      },
      disabled ? 409 : 500
    );
  }
});

/**
 * GET /api/v1/simulations/:eventId/replay
 * Canonical Replay Aggregator for Frontend Responder Dashboard.
 * Returns time series of flood extent, depth, zone impacts, facilities, and response priorities.
 */
simulationRouter.get("/:eventId/replay", async (c) => {
  const eventId = c.req.param("eventId");

  try {
    const replay = simulationService.getReplayData(eventId);
    return c.json(replay);
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: `Failed to load replay data for event ${eventId}: ${err.message}`,
      },
      500
    );
  }
});

/**
 * POST /api/v1/simulations/scenario
 * What-If Contingency Mode: Generates hypothetical stress-test sequence
 * based on user-supplied rainfall intensity and storm surge sliders.
 */
simulationRouter.post("/scenario", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const scenario = simulationService.getScenarioData({
      rainfallRateMmHr: body.rainfallRateMmHr != null ? Number(body.rainfallRateMmHr) : undefined,
      surgeLevelM: body.surgeLevelM != null ? Number(body.surgeLevelM) : undefined,
      scenarioName: body.scenarioName,
      breachSeaWall: body.breachSeaWall !== false,
    });
    return c.json(scenario);
  } catch (error) {
    const err = error as Error;
    return c.json(
      {
        success: false,
        error: `Failed to generate contingency scenario: ${err.message}`,
      },
      500
    );
  }
});
