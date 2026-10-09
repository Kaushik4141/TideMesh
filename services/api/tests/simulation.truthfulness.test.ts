import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { simulationRouter } from "../src/routes/simulation.js";
import { SimulationService } from "../src/services/simulation.service.js";

export async function runSimulationTruthfulnessTests() {
  const service = new SimulationService("http://127.0.0.1:1", "/tmp/no-configured-forecast-artifact.json");
  assert.deepEqual(await service.getLiveForecast(), {
    success: true,
    mode: "LIVE_FORECAST",
    event: null,
    status: "unavailable",
    reason: "No validated operational forecast artifact is configured",
  });
  const liveResponse = await simulationRouter.request("/live/forecast");
  assert.equal(liveResponse.status, 200);
  assert.deepEqual(await liveResponse.json(), {
    success: true,
    mode: "LIVE_FORECAST",
    event: null,
    status: "unavailable",
    reason: "No validated operational forecast artifact is configured",
  });
  const capabilitiesResponse = await simulationRouter.request("/capabilities");
  assert.equal(capabilitiesResponse.status, 200);
  const capabilities = await capabilitiesResponse.json() as { solver: string; enabled: boolean; operational: boolean; reason: string };
  assert.equal(capabilities.solver, "sfincs");
  assert.equal(capabilities.operational, false);
  assert.equal(typeof capabilities.enabled, "boolean");
  assert.ok(capabilities.reason.length > 0);
  assert.deepEqual(service.getScenarioData(), {
    success: true,
    mode: "SCENARIO",
    event: null,
    status: "unavailable",
    reason: "No solver run was performed. Submit a private six-hour scenario job and retrieve its actual artifacts; parameter scaling is not a hydrodynamic simulation.",
  });
  const replay = service.getReplayData();
  assert.equal(replay.mode, "HISTORICAL_REPLAY");
  if (replay.event) {
    assert.equal(replay.event.operational, false);
    assert.match(replay.event.disclaimer, /not a calibrated hindcast or operational forecast/i);
  }
  await assert.rejects(
    service.runSimulation(undefined as never, { zoneId: "zone-other-city", rainfallRateMmHr: 10, useLiveWeather: false }),
    /Unsupported simulation boundary "zone-other-city"/,
  );

  const directory = await mkdtemp(join(tmpdir(), "simulation-forecast-"));
  const artifactPath = join(directory, "forecast.json");
  const artifact = {
    id: "validated-forecast-1",
    operational: true,
    validationStatus: "validated",
    source: "configured-operations-artifact",
  };
  try {
    await writeFile(artifactPath, JSON.stringify(artifact));
    assert.deepEqual(await new SimulationService("http://127.0.0.1:1", artifactPath).getLiveForecast(), {
      success: true,
      mode: "LIVE_FORECAST",
      event: artifact,
      status: "available",
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[1]?.endsWith("simulation.truthfulness.test.ts")) {
  runSimulationTruthfulnessTests()
    .then(() => console.log("Simulation truthfulness tests passed"))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
