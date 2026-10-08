import { z } from "zod";

export const EnvironmentalSourceSchema = z.enum([
  "open-meteo",
  "cwc",
  "station",
  "noaa",
]);
export type EnvironmentalSource = z.infer<typeof EnvironmentalSourceSchema>;

export const EnvironmentalObservationSchema = z.object({
  timestamp: z.string(),

  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),

  rainfallMm: z.number().nullable(),
  rainMm: z.number().nullable(),

  temperatureC: z.number().nullable().optional(),
  surfacePressureHpa: z.number().nullable().optional(),
  windSpeedKmh: z.number().nullable().optional(),

  elevationM: z.number().nullable(),

  source: EnvironmentalSourceSchema,
  sourceTimezone: z.string().nullable().optional(),

  dataQuality: z.enum(["valid", "warning", "invalid"]).default("valid"),
});

export type EnvironmentalObservation = z.infer<
  typeof EnvironmentalObservationSchema
>;