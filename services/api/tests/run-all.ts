import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { runHealthTests } from "./health.test.js";
import { runDbTests } from "./db.test.js";
import { runContractTests } from "./contracts.test.js";
import { runSimulationTests } from "./simulation.test.js";
import { runEnvironmentalTests } from "./environmental.test.js";

const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config();
}

async function runAllTests() {
  console.log("============================================================");
  console.log("🌊 TideMesh (CoastShield AI) — Backend Test Suite");
  console.log("============================================================");

  const start = Date.now();
  let passed = 0;
  let failed = 0;

  const suites = [
    { name: "Shared Contracts (Zod Validation)", fn: runContractTests },
    { name: "Database & PostGIS Connectivity", fn: runDbTests },
    { name: "Hono API & Health Endpoints", fn: runHealthTests },
    { name: "SFINCS Hydrodynamic Simulation Integration", fn: runSimulationTests },
    { name: "Environmental Observation Pipeline & Ingestion", fn: runEnvironmentalTests },
  ];



  for (const suite of suites) {
    try {
      await suite.fn();
      passed++;
    } catch (err) {
      console.error(`\n❌ Test Suite Failed: ${suite.name}`);
      console.error(err);
      failed++;
    }
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log("\n============================================================");
  console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed (${duration}s)`);
  console.log("============================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL PHASE 1 ACCEPTANCE TESTS PASSED!\n");
  }
}

runAllTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
