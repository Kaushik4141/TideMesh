import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  ComparisonRequestSchema, ComparisonSchema, RunSnapshotSchema,
  type AssetImpact, type FloodPrediction, type RunSnapshot,
} from "@tidemesh/contracts";
import { app } from "../src/index.js";
import { getDb, type DatabaseInstance } from "../src/db/index.js";
import { ComparisonService, comparisonSpatialSql, querySpatialComparison } from "../src/services/comparison.service.js";
import { SimulationService } from "../src/services/simulation.service.js";

// Synthetic WGS84 geometry fixtures, not measured local assets or solver outputs.
const polygon = (west = 74.85, east = 74.86) => ({
  type: "Polygon", coordinates: [[[west, 12.85], [east, 12.85], [east, 12.86], [west, 12.86], [west, 12.85]]],
});
const request = { baselineRunId: "baseline-1", scenario: { rainfallRateMmHr: 80, surgeLevelM: 2 } };
const snapshot = (runId: string, scenario = false): RunSnapshot => ({
  runId, generatedAt: "2026-10-09T00:00:00Z", simulationStart: "2018-05-29T00:00:00Z",
  simulationEnd: "2018-05-29T04:00:00Z", modelVersion: "SFINCS-v2.4.2",
  inputs: { rainfallRateMmHr: scenario ? 80 : 40, surgeLevelM: scenario ? 2 : 1, durationHours: 4 },
  rainfallSeries: [40, 40], waterLevelSeries: [1, 1], artifactIds: [`simulations/${runId}/metadata.json`],
  floodGeometry: polygon(74.85, scenario ? 74.87 : 74.86), maximumDepthM: scenario ? 2 : 1,
  gridResolutionM: 50, floodThresholdM: 0.1, qualityNotes: [],
});
const prediction = (eventId: string): FloodPrediction => ({
  eventId, zoneId: "zone-mangaluru-coastal", timestamp: "2026-10-09T00:00:00Z",
  severity: "CRITICAL", probability: null, isDeterministic: true, depthMax: 2,
  floodGeometry: polygon(74.85, 74.87), modelVersion: "SFINCS-v2.4.2", source: "sfincs",
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const dialect = new PgDialect();
type FetchCall = { url: string; init?: RequestInit };

async function withSimulationApi(
  execute: (calls: FetchCall[]) => Promise<void>,
  options: { baseline?: RunSnapshot; after?: (run: RunSnapshot) => unknown; runner?: (eventId: string) => unknown; status?: number } = {},
) {
  const original = globalThis.fetch;
  const calls: FetchCall[] = [];
  let scenarioId = "";
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/api/v1/simulations/run")) {
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.eventId, undefined, "The Python runner owns unique run IDs");
      scenarioId = "sim-new-unique";
      return json(options.runner?.(scenarioId) ?? prediction(scenarioId));
    }
    if (url.endsWith(`/simulations/${request.baselineRunId}/run`)) {
      return json(options.baseline ?? snapshot(request.baselineRunId), options.status ?? 200);
    }
    if (scenarioId && url.endsWith(`/simulations/${scenarioId}/run`)) {
      const run = snapshot(scenarioId, true);
      return json(options.after?.(run) ?? run);
    }
    throw new Error(`Unexpected upstream call: ${url}`);
  };
  try { await execute(calls); } finally { globalThis.fetch = original; }
}

const runComparison = (db?: DatabaseInstance) => new ComparisonService(new SimulationService("https://ml.test"), "https://ml.test").compare(request, db);

export async function runComparisonTests() {
  console.log("\n🧪 Running comparison contract, API and mocked service/PostGIS tests...");
  assert.ok(ComparisonRequestSchema.safeParse(request).success);
  for (const invalid of [
    { ...request, scenario: { ...request.scenario, durationHours: 4 } },
    { ...request, scenario: { rainfallRateMmHr: "80", surgeLevelM: 2 } },
    { ...request, scenario: { rainfallRateMmHr: 301, surgeLevelM: 2 } },
    { ...request, scenario: { rainfallRateMmHr: 80, surgeLevelM: -1 } },
    { ...request, baselineRunId: "../baseline" }, { ...request, extra: true },
  ]) assert.equal(ComparisonRequestSchema.safeParse(invalid).success, false);
  assert.ok(RunSnapshotSchema.safeParse(snapshot("baseline-1")).success);

  await withSimulationApi(async calls => {
    const result = ComparisonSchema.parse(await runComparison());
    assert.equal(result.mode, "HYPOTHETICAL_SCENARIO");
    assert.equal(result.baseline.runId, request.baselineRunId);
    assert.notEqual(result.scenario.runId, result.baseline.runId);
    assert.equal(result.scenario.inputs?.durationHours, 4);
    assert.equal(result.delta.maximumDepthM, 1);
    assert.equal(result.delta.inundatedAreaKm2, null);
    assert.equal(result.baseline.metrics.affectedBuildings, null);
    assert.equal(result.scenario.metrics.populationExposureEstimate, null);
    assert.equal(result.assets, null);
    assert.equal(result.delta.newlyAffectedAssets, null);
    assert.equal(result.delta.newlyInundatedGeometry, null);
    assert.equal(result.baseline.priorities, null);
    assert.equal(result.dataQuality.priorityMethod, null);
    assert.equal(result.dataQuality.persistence, "unavailable");
    assert.ok(result.dataQuality.warnings.some(warning => warning.includes("Database")));
    assert.deepEqual(calls.map(call => call.init?.method ?? "GET"), ["GET", "POST", "GET"]);
    assert.ok(calls.every(call => call.url.startsWith("https://ml.test/")));
    const payload = JSON.parse(String(calls[1].init?.body));
    assert.equal(payload.durationHours, 4);
    assert.equal(payload.rainfallRateMmHr, 80);
    assert.equal(payload.surgeLevelM, 2);
    assert.equal(payload.rainfallSeries, undefined);
    assert.equal(payload.useLiveWeather, undefined);
    assert.ok(calls[1].init?.signal);
  });

  for (const alias of ["latest", "live", "default", "mangaluru-live-forecast"]) {
    await withSimulationApi(async calls => {
      await assert.rejects(new ComparisonService(new SimulationService("https://ml.test")).compare({ ...request, baselineRunId: alias }), /immutable/);
      assert.equal(calls.length, 0);
    });
  }
  await withSimulationApi(async calls => {
    await assert.rejects(runComparison(), /legacy artifact/);
    assert.equal(calls.length, 1);
  }, { baseline: { ...snapshot("baseline-1"), inputs: null } });
  await withSimulationApi(async calls => {
    await assert.rejects(runComparison(), /at least 3 hours/);
    assert.equal(calls.length, 1);
  }, { baseline: { ...snapshot("baseline-1"), inputs: { rainfallRateMmHr: 40, surgeLevelM: 1, durationHours: 2 } } });
  await withSimulationApi(async calls => {
    await assert.rejects(runComparison(), /Change rainfall/);
    assert.equal(calls.length, 1);
  }, { baseline: snapshot("baseline-1", true) });
  await withSimulationApi(async calls => {
    await assert.rejects(runComparison(), /identity does not match/);
    assert.equal(calls.length, 1);
  }, { baseline: snapshot("different-baseline") });
  await withSimulationApi(async calls => {
    await assert.rejects(runComparison(), /not found/);
    assert.equal(calls.length, 1);
  }, { status: 404 });
  await withSimulationApi(async () => {
    await assert.rejects(runComparison(), /identity does not match/);
  }, { after: run => ({ ...run, runId: "wrong-scenario" }) });
  await withSimulationApi(async () => {
    await assert.rejects(runComparison(), /inputs do not match/);
  }, { after: run => ({ ...run, inputs: { ...run.inputs, durationHours: 6 } }) });
  await withSimulationApi(async calls => {
    await assert.rejects(runComparison(), /distinct immutable/);
    assert.equal(calls.length, 2);
  }, { runner: () => prediction("baseline-1") });
  await withSimulationApi(async () => {
    await assert.rejects(runComparison(), /invalid run snapshot/);
  }, { after: () => ({ runId: "broken" }) });
  await withSimulationApi(async () => {
    const result = await runComparison();
    assert.equal(result.baseline.metrics.maximumDepthM, null);
    assert.equal(result.delta.maximumDepthM, null);
  }, { baseline: { ...snapshot("baseline-1"), maximumDepthM: null } });

  const assets: AssetImpact[] = [
    { id: "r1", kind: "road", name: "Road 1", geometry: { type: "LineString", coordinates: [[74.85, 12.85], [74.87, 12.86]] }, baselineAffected: true, scenarioAffected: true },
    { id: "r2", kind: "road", name: "Road 2", geometry: { type: "LineString", coordinates: [[74.86, 12.85], [74.87, 12.86]] }, baselineAffected: false, scenarioAffected: true },
    { id: "b1", kind: "building", name: null, geometry: polygon(), baselineAffected: true, scenarioAffected: false },
    { id: "f1", kind: "facility", name: "Hospital", geometry: { type: "Point", coordinates: [74.865, 12.855] }, baselineAffected: false, scenarioAffected: true },
  ];
  const spatialRow = {
    baseline_area_km2: 1, scenario_area_km2: 2,
    newly_inundated_geometry: polygon(74.86, 74.87), assets,
    infrastructure_available: true, available_kinds: ["road", "building", "facility"],
  };
  const statements: ReturnType<PgDialect["sqlToQuery"]>[] = [];
  const db = { execute: async (statement: Parameters<PgDialect["sqlToQuery"]>[0]) => {
    const query = dialect.sqlToQuery(statement);
    statements.push(query);
    if (query.sql.includes("WITH inputs")) return { rows: [spatialRow] };
    if (query.sql.includes("RETURNING id")) return { rows: [{ id: "00000000-0000-4000-8000-000000000001" }] };
    return { rows: [] };
  } } as unknown as DatabaseInstance;
  await withSimulationApi(async calls => {
    const result = await runComparison(db);
    assert.equal(result.dataQuality.persistence, "database");
    assert.equal(result.delta.inundatedAreaKm2, 1);
    assert.equal(result.baseline.metrics.affectedRoads, 1);
    assert.equal(result.scenario.metrics.affectedRoads, 2);
    assert.equal(result.delta.affectedRoads, 1);
    assert.equal(result.delta.affectedBuildings, -1);
    assert.deepEqual(result.delta.newlyAffectedAssets?.map(asset => asset.id), ["r2", "f1"]);
    assert.deepEqual(result.delta.newlyInundatedGeometry, spatialRow.newly_inundated_geometry);
    assert.deepEqual(result.assets, assets);
    assert.equal(calls.length, 3, "Persistence must not re-fetch forecast or re-run solver");
    const predictionInsert = statements.find(query => query.sql.includes("INSERT INTO flood_predictions"));
    assert.ok(predictionInsert?.params.includes(result.scenario.runId), "Save returned scenario forecast association");
    const comparisonInsert = statements.find(query => query.sql.includes("INSERT INTO simulation_comparisons"));
    assert.ok(comparisonInsert?.params.includes(result.baseline.runId));
    assert.ok(comparisonInsert?.params.includes(result.scenario.runId));
    assert.ok(comparisonInsert?.params.includes(result.comparisonId));
    const compact = comparisonInsert?.params.find(value => typeof value === "string" && value.includes('"baselineMetrics"'));
    assert.ok(compact);
    assert.equal(String(compact).includes('"coordinates"'), false, "Do not duplicate spatial payloads in metadata");
  });
  const query = dialect.sqlToQuery(comparisonSpatialSql(snapshot("before"), snapshot("after", true)));
  for (const expression of ["ST_MakeValid", "ST_UnaryUnion", "ST_CollectionExtract", "ST_Area(p.baseline::geography)", "ST_Difference(p.scenario, p.baseline)", "SELECT DISTINCT", "FROM roads", "FROM buildings", "FROM critical_facilities"]) {
    assert.ok(query.sql.includes(expression), `SQL must use ${expression}`);
  }
  assert.equal(query.params.length, 2);
  assert.equal(query.sql.includes("74.85"), false, "Geometry must be bound parameters");

  for (const invalidGeometry of [
    { type: "Point", coordinates: [74.85, 12.85] },
    { type: "LineString", coordinates: [[74.85, 12.85], [74.86, 12.86]] },
    polygon(698000, 698050), // Projected metre coordinates must not be relabelled as degrees.
    { type: "Polygon", coordinates: [[[74.85, 12.85], [74.86, 12.85], [74.86, 12.86]]] },
    { type: "Polygon", coordinates: [[[74.85, 91], [74.86, 91], [74.86, 92], [74.85, 91]]] },
    { type: "MultiPolygon", coordinates: [[]] },
    { ...polygon(), crs: { type: "name", properties: { name: "EPSG:3857" } } },
  ]) {
    assert.throws(() => comparisonSpatialSql({ ...snapshot("before"), floodGeometry: invalidGeometry }, snapshot("after", true)), /polygon|WGS84|ring/i,
      "Malformed, non-area or projected geometry cannot become a verified dry extent");
  }

  for (const threshold of [0.2, null]) {
    await withSimulationApi(async () => {
      const result = await runComparison(db);
      assert.equal(result.baseline.metrics.inundatedAreaKm2, 1, "Retain each run's genuine area");
      assert.equal(result.scenario.metrics.inundatedAreaKm2, 2);
      assert.equal(result.delta.inundatedAreaKm2, null);
      assert.equal(result.delta.affectedRoads, null);
      assert.equal(result.delta.affectedBuildings, null);
      assert.equal(result.delta.affectedFacilities, null);
      assert.equal(result.delta.newlyInundatedGeometry, null);
      assert.equal(result.delta.newlyAffectedAssets, null);
      assert.equal(result.delta.maximumDepthM, 1, "Raster maximum depth is independent of extent threshold");
      assert.ok(result.dataQuality.warnings.some(w => w.includes("threshold")));
      assert.equal(result.explanations.some(text => /scenario minus baseline 1\.000 km/.test(text)), false);
    }, { after: run => ({ ...run, floodThresholdM: threshold }) });
  }

  await withSimulationApi(async () => {
    const failingDb = { execute: async () => { throw new Error("database offline"); } } as unknown as DatabaseInstance;
    const result = await runComparison(failingDb);
    assert.equal(result.delta.maximumDepthM, 1);
    assert.equal(result.delta.inundatedAreaKm2, null);
    assert.equal(result.assets, null);
    assert.equal(result.scenario.metrics.affectedRoads, null);
    assert.equal(result.dataQuality.persistence, "unavailable");
    assert.ok(result.dataQuality.warnings.some(w => w.includes("spatial analysis failed")));
    assert.ok(result.dataQuality.warnings.some(w => w.includes("persistence failed")));
  });
  await withSimulationApi(async () => {
    const partiallyFailingDb = { execute: async (statement: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      if (dialect.sqlToQuery(statement).sql.includes("WITH inputs")) return { rows: [spatialRow] };
      throw new Error("missing migration");
    } } as unknown as DatabaseInstance;
    const result = await runComparison(partiallyFailingDb);
    assert.equal(result.delta.inundatedAreaKm2, 1);
    assert.equal(result.dataQuality.persistence, "unavailable");
    assert.ok(result.dataQuality.warnings.some(w => w.includes("not saved")));
  });
  await withSimulationApi(async () => {
    const emptyDb = { execute: async (statement: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      if (dialect.sqlToQuery(statement).sql.includes("WITH inputs")) return { rows: [{ ...spatialRow, assets: [], infrastructure_available: false, available_kinds: [] }] };
      return { rows: [{ id: "00000000-0000-4000-8000-000000000001" }] };
    } } as unknown as DatabaseInstance;
    const result = await runComparison(emptyDb);
    assert.equal(result.assets, null);
    assert.equal(result.scenario.metrics.affectedFacilities, null);
    assert.equal(result.scenario.metrics.inundatedAreaKm2, 2);
    assert.ok(result.dataQuality.warnings.some(w => w.includes("inventory is empty")));
  });
  await withSimulationApi(async () => {
    const partialInventoryDb = { execute: async (statement: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      if (dialect.sqlToQuery(statement).sql.includes("WITH inputs")) return { rows: [{ ...spatialRow, assets: assets.filter(asset => asset.kind !== "building"), available_kinds: ["road", "facility"] }] };
      return { rows: [{ id: "00000000-0000-4000-8000-000000000001" }] };
    } } as unknown as DatabaseInstance;
    const result = await runComparison(partialInventoryDb);
    assert.equal(result.baseline.metrics.affectedBuildings, null);
    assert.equal(result.delta.affectedBuildings, null);
    assert.equal(result.delta.affectedRoads, 1);
    assert.ok(result.dataQuality.warnings.some(w => w.includes("No building inventory")));
  });

  await withSimulationApi(async () => {
    const nonlocalDb = { execute: async (statement: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      if (dialect.sqlToQuery(statement).sql.includes("WITH inputs")) return { rows: [{ ...spatialRow, assets: [], available_kinds: ["road", "facility"] }] };
      return { rows: [{ id: "00000000-0000-4000-8000-000000000001" }] };
    } } as unknown as DatabaseInstance;
    const result = await runComparison(nonlocalDb);
    assert.equal(result.scenario.metrics.affectedRoads, 0, "Zero is inventory-only intersection count");
    assert.equal(result.scenario.metrics.affectedBuildings, null);
    assert.ok(result.dataQuality.warnings.some(w => w.includes("No building inventory")), "Missing-kind warning must survive the no-intersection branch");
    assert.ok(result.dataQuality.warnings.some(w => w.includes("not verified absence")));
    assert.ok(result.dataQuality.infrastructureSource?.includes("synthetic NYC"));
  });
  await withSimulationApi(async () => {
    const dryDb = { execute: async (statement: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      if (dialect.sqlToQuery(statement).sql.includes("WITH inputs")) return { rows: [{
        ...spatialRow, scenario_area_km2: 0, newly_inundated_geometry: { type: "Polygon", coordinates: [] },
        assets: assets.filter(asset => asset.baselineAffected).map(asset => ({ ...asset, scenarioAffected: false })),
      }] };
      return { rows: [{ id: "00000000-0000-4000-8000-000000000001" }] };
    } } as unknown as DatabaseInstance;
    const result = await runComparison(dryDb);
    assert.equal(result.delta.inundatedAreaKm2, -1, "A genuine contraction keeps its negative delta");
    assert.equal(result.delta.maximumDepthM, -1, "A supplied zero depth is not missing");
    assert.equal(result.delta.affectedRoads, -1);
    assert.deepEqual(result.delta.newlyAffectedAssets, []);
    assert.deepEqual(result.delta.newlyInundatedGeometry?.coordinates, []);
  }, { after: run => ({ ...run, maximumDepthM: 0, floodGeometry: { type: "Polygon", coordinates: [] } }) });
  await withSimulationApi(async () => {
    const collapsedDb = { execute: async (statement: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      if (dialect.sqlToQuery(statement).sql.includes("WITH inputs")) return { rows: [{
        ...spatialRow, baseline_area_km2: null, assets: null, newly_inundated_geometry: null,
      }] };
      return { rows: [{ id: "00000000-0000-4000-8000-000000000001" }] };
    } } as unknown as DatabaseInstance;
    const result = await runComparison(collapsedDb);
    assert.equal(result.baseline.metrics.inundatedAreaKm2, null);
    assert.equal(result.scenario.metrics.inundatedAreaKm2, 2);
    assert.equal(result.delta.inundatedAreaKm2, null);
    assert.equal(result.scenario.metrics.affectedRoads, null);
    assert.ok(result.dataQuality.warnings.some(w => w.includes("collapsed to non-area")));
  });

  // The legacy direct runner also persists the exact returned forecast.
  await withSimulationApi(async calls => {
    await new SimulationService("https://ml.test").runSimulation(db, { rainfallRateMmHr: 80 });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].init?.method, "POST");
  });

  const apiRequest = (body: unknown) => app.request("/api/v1/simulations/compare", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }, { ML_API_URL: "https://binding.test", DATABASE_URL: "" });
  await withSimulationApi(async calls => {
    const response = await apiRequest(request);
    assert.equal(response.status, 201);
    const body = await response.json() as { success: boolean; comparison: unknown };
    assert.equal(body.success, true);
    assert.ok(ComparisonSchema.safeParse(body.comparison).success);
    assert.ok(calls.every(call => call.url.startsWith("https://binding.test/")), "Worker binding must select ML service");
  });
  await withSimulationApi(async calls => {
    const response = await app.request("/api/v1/simulations/baseline-1/run", {}, { ML_API_URL: "https://binding.test/" });
    assert.equal(response.status, 200);
    assert.equal((await response.json() as RunSnapshot).runId, "baseline-1");
    assert.equal(calls[0].url, "https://binding.test/api/v1/simulations/baseline-1/run");
  });
  for (const body of [null, {}, { ...request, scenario: { ...request.scenario, durationHours: 6 } }]) {
    await withSimulationApi(async calls => {
      const response = await apiRequest(body);
      assert.equal(response.status, 400);
      assert.equal(calls.length, 0);
    });
  }
  const malformed = await app.request("/api/v1/simulations/compare", { method: "POST", body: "{" });
  assert.equal(malformed.status, 400);
  for (const [options, expectedStatus] of [
    [{ baseline: { ...snapshot("baseline-1"), inputs: null } }, 422],
    [{ baseline: snapshot("wrong-run") }, 502],
    [{ status: 404 }, 404],
  ] as const) {
    await withSimulationApi(async calls => {
      const response = await apiRequest(request);
      assert.equal(response.status, expectedStatus);
      assert.equal(calls.length, 1);
      assert.equal((await response.json() as { success: boolean }).success, false);
    }, options);
  }

  // A pending identical submission cannot start another solver. Completion releases the key.
  const originalFetch = globalThis.fetch;
  let release!: () => void;
  let entered!: () => void;
  const enteredPromise = new Promise<void>(resolve => { entered = resolve; });
  const barrier = new Promise<void>(resolve => { release = resolve; });
  let solverCalls = 0;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith("/simulations/baseline-1/run")) {
      entered(); await barrier; return json(snapshot("baseline-1"));
    }
    if (init?.method === "POST") {
      solverCalls++;
      return json(prediction(`sim-guard-${solverCalls}`));
    }
    const id = String(url).split("/").at(-2)!;
    return json(snapshot(id, true));
  };
  try {
    const first = runComparison();
    await enteredPromise;
    await assert.rejects(runComparison(), /already running/);
    release();
    await first;
    assert.equal(solverCalls, 1);
    await runComparison();
    assert.equal(solverCalls, 2, "In-flight key must be released after completion");
  } finally { release(); globalThis.fetch = originalFetch; }

  // Bound the in-memory guard even when distinct runs are stuck upstream.
  let capacityRelease!: () => void;
  const capacityBarrier = new Promise<void>(resolve => { capacityRelease = resolve; });
  globalThis.fetch = async (url, init) => {
    if (init?.method === "POST") return json(prediction(`sim-capacity-${crypto.randomUUID()}`));
    const id = String(url).split("/").at(-2)!;
    if (id.startsWith("capacity-")) await capacityBarrier;
    return json(snapshot(id, !id.startsWith("capacity-")));
  };
  const pending: Promise<unknown>[] = [];
  try {
    for (let i = 0; i < 16; i++) pending.push(new ComparisonService(new SimulationService("https://ml.test")).compare({ ...request, baselineRunId: `capacity-${i}` }));
    await assert.rejects(new ComparisonService(new SimulationService("https://ml.test")).compare({ ...request, baselineRunId: "capacity-overflow" }), /at capacity/);
    capacityRelease();
    await Promise.all(pending);
  } finally { capacityRelease(); await Promise.allSettled(pending); globalThis.fetch = originalFetch; }

  for (const [failureName, expectedStatus] of [["TimeoutError", 504], ["Error", 502]] as const) {
    globalThis.fetch = async () => { const error = new Error("private upstream detail"); error.name = failureName; throw error; };
    try {
      const response = await apiRequest(request);
      assert.equal(response.status, expectedStatus);
      assert.equal(JSON.stringify(await response.json()).includes("private upstream detail"), false);
    } finally { globalThis.fetch = originalFetch; }
  }
  console.log("  ✅ Contract, forcing/duration, immutable association, nullability, persistence, deltas, API errors, guard and SQL-path mocks passed");

  if (process.env.COMPARISON_LIVE_DB === "1") {
    console.log("  Running explicitly requested LIVE PostGIS read-only comparison queries...");
    const liveDb = getDb();
    const before = snapshot("live-test-before"), after = snapshot("live-test-after", true);
    const spatial = await querySpatialComparison(liveDb, before, after);
    assert.ok(spatial.baselineAreaKm2! > 1 && spatial.baselineAreaKm2! < 1.3, "WGS84 0.01° square near Mangaluru is about 1.2 km²");
    assert.ok(Math.abs(spatial.scenarioAreaKm2! / spatial.baselineAreaKm2! - 2) < 0.001);
    assert.ok(spatial.newlyInundatedGeometry);
    assert.equal(spatial.newlyInundatedGeometry.type, "Polygon");
    const same = await querySpatialComparison(liveDb, before, before);
    assert.deepEqual(same.newlyInundatedGeometry?.coordinates, [], "Identical extents produce an empty difference");
    const missing = await querySpatialComparison(liveDb, { ...before, floodGeometry: null }, after);
    assert.equal(missing.baselineAreaKm2, null);
    assert.equal(missing.assets, null);
    assert.equal(missing.newlyInundatedGeometry, null);
    const dry = await querySpatialComparison(liveDb, { ...before, floodGeometry: { type: "Polygon", coordinates: [] } }, after);
    assert.equal(dry.baselineAreaKm2, 0, "A verified dry run is zero area, not unavailable");
    assert.ok(dry.scenarioAreaKm2! > 0);
    assert.ok(dry.newlyInundatedGeometry);
    const dryMulti = await querySpatialComparison(liveDb, { ...before, floodGeometry: { type: "MultiPolygon", coordinates: [] } }, after);
    assert.equal(dryMulti.baselineAreaKm2, 0);
    const collapsed = await querySpatialComparison(liveDb, { ...before, floodGeometry: {
      type: "Polygon", coordinates: [[[74.85, 12.85], [74.855, 12.85], [74.86, 12.85], [74.85, 12.85]]],
    } }, after);
    assert.equal(collapsed.baselineAreaKm2, null, "A polygon repaired into a line is unavailable, not verified dry");
    assert.ok(collapsed.scenarioAreaKm2! > 0);
    assert.equal(collapsed.assets, null);
    assert.equal(collapsed.newlyInundatedGeometry, null);
    const multi = { ...after, floodGeometry: { type: "MultiPolygon", coordinates: [polygon().coordinates, polygon(74.86, 74.87).coordinates] } };
    const dissolved = await querySpatialComparison(liveDb, before, multi);
    assert.ok(Math.abs(dissolved.scenarioAreaKm2! - spatial.scenarioAreaKm2!) < 0.00001);
    const overlapping = await querySpatialComparison(liveDb, before, { ...after, floodGeometry: {
      type: "MultiPolygon", coordinates: [polygon().coordinates, polygon().coordinates],
    } });
    assert.ok(Math.abs(overlapping.scenarioAreaKm2! - spatial.baselineAreaKm2!) < 0.00001, "Duplicate polygon fixtures must not double-count area");

    // Read-only CTE inventories exercise actual PostGIS intersections with controlled data.
    // These are labelled fixtures and never inserted into the live infrastructure tables.
    const fixtureDb = { execute: async (statement: Parameters<PgDialect["sqlToQuery"]>[0]) => liveDb.execute(sql`
      WITH roads AS (
        SELECT 'both-road'::text AS id, 'Both'::text AS name, ST_GeomFromText('LINESTRING(74.851 12.852, 74.863 12.852)', 4326) AS geometry
        UNION ALL SELECT 'new-road', 'New', ST_GeomFromText('LINESTRING(74.861 12.854, 74.864 12.854)', 4326)
        UNION ALL SELECT 'new-road', 'New', ST_GeomFromText('LINESTRING(74.861 12.854, 74.864 12.854)', 4326)
        UNION ALL SELECT 'baseline-road', 'Baseline', ST_GeomFromText('LINESTRING(74.851 12.858, 74.853 12.858)', 4326)
      ), buildings AS (
        SELECT 'new-building'::text AS id, ST_GeomFromText('POLYGON((74.861 12.855,74.863 12.855,74.863 12.856,74.861 12.856,74.861 12.855))', 4326) AS geometry
        UNION ALL SELECT 'baseline-building', ST_GeomFromText('POLYGON((74.851 12.855,74.853 12.855,74.853 12.856,74.851 12.856,74.851 12.855))', 4326)
      ), critical_facilities AS (
        SELECT 'new-facility'::text AS id, 'New facility'::text AS name, ST_GeomFromText('POINT(74.862 12.853)', 4326) AS geometry
        UNION ALL SELECT 'baseline-facility', 'Baseline facility', ST_GeomFromText('POINT(74.852 12.853)', 4326)
      ), compared AS (${statement}) SELECT * FROM compared;
    `) } as unknown as DatabaseInstance;
    const shifted = { ...after, floodGeometry: polygon(74.855, 74.865) };
    const intersections = await querySpatialComparison(fixtureDb, before, shifted);
    assert.equal(intersections.assets?.length, 7, "Distinct IDs/geometry remove duplicate road intersections");
    assert.deepEqual(intersections.assets?.filter(asset => !asset.baselineAffected && asset.scenarioAffected).map(asset => asset.id).sort(), ["new-building", "new-facility", "new-road"]);
    assert.deepEqual(intersections.assets?.filter(asset => asset.baselineAffected && !asset.scenarioAffected).map(asset => asset.id).sort(), ["baseline-building", "baseline-facility", "baseline-road"]);
    assert.ok(intersections.assets?.every(asset => asset.geometry.coordinates.length > 0));
    const both = intersections.assets?.find(asset => asset.id === "both-road");
    assert.equal(both?.baselineAffected, true);
    assert.equal(both?.scenarioAffected, true);
    const bowtie = { ...before, floodGeometry: { type: "Polygon", coordinates: [[[74.85,12.85],[74.86,12.86],[74.85,12.86],[74.86,12.85],[74.85,12.85]]] } };
    const repaired = await querySpatialComparison(liveDb, bowtie, after);
    assert.ok(repaired.baselineAreaKm2! > 0, "ST_MakeValid repairs a self-intersecting flood polygon");
    console.log("  ✅ LIVE PostGIS area, dissolution, repair, difference, empty/missing geometry and distinct asset fixtures verified (read-only)");
  } else {
    console.log("  ⏭ LIVE PostGIS check not requested; SQL-path results above use mocks. Set COMPARISON_LIVE_DB=1 to run read-only spatial checks.");
  }
}

if (process.argv[1]?.endsWith("comparison.test.ts")) {
  runComparisonTests().catch(error => { console.error(error); process.exitCode = 1; });
}
