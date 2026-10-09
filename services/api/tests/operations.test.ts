import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Hono } from "hono";
import { operationsRouter } from "../src/routes/operations.js";
import { OperationsService, validateScenarioInput } from "../src/services/operations.service.js";
import type { OperationsBindings, OperationsContextEnv, OperationsUser } from "../src/services/operations.types.js";

const user: OperationsUser = { id: "officer-1", name: "Test officer", teamId: "team-1", jurisdictionIds: ["mangaluru"], canRunScenarios: false, isAdmin: true };
const auth = { Authorization: "Bearer auth-token" };
const post = (payload: unknown, headers: Record<string, string> = {}) => ({ method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(payload) });
const app = () => { const instance = new Hono<OperationsContextEnv>(); instance.route("/operations", operationsRouter); return instance; };
const env = (directory: string): OperationsBindings => ({ OPERATIONS_DATA_DIR: directory, OPERATIONS_AUTH_TOKEN: "auth-token", OPERATIONS_AUTH_USER_JSON: JSON.stringify(user), OPERATIONS_PUBLISHER_TOKEN: "publisher-token" });
const square = (x = 74.8, y = 12.8, size = 0.1) => ({ type: "Polygon" as const, coordinates: [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]] });
function forecast(now: Date, id = "forecast-1") {
  const generatedAt = new Date(now.getTime() - 10 * 60_000).toISOString();
  const validFrom = now.toISOString();
  const validUntil = new Date(now.getTime() + 60 * 60_000).toISOString();
  return { id, basinId: "basin-1", modelId: "official-1", generatedAt, validFrom, validUntil, validationStatus: "validated", purpose: "operational", inputs: [{ source: "gauge-1", observedAt: generatedAt }], frames: [{ validAt: now.toISOString(), floodExtent: { type: "FeatureCollection", features: [{ type: "Feature", geometry: square(), properties: { severity: "HIGH" } }] } }] };
}

test("scenario payloads validate strictly and laptop-safe route never queues", async () => {
  assert.equal(validateScenarioInput({ durationHours: 6 }).success, true);
  assert.equal(validateScenarioInput({ durationHours: "6" }).success, false);
  const response = await app().request("/operations/scenarios", post({ durationHours: 2 }));
  assert.equal(response.status, 503);
  assert.equal((await response.json() as any).job, undefined);
});

test("publisher writes immutable forecast and latest read returns it", async () => {
  const directory = await mkdtemp(join(tmpdir(), "operations-test-"));
  try {
    const now = new Date(); const bindings = env(directory);
    const published = await app().request("/operations/forecasts", post(forecast(now), { ...auth, Authorization: "Bearer publisher-token" }), bindings);
    assert.equal(published.status, 201);
    const latest = await app().request("/operations/forecasts/latest", undefined, bindings);
    assert.equal(latest.status, 200); assert.equal((await latest.json() as any).forecast.id, "forecast-1");
    const duplicate = await app().request("/operations/forecasts", post(forecast(now), { Authorization: "Bearer publisher-token" }), bindings);
    assert.equal(duplicate.status, 409);
    const unauthorized = await app().request("/operations/forecasts", post(forecast(now, "forecast-2")), bindings);
    assert.equal(unauthorized.status, 401);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("verified jurisdiction polygons produce scoped alert and server-derived acknowledgment", async () => {
  const directory = await mkdtemp(join(tmpdir(), "operations-test-"));
  try {
    const bindings = env(directory); const now = new Date();
    const jurisdiction = { id: "mangaluru", name: "Verified Mangaluru", geometry: square(), boundaryStatus: "verified", boundarySource: "survey-2026", teamIds: ["team-1"] };
    const jurisdictionResponse = await app().request("/operations/jurisdictions", post(jurisdiction, auth), bindings);
    assert.equal(jurisdictionResponse.status, 201);
    await app().request("/operations/forecasts", post(forecast(now), { Authorization: "Bearer publisher-token" }), bindings);
    const alertsResponse = await app().request("/operations/alerts", { headers: auth }, bindings);
    assert.equal(alertsResponse.status, 200); const alerts = (await alertsResponse.json() as any).alerts; assert.equal(alerts.length, 1); assert.equal(alerts[0].severity, "HIGH");
    const acknowledged = await app().request(`/operations/alerts/${alerts[0].id}/acknowledge`, post({}, auth), bindings);
    assert.equal(acknowledged.status, 200); const body = await acknowledged.json() as any;
    assert.equal(body.alert.acknowledgedBy.id, "officer-1"); assert.ok(body.alert.acknowledgedAt);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("clock injection rejects old publications without touching persistence", async () => {
  const fixed = new Date("2026-01-01T12:00:00.000Z"); const directory = await mkdtemp(join(tmpdir(), "operations-test-"));
  try {
    const service = new OperationsService(() => fixed);
    await assert.rejects(() => service.publishForecast({ ...env(directory) }, forecast(new Date("2026-01-01T10:00:00.000Z")), "publisher-token"), /generatedAt/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
