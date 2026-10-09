import { Hono } from "hono";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { operationsService, authenticatedOperationsUser, requireScenarioAccess, validateScenarioInput } from "../services/operations.service.js";
import type { OperationsContextEnv } from "../services/operations.types.js";

export const operationsRouter = new Hono<OperationsContextEnv>();
type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 422 | 500 | 503;
function errorResponse(error: unknown): { status: ErrorStatus; body: Record<string, unknown> } {
  if (error instanceof HTTPException) { const status = error.status as ErrorStatus; return { status, body: { success: false, status: status === 503 ? "unavailable" : "error", error: error.message } }; }
  return { status: 500, body: { success: false, status: "error", error: error instanceof Error ? error.message : "Operations request failed" } };
}
async function readJson(c: Context<OperationsContextEnv>): Promise<unknown> {
  const contentLength = Number(c.req.header("Content-Length") ?? 0);
  if (contentLength > 2 * 1024 * 1024) throw new HTTPException(413, { message: "Request body exceeds the 2MB limit" });
  let text: string;
  try { text = await c.req.text(); } catch { throw new HTTPException(400, { message: "JSON request body required" }); }
  if (Buffer.byteLength(text, "utf8") > 2 * 1024 * 1024) throw new HTTPException(413, { message: "Request body exceeds the 2MB limit" });
  try { return JSON.parse(text); } catch { throw new HTTPException(400, { message: "JSON request body required" }); }
}
function publisherToken(c: Context<OperationsContextEnv>): string | undefined { return c.req.header("Authorization")?.match(/^Bearer\s+([^\s]+)$/i)?.[1]; }

operationsRouter.get("/context", async (c) => {
  try {
    const user = authenticatedOperationsUser(c);
    const response = operationsService.context(c.env ?? {}, user);
    response.jurisdictions = await operationsService.listJurisdictions(c.env ?? {});
    response.jurisdiction = response.jurisdictions[0] ?? response.jurisdiction;
    response.status = response.jurisdiction.boundaryStatus === "verified" ? "operational" : "pilot";
    response.boundaryStatus = response.jurisdiction.boundaryStatus;
    response.modelStatus = response.jurisdiction.modelStatus;
    return c.json(response);
  } catch (error) { const response = errorResponse(error); return c.json(response.body, response.status); }
});
operationsRouter.get("/jurisdictions", async (c) => {
  try { return c.json({ success: true, jurisdictions: await operationsService.listJurisdictions(c.env ?? {}) }); }
  catch (error) { const response = errorResponse(error); return c.json(response.body, response.status); }
});
operationsRouter.get("/forecasts/latest", async (c) => {
  try { return c.json(await operationsService.latestForecast(c.env ?? {})); }
  catch (error) { const response = errorResponse(error); return c.json(response.body, response.status); }
});
operationsRouter.post("/forecasts", async (c) => {
  try { const forecast = await operationsService.publishForecast(c.env ?? {}, await readJson(c), publisherToken(c)); return c.json({ success: true, forecast }, 201); }
  catch (error) { const response = errorResponse(error); return c.json(response.body, response.status); }
});
operationsRouter.post("/jurisdictions", async (c) => {
  try { const jurisdiction = await operationsService.publishJurisdiction(c, await readJson(c)); return c.json({ success: true, jurisdiction }, 201); }
  catch (error) { const response = errorResponse(error); return c.json(response.body, response.status); }
});
operationsRouter.get("/alerts", async (c) => {
  try { return c.json(await operationsService.alerts(c)); }
  catch (error) { const response = errorResponse(error); return c.json(response.body, response.status); }
});
operationsRouter.post("/alerts/:id/acknowledge", async (c) => {
  try { return c.json({ success: true, alert: await operationsService.acknowledge(c, c.req.param("id")) }); }
  catch (error) { const response = errorResponse(error); return c.json(response.body, response.status); }
});
operationsRouter.post("/scenarios", async (c) => {
  try {
    const parsed = validateScenarioInput(await readJson(c));
    if (!parsed.success) throw new HTTPException(422, { message: "Scenario input is invalid: durationHours must be greater than 0 and no more than 6" });
    // Keep validation and authorization available while guaranteeing no phantom queue.
    if (c.env?.ALLOW_LOCAL_SCENARIO_JOBS === "true") requireScenarioAccess(c, parsed.data.jurisdictionId);
    throw new HTTPException(503, { message: "Scenario execution is disabled in laptop-safe mode; no job was queued" });
  } catch (error) { const response = errorResponse(error); return c.json(response.body, response.status); }
});
export { requireScenarioAccess };
