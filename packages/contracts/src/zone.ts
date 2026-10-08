import { z } from "zod";

export const GeoJsonGeometrySchema = z.object({
  type: z.string(),
  coordinates: z.array(z.unknown()),
});

export const ZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  elevation: z.number().nullable().optional(),
  geometry: z.union([GeoJsonGeometrySchema, z.string()]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Zone = z.infer<typeof ZoneSchema>;
