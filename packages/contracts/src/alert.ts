import { z } from "zod";
import { SeverityLevelSchema } from "./enums.js";

export const AlertSchema = z.object({
  id: z.string().optional(),
  zoneId: z.string().min(1),
  severity: SeverityLevelSchema,
  message: z.string().min(1),
  recommendedActions: z.array(z.string()),
  createdAt: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
});
export type Alert = z.infer<typeof AlertSchema>;
