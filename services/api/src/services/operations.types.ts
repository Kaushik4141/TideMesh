import { z } from "zod";

const identifier = z.string().trim().min(1).max(128);
export const UtcTimestampSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/)
  .refine((value) => {
    const time = Date.parse(value);
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19);
  }, "A real ISO UTC timestamp is required");
const ring = z.array(z.tuple([z.number().finite().min(-180).max(180), z.number().finite().min(-90).max(90)]))
  .min(4).max(256);
export const GeometrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Polygon"), coordinates: z.array(ring).min(1).max(16) }).strict(),
  z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(z.array(ring).min(1).max(16)).min(1).max(32) }).strict(),
]);
export type Geometry = z.infer<typeof GeometrySchema>;

export const JurisdictionSchema = z.object({
  id: identifier,
  name: z.string().trim().min(1).max(200),
  geometry: GeometrySchema,
  boundaryStatus: z.enum(["approximate-unverified", "verified"]),
  boundarySource: z.string().trim().min(1).max(1000),
  teamIds: z.array(identifier).max(100).optional(),
  modelStatus: z.enum(["available", "unavailable"]).default("unavailable"),
  modelId: identifier.nullable().default(null),
}).strict();
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;
export const JurisdictionPublicationSchema = z.object({
  id: identifier,
  name: z.string().trim().min(1).max(200),
  geometry: GeometrySchema,
  boundaryStatus: z.literal("verified"),
  boundarySource: z.string().trim().min(1).max(1000),
  teamIds: z.array(identifier).max(100).optional(),
}).strict();

/** Membership and administrative authority are read from server configuration only. */
export const OperationsUserSchema = z.object({
  id: identifier,
  name: z.string().trim().min(1).max(200),
  teamId: identifier,
  jurisdictionIds: z.array(identifier).max(100),
  canRunScenarios: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
}).strict();
export type OperationsUser = {
  id: string;
  name: string;
  teamId: string;
  jurisdictionIds: string[];
  canRunScenarios: boolean;
  isAdmin?: boolean;
};
export type PublicOperationsUser = Pick<OperationsUser, "id" | "name" | "teamId" | "jurisdictionIds"> & { canRunScenarios: false };

export const ScenarioInputSchema = z.object({
  jurisdictionId: identifier.optional(),
  durationHours: z.number().finite().positive().max(6),
  rainfallRateMmHr: z.number().finite().min(0).max(300).optional(),
  surgeLevelM: z.number().finite().min(-2).max(10).optional(),
}).strict();
export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;

export const FloodFeatureSchema = z.object({
  type: z.literal("Feature"),
  id: identifier.optional(),
  geometry: GeometrySchema,
  properties: z.object({
    severity: z.enum(["HIGH", "CRITICAL", "MODERATE", "LOW"]),
    depthMinM: z.number().finite().min(0).max(100).optional(),
    depthMaxM: z.number().finite().min(0).max(100).optional(),
  }).strict().refine((p) => p.depthMinM === undefined || p.depthMaxM === undefined || p.depthMinM <= p.depthMaxM,
    "Depth minimum must not exceed maximum"),
}).strict();
export const ForecastPublicationSchema = z.object({
  id: identifier,
  basinId: identifier,
  modelId: identifier,
  generatedAt: UtcTimestampSchema,
  validFrom: UtcTimestampSchema,
  validUntil: UtcTimestampSchema,
  validationStatus: z.literal("validated"),
  purpose: z.literal("operational"),
  inputs: z.array(z.object({ source: z.string().trim().min(1).max(1000), observedAt: UtcTimestampSchema }).strict()).min(1).max(100),
  frames: z.array(z.object({
    validAt: UtcTimestampSchema,
    waterLevelChangeM: z.number().finite().min(-100).max(100).optional(),
    dischargeM3s: z.number().finite().min(0).max(10000000).optional(),
    floodExtent: z.object({ type: z.literal("FeatureCollection"), features: z.array(FloodFeatureSchema).max(500) }).strict(),
  }).strict()).min(1).max(25),
}).strict();
export type OfficialForecast = z.infer<typeof ForecastPublicationSchema>;
export type OperationsAlert = {
  id: string;
  hazardKey: string;
  hazard: "flood";
  basinId: string;
  jurisdictionId: string;
  forecastId: string;
  severity: "HIGH" | "CRITICAL";
  geometry: Geometry;
  createdAt: string;
  validUntil: string;
  acknowledgedAt: string | null;
  acknowledgedBy: { id: string; name: string; teamId: string } | null;
};
export type OperationsState = {
  schemaVersion: 1;
  jurisdictions: Jurisdiction[];
  teams: unknown[];
  users: OperationsUser[];
  jobs: never[];
  forecasts: OfficialForecast[];
  alerts: OperationsAlert[];
};
export type OperationsBindings = {
  OPERATIONS_DATA_DIR?: string;
  OPERATIONS_PUBLISHER_TOKEN?: string;
  OPERATIONS_AUTH_TOKEN?: string;
  OPERATIONS_AUTH_USER_JSON?: string;
  OPERATIONS_MODEL_ID?: string;
  OPERATIONS_MODEL_STATUS?: string;
  /** Legacy setting is ignored: execution is always disabled in laptop-safe mode. */
  ALLOW_LOCAL_SCENARIO_JOBS?: string;
};
export type OperationsContextEnv = {
  Bindings: OperationsBindings;
  Variables: { operationsUser?: OperationsUser };
};
export type ScenarioAccess = { user: OperationsUser; jurisdiction: Jurisdiction };
export type LatestForecastResponse = {
  success: true;
  forecast: OfficialForecast | null;
  status: "available" | "stale" | "unavailable";
  reason?: string;
};
export type AlertsResponse = {
  success: true;
  alerts: OperationsAlert[];
  status: "available" | "unavailable";
  reason?: string;
};
export type OperationsContextResponse = {
  success: true;
  status: "pilot" | "operational";
  user: PublicOperationsUser | null;
  canRunScenarios: false;
  jurisdiction: Jurisdiction;
  jurisdictions: Jurisdiction[];
  modelStatus: Jurisdiction["modelStatus"];
  boundaryStatus: Jurisdiction["boundaryStatus"];
  notices: string[];
  resources: { forecasts: string; jurisdictions: string; alerts: string };
};
