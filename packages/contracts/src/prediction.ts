import { z } from "zod";
import { SeverityLevelSchema } from "./enums.js";
import { GeoJsonGeometrySchema } from "./zone.js";

export const RiskDriverSchema = z.object({
  factor: z.string(),
  contribution: z.number().min(0).max(1),
  description: z.string().optional(),
});
export type RiskDriver = z.infer<typeof RiskDriverSchema>;

export const FloodPredictionSchema = z.object({
  id: z.string().optional(),
  eventId: z.string().nullable().optional(),
  zoneId: z.string().min(1),
  timestamp: z.string(),
  probability: z.number().min(0).max(1).nullable().optional(),
  isDeterministic: z.boolean().optional(),
  severity: SeverityLevelSchema,
  onset: z.string().nullable().optional(),
  peak: z.string().nullable().optional(),
  depthMin: z.number().min(0).nullable().optional(),
  depthMax: z.number().min(0).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  modelVersion: z.string().optional(),
  source: z.string().optional(),
  floodGeometry: GeoJsonGeometrySchema.nullable().optional(),
  metrics: z.record(z.string(), z.any()).optional(),
  forcing: z.record(z.string(), z.any()).optional(),
  drivers: z.array(RiskDriverSchema).optional(),
});
export type FloodPrediction = z.infer<typeof FloodPredictionSchema>;


