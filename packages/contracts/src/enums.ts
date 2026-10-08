import { z } from "zod";

export const SeverityLevelEnum = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export const SeverityLevelSchema = z.enum(SeverityLevelEnum);
export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;

export const UserRoleEnum = ["citizen", "responder", "municipality", "admin"] as const;
export const UserRoleSchema = z.enum(UserRoleEnum);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const FacilityTypeEnum = [
  "hospital",
  "shelter",
  "fire_station",
  "police_station",
  "school",
  "other",
] as const;
export const FacilityTypeSchema = z.enum(FacilityTypeEnum);
export type FacilityType = z.infer<typeof FacilityTypeSchema>;

export const DashboardModeEnum = [
  "LIVE_FORECAST",
  "HISTORICAL_REPLAY",
  "SCENARIO",
] as const;
export const DashboardModeSchema = z.enum(DashboardModeEnum);
export type DashboardMode = z.infer<typeof DashboardModeSchema>;
