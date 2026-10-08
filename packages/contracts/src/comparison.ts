import { z } from "zod";
import { GeoJsonGeometrySchema } from "./zone.js";
import { ResponsePrioritySchema } from "./priority.js";

// Scenario forcing controls retain the existing runner's units and bounds.
export const ScenarioInputsSchema = z.object({
  rainfallRateMmHr: z.number().finite().min(0).max(300),
  surgeLevelM: z.number().finite().min(0).max(5),
  durationHours: z.number().int().min(1).max(12),
}).strict();
export const ComparisonRequestSchema = z.object({
  baselineRunId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  scenario: ScenarioInputsSchema.omit({ durationHours: true }),
}).strict();

export const RunSnapshotSchema = z.object({
  runId: z.string().min(1),
  generatedAt: z.string().nullable(), // null for legacy artifacts without execution provenance
  simulationStart: z.string(),
  simulationEnd: z.string(),
  modelVersion: z.string().nullable(), // reported artifact version, not independently validated
  inputs: ScenarioInputsSchema.nullable(), // never infer numeric inputs from prose
  rainfallSeries: z.array(z.number().finite().nonnegative()).nullable(),
  waterLevelSeries: z.array(z.number().finite()).nullable(),
  artifactIds: z.array(z.string()), // stable relative references, never host paths
  floodGeometry: GeoJsonGeometrySchema.nullable(),
  maximumDepthM: z.number().finite().nonnegative().nullable(),
  gridResolutionM: z.number().positive().nullable(),
  floodThresholdM: z.number().nonnegative().nullable(),
  qualityNotes: z.array(z.string()),
});
export const ImpactMetricsSchema = z.object({
  inundatedAreaKm2: z.number().finite().nonnegative().nullable(),
  maximumDepthM: z.number().finite().nonnegative().nullable(),
  affectedRoads: z.number().int().nonnegative().nullable(),
  affectedBuildings: z.number().int().nonnegative().nullable(),
  affectedFacilities: z.number().int().nonnegative().nullable(),
  populationExposureEstimate: z.number().nonnegative().nullable(),
});
export const AssetImpactSchema = z.object({
  id: z.string(),
  kind: z.enum(["road", "building", "facility"]),
  name: z.string().nullable(),
  geometry: GeoJsonGeometrySchema,
  baselineAffected: z.boolean(),
  scenarioAffected: z.boolean(),
});
export const ComparisonRunSchema = RunSnapshotSchema.extend({
  metrics: ImpactMetricsSchema,
  priorities: z.array(ResponsePrioritySchema).nullable(), // null: no executable scoring methodology
});
export const ComparisonSchema = z.object({
  comparisonId: z.string(),
  createdAt: z.string(),
  mode: z.literal("HYPOTHETICAL_SCENARIO"),
  baseline: ComparisonRunSchema,
  scenario: ComparisonRunSchema,
  delta: z.object({
    inundatedAreaKm2: z.number().finite().nullable(),
    maximumDepthM: z.number().finite().nullable(),
    affectedRoads: z.number().int().nullable(),
    affectedBuildings: z.number().int().nullable(),
    affectedFacilities: z.number().int().nullable(),
    newlyAffectedAssets: z.array(AssetImpactSchema).nullable(),
    newlyInundatedGeometry: GeoJsonGeometrySchema.nullable(),
  }),
  assets: z.array(AssetImpactSchema).nullable(),
  explanations: z.array(z.string()),
  dataQuality: z.object({
    areaMethod: z.string(),
    infrastructureSource: z.string().nullable(),
    populationSource: z.string().nullable(),
    priorityMethod: z.string().nullable(),
    persistence: z.enum(["database", "unavailable"]),
    warnings: z.array(z.string()),
  }),
});
export type ComparisonRequest = z.infer<typeof ComparisonRequestSchema>;
export type RunSnapshot = z.infer<typeof RunSnapshotSchema>;
export type ScenarioInputs = z.infer<typeof ScenarioInputsSchema>;
export type Comparison = z.infer<typeof ComparisonSchema>;
export type AssetImpact = z.infer<typeof AssetImpactSchema>;
