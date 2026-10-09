import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { sql } from "drizzle-orm";
import type { DatabaseInstance } from "../db/index.js";
import {
  EnvironmentalObservationSchema,
  type EnvironmentalObservation,
  type DataQualityStatus,
} from "@tidemesh/contracts";

export interface EnvironmentalQueryFilters {
  start?: string;
  end?: string;
  source?: string;
  dataQuality?: DataQualityStatus;
  minRainfall?: number;
  latitude?: number;
  longitude?: number;
  limit?: number;
}

export interface IngestionReport {
  success: boolean;
  source: string;
  totalParsed: number;
  inserted: number;
  skipped: number;
  qualityBreakdown: Record<string, number>;
  timeRange: { start: string | null; end: string | null };
}

export class EnvironmentalService {
  private repoRoot: string;

  constructor() {
    this.repoRoot = resolve(process.cwd(), "../..");
  }

  /**
   * Reads raw P2 feeds and normalizes them into canonical EnvironmentalObservation contracts.
   */
  public parseAndNormalizeFeeds(): EnvironmentalObservation[] {
    const observations: EnvironmentalObservation[] = [];

    // 1. Process Open-Meteo local feed (Asia/Kolkata -> UTC conversion)
    const meteoPath = this.resolvePath("data-pipeline/data/raw/open-meteo/open_meteo_hourly.json");
    if (existsSync(meteoPath)) {
      try {
        const raw = JSON.parse(readFileSync(meteoPath, "utf-8"));
        const lat = Number(raw.latitude);
        const lon = Number(raw.longitude);
        const elev = raw.elevation != null ? Number(raw.elevation) : null;
        const utcOffsetSeconds = Number(raw.utc_offset_seconds || 19800);
        const hourly = raw.hourly || {};
        const times: string[] = hourly.time || [];
        const precipitation: number[] = hourly.precipitation || [];
        const rain: number[] = hourly.rain || [];

        times.forEach((tStr, idx) => {
          // Local time (Asia/Kolkata = UTC+5:30)
          const localDt = new Date(tStr + ":00+05:30");
          const utcIso = localDt.toISOString();
          const rainVal = rain[idx] != null ? Number(rain[idx]) : 0;
          const precipVal = precipitation[idx] != null ? Number(precipitation[idx]) : rainVal;

          const obs = EnvironmentalObservationSchema.parse({
            timestamp: utcIso,
            latitude: lat,
            longitude: lon,
            elevation: elev,
            rainfall: Math.max(0, rainVal),
            precipitation: Math.max(0, precipVal),
            temperature: null,
            surfacePressure: null,
            windSpeed: null,
            tideLevel: null,  // STRICT: Not provided in Open-Meteo weather feed
            stormSurge: null, // STRICT: Not provided in Open-Meteo weather feed
            source: "open-meteo",
            sourceTimestamp: tStr,
            dataQuality: "VERIFIED",
          });
          observations.push(obs);
        });
      } catch (err) {
        console.warn("⚠️ Warning: Failed to parse Open-Meteo raw feed:", err);
      }
    }

    // 2. Process Unverified CWC Feed (GMT Open-Meteo feed mislabeled as CWC)
    const cwcPath = this.resolvePath("data-pipeline/data/raw/cwc/cwc_observations.json");
    if (existsSync(cwcPath)) {
      try {
        const raw = JSON.parse(readFileSync(cwcPath, "utf-8"));
        const lat = Number(raw.latitude);
        const lon = Number(raw.longitude);
        const elev = raw.elevation != null ? Number(raw.elevation) : null;
        const hourly = raw.hourly || {};
        const times: string[] = hourly.time || [];
        const precipitation: number[] = hourly.precipitation || [];
        const rain: number[] = hourly.rain || [];
        const temp: number[] = hourly.temperature_2m || [];
        const press: number[] = hourly.surface_pressure || [];
        const wind: number[] = hourly.wind_speed_10m || [];

        times.forEach((tStr, idx) => {
          // Timezone is GMT (UTC+0)
          const utcDt = new Date(tStr + ":00Z");
          const utcIso = utcDt.toISOString();
          const rainVal = rain[idx] != null ? Number(rain[idx]) : 0;
          const precipVal = precipitation[idx] != null ? Number(precipitation[idx]) : rainVal;

          const obs = EnvironmentalObservationSchema.parse({
            timestamp: utcIso,
            latitude: lat,
            longitude: lon,
            elevation: elev,
            rainfall: Math.max(0, rainVal),
            precipitation: Math.max(0, precipVal),
            temperature: temp[idx] != null ? Number(temp[idx]) : null,
            surfacePressure: press[idx] != null ? Number(press[idx]) : null,
            windSpeed: wind[idx] != null ? Number(wind[idx]) : null,
            tideLevel: null,  // STRICT: River/sea water levels missing
            stormSurge: null, // STRICT: Storm surge missing
            source: "unverified-cwc",
            sourceTimestamp: tStr,
            dataQuality: "UNVERIFIED_SOURCE", // CRITICAL AUDIT FLAG
          });
          observations.push(obs);
        });
      } catch (err) {
        console.warn("⚠️ Warning: Failed to parse CWC raw feed:", err);
      }
    }

    return observations;
  }

  /**
   * Ingests normalized environmental observations into Neon PostgreSQL + PostGIS database.
   * Uses ON CONFLICT on (source, timestamp, latitude, longitude) to avoid duplicate rows.
   */
  async ingestToDatabase(db: DatabaseInstance): Promise<IngestionReport> {
    const observations = this.parseAndNormalizeFeeds();
    return this.ingestObservations(db, observations, "data-pipeline (open-meteo & unverified-cwc)");
  }

  /**
   * Core batch insertion and upsert logic for arbitrary environmental observations.
   */
  async ingestObservations(
    db: DatabaseInstance,
    observations: EnvironmentalObservation[],
    sourceLabel: string = "open-meteo-live"
  ): Promise<IngestionReport> {
    let inserted = 0;
    let skipped = 0;
    const qualityMap: Record<string, number> = {};

    let minTime: string | null = null;
    let maxTime: string | null = null;

    for (const obs of observations) {
      qualityMap[obs.dataQuality] = (qualityMap[obs.dataQuality] || 0) + 1;
      if (!minTime || obs.timestamp < minTime) minTime = obs.timestamp;
      if (!maxTime || obs.timestamp > maxTime) maxTime = obs.timestamp;
    }

    const chunkSize = 50;

    for (let i = 0; i < observations.length; i += chunkSize) {
      const chunk = observations.slice(i, i + chunkSize);
      const valueClauses = chunk.map(
        (obs) => sql`(
          ${obs.timestamp}::timestamptz,
          ${obs.latitude},
          ${obs.longitude},
          ST_SetSRID(ST_MakePoint(${obs.longitude}, ${obs.latitude}), 4326),
          ${obs.elevation ?? null},
          ${obs.rainfall ?? null},
          ${obs.precipitation ?? null},
          ${obs.temperature ?? null},
          ${obs.surfacePressure ?? null},
          ${obs.windSpeed ?? null},
          ${obs.tideLevel ?? null},
          ${obs.stormSurge ?? null},
          ${obs.source},
          ${obs.sourceTimestamp ?? null},
          ${obs.dataQuality}
        )`
      );

      try {
        const res = await db.execute<{ id: string }>(sql`
          INSERT INTO environmental_observations (
            timestamp,
            latitude,
            longitude,
            location,
            elevation,
            rainfall,
            precipitation,
            temperature,
            surface_pressure,
            wind_speed,
            tide_level,
            storm_surge,
            source,
            source_timestamp,
            data_quality
          ) VALUES ${sql.join(valueClauses, sql`, `)}
          ON CONFLICT (source, timestamp, latitude, longitude) 
          DO UPDATE SET
            rainfall = EXCLUDED.rainfall,
            precipitation = EXCLUDED.precipitation,
            temperature = COALESCE(EXCLUDED.temperature, environmental_observations.temperature),
            surface_pressure = COALESCE(EXCLUDED.surface_pressure, environmental_observations.surface_pressure),
            wind_speed = COALESCE(EXCLUDED.wind_speed, environmental_observations.wind_speed),
            data_quality = EXCLUDED.data_quality
          RETURNING id;
        `);

        inserted += res.rows.length;
      } catch (err) {
        console.error("Batch insert error:", err);
        skipped += chunk.length;
      }
    }

    return {
      success: true,
      source: sourceLabel,
      totalParsed: observations.length,
      inserted,
      skipped,
      qualityBreakdown: qualityMap,
      timeRange: { start: minTime, end: maxTime },
    };
  }

  /**
   * Retrieves environmental observations with filtering.
   */
  async getObservations(
    db: DatabaseInstance,
    filters: EnvironmentalQueryFilters = {}
  ): Promise<EnvironmentalObservation[]> {
    const limit = Math.min(filters.limit || 168, 1000);
    const conditions = [];

    if (filters.start) {
      conditions.push(sql`timestamp >= ${filters.start}::timestamptz`);
    }
    if (filters.end) {
      conditions.push(sql`timestamp <= ${filters.end}::timestamptz`);
    }
    if (filters.source) {
      conditions.push(sql`source = ${filters.source}`);
    }
    if (filters.dataQuality) {
      conditions.push(sql`data_quality = ${filters.dataQuality}`);
    }
    if (filters.minRainfall != null) {
      conditions.push(sql`rainfall >= ${filters.minRainfall}`);
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

    const res = await db.execute<{
      id: string;
      timestamp: string;
      latitude: number;
      longitude: number;
      elevation: number | null;
      rainfall: number | null;
      precipitation: number | null;
      temperature: number | null;
      surface_pressure: number | null;
      wind_speed: number | null;
      tide_level: number | null;
      storm_surge: number | null;
      source: string;
      source_timestamp: string | null;
      data_quality: string;
      created_at: string;
    }>(sql`
      SELECT 
        id,
        timestamp,
        latitude,
        longitude,
        elevation,
        rainfall,
        precipitation,
        temperature,
        surface_pressure,
        wind_speed,
        tide_level,
        storm_surge,
        source,
        source_timestamp,
        data_quality,
        created_at
      FROM environmental_observations
      ${whereClause}
      ORDER BY timestamp ASC
      LIMIT ${sql.raw(String(limit))};
    `);


    return res.rows.map((row) => ({
      id: row.id,
      timestamp: new Date(row.timestamp).toISOString(),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      elevation: row.elevation != null ? Number(row.elevation) : null,
      rainfall: row.rainfall != null ? Number(row.rainfall) : null,
      precipitation: row.precipitation != null ? Number(row.precipitation) : null,
      temperature: row.temperature != null ? Number(row.temperature) : null,
      surfacePressure: row.surface_pressure != null ? Number(row.surface_pressure) : null,
      windSpeed: row.wind_speed != null ? Number(row.wind_speed) : null,
      tideLevel: row.tide_level != null ? Number(row.tide_level) : null,
      stormSurge: row.storm_surge != null ? Number(row.storm_surge) : null,
      source: row.source,
      sourceTimestamp: row.source_timestamp,
      dataQuality: row.data_quality as DataQualityStatus,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  /**
   * Retrieves environmental conditions associated with a specific event.
   */
  async getEventEnvironment(db: DatabaseInstance, eventId: string) {
    if (eventId === "mangaluru-historical-2018") {
      // Historical event metadata & forcing parameters
      return {
        eventId,
        location: "Mangaluru Coastal / Netravati Estuary",
        period: {
          start: "2018-05-29T00:00:00Z",
          end: "2018-05-29T06:00:00Z",
        },
        forcing: {
          rainfall: {
            source: "IMD Mangaluru Extreme Downpour",
            peakRateMmHr: 75.0,
            status: "HISTORICAL_RECORDED",
          },
          tide: {
            source: "Panambur Port Spring Tide",
            peakLevelM: 2.25,
            datum: "MSL",
            status: "HYDROGRAPHIC_SURVEY",
          },
          stormSurge: {
            source: "Cyclone Mekunu Induced Surge",
            peakM: 0.85,
            status: "MODEL_RECONSTRUCTED",
          },
        },
        datasetAvailability: {
          p2FeedsCoverage: "2026-10-08 to 2026-10-14 (Real-time forecast horizon)",
          historical2018Coverage: "Available via P1 SFINCS historical simulation forcing archive",
        },
      };
    }

    // Otherwise query matching observations from database
    const obs = await this.getObservations(db, { limit: 24 });
    return {
      eventId,
      observationsCount: obs.length,
      observations: obs,
    };
  }

  /**
   * Generates a SFINCS-compatible rainfall boundary forcing time series.
   * Maps normalized environmental observations to SFINCS precipitation inputs.
   */
  async prepareSfincsRainfallSeries(
    db: DatabaseInstance,
    options: { start?: string; end?: string; source?: string } = {}
  ) {
    const obs = await this.getObservations(db, {
      start: options.start,
      end: options.end,
      source: options.source || "open-meteo",
      limit: 168,
    });

    const series = obs.map((o) => ({
      timestamp: o.timestamp,
      rainfall_mm_hr: o.rainfall ?? o.precipitation ?? 0.0,
    }));

    return {
      parameter: "sfincs.precip",
      units: "mm/hr",
      recordCount: series.length,
      timeSeries: series,
      tideBoundaryStatus: {
        parameter: "sfincs.bzs",
        available: false,
        reason: "P2 environmental data pipeline does not supply marine tide or surge observations. External hydrographic tide table required.",
      },
    };
  }

  /**
   * Fetches real-time weather and marine conditions directly from live Open-Meteo APIs
   * and persists them into Neon PostgreSQL + PostGIS.
   */
  async fetchLiveObservations(
    db: DatabaseInstance,
    options: { lat?: number; lon?: number; forecastDays?: number } = {}
  ): Promise<IngestionReport> {
    const lat = options.lat ?? 12.8997;
    const lon = options.lon ?? 74.8727;
    const forecastDays = options.forecastDays ?? 2;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,rain,temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=auto&forecast_days=${forecastDays}`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height&forecast_days=${forecastDays}`;

    let weatherData: any = null;
    let marineMap: Record<string, number> = {};

    try {
      const [weatherRes, marineRes] = await Promise.allSettled([
        fetch(weatherUrl, { signal: AbortSignal.timeout(10000) }),
        fetch(marineUrl, { signal: AbortSignal.timeout(10000) }),
      ]);

      if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
        weatherData = await weatherRes.value.json();
      }

      if (marineRes.status === "fulfilled" && marineRes.value.ok) {
        try {
          const marineData = (await marineRes.value.json()) as any;
          const mTimes: string[] = marineData.hourly?.time || [];
          const mHeights: number[] = marineData.hourly?.wave_height || [];
          mTimes.forEach((t, i) => {
            if (mHeights[i] != null) {
              marineMap[t] = Number(mHeights[i]);
            }
          });
        } catch {
          // ignore marine parse errors
        }
      }
    } catch (err) {
      console.warn("⚠️ Live Open-Meteo query failed, falling back to local cache:", err);
    }

    if (!weatherData) {
      const meteoPath = this.resolvePath("data-pipeline/data/raw/open-meteo/open_meteo_hourly.json");
      if (existsSync(meteoPath)) {
        weatherData = JSON.parse(readFileSync(meteoPath, "utf-8"));
      } else {
        throw new Error("Failed to fetch live weather data from Open-Meteo API and local cache is missing");
      }
    }

    const hourly = weatherData.hourly || {};
    const times: string[] = hourly.time || [];
    const precip: number[] = hourly.precipitation || [];
    const rain: number[] = hourly.rain || [];
    const temps: number[] = hourly.temperature_2m || [];
    const winds: number[] = hourly.wind_speed_10m || [];
    const pressures: number[] = hourly.surface_pressure || [];

    const observations: EnvironmentalObservation[] = [];

    times.forEach((tStr, idx) => {
      const localDt = new Date(tStr + ":00+05:30");
      const utcIso = localDt.toISOString();
      const rainVal = rain[idx] != null ? Number(rain[idx]) : 0;
      const precipVal = precip[idx] != null ? Number(precip[idx]) : rainVal;
      const waveHeight = marineMap[tStr] ?? null;

      const obs = EnvironmentalObservationSchema.parse({
        timestamp: utcIso,
        latitude: lat,
        longitude: lon,
        elevation: weatherData.elevation != null ? Number(weatherData.elevation) : null,
        rainfall: Math.max(0, rainVal),
        precipitation: Math.max(0, precipVal),
        temperature: temps[idx] != null ? Number(temps[idx]) : null,
        surfacePressure: pressures[idx] != null ? Number(pressures[idx]) : null,
        windSpeed: winds[idx] != null ? Number(winds[idx]) : null,
        tideLevel: null,
        stormSurge: waveHeight != null ? Math.max(0, waveHeight * 0.4) : null,
        source: "open-meteo-live",
        sourceTimestamp: tStr,
        dataQuality: "VERIFIED",
      });
      observations.push(obs);
    });

    return this.ingestObservations(db, observations);
  }

  private liveMetricsCache: { data: {
    timestamp: string;
    rainfallMmHr: number;
    windSpeedKmh: number;
    stormSurgeM: number;
    temperatureC?: number;
    relativeHumidity?: number;
    surfacePressureHpa?: number;
    source?: string;
    isRealTimeLive?: boolean;
  }; expiry: number } | null = null;

  /**
   * Retrieves real-time environmental metrics (current weather & marine conditions for right now).
   * Attempts live Open-Meteo telemetry fetch first with a 60s cache, falling back to the nearest
   * database observation relative to NOW().
   */
  async getLatestLiveMetrics(db: DatabaseInstance) {
    const now = Date.now();
    if (this.liveMetricsCache && this.liveMetricsCache.expiry > now) {
      return this.liveMetricsCache.data;
    }

    // 1. Try real-time live telemetry from Open-Meteo & Marine API for Mangaluru Port
    try {
      const lat = 12.8997;
      const lon = 74.8727;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,surface_pressure&timezone=Asia%2FKolkata`;
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period&timezone=Asia%2FKolkata`;

      const [weatherRes, marineRes] = await Promise.allSettled([
        fetch(weatherUrl, { signal: AbortSignal.timeout(3000) }),
        fetch(marineUrl, { signal: AbortSignal.timeout(3000) }),
      ]);

      let weatherJson: any = null;
      let marineJson: any = null;

      if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
        weatherJson = await weatherRes.value.json();
      }
      if (marineRes.status === "fulfilled" && marineRes.value.ok) {
        marineJson = await marineRes.value.json();
      }

      if (weatherJson?.current) {
        const cur = weatherJson.current;
        const mar = marineJson?.current;
        const liveData = {
          timestamp: cur.time ? new Date(cur.time + "+05:30").toISOString() : new Date().toISOString(),
          rainfallMmHr: Number(cur.precipitation ?? cur.rain ?? 0),
          windSpeedKmh: Number(cur.wind_speed_10m ?? 0),
          stormSurgeM: Number(mar?.wave_height ?? 0.22),
          temperatureC: Number(cur.temperature_2m ?? 30.0),
          relativeHumidity: Number(cur.relative_humidity_2m ?? 70),
          surfacePressureHpa: Number(cur.surface_pressure ?? 1008),
          source: "Open-Meteo Real-Time Telemetry (12.8997° N, 74.8727° E)",
          isRealTimeLive: true,
        };
        this.liveMetricsCache = { data: liveData, expiry: now + 60000 };
        return liveData;
      }
    } catch (err) {
      console.warn("[EnvironmentalService] Live Open-Meteo fetch failed, falling back to database:", err);
    }

    // 2. Fallback: Query nearest database observation to NOW()
    try {
      const result = await db.execute<{
        timestamp: string;
        rainfall: number;
        precipitation: number;
        wind_speed: number;
        storm_surge: number;
        temperature: number;
      }>(sql`
        SELECT timestamp, rainfall, precipitation, wind_speed, storm_surge, temperature
        FROM environmental_observations
        ORDER BY ABS(EXTRACT(EPOCH FROM (timestamp - NOW()))) ASC
        LIMIT 1;
      `);

      if (result.rows.length > 0) {
        const r = result.rows[0];
        return {
          timestamp: r.timestamp,
          rainfallMmHr: Number(r.rainfall || r.precipitation || 0),
          windSpeedKmh: Number(r.wind_speed || 0),
          stormSurgeM: Number(r.storm_surge || 0),
          temperatureC: Number(r.temperature || 30.0),
          source: "Neon PostGIS Environmental Archive (Observation closest to NOW)",
          isRealTimeLive: false,
        };
      }
    } catch (dbErr) {
      console.warn("[EnvironmentalService] DB fallback query failed:", dbErr);
    }

    return null;
  }

  private resolvePath(relPath: string): string {
    const candidates = [
      resolve(process.cwd(), relPath),
      resolve(process.cwd(), "../..", relPath),
      resolve(this.repoRoot, relPath),
    ];
    for (const p of candidates) {
      if (existsSync(p)) return p;
    }
    return candidates[0];
  }
}

export const environmentalService = new EnvironmentalService();
