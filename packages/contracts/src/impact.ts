import { z } from "zod";

export const FloodImpactSchema = z.object({
  id: z.string().optional(),
  predictionId: z.string().min(1),
  zoneId: z.string().optional(),
  affectedPopulation: z.number().int().nonnegative().nullable().optional(),
  affectedBuildingsCount: z.number().int().nonnegative().nullable().optional(),
  affectedRoadsCount: z.number().int().nonnegative().nullable().optional(),
  criticalFacilitiesCount: z.number().int().nonnegative().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type FloodImpact = z.infer<typeof FloodImpactSchema>;
