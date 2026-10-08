import { z } from "zod";

/**
 * Data quality indicator reflecting source verification and data health.
 * Used to explicitly distinguish verified sensors from unverified / mock data sources.
 */
export const DataQualityStatusSchema = z.enum([
  "VERIFIED",
  "UNVERIFIED_SOURCE",
  "RAW",
  "IMPUTED",
  "SUSPECT",
]);
export type DataQualityStatus = z.infer<typeof DataQualityStatusSchema>;

/**
 * Canonical Environmental Observation Schema
 * Represents standardized meteorological and coastal observations.
 * 
 * Rules:
 * - Timestamps are strictly normalized to ISO-8601 UTC.
 * - Variables not present in raw sources (e.g. tideLevel, stormSurge in weather feeds)
 *   MUST remain null/optional. Never fake values.
 */
export const EnvironmentalObservationSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string().describe("Standardized ISO-8601 UTC timestamp (YYYY-MM-DDTHH:mm:ssZ)"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number().nullable().optional(),

  // Atmospheric / Hydrometeorological observations
  rainfall: z.number().min(0).nullable().optional().describe("Rainfall in mm"),
  precipitation: z.number().min(0).nullable().optional().describe("Precipitation in mm"),
  temperature: z.number().nullable().optional().describe("Air temperature in °C"),
  surfacePressure: z.number().nullable().optional().describe("Surface atmospheric pressure in hPa"),
  windSpeed: z.number().min(0).nullable().optional().describe("Wind speed in km/h"),

  // Coastal / Hydrodynamic observations (nullable - do NOT fabricate)
  tideLevel: z.number().nullable().optional().describe("Water / tide level in meters MSL (null if unmeasured)"),
  stormSurge: z.number().nullable().optional().describe("Storm surge in meters (null if unmeasured)"),

  // Data provenance & auditability
  source: z.string().describe("Identifies data provider or sensor feed (e.g., 'open-meteo', 'unverified-cwc')"),
  sourceTimestamp: z.string().nullable().optional().describe("Original timestamp from the raw feed before UTC conversion"),
  dataQuality: DataQualityStatusSchema.default("RAW"),
  createdAt: z.string().optional(),
});

export type EnvironmentalObservation = z.infer<typeof EnvironmentalObservationSchema>;

/**
 * Batch ingestion and query response container with audit summary.
 */
export const EnvironmentalObservationBatchSchema = z.object({
  source: z.string(),
  totalRecords: z.number(),
  validRecords: z.number(),
  invalidRecords: z.number(),
  warnings: z.array(z.string()).default([]),
  observations: z.array(EnvironmentalObservationSchema),
});

export type EnvironmentalObservationBatch = z.infer<typeof EnvironmentalObservationBatchSchema>;
