import { sql } from "drizzle-orm";
import {
  EnvironmentalObservationSchema,
  type EnvironmentalObservation,
  type EnvironmentalSource,
} from "@tidemesh/contracts";
import type { DatabaseInstance } from "../db/index.js";
import {
  environmentalPipelineAdapter,
  type EnvironmentalAdapterOptions,
} from "../adapters/environmental-pipeline.adapter.js";

export interface EnvironmentalObservationFilters {
  source?: EnvironmentalSource;
  /** ISO 8601 lower bound (inclusive). */
  start?: string;
  /** ISO 8601 upper bound (inclusive). */
  end?: string;
  limit?: number;
}

export interface EnvironmentalSyncResult {
  synced: number;
  sources: string[];
  timestampStart: string | null;
  timestampEnd: string | null;
  observations: EnvironmentalObservation[];
}

interface EnvironmentalObservationRow {
  timestamp: Date | string;
  rainfall: number | null;
  temperature_c: number | null;
  surface_pressure_hpa: number | null;
  wind_speed_kmh: number | null;
  elevation_m: number | null;
  latitude: number | null;
  longitude: number | null;
  source: string | null;
  [key: string]: unknown;
}

/**
 * Serves P2's environmental observations.
 *
 * - Reads from Neon/PostGIS (environmental_observations) when a
 *   database connection is available.
 * - Falls back to the P2 data-pipeline files (via the adapter)
 *   when no DATABASE_URL is configured, so the API remains
 *   functional without a database.
 */
export class EnvironmentalService {
  private adapter: typeof environmentalPipelineAdapter;

  constructor(
    adapterOptions?: EnvironmentalAdapterOptions,
    adapter?: EnvironmentalService["adapter"]
  ) {
    this.adapter =
      adapter ??
      (adapterOptions
        ? new (Object.getPrototypeOf(environmentalPipelineAdapter)
            .constructor as new (
            options: EnvironmentalAdapterOptions
          ) => EnvironmentalService["adapter"])(adapterOptions)
        : environmentalPipelineAdapter);
  }

  /**
   * Lists normalized environmental observations.
   */
  async listObservations(
    filters: EnvironmentalObservationFilters = {},
    db?: DatabaseInstance
  ): Promise<EnvironmentalObservation[]> {
    const database = db ?? this.tryGetDb();
    if (!database) {
      return this.listFromFile(filters);
    }
    return this.listFromDatabase(database, filters);
  }

  /**
   * Normalizes P2's data-pipeline output and upserts it into
   * Neon/PostGIS (idempotent on (timestamp, source)).
   */
  async syncToDatabase(
    db: DatabaseInstance
  ): Promise<EnvironmentalSyncResult> {
    const observations = this.adapter.loadAll();
    if (observations.length === 0) {
      return {
        synced: 0,
        sources: [],
        timestampStart: null,
        timestampEnd: null,
        observations,
      };
    }

    for (const observation of observations) {
      const location =
        observation.latitude !== undefined &&
          observation.longitude !== undefined
          ? sql`ST_SetSRID(ST_MakePoint(${observation.longitude}, ${observation.latitude}), 4326)`
          : null;

      await db.execute(sql`
        INSERT INTO environmental_observations (
          timestamp, rainfall, temperature_c, surface_pressure_hpa,
          wind_speed_kmh, elevation_m, location, source
        ) VALUES (
          ${observation.timestamp}::timestamptz,
          ${observation.rainfallMm ?? null},
          ${observation.temperatureC ?? null},
          ${observation.surfacePressureHpa ?? null},
          ${observation.windSpeedKmh ?? null},
          ${observation.elevationM ?? null},
          ${location},
          ${observation.source}
        )
        ON CONFLICT (timestamp, source) DO UPDATE SET
          rainfall = EXCLUDED.rainfall,
          temperature_c = EXCLUDED.temperature_c,
          surface_pressure_hpa = EXCLUDED.surface_pressure_hpa,
          wind_speed_kmh = EXCLUDED.wind_speed_kmh,
          elevation_m = EXCLUDED.elevation_m,
          location = EXCLUDED.location;
      `);
    }

    const timestamps = observations.map((o) => o.timestamp).sort();
    return {
      synced: observations.length,
      sources: [...new Set(observations.map((o) => o.source))],
      timestampStart: timestamps[0] ?? null,
      timestampEnd: timestamps[timestamps.length - 1] ?? null,
      observations,
    };
  }

  // --- Internal helpers ---

  private tryGetDb(): DatabaseInstance | undefined {
    const url =
      typeof process !== "undefined"
        ? process.env?.DATABASE_URL
        : undefined;
    if (!url) return undefined;
    // Lazy import to avoid a hard dependency at module load time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getDb } = require("../db/index.js") as {
      getDb: (env?: { DATABASE_URL?: string }) => DatabaseInstance;
    };
    return getDb({ DATABASE_URL: url });
  }

  private async listFromDatabase(
    db: DatabaseInstance,
    filters: EnvironmentalObservationFilters
  ): Promise<EnvironmentalObservation[]> {
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (filters.source) {
      conditions.push("source = ${source}");
      params.source = filters.source;
    }
    if (filters.start) {
      conditions.push("timestamp >= ${start}");
      params.start = filters.start;
    }
    if (filters.end) {
      conditions.push("timestamp <= ${end}");
      params.end = filters.end;
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.min(
      Math.max(1, filters.limit ?? 1000),
      10000
    );

    const res = await db.execute<EnvironmentalObservationRow>(sql`
      SELECT
        timestamp,
        rainfall,
        temperature_c,
        surface_pressure_hpa,
        wind_speed_kmh,
        elevation_m,
        ST_Y(location) AS latitude,
        ST_X(location) AS longitude,
        source
      FROM environmental_observations
      ${where}
      ORDER BY timestamp DESC
      LIMIT ${limit};
    `);

    return res.rows.map((row) =>
      EnvironmentalObservationSchema.parse({
        timestamp:
          row.timestamp instanceof Date
            ? row.timestamp.toISOString()
            : row.timestamp,
        rainfallMm: row.rainfall,
        temperatureC: row.temperature_c,
        surfacePressureHpa: row.surface_pressure_hpa,
        windSpeedKmh: row.wind_speed_kmh,
        elevationM: row.elevation_m,
        latitude: row.latitude ?? undefined,
        longitude: row.longitude ?? undefined,
        source: row.source ?? "open-meteo",
      })
    );
  }

  private async listFromFile(
    filters: EnvironmentalObservationFilters
  ): Promise<EnvironmentalObservation[]> {
    let observations = this.adapter.loadAll();

    if (filters.source) {
      observations = observations.filter(
        (o) => o.source === filters.source
      );
    }
    if (filters.start) {
      observations = observations.filter((o) => o.timestamp >= filters.start!);
    }
    if (filters.end) {
      observations = observations.filter((o) => o.timestamp <= filters.end!);
    }

    const limit = filters.limit ?? 1000;
    // File fallback returns chronological order; apply the same
    // descending order as the database path for consistency.
    return observations
      .slice()
      .reverse()
      .slice(0, Math.min(Math.max(1, limit), 10000));
  }
}

export const environmentalService = new EnvironmentalService();
