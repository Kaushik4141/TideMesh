import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { sql } from "drizzle-orm";
import type { DatabaseInstance } from "../db/index.js";
import {
  FloodPredictionSchema,
  type FloodPrediction,
  type SeverityLevel,
} from "@tidemesh/contracts";

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

export class SimulationService {
  private mlApiUrl: string;
  private rootDir: string;

  constructor(mlApiUrl?: string) {
    this.mlApiUrl =
      mlApiUrl ||
      process.env.ML_API_URL ||
      "http://127.0.0.1:8000";
    this.rootDir = resolve(process.cwd(), "../..");
  }

  /**
   * Derives severity deterministically based on physical water depth (meters).
   */
  public classifySeverity(maxDepthM: number): SeverityLevel {
    if (maxDepthM < 0.15) return "LOW";
    if (maxDepthM < 0.5) return "MODERATE";
    if (maxDepthM < 1.5) return "HIGH";
    return "CRITICAL";
  }

  /**
   * Retrieves available simulation events either from ML API or local precomputed outputs.
   */
  async listSimulations(): Promise<SimulationEventSummary[]> {
    try {
      const res = await fetch(`${this.mlApiUrl}/api/v1/simulations`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        return (await res.json()) as SimulationEventSummary[];
      }
    } catch {
      // ML service not reachable, fall back to file check
    }

    return this.getLocalCatalog();
  }

  /**
   * Retrieves normalized FloodPrediction for an event.
   */
  async getForecast(
    eventId: string,
    zoneId: string = "zone-mangaluru-coastal"
  ): Promise<FloodPrediction> {
    try {
      const res = await fetch(
        `${this.mlApiUrl}/api/v1/simulations/${encodeURIComponent(
          eventId
        )}/forecast?zone_id=${encodeURIComponent(zoneId)}`,
        { signal: AbortSignal.timeout(2000) }
      );
      if (res.ok) {
        const raw = await res.json();
        return FloodPredictionSchema.parse(raw);
      }
    } catch {
      // ML service not reachable, fall back to local adapter
    }

    return this.loadLocalForecast(eventId, zoneId);
  }

  /**
   * Retrieves GeoJSON flood extent polygon.
   */
  async getFloodExtent(eventId: string): Promise<Record<string, unknown>> {
    try {
      const res = await fetch(
        `${this.mlApiUrl}/api/v1/simulations/${encodeURIComponent(
          eventId
        )}/extent`,
        { signal: AbortSignal.timeout(2000) }
      );
      if (res.ok) {
        return (await res.json()) as Record<string, unknown>;
      }
    } catch {
      // Fallback
    }

    return this.loadLocalFloodExtent();
  }

  /**
   * Persists normalized SFINCS forecast into Neon PostGIS database.
   * Ensures zone exists and registers PostGIS geometry and physical properties.
   */
  async syncToDatabase(
    db: DatabaseInstance,
    eventId: string,
    zoneId: string = "zone-mangaluru-coastal"
  ) {
    const forecast = await this.getForecast(eventId, zoneId);

    // 1. Ensure target Mangaluru zone exists in zones table
    await db.execute(sql`
      INSERT INTO zones (id, name, elevation, geometry)
      VALUES (
        ${zoneId},
        'Mangaluru Coastal / Netravati Estuary',
        1.5,
        ST_SetSRID(ST_GeomFromText('POLYGON((74.843 12.854, 74.889 12.854, 74.889 12.899, 74.843 12.899, 74.843 12.854))'), 4326)
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Prepare GeoJSON string for ST_GeomFromGeoJSON
    const geomStr = forecast.floodGeometry
      ? JSON.stringify(forecast.floodGeometry)
      : null;

    // 3. Insert or update prediction
    const res = await db.execute<{
      id: string;
      event_id: string;
      zone_id: string;
      severity: string;
      is_deterministic: boolean;
      depth_max: number;
      created_at: string;
    }>(sql`
      INSERT INTO flood_predictions (
        event_id,
        zone_id,
        timestamp,
        probability,
        is_deterministic,
        severity,
        onset_time,
        peak_time,
        depth_min,
        depth_max,
        flood_geometry,
        model_version,
        source,
        metrics
      ) VALUES (
        ${forecast.eventId || eventId},
        ${forecast.zoneId},
        ${forecast.timestamp}::timestamptz,
        ${forecast.probability ?? null},
        ${forecast.isDeterministic ?? true},
        ${forecast.severity}::severity_level,
        ${forecast.onset ? sql`${forecast.onset}::timestamptz` : null},
        ${forecast.peak ? sql`${forecast.peak}::timestamptz` : null},
        ${forecast.depthMin ?? null},
        ${forecast.depthMax ?? null},
        ${
          geomStr
            ? sql`ST_SetSRID(ST_GeomFromGeoJSON(${geomStr}), 4326)`
            : null
        },
        ${forecast.modelVersion ?? "SFINCS-v2.4.2"},
        ${forecast.source ?? "sfincs"},
        ${JSON.stringify(forecast.metrics || {})}::jsonb
      )
      RETURNING id, event_id, zone_id, severity, is_deterministic, depth_max, created_at;
    `);

    return {
      synced: true,
      prediction: res.rows[0],
      forecast,
    };
  }

  // --- Fallback Local Loaders ---

  private getLocalCatalog(): SimulationEventSummary[] {
    const metaPath = this.resolveFilePath("outputs/metadata.json");
    if (!existsSync(metaPath)) {
      return [];
    }

    try {
      const data = JSON.parse(readFileSync(metaPath, "utf-8"));
      return [
        {
          eventId: data.simulation_id || "mangaluru-historical-2018",
          name: data.event_name || "Mangaluru Historical Flood 2018",
          location: data.location || "Mangaluru Coastal",
          startTime: data.start_time,
          endTime: data.end_time,
          maxDepthM: data.max_depth_m,
          floodedAreaKm2: data.flooded_area_km2,
          model: `${data.model} ${data.model_version}`,
          status: "ready",
        },
      ];
    } catch {
      return [];
    }
  }

  private loadLocalForecast(
    eventId: string,
    zoneId: string
  ): FloodPrediction {
    const metaPath = this.resolveFilePath("outputs/metadata.json");
    if (!existsSync(metaPath)) {
      throw new Error(`SFINCS metadata not found at ${metaPath}`);
    }

    const data = JSON.parse(readFileSync(metaPath, "utf-8"));
    const extent = this.loadLocalFloodExtent();

    // Extract first geometry
    let primaryGeom: Record<string, unknown> | null = null;
    if (extent && typeof extent === "object") {
      const features = (extent as { features?: Array<{ geometry: Record<string, unknown> }> }).features;
      if (features && features.length > 0) {
        primaryGeom = features[0].geometry;
      }
    }

    const maxDepth = Number(data.max_depth_m);
    const severity = this.classifySeverity(maxDepth);

    const startDt = new Date(data.start_time);
    const onsetDt = new Date(startDt.getTime() + 20 * 60 * 1000);
    const peakDt = new Date(startDt.getTime() + 180 * 60 * 1000);

    return FloodPredictionSchema.parse({
      eventId: data.simulation_id || eventId,
      zoneId,
      timestamp: data.start_time,
      probability: null, // SFINCS is deterministic!
      isDeterministic: true,
      severity,
      onset: onsetDt.toISOString(),
      peak: peakDt.toISOString(),
      depthMin: Number(data.flood_threshold_m || 0.1),
      depthMax: maxDepth,
      confidence: null,
      modelVersion: `${data.model}-${data.model_version}`,
      source: "sfincs",
      floodGeometry: primaryGeom,
      metrics: {
        meanFloodedDepthM: data.mean_flooded_depth_m,
        floodedAreaKm2: data.flooded_area_km2,
        gridResolutionM: data.grid_resolution_m,
        crs: data.crs,
        verticalDatum: data.vertical_datum,
      },
      forcing: data.forcing || {},
    });
  }

  private loadLocalFloodExtent(): Record<string, unknown> {
    const extentPath = this.resolveFilePath("outputs/flood_extent.geojson");
    if (!existsSync(extentPath)) {
      throw new Error(`SFINCS flood extent GeoJSON not found at ${extentPath}`);
    }
    return JSON.parse(readFileSync(extentPath, "utf-8"));
  }

  private resolveFilePath(relPath: string): string {
    const candidates = [
      resolve(process.cwd(), relPath),
      resolve(process.cwd(), "../..", relPath),
      resolve(this.rootDir, relPath),
      resolve(this.rootDir, "ml/sfincs/mangaluru/simulations/baseline", relPath),
    ];
    for (const p of candidates) {
      if (existsSync(p)) return p;
    }
    return candidates[0];
  }
}

export const simulationService = new SimulationService();
