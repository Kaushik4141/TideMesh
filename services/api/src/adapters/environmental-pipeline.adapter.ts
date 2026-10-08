import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  EnvironmentalObservationSchema,
  type EnvironmentalObservation,
  type EnvironmentalSource,
} from "@tidemesh/contracts";

/**
 * P2 (data-pipeline) → P3 (backend) adapter.
 *
 * Consumes P2's environmental observation files from the data-pipeline
 * package and normalizes them into the TideMesh EnvironmentalObservation
 * contract. The adapter depends only on P2's *data format* (the Open-Meteo
 * hourly JSON schema of the versioned raw files), never on P2's internal
 * implementation (pandas / pyarrow / parquet artifacts, which are
 * gitignored build outputs).
 *
 * Normalization rules (identical to P2's clean_meteo.py):
 * - Timestamps are wall-clock times in the source timezone declared by the
 *   file (`utc_offset_seconds`). UTC = local wall clock − utc_offset_seconds.
 * - Position is WGS 84 decimal degrees (EPSG:4326).
 * - Units are preserved as delivered: mm, °C, hPa, km/h, meters.
 */

export interface EnvironmentalPipelineFile {
  /** Contract source label for this file. */
  source: EnvironmentalSource;
  /** Path relative to the repository root. */
  relPath: string;
}

/** P2 observation files, in pipeline order. */
export const P2_ENVIRONMENTAL_FILES: EnvironmentalPipelineFile[] = [
  {
    source: "open-meteo",
    relPath: "data-pipeline/data/raw/open-meteo/open_meteo_hourly.json",
  },
  {
    source: "cwc",
    relPath: "data-pipeline/data/raw/cwc/cwc_observations.json",
  },
];

interface RawHourlyFile {
  latitude?: number;
  longitude?: number;
  elevation?: number;
  utc_offset_seconds?: number;
  timezone?: string;
  hourly?: Record<string, Array<number | string | null>>;
}

export interface EnvironmentalAdapterOptions {
  /** Repository root directory. Defaults to two levels above cwd (services/api). */
  rootDir?: string;
}

/**
 * Parses a naive ISO wall-clock timestamp (e.g. "2026-10-08T00:00") as a
 * fixed instant, independent of the host machine's timezone, by interpreting
 * the wall clock as UTC. Returns epoch milliseconds.
 */
export function parseWallClockIso(localIso: string): number {
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localIso)
    ? `${localIso}:00`
    : localIso;
  const ms = Date.parse(`${withSeconds}Z`);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid ISO timestamp in P2 data: ${localIso}`);
  }
  return ms;
}

/**
 * Converts a naive local wall-clock timestamp plus a UTC offset (seconds)
 * into an ISO 8601 UTC timestamp string. Mirrors P2's
 * `timestamp_utc = timestamp_local - utc_offset` rule.
 */
export function toUtcIso(localIso: string, utcOffsetSeconds: number): string {
  return new Date(parseWallClockIso(localIso) - utcOffsetSeconds * 1000)
    .toISOString();
}

export class EnvironmentalPipelineAdapter {
  private rootDir: string;

  constructor(options: EnvironmentalAdapterOptions = {}) {
    this.rootDir =
      options.rootDir ?? resolve(process.cwd(), "..", "..");
  }

  /**
   * Resolves a repository-relative path, checking the current working
   * directory first (for direct execution) and the repository root second.
   */
  resolveFilePath(relPath: string): string {
    const candidates = [
      resolve(process.cwd(), relPath),
      resolve(this.rootDir, relPath),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
    return candidates[candidates.length - 1];
  }

  /**
   * Loads and normalizes a single P2 observation file.
   */
  loadFile(file: EnvironmentalPipelineFile): EnvironmentalObservation[] {
    const filePath = this.resolveFilePath(file.relPath);
    if (!existsSync(filePath)) {
      throw new Error(`P2 environmental data file not found: ${filePath}`);
    }

    let raw: RawHourlyFile;
    try {
      raw = JSON.parse(readFileSync(filePath, "utf-8")) as RawHourlyFile;
    } catch (err) {
      throw new Error(
        `Failed to parse P2 environmental data file ${filePath}: ${
          err instanceof Error ? err.message : err
        }`
      );
    }

    const hourly = raw.hourly ?? {};
    const times = (hourly.time ?? []) as string[];
    const utcOffsetSeconds = Number(raw.utc_offset_seconds ?? 0);

    const latitude = raw.latitude;
    const longitude = raw.longitude;
    if (latitude === undefined || longitude === undefined) {
      throw new Error(
        `P2 environmental data file ${filePath} is missing latitude/longitude`
      );
    }

    const observations = times.map((localTime, index) => {
      const value = (name: string): number | null | undefined => {
        const values = hourly[name];
        if (!values) return undefined;
        const v = values[index];
        return typeof v === "number" ? v : null;
      };

      return EnvironmentalObservationSchema.parse({
        timestamp: toUtcIso(localTime, utcOffsetSeconds),
        rainfallMm: value("precipitation"),
        rainMm: value("rain"),
        temperatureC: value("temperature_2m"),
        surfacePressureHpa: value("surface_pressure"),
        windSpeedKmh: value("wind_speed_10m"),
        latitude,
        longitude,
        elevationM: raw.elevation ?? null,
        source: file.source,
        sourceTimezone: raw.timezone,
      });
    });

    return observations;
  }

  /**
   * Loads and normalizes every P2 observation file, sorted by timestamp.
   */
  loadAll(): EnvironmentalObservation[] {
    const observations = P2_ENVIRONMENTAL_FILES.flatMap((file) =>
      this.loadFile(file)
    );
    return observations.sort((a, b) => {
      const byTime = a.timestamp.localeCompare(b.timestamp);
      return byTime !== 0 ? byTime : a.source.localeCompare(b.source);
    });
  }
}

export const environmentalPipelineAdapter = new EnvironmentalPipelineAdapter();
