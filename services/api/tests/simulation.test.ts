import assert from "node:assert";
import { app } from "../src/index.js";
import { getDb, schema } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import { FloodPredictionSchema } from "@tidemesh/contracts";

export async function runSimulationTests() {
  console.log("\n🧪 Running SFINCS Hydrodynamic Simulation Integration Tests...");

  // 1. Test GET /api/v1/simulations
  console.log("  Testing GET /api/v1/simulations...");
  const listRes = await app.request("/api/v1/simulations");
  assert.strictEqual(listRes.status, 200, "Simulations endpoint should return 200 OK");
  const listData = (await listRes.json()) as any;
  assert.ok(listData.success, "Response should have success: true");
  assert.ok(listData.simulations.length > 0, "Should list at least one simulation");
  assert.ok(
    listData.simulations.some((s: any) => s.eventId === "mangaluru-historical-2018"),
    "Should contain Mangaluru historical simulation in event catalog"
  );
  console.log(`  ✅ List simulations verified: found ${listData.simulations.length} event(s)`);

  // 2. Test GET /api/v1/simulations/:eventId/forecast
  console.log("  Testing GET /api/v1/simulations/mangaluru-historical-2018/forecast...");
  const forecastRes = await app.request(
    "/api/v1/simulations/mangaluru-historical-2018/forecast?zoneId=zone-mangaluru-coastal"
  );
  assert.strictEqual(forecastRes.status, 200, "Forecast endpoint should return 200 OK");
  const forecastBody = (await forecastRes.json()) as any;

  assert.ok(forecastBody.success, "Response should have success: true");

  const forecast = forecastBody.forecast;
  // Strict schema validation with Zod
  const parsed = FloodPredictionSchema.parse(forecast);
  assert.ok(parsed, "Forecast must strictly conform to CoastShield FloodPredictionSchema");

  // Physics vs. Statistics assertion: Do NOT fake probability
  assert.strictEqual(
    forecast.probability,
    null,
    "SFINCS hydrodynamic simulation must have null probability (deterministic physics)"
  );
  assert.strictEqual(forecast.isDeterministic, true, "isDeterministic must be true");
  assert.strictEqual(forecast.severity, "CRITICAL", "Depth >= 1.5m must be CRITICAL");
  assert.ok(forecast.depthMax > 0, "Depth max should be positive");
  assert.strictEqual(forecast.source, "sfincs", "Source must be sfincs");
  assert.strictEqual(forecast.modelVersion, "SFINCS-v2.4.2", "Model version should be SFINCS-v2.4.2");
  assert.ok(forecast.floodGeometry, "Flood geometry must be provided");
  assert.strictEqual(
    forecast.floodGeometry.type,
    "Polygon",
    "Geometry should be Polygon or MultiPolygon"
  );
  console.log(
    `  ✅ SFINCS contract verified: probability=null, deterministic=true, severity=CRITICAL, maxDepth=${forecast.depthMax.toFixed(2)}m`
  );

  // 3. Test GET /api/v1/simulations/:eventId/extent
  console.log("  Testing GET /api/v1/simulations/mangaluru-historical-2018/extent...");
  const extentRes = await app.request(
    "/api/v1/simulations/mangaluru-historical-2018/extent"
  );
  assert.strictEqual(extentRes.status, 200, "Extent endpoint should return 200 OK");
  const extentBody = (await extentRes.json()) as any;
  assert.strictEqual(extentBody.type, "FeatureCollection", "Extent must be GeoJSON FeatureCollection");
  assert.ok(extentBody.features.length > 0, "Should contain at least one feature");
  console.log(`  ✅ Flood extent GeoJSON verified with ${extentBody.features.length} feature(s)`);

  // 4. Test POST /api/v1/simulations/:eventId/sync (Neon PostGIS database integration)
  if (process.env.DATABASE_URL) {
    console.log("  Testing POST /api/v1/simulations/mangaluru-historical-2018/sync to Neon PostGIS...");
    const syncRes = await app.request(
      "/api/v1/simulations/mangaluru-historical-2018/sync?zoneId=zone-mangaluru-coastal",
      { method: "POST" }
    );
    assert.strictEqual(syncRes.status, 201, "Sync endpoint should return 201 Created");
    const syncBody = (await syncRes.json()) as any;

    assert.ok(syncBody.success, "Sync response should have success: true");
    assert.ok(syncBody.data.prediction.id, "Saved prediction must have an ID");

    // Query Neon database directly to verify PostGIS geometry and attributes
    const db = getDb();
    const dbRecord = await db.execute<{
      id: string;
      event_id: string;
      zone_id: string;
      severity: string;
      is_deterministic: boolean;
      depth_max: number;
      has_geom: boolean;
      geom_type: string;
    }>(sql`
      SELECT 
        id, 
        event_id, 
        zone_id, 
        severity, 
        is_deterministic, 
        depth_max,
        (flood_geometry IS NOT NULL) AS has_geom,
        ST_GeometryType(flood_geometry) AS geom_type
      FROM flood_predictions 
      WHERE event_id = 'mangaluru-historical-2018'
      ORDER BY created_at DESC
      LIMIT 1;
    `);

    assert.ok(dbRecord.rows.length > 0, "Record must exist in Neon PostgreSQL");
    const row = dbRecord.rows[0];
    assert.strictEqual(row?.event_id, "mangaluru-historical-2018");
    assert.strictEqual(row?.severity, "CRITICAL");
    assert.strictEqual(row?.is_deterministic, true);
    assert.strictEqual(row?.has_geom, true);
    assert.strictEqual(row?.geom_type, "ST_Polygon");
    console.log(
      `  ✅ Neon PostGIS verified: rowId=${row?.id}, geomType=${row?.geom_type}, depth=${row?.depth_max}m`
    );
  } else {
    console.log("  ⚠️ Skipping PostGIS sync test (DATABASE_URL not set)");
  }
}

// Allow standalone execution
if (process.argv[1]?.endsWith("simulation.test.ts")) {
  runSimulationTests()
    .then(() => console.log("\n🎉 All SFINCS simulation tests PASSED!\n"))
    .catch((err) => {
      console.error("\n❌ Simulation tests failed:", err);
      process.exit(1);
    });
}
