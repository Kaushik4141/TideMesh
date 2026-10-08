import { z } from "zod";
import { UserRoleSchema } from "./enums.js";

export const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  role: UserRoleSchema,
  location: z.record(z.string(), z.unknown()).nullable().optional(),
  notificationPreferences: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;
