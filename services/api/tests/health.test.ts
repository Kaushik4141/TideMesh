import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/index.js";

export async function runHealthTests() {
  console.log("\n🧪 Running API Health Endpoint Tests...");

  // 1. Test GET /
  {
    const res = await app.request("/");
    assert.equal(res.status, 200, "Root endpoint should return 200 OK");
    const json = (await res.json()) as { name: string; status: string };
    assert.equal(json.status, "running", "Root status should be running");
    console.log("  ✅ GET / returns 200 with service info");
  }

  // 2. Test GET /api/v1/health
  {
    const res = await app.request("/api/v1/health");
    assert.equal(res.status, 200, "Health endpoint should return 200 OK");
    const json = (await res.json()) as { status: string; service: string };
    assert.equal(json.status, "ok", "Status should be 'ok'");
    assert.equal(json.service, "tidemesh-api", "Service should be tidemesh-api");
    console.log("  ✅ GET /api/v1/health returns 200 with status 'ok'");
  }

  // 3. Test GET /api/v1/health/db
  {
    const res = await app.request("/api/v1/health/db");
    assert.equal(res.status, 200, "DB health endpoint should return 200 OK");
    const json = (await res.json()) as {
      status: string;
      database: string;
      postgis: string;
      postgisVersion?: string;
    };
    assert.equal(json.status, "ok", "DB health status should be 'ok'");
    assert.equal(json.database, "connected", "Database status should be 'connected'");
    assert.equal(json.postgis, "available", "PostGIS status should be 'available'");
    assert.ok(json.postgisVersion, "PostGIS version should be reported");
    console.log(
      `  ✅ GET /api/v1/health/db returns 200 with PostGIS (${json.postgisVersion})`
    );
  }
}

// Allow running standalone
if (process.argv[1]?.endsWith("health.test.ts")) {
  runHealthTests().catch((err) => {
    console.error("❌ Health tests failed:", err);
    process.exit(1);
  });
}
