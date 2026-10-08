import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { getDb, schema } from "../src/db/index.js";

export async function runDbTests() {
  console.log("\n🧪 Running Database & PostGIS Connectivity Tests...");

  const db = getDb();

  // 1. Test basic connectivity
  {
    const res = await db.execute<{ ping: number }>(sql`SELECT 1 as ping;`);
    assert.equal(res.rows[0]?.ping, 1, "Ping query should return 1");
    console.log("  ✅ Neon PostgreSQL connection ping verified");
  }

  // 2. Test PostGIS extension availability
  {
    const res = await db.execute<{ postgis_version: string }>(
      sql`SELECT PostGIS_Version() as postgis_version;`
    );
    const version = res.rows[0]?.postgis_version;
    assert.ok(version, "PostGIS version must be non-empty");
    assert.ok(
      version.includes("3."),
      `PostGIS version should be 3.x, received: ${version}`
    );
    console.log(`  ✅ PostGIS extension verified: ${version}`);
  }

  // 3. Test basic schema query on zones table
  {
    const zonesList = await db.select().from(schema.zones);
    assert.ok(Array.isArray(zonesList), "Zones query should return an array");
    assert.ok(zonesList.length > 0, "Zones table should contain seeded zones");
    const zoneB = zonesList.find((z) => z.id === "zone-b");
    assert.ok(zoneB, "Zone B should exist in database");
    assert.equal(
      zoneB.name,
      "Bayside Residential",
      "Zone B name should match seed data"
    );
    console.log(`  ✅ Schema query verified: retrieved ${zonesList.length} zones`);
  }

  // 4. Test PostGIS spatial query operation
  {
    const spatialResult = await db.execute<{
      zone_id: string;
      facility_name: string;
      facility_type: string;
    }>(sql`
      SELECT 
        z.id as zone_id,
        cf.name as facility_name,
        cf.type as facility_type
      FROM zones z
      JOIN critical_facilities cf ON ST_Contains(z.geometry, cf.geometry)
      WHERE z.id = 'zone-b';
    `);

    assert.ok(
      spatialResult.rows.length > 0,
      "Spatial ST_Contains query should match facility inside Zone B"
    );
    assert.equal(
      spatialResult.rows[0]?.facility_name,
      "Coastal Memorial Hospital",
      "Facility in Zone B should be Coastal Memorial Hospital"
    );
    console.log(
      `  ✅ PostGIS spatial intersection verified: ${spatialResult.rows[0]?.facility_name} inside ${spatialResult.rows[0]?.zone_id}`
    );
  }

  // 5. Test relations and joins on flood predictions
  {
    const predictions = await db
      .select({
        id: schema.floodPredictions.id,
        zoneId: schema.floodPredictions.zoneId,
        probability: schema.floodPredictions.probability,
        severity: schema.floodPredictions.severity,
      })
      .from(schema.floodPredictions)
      .where(sql`${schema.floodPredictions.zoneId} = 'zone-b'`);

    assert.ok(predictions.length > 0, "Should find flood predictions for zone-b");
    const prob = predictions[0]!.probability;
    assert.ok(
      prob === null || (prob >= 0 && prob <= 1),
      "Probability must be null or normalized between 0 and 1"
    );
    console.log(
      `  ✅ Flood predictions query verified: probability=${predictions[0]?.probability}, severity=${predictions[0]?.severity}`
    );
  }
}

// Allow running standalone
if (process.argv[1]?.endsWith("db.test.ts")) {
  runDbTests().catch((err) => {
    console.error("❌ DB tests failed:", err);
    process.exit(1);
  });
}
