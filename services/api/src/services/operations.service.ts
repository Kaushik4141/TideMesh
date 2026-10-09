import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { OperationsRepository } from "./operations.repository.js";
import { areaKm2, intersection, materialExtentChange, validateGeometry } from "./operations.geometry.js";
import {
  ForecastPublicationSchema, JurisdictionPublicationSchema, OperationsUserSchema, ScenarioInputSchema,
  type AlertsResponse, type Jurisdiction, type LatestForecastResponse, type OfficialForecast,
  type OperationsAlert, type OperationsBindings, type OperationsContextEnv, type OperationsContextResponse,
  type OperationsState, type OperationsUser, type ScenarioAccess, type ScenarioInput, type PublicOperationsUser,
} from "./operations.types.js";

export const PILOT_BOUNDARY_NOTICE = "The Mangaluru pilot boundary is approximate and unverified; it must not be used for operational alerting.";
export const FORECAST_UNAVAILABLE_REASON = "No validated operational forecast is configured for the Mangaluru pilot.";
export const ALERTS_UNAVAILABLE_REASON = "Alerting is unavailable until a validated forecast and verified jurisdiction boundary are configured.";
const SCENARIOS_UNAVAILABLE_REASON = "Scenario execution is disabled in laptop-safe mode; no job was queued.";
const DEFAULT_MANGALURU_PILOT: Jurisdiction = {
  id: "mangaluru", name: "Mangaluru pilot (approximate/unverified)", geometry: { type: "Polygon", coordinates: [[[74.80, 12.80], [74.95, 12.80], [74.95, 12.95], [74.80, 12.95], [74.80, 12.80]]] },
  boundaryStatus: "approximate-unverified", boundarySource: "local-pilot-approximation-unverified", modelStatus: "unavailable", modelId: null,
};
const emptyState = (): OperationsState => ({ schemaVersion: 1, jurisdictions: [DEFAULT_MANGALURU_PILOT], teams: [], users: [], jobs: [], forecasts: [], alerts: [] });

function envValue(env: OperationsBindings = {}, key: keyof OperationsBindings): string | undefined {
  const value = env[key] ?? process.env[key];
  return typeof value === "string" && value.length ? value : undefined;
}
function parseJson(value: string | undefined, label: string): unknown {
  if (!value) return undefined;
  try { return JSON.parse(value); } catch { throw new HTTPException(500, { message: `${label} is not valid JSON` }); }
}
function configuredUser(env: OperationsBindings): OperationsUser | undefined {
  const raw = parseJson(envValue(env, "OPERATIONS_AUTH_USER_JSON"), "OPERATIONS_AUTH_USER_JSON");
  if (raw === undefined) return undefined;
  const parsed = OperationsUserSchema.safeParse(raw);
  if (!parsed.success) throw new HTTPException(500, { message: "Configured operations user is invalid" });
  return parsed.data;
}
function token(c: Context<OperationsContextEnv>): string | undefined { return c.req.header("Authorization")?.match(/^Bearer\s+([^\s]+)$/i)?.[1]; }
function equalSecret(actual: string | undefined, expected: string | undefined): boolean {
  if (!actual || !expected) return false;
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(actual), digest(expected));
}
function ensureRepositoryConfigured(env: OperationsBindings): string {
  const directory = envValue(env, "OPERATIONS_DATA_DIR");
  if (!directory) throw new HTTPException(503, { message: "Operations persistence is unavailable; configure OPERATIONS_DATA_DIR" });
  return directory;
}
function publicUser(user: OperationsUser | undefined): PublicOperationsUser | null {
  return user ? { id: user.id, name: user.name, teamId: user.teamId, jurisdictionIds: user.jurisdictionIds, canRunScenarios: false } : null;
}
function isPast(value: string, now: number): boolean { return Date.parse(value) < now; }
function validateTimes(forecast: OfficialForecast, now: number): void {
  const generated = Date.parse(forecast.generatedAt), from = Date.parse(forecast.validFrom), until = Date.parse(forecast.validUntil);
  if (!isPast(forecast.generatedAt, now) || now - generated > 60 * 60_000) throw new Error("generatedAt must be in the past no more than 60 minutes");
  if (until <= from || until - from > 6 * 60 * 60_000 || forecast.frames[0] === undefined || Date.parse(forecast.frames[0].validAt) < from || Date.parse(forecast.frames.at(-1)!.validAt) > until) throw new Error("Forecast validity interval is invalid");
  if (Math.abs(Date.parse(forecast.frames[0].validAt) - now) > 15 * 60_000 || Date.parse(forecast.frames.at(-1)!.validAt) - now > 6 * 60 * 60_000) throw new Error("Forecast frame horizon is invalid");
  if (forecast.inputs.some((input) => now - Date.parse(input.observedAt) > 6 * 60 * 60_000 || Date.parse(input.observedAt) > now)) throw new Error("Forecast input freshness is invalid");
  for (let i = 1; i < forecast.frames.length; i++) if (Date.parse(forecast.frames[i].validAt) <= Date.parse(forecast.frames[i - 1].validAt)) throw new Error("Forecast frames must be ordered");
}

export function authenticatedOperationsUser(c: Context<OperationsContextEnv>): OperationsUser | undefined {
  const requestUser = c.get("operationsUser");
  if (requestUser) { const parsed = OperationsUserSchema.safeParse(requestUser); return parsed.success ? parsed.data : undefined; }
  if (!equalSecret(token(c), envValue(c.env ?? {}, "OPERATIONS_AUTH_TOKEN"))) return undefined;
  return configuredUser(c.env ?? {});
}
export function requireAuthenticated(c: Context<OperationsContextEnv>): OperationsUser {
  const user = authenticatedOperationsUser(c);
  if (!user) throw new HTTPException(401, { message: "Authenticated operations user is required" });
  return user;
}
export function validateScenarioInput(input: unknown) { return ScenarioInputSchema.safeParse(input); }
export function isScenarioDurationAllowed(durationHours: unknown): durationHours is number { return typeof durationHours === "number" && Number.isFinite(durationHours) && durationHours > 0 && durationHours <= 6; }

export class OperationsService {
  private readonly repositories = new Map<string, OperationsRepository>();
  constructor(private readonly clock: () => Date = () => new Date(), private readonly repositoryFactory: (directory: string) => OperationsRepository = (directory) => new OperationsRepository(directory)) {}
  private async repository(env: OperationsBindings): Promise<OperationsRepository> {
    const directory = ensureRepositoryConfigured(env);
    let repository = this.repositories.get(directory);
    if (!repository) { repository = this.repositoryFactory(directory); await repository.initialize(emptyState()); this.repositories.set(directory, repository); }
    return repository;
  }
  private configuredJurisdictions(env: OperationsBindings): Jurisdiction[] {
    const modelId = envValue(env, "OPERATIONS_MODEL_ID");
    const modelStatus = envValue(env, "OPERATIONS_MODEL_STATUS") === "available" && modelId ? "available" : "unavailable";
    return [{ ...DEFAULT_MANGALURU_PILOT, modelStatus, modelId: modelStatus === "available" ? modelId! : null }];
  }
  context(env: OperationsBindings, user?: OperationsUser): OperationsContextResponse {
    const jurisdictions = this.configuredJurisdictions(env);
    return { success: true, status: "pilot", user: publicUser(user), canRunScenarios: false, jurisdiction: jurisdictions[0], jurisdictions, modelStatus: jurisdictions[0].modelStatus, boundaryStatus: jurisdictions[0].boundaryStatus,
      notices: [PILOT_BOUNDARY_NOTICE, "Laptop-safe mode disables scenario execution."], resources: { forecasts: "/forecasts/latest", jurisdictions: "/jurisdictions", alerts: "/alerts" } };
  }
  async listJurisdictions(env: OperationsBindings): Promise<Jurisdiction[]> {
    if (!envValue(env, "OPERATIONS_DATA_DIR")) return this.configuredJurisdictions(env);
    return (await (await this.repository(env)).read()).jurisdictions;
  }
  async latestForecast(env: OperationsBindings): Promise<LatestForecastResponse> {
    if (!envValue(env, "OPERATIONS_DATA_DIR")) return { success: true, forecast: null, status: "unavailable", reason: FORECAST_UNAVAILABLE_REASON };
    const repository = await this.repository(env);
    const forecasts = (await repository.read()).forecasts;
    const forecast = forecasts.slice().sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))[0] ?? null;
    if (!forecast) return { success: true, forecast: null, status: "unavailable", reason: FORECAST_UNAVAILABLE_REASON };
    return { success: true, forecast, status: Date.parse(forecast.validUntil) > this.clock().getTime() ? "available" : "stale", reason: Date.parse(forecast.validUntil) > this.clock().getTime() ? undefined : "The latest forecast has expired." };
  }
  async publishForecast(env: OperationsBindings, body: unknown, publisherToken: string | undefined): Promise<OfficialForecast> {
    if (!equalSecret(publisherToken, envValue(env, "OPERATIONS_PUBLISHER_TOKEN"))) throw new HTTPException(401, { message: "Publisher bearer token is required" });
    const parsed = ForecastPublicationSchema.safeParse(body);
    if (!parsed.success) throw new HTTPException(422, { message: `Forecast payload is invalid: ${parsed.error.issues[0]?.message ?? "invalid payload"}` });
    try { validateTimes(parsed.data, this.clock().getTime()); for (const frame of parsed.data.frames) for (const feature of frame.floodExtent.features) validateGeometry(feature.geometry); }
    catch (error) { throw new HTTPException(422, { message: error instanceof Error ? error.message : "Forecast geometry or time is invalid" }); }
    const repository = await this.repository(env);
    await repository.mutate((state) => { if (state.forecasts.some((forecast) => forecast.id === parsed.data.id)) throw new HTTPException(409, { message: "Forecast id already exists" }); state.forecasts.push(parsed.data); });
    return parsed.data;
  }
  async publishJurisdiction(c: Context<OperationsContextEnv>, body: unknown): Promise<Jurisdiction> {
    const user = requireAuthenticated(c); if (!user.isAdmin) throw new HTTPException(403, { message: "Jurisdiction administration is required" });
    const parsed = JurisdictionPublicationSchema.safeParse(body);
    if (!parsed.success) throw new HTTPException(422, { message: `Jurisdiction payload is invalid: ${parsed.error.issues[0]?.message ?? "invalid payload"}` });
    try { validateGeometry(parsed.data.geometry); } catch (error) { throw new HTTPException(422, { message: error instanceof Error ? error.message : "Jurisdiction geometry is invalid" }); }
    const repository = await this.repository(c.env ?? {});
    const jurisdiction: Jurisdiction = { ...parsed.data, modelStatus: "unavailable", modelId: null };
    await repository.mutate((state) => { const index = state.jurisdictions.findIndex((item) => item.id === jurisdiction.id); if (index >= 0) state.jurisdictions[index] = jurisdiction; else state.jurisdictions.push(jurisdiction); });
    return jurisdiction;
  }
  requireScenarioAccess(c: Context<OperationsContextEnv>, jurisdictionId?: string): ScenarioAccess {
    const user = requireAuthenticated(c); if (!user.canRunScenarios) throw new HTTPException(403, { message: "Scenario access is not granted" });
    const jurisdiction = this.configuredJurisdictions(c.env ?? {})[0]; const requestedId = jurisdictionId ?? jurisdiction.id;
    if (requestedId !== jurisdiction.id || !user.jurisdictionIds.includes(requestedId)) throw new HTTPException(403, { message: "Jurisdiction is outside the authenticated context" });
    return { user, jurisdiction };
  }
  createScenario(_c: Context<OperationsContextEnv>, _input: ScenarioInput): never { throw new HTTPException(503, { message: SCENARIOS_UNAVAILABLE_REASON }); }
  async alerts(c: Context<OperationsContextEnv>): Promise<AlertsResponse> {
    const user = requireAuthenticated(c);
    if (!envValue(c.env ?? {}, "OPERATIONS_DATA_DIR")) return { success: true, alerts: [], status: "unavailable", reason: ALERTS_UNAVAILABLE_REASON };
    const repository = await this.repository(c.env ?? {}); const state = await repository.read();
    const accessible = state.jurisdictions.filter((j) => j.boundaryStatus === "verified" && user.jurisdictionIds.includes(j.id) && (!j.teamIds?.length || j.teamIds.includes(user.teamId)));
    const forecast = state.forecasts.filter((f) => Date.parse(f.validUntil) > this.clock().getTime()).sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))[0];
    if (!forecast || !accessible.length) return { success: true, alerts: [], status: "unavailable", reason: ALERTS_UNAVAILABLE_REASON };
    const additions: OperationsAlert[] = [];
    for (const jurisdiction of accessible) for (const frame of forecast.frames) for (const feature of frame.floodExtent.features) {
      if (feature.properties.severity !== "HIGH" && feature.properties.severity !== "CRITICAL") continue;
      const clipped = intersection(jurisdiction.geometry, feature.geometry); if (!clipped || areaKm2(clipped) <= 0) continue;
      const hazardKey = `${forecast.basinId}:${jurisdiction.id}:${frame.validAt}`;
      const prior = state.alerts.find((a) => a.hazardKey === hazardKey);
      if (prior && prior.forecastId === forecast.id && prior.severity === feature.properties.severity && !materialExtentChange(prior.geometry, clipped)) { additions.push(prior); continue; }
      additions.push({ id: prior?.id ?? randomUUID(), hazardKey, hazard: "flood", basinId: forecast.basinId, jurisdictionId: jurisdiction.id, forecastId: forecast.id, severity: feature.properties.severity, geometry: clipped, createdAt: prior?.createdAt ?? this.clock().toISOString(), validUntil: forecast.validUntil, acknowledgedAt: prior?.acknowledgedAt ?? null, acknowledgedBy: prior?.acknowledgedBy ?? null });
    }
    if (additions.length) await repository.mutate((draft) => { for (const alert of additions) { const i = draft.alerts.findIndex((a) => a.id === alert.id); if (i >= 0) draft.alerts[i] = alert; else draft.alerts.push(alert); } });
    return { success: true, alerts: additions, status: "available" };
  }
  async acknowledge(c: Context<OperationsContextEnv>, id: string): Promise<OperationsAlert> {
    const user = requireAuthenticated(c); const repository = await this.repository(c.env ?? {}); let result: OperationsAlert | undefined;
    await repository.mutate((state) => { const alert = state.alerts.find((item) => item.id === id); if (!alert) throw new HTTPException(404, { message: "Alert not found" }); const jurisdiction = state.jurisdictions.find((item) => item.id === alert!.jurisdictionId); if (!jurisdiction || jurisdiction.boundaryStatus !== "verified" || !user.jurisdictionIds.includes(jurisdiction.id) || (jurisdiction.teamIds?.length && !jurisdiction.teamIds.includes(user.teamId))) throw new HTTPException(403, { message: "Alert is outside the authenticated context" }); alert.acknowledgedAt = this.clock().toISOString(); alert.acknowledgedBy = { id: user.id, name: user.name, teamId: user.teamId }; result = alert; });
    return result!;
  }
}
export const operationsService = new OperationsService();
export function requireScenarioAccess(c: Context<OperationsContextEnv>, jurisdictionId?: string): ScenarioAccess { return operationsService.requireScenarioAccess(c, jurisdictionId); }
