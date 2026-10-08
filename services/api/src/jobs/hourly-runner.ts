/**
 * hourly-runner.ts - Autonomous 1-Hour Pipeline & Hydrodynamic Execution Job
 *
 * Workflow:
 * 1. Queries live Open-Meteo & Marine APIs for Mangaluru coordinates.
 * 2. Persists & deduplicates real-time environmental observations into Neon PostGIS.
 * 3. Evaluates latest meteorological conditions (rainfall rate, surface pressure, surge).
 * 4. Triggers on-demand SFINCS hydrodynamic simulation (<10-15s execution).
 * 5. Extracts updated flood extents and persists new predictions into Neon PostGIS.
 */

import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config({ path: resolve(process.cwd(), ".env") });
}

import { getDb } from "../db/index.js";
import { environmentalService } from "../services/environmental.service.js";
import { simulationService } from "../services/simulation.service.js";

async function runHourlyPipeline() {
  console.log("==================================================");
  console.log(" COASTSHIELD AI: HOURLY LIVE INTELLIGENCE CRON   ");
  console.log("==================================================");
  console.log(`[1/4] Timestamp: ${new Date().toISOString()}`);

  const db = getDb();

  // 1. Fetch live Open-Meteo weather and marine wave/surge conditions
  console.log("[2/4] Pulling live weather & marine observations from Open-Meteo...");
  const envReport = await environmentalService.fetchLiveObservations(db);
  console.log(
    `[OK] Ingested ${envReport.inserted} new / updated records. Total parsed: ${envReport.totalParsed}.`
  );

  // 2. Read latest live conditions
  const latestMetrics = await environmentalService.getLatestLiveMetrics(db);
  console.log(
    `[3/4] Current Mangaluru weather: ${latestMetrics?.rainfallMmHr ?? 0} mm/hr rain, ${
      latestMetrics?.windSpeedKmh ?? 0
    } km/h wind, ${latestMetrics?.stormSurgeM?.toFixed(2) ?? 0}m wave/surge setup.`
  );

  // 3. Trigger SFINCS simulation run
  console.log("[4/4] Executing on-demand SFINCS hydrodynamic simulation...");
  const simResult = await simulationService.runSimulation(db, {
    useLiveWeather: true,
    scenarioName: `Hourly Cycle ${new Date().toISOString().substring(0, 13)}:00`,
  });

  console.log(
    `[SUCCESS] Simulation finished in ${(simResult.executionTimeMs / 1000).toFixed(2)}s!`
  );
  console.log(`  |- Event ID:     ${simResult.simulation.eventId}`);
  console.log(`  |- Severity:     ${simResult.simulation.severity}`);
  console.log(`  |- Max Depth:    ${simResult.simulation.depthMax}m`);
  console.log(`  |- Flooded Area: ${simResult.simulation.metrics?.floodedAreaKm2} km²`);
  console.log(`  |- DB Record ID: ${simResult.dbRecord?.prediction?.id}`);
  console.log("==================================================");
}

runHourlyPipeline()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Hourly pipeline failed:", err);
    process.exit(1);
  });
