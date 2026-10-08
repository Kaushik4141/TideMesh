import { z } from "zod";
import { SeverityLevelSchema } from "./enums.js";

export const ResponsePrioritySchema = z.object({
  id: z.string().optional(),
  zoneId: z.string().min(1),
  score: z.number().min(0),
  rank: z.number().int().positive(),
  severity: SeverityLevelSchema,
  reason: z.string().optional(),
  recommendedActions: z.array(z.string()),
  createdAt: z.string().optional(),
});
export type ResponsePriority = z.infer<typeof ResponsePrioritySchema>;
