import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { DatabaseInstance } from "../db/index.js";
import { FloodPredictionSchema, type FloodPrediction, type SeverityLevel } from "@tidemesh/contracts";

export interface SimulationEventSummary {
  eventId: string;
  name: string;
  location: string;
  startTime: string;
  endTime: string;
  maxDepthM: number;
  floodedAreaKm2?: number;
  model: string;
  status: string;
}

export interface SimulationRunnerCapabilities {
  solver: "sfincs";
  enabled: boolean;
  operational: false;
  reason: string;
}

export interface SimulationRunResult {
  simulation: FloodPrediction | null;
  eventId: string | null;
  status: "completed" | "queued";
  dbRecord: { prediction: Record<string, unknown> } | null;
  executionTimeMs: number;
}

/** Scenario artifacts are never an operational forecast or an alert source. */
export class SimulationService {
  private mlApiUrl: string;
  private rootDir: string;
  private validatedOperationalForecastArtifactPath?: string;

  constructor(mlApiUrl?: string, validatedOperationalForecastArtifactPath?: string) {
    this.mlApiUrl = mlApiUrl || process.env.ML_API_URL || "http://127.0.0.1:8000";
    this.rootDir = resolve(process.cwd(), "../..");
    this.validatedOperationalForecastArtifactPath = validatedOperationalForecastArtifactPath
      || process.env.VALIDATED_OPERATIONAL_FORECAST_ARTIFACT_PATH
      || process.env.OPERATIONAL_FORECAST_ARTIFACT_PATH;
  }

  public classifySeverity(maxDepthM: number): SeverityLevel {
    if (maxDepthM < 0.15) return "LOW";
    if (maxDepthM < 0.5) return "MODERATE";
    if (maxDepthM < 1.5) return "HIGH";
    return "CRITICAL";
  }

  public getRunnerCapabilities(): SimulationRunnerCapabilities {
    const enabled = process.env.ENABLE_SFINCS_LOCAL_RUNNER?.toLowerCase() === "true";
    return {
      solver: "sfincs",
      enabled,
      operational: false,
      reason: enabled
        ? "Bounded local SFINCS runner is enabled"
        : "Bounded local SFINCS runner is disabled; no solver process will be started",
    };
  }

  private validateEventId(eventId: string) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(eventId)) throw new Error("Invalid simulation event ID");
  }

  async listSimulations(): Promise<SimulationEventSummary[]> {
    try {
      const res = await fetch(`${this.mlApiUrl}/api/v1/simulations`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json() as SimulationEventSummary[];
    } catch { /* Exact local artifacts remain available when ML API is offline. */ }
    const path = this.resolveFilePath("outputs/metadata.json");
    if (!existsSync(path)) return [];
    try {
      const data = JSON.parse(readFileSync(path, "utf-8"));
      if (!data.simulation_id) return [];
      return [{ eventId: data.simulation_id, name: data.event_name || "Unvalidated illustrative simulation",
        location: data.location, startTime: data.start_time, endTime: data.end_time,
        maxDepthM: data.max_depth_m, floodedAreaKm2: data.flooded_area_km2,
        model: `${data.model} ${data.model_version}`, status: "unvalidated_nonoperational" }];
    } catch { return []; }
  }

  async getForecast(eventId: string, zoneId = "zone-mangaluru-coastal"): Promise<FloodPrediction> {
    this.validateEventId(eventId);
    if (zoneId !== "zone-mangaluru-coastal") {
      throw new Error(`Unsupported simulation boundary "${zoneId}". Only the Mangaluru coastal boundary is configured`);
    }
    try {
      const res = await fetch(`${this.mlApiUrl}/api/v1/simulations/${encodeURIComponent(eventId)}/forecast?zone_id=${encodeURIComponent(zoneId)}`,
        { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const prediction = FloodPredictionSchema.parse(await res.json());
        if (prediction.eventId !== eventId) throw new Error("Simulation artifact ID mismatch");
        return prediction;
      }
    } catch { /* Fall back only to this exact event. */ }
    const { data } = this.localEvent(eventId);
    const extent = this.loadLocalFloodExtent(eventId);
    const features = extent.features as Array<{ geometry: Record<string, unknown> }> | undefined;
    const polygons = (features || []).flatMap(({ geometry }) => geometry?.type === "Polygon" ? [geometry.coordinates]
      : geometry?.type === "MultiPolygon" ? geometry.coordinates as unknown[] : []);
    return FloodPredictionSchema.parse({
      eventId, zoneId, timestamp: data.start_time, probability: null, isDeterministic: true,
      severity: this.classifySeverity(Number(data.max_depth_m)), onset: null, peak: null,
      depthMin: null, depthMax: Number(data.max_depth_m), confidence: null,
      modelVersion: `${data.model}-${data.model_version}`, source: "sfincs",
      floodGeometry: polygons.length ? { type: "MultiPolygon", coordinates: polygons } : null,
      metrics: { meanFloodedDepthM: data.mean_flooded_depth_m, floodedAreaKm2: data.flooded_area_km2,
        gridResolutionM: data.grid_resolution_m, crs: data.crs, verticalDatum: data.vertical_datum,
        purpose: "scenario", operational: false, validationStatus: "unvalidated",
        terrainSource: data.terrain_source || "unknown", artifactKind: "maximum_extent", frameCount: 0 },
      forcing: data.forcing || {}, drivers: [],
    });
  }

  async getFloodExtent(eventId: string): Promise<Record<string, unknown>> {
    this.validateEventId(eventId);
    try {
      const res = await fetch(`${this.mlApiUrl}/api/v1/simulations/${encodeURIComponent(eventId)}/extent`,
        { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json() as Record<string, unknown>;
    } catch { /* Exact local fallback. */ }
    return this.loadLocalFloodExtent(eventId);
  }

  async getScenarioArtifacts(eventId: string): Promise<Record<string, unknown>> {
    this.validateEventId(eventId);
    const res = await fetch(`${this.mlApiUrl}/api/v1/simulations/${encodeURIComponent(eventId)}/frames`,
      { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Scenario artifacts unavailable (${res.status})`);
    return await res.json() as Record<string, unknown>;
  }

  async syncToDatabase(_db: DatabaseInstance, _eventId: string, _zoneId = "zone-mangaluru-coastal") {
    throw new Error("Unvalidated simulation artifacts cannot be published as official forecasts; use the operations publisher");
  }

  async runSimulation(_db: DatabaseInstance | undefined, options: {
    eventId?: string; zoneId?: string; rainfallRateMmHr?: number; rainfallSeries?: number[];
    surgeLevelM?: number; durationHours?: number; scenarioName?: string; useLiveWeather?: boolean;
  } = {}): Promise<SimulationRunResult> {
    const startTime = Date.now();
    if (options.eventId !== undefined) throw new Error("Scenario IDs are generated by the solver service");
    if (options.zoneId && options.zoneId !== "zone-mangaluru-coastal") {
      throw new Error(`Unsupported simulation boundary "${options.zoneId}". Only the Mangaluru coastal boundary is configured`);
    }
    if (options.useLiveWeather) throw new Error("Live forcing is not validated for this scenario model");
    if ((options.durationHours ?? 6) !== 6) throw new Error("Scenarios require a six-hour duration");
    const validRain = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1000;
    if (options.rainfallRateMmHr !== undefined && !validRain(options.rainfallRateMmHr)) throw new Error("Invalid rainfall rate");
    if (options.rainfallSeries && (options.rainfallSeries.length !== 7 || !options.rainfallSeries.every(validRain))) {
      throw new Error("Rainfall series must contain seven finite hourly values (0–6h)");
    }
    if (options.rainfallRateMmHr === undefined && !options.rainfallSeries) throw new Error("Explicit scenario rainfall is required");
    if (options.surgeLevelM !== undefined && (!Number.isFinite(options.surgeLevelM) || options.surgeLevelM < -5 || options.surgeLevelM > 10)) {
      throw new Error("Invalid scenario boundary water level");
    }
    if (!this.getRunnerCapabilities().enabled) {
      throw new Error("Bounded local SFINCS solver is disabled");
    }
    const res = await fetch(`${this.mlApiUrl}/api/v1/simulations/run`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...options, zoneId: "zone-mangaluru-coastal", durationHours: 6 }),
      signal: AbortSignal.timeout(240000),
    });
    if (!res.ok) throw new Error(`SFINCS scenario failed (${res.status}): ${await res.text()}`);
    const payload = await res.json() as Record<string, unknown>;
    const candidate = payload.forecast && typeof payload.forecast === "object"
      ? payload.forecast
      : payload.simulation && typeof payload.simulation === "object"
        ? payload.simulation
        : payload;
    const eventId = typeof payload.eventId === "string"
      ? payload.eventId
      : typeof payload.event_id === "string"
        ? payload.event_id
      : typeof payload.simulation_id === "string"
        ? payload.simulation_id
        : payload.job && typeof payload.job === "object" && typeof (payload.job as Record<string, unknown>).eventId === "string"
          ? (payload.job as Record<string, unknown>).eventId as string
      : candidate && typeof candidate === "object" && typeof (candidate as Record<string, unknown>).eventId === "string"
          ? (candidate as Record<string, unknown>).eventId as string
          : null;
    if (res.status === 202 || payload.job || payload.status === "queued" || payload.status === "pending" || payload.status === "running" || payload.status === "accepted") {
      return { simulation: null, eventId, status: "queued", dbRecord: null, executionTimeMs: Date.now() - startTime };
    }
    const simulation = FloodPredictionSchema.parse(candidate);
    if (!simulation.eventId) throw new Error("Solver response did not include an exact event ID");
    return { simulation, eventId: simulation.eventId, status: "completed", dbRecord: null, executionTimeMs: Date.now() - startTime };
  }

  public getReplayData(eventId = "mangaluru-historical-2018") {
    try {
      const { data } = this.localEvent(eventId);
      return { success: true, mode: "HISTORICAL_REPLAY", status: "illustrative_unvalidated", event: {
        id: eventId, name: data.event_name || "Illustrative historical scenario", type: "HISTORICAL REPLAY",
        mode: "ILLUSTRATIVE_UNVALIDATED", status: "UNVALIDATED", isHypothetical: true,
        disclaimer: "Illustrative, unvalidated model artifact. Not a calibrated hindcast or operational forecast.",
        location: data.location, model: `${data.model} ${data.model_version}`, gridResolutionM: data.grid_resolution_m,
        crs: data.crs, timeStepMinutes: null, timestamps: [], timesteps: {},
        onset: null, peak: null, maximumExtent: this.loadLocalFloodExtent(eventId),
        artifactKind: "maximum_extent", operational: false, validationStatus: "unvalidated",
      } };
    } catch {
      return { success: true, mode: "HISTORICAL_REPLAY", event: null, status: "unavailable",
        reason: "No matching replay artifact is available for the requested event." };
    }
  }

  public async getLiveForecast(_db?: DatabaseInstance) {
    const event = this.loadValidatedOperationalForecastArtifact();
    if (event) return { success: true, mode: "LIVE_FORECAST", event, status: "available" };
    return { success: true, mode: "LIVE_FORECAST", event: null, status: "unavailable",
      reason: "No validated operational forecast artifact is configured" };
  }

  public getScenarioData(_options: { rainfallRateMmHr?: number; surgeLevelM?: number; scenarioName?: string; breachSeaWall?: boolean } = {}) {
    return { success: true, mode: "SCENARIO", event: null, status: "unavailable",
      reason: "No solver run was performed. Submit a private six-hour scenario job and retrieve its actual artifacts; parameter scaling is not a hydrodynamic simulation." };
  }

  private localEvent(eventId: string): { data: Record<string, any>; directory: string } {
    this.validateEventId(eventId);
    const paths = [this.resolveFilePath(`simulations/runs/${eventId}/outputs/metadata.json`), this.resolveFilePath("outputs/metadata.json")];
    for (const path of paths) {
      if (!existsSync(path)) continue;
      const data = JSON.parse(readFileSync(path, "utf-8"));
      if (data.simulation_id === eventId) return { data, directory: resolve(path, "..") };
    }
    throw new Error(`No matching artifact for simulation ${eventId}`);
  }

  private loadLocalFloodExtent(eventId: string): Record<string, unknown> {
    const { directory } = this.localEvent(eventId);
    const path = resolve(directory, "flood_extent.geojson");
    if (!existsSync(path)) throw new Error("Flood extent artifact unavailable");
    return JSON.parse(readFileSync(path, "utf-8"));
  }

  /**
   * Read only an explicitly configured operational artifact. Historical local
   * outputs and simulation polygons are deliberately never considered here.
   */
  private loadValidatedOperationalForecastArtifact(): Record<string, unknown> | null {
    const path = this.validatedOperationalForecastArtifactPath;
    if (!path || !existsSync(path)) return null;

    try {
      const raw = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
      const candidate = raw.event && typeof raw.event === "object" && !Array.isArray(raw.event)
        ? raw.event as Record<string, unknown>
        : raw;
      const validationStatus = candidate.validationStatus ?? candidate.validation_status
        ?? raw.validationStatus ?? raw.validation_status;
      const validated = candidate.validated === true || raw.validated === true || validationStatus === "validated";
      const operational = candidate.operational === true || raw.operational === true;
      return validated && operational ? candidate : null;
    } catch {
      return null;
    }
  }

  private resolveFilePath(relPath: string): string {
    const candidates = [resolve(process.cwd(), relPath), resolve(process.cwd(), "../..", relPath),
      resolve(this.rootDir, relPath), resolve(this.rootDir, "ml/sfincs/mangaluru/simulations/baseline", relPath)];
    return candidates.find(existsSync) || candidates[0];
  }
}

export const simulationService = new SimulationService();
