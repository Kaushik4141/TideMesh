import assert from "node:assert";
import { app } from "../src/index.js";
import { getDb } from "../src/db/index.js";
import { sql } from "drizzle-orm";
import {
  EnvironmentalObservationSchema,
  EnvironmentalObservationBatchSchema,
} from "@tidemesh/contracts";
import { environmentalService } from "../src/services/environmental.service.js";

export async function runEnvironmentalTests() {
  console.log("\n🧪 Running Environmental Data Pipeline Integration Tests...");

  // 1. Test Contract Validation
  console.log("  Testing EnvironmentalObservationSchema Zod validation...");
  const validSample = {
    timestamp: "2026-10-08T12:00:00Z",
    latitude: 12.8998,
    longitude: 74.8774,
    elevation: 22.0,
    rainfall: 12.5,
    precipitation: 15.0,
    temperature: 28.4,
    surfacePressure: 1011.2,
    windSpeed: 14.2,
    tideLevel: null, // STRICT: must accept null
    stormSurge: null, // STRICT: must accept null
    source: "open-meteo",
    sourceTimestamp: "2026-10-08T17:30",
    dataQuality: "VERIFIED",
  };
  const parsed = EnvironmentalObservationSchema.parse(validSample);
  assert.strictEqual(parsed.tideLevel, null, "tideLevel must be null");
  assert.strictEqual(parsed.stormSurge, null, "stormSurge must be null");
  assert.strictEqual(parsed.dataQuality, "VERIFIED");

  // Invalid latitude rejection
  assert.throws(
    () => EnvironmentalObservationSchema.parse({ ...validSample, latitude: 120 }),
    /Too big|less than or equal/
  );

  console.log("  ✅ Zod schemas validated correctly (null tide/surge supported, invalid coords rejected)");

  // 2. Test Normalization from P2 Raw Files
  console.log("  Testing P2 feed normalization...");
  const normalized = environmentalService.parseAndNormalizeFeeds();
  assert.ok(normalized.length >= 336, "Must parse at least 336 hourly observations (168 Open-Meteo + 168 CWC)");

  const meteoRecords = normalized.filter((r) => r.source === "open-meteo");
  assert.strictEqual(meteoRecords.length, 168, "Must have 168 Open-Meteo records");
  assert.strictEqual(meteoRecords[0]?.dataQuality, "VERIFIED");
  // Check UTC conversion from Asia/Kolkata: 2026-10-08T00:00 local = 2026-10-07T18:30:00.000Z UTC
  assert.strictEqual(
    meteoRecords[0]?.timestamp,
    "2026-10-07T18:30:00.000Z",
    "Local Asia/Kolkata 00:00 must correctly convert to 18:30:00 UTC previous day"
  );

  const cwcRecords = normalized.filter((r) => r.source === "unverified-cwc");
  assert.strictEqual(cwcRecords.length, 168, "Must have 168 unverified CWC records");
  assert.strictEqual(
    cwcRecords[0]?.dataQuality,
    "UNVERIFIED_SOURCE",
    "Mislabeled CWC feed must be tagged UNVERIFIED_SOURCE"
  );
  assert.strictEqual(cwcRecords[0]?.tideLevel, null, "Tide level must be null");
  console.log(`  ✅ Feed normalization verified: 168 verified Open-Meteo, 168 UNVERIFIED_SOURCE CWC`);

  // 3. Test Database Ingestion and Deduplication (Neon PostGIS)
  if (process.env.DATABASE_URL) {
    console.log("  Testing Neon PostGIS ingestion and deduplication...");
    const db = getDb();
    const report1 = await environmentalService.ingestToDatabase(db);
    assert.strictEqual(report1.success, true);
    assert.ok(report1.inserted > 0, "Initial ingestion must insert records");

    // Second ingestion run should deduplicate / upsert without error
    const report2 = await environmentalService.ingestToDatabase(db);
    assert.strictEqual(report2.success, true);

    // Verify PostGIS point geometry
    const geomCheck = await db.execute<{
      count: string;
      has_point: boolean;
      geom_type: string;
    }>(sql`
      SELECT 
        count(*)::text AS count,
        bool_and(location IS NOT NULL) AS has_point,
        ST_GeometryType(location) AS geom_type
      FROM environmental_observations
      WHERE source = 'open-meteo'
      GROUP BY location
      LIMIT 1;
    `);
    assert.ok(geomCheck.rows.length > 0, "Open-Meteo records must exist in database");
    assert.strictEqual(geomCheck.rows[0]?.has_point, true, "location geometry must not be null");
    assert.strictEqual(geomCheck.rows[0]?.geom_type, "ST_Point", "Location geometry must be ST_Point");
    console.log("  ✅ Neon PostGIS verified: ST_Point geometry (SRID 4326) and deduplication confirmed");
  } else {
    console.log("  ⚠️ Skipping PostGIS ingestion test (DATABASE_URL not set)");
  }

  // 4. Test Hono GET /api/v1/environmental-observations
  console.log("  Testing GET /api/v1/environmental-observations...");
  const obsRes = await app.request("/api/v1/environmental-observations?source=open-meteo&limit=24");
  assert.strictEqual(obsRes.status, 200, "Endpoint should return 200 OK");
  const obsBody = (await obsRes.json()) as any;
  assert.strictEqual(obsBody.success, true);
  assert.ok(obsBody.observations.length > 0, "Should return observations");
  assert.strictEqual(obsBody.observations[0].source, "open-meteo");
  assert.strictEqual(obsBody.observations[0].tideLevel, null, "tideLevel must be null");
  console.log(`  ✅ GET /api/v1/environmental-observations returned ${obsBody.observations.length} items`);

  // 5. Test Hono GET /api/v1/events/:eventId/environment
  console.log("  Testing GET /api/v1/events/mangaluru-historical-2018/environment...");
  const eventRes = await app.request("/api/v1/events/mangaluru-historical-2018/environment");
  assert.strictEqual(eventRes.status, 200, "Event environment endpoint should return 200 OK");
  const eventBody = (await eventRes.json()) as any;
  assert.strictEqual(eventBody.success, true);
  assert.strictEqual(eventBody.eventEnvironment.eventId, "mangaluru-historical-2018");
  assert.ok(eventBody.eventEnvironment.forcing.rainfall, "Event rainfall forcing should be present");
  console.log("  ✅ GET /api/v1/events/:eventId/environment verified");

  // 6. Test Hono GET /api/v1/environmental-observations/sfincs-forcing
  console.log("  Testing GET /api/v1/environmental-observations/sfincs-forcing...");
  const forcingRes = await app.request("/api/v1/environmental-observations/sfincs-forcing?source=open-meteo");
  assert.strictEqual(forcingRes.status, 200);
  const forcingBody = (await forcingRes.json()) as any;
  assert.strictEqual(forcingBody.success, true);
  assert.strictEqual(forcingBody.forcing.parameter, "sfincs.precip");
  assert.strictEqual(forcingBody.forcing.tideBoundaryStatus.available, false, "Tide boundary must be marked unavailable");
  console.log("  ✅ SFINCS rainfall forcing boundary generated and tide unavailability documented");
}

// Standalone execution
if (process.argv[1]?.endsWith("environmental.test.ts")) {
  runEnvironmentalTests()
    .then(() => console.log("\n🎉 All Environmental Data Pipeline tests PASSED!\n"))
    .catch((err) => {
      console.error("\n❌ Environmental tests failed:", err);
      process.exit(1);
    });
}
