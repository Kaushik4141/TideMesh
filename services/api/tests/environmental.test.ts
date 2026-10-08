import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/index.js";

export async function runEnvironmentalTests() {
  console.log("\n🧪 Running Environmental Endpoint Tests...");

  // 1. Test GET /api/v1/environmental
  {
    const res = await app.request("/api/v1/environmental");
    assert.equal(res.status, 200, "Environmental endpoint should return 200 OK");
    const json = (await res.json()) as {
      success: boolean;
      count: number;
      observations: any[];
    };
    assert.equal(json.success, true, "Success should be true");
    assert.ok(typeof json.count === "number", "Count should be a number");
    assert.ok(Array.isArray(json.observations), "Observations should be an array");
    console.log(
      `  ✅ GET /api/v1/environmental returns 200 with ${json.count} observations`
    );

    if (json.observations.length > 0) {
      const obs = json.observations[0];
      assert.ok(obs.timestamp, "Observation should have timestamp");
      assert.ok(typeof obs.latitude === "number", "Observation should have latitude");
      assert.ok(typeof obs.longitude === "number", "Observation should have longitude");
      assert.ok(obs.source, "Observation should have source");
      console.log(
        `  ✅ Observation structure validated: source=${obs.source}, timestamp=${obs.timestamp}`
      );
    }
  }

  // 2. Test GET /api/v1/environmental with source filter
  {
    const res = await app.request("/api/v1/environmental?source=open-meteo");
    assert.equal(res.status, 200, "Environmental endpoint with source filter should return 200 OK");
    const json = (await res.json()) as {
      success: boolean;
      count: number;
      observations: any[];
    };
    assert.equal(json.success, true, "Success should be true");
    if (json.observations.length > 0) {
      const allOpenMeteo = json.observations.every(
        (o) => o.source === "open-meteo"
      );
      assert.ok(allOpenMeteo, "All observations should be from open-meteo source");
    }
    console.log(
      `  ✅ GET /api/v1/environmental?source=open-meteo returns ${json.count} filtered observations`
    );
  }

  // 3. Test GET /api/v1/environmental with limit
  {
    const res = await app.request("/api/v1/environmental?limit=5");
    assert.equal(res.status, 200, "Environmental endpoint with limit should return 200 OK");
    const json = (await res.json()) as {
      success: boolean;
      count: number;
      observations: any[];
    };
    assert.equal(json.success, true, "Success should be true");
    assert.ok(
      json.count <= 5,
      `Count should respect limit (got ${json.count}, expected <= 5)`
    );
    console.log(
      `  ✅ GET /api/v1/environmental?limit=5 returns ${json.count} observations (respects limit)`
    );
  }
}

// Allow running standalone
if (process.argv[1]?.endsWith("environmental.test.ts")) {
  runEnvironmentalTests().catch((err) => {
    console.error("❌ Environmental tests failed:", err);
    process.exit(1);
  });
}