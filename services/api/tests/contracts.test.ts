import assert from "node:assert/strict";
import {
  FloodPredictionSchema,
  FloodImpactSchema,
  ResponsePrioritySchema,
  AlertSchema,
} from "@tidemesh/contracts";

export async function runContractTests() {
  console.log("\n🧪 Running Shared Contracts Zod Validation Tests...");

  // 1. Valid FloodPrediction
  {
    const valid = {
      zoneId: "zone-b",
      timestamp: "2026-10-08T15:00:00.000Z",
      probability: 0.87,
      severity: "HIGH",
      onset: "2026-10-08T15:35:00.000Z",
      peak: "2026-10-08T17:10:00.000Z",
      depthMin: 0.45,
      depthMax: 0.8,
      modelVersion: "flood-xgb-v1",
    };

    const parsed = FloodPredictionSchema.parse(valid);
    assert.equal(parsed.zoneId, "zone-b");
    assert.equal(parsed.probability, 0.87);
    console.log("  ✅ FloodPredictionSchema validates correct payload");

    // Invalid: probability > 1
    assert.throws(
      () => FloodPredictionSchema.parse({ ...valid, probability: 1.5 }),
      /too_big|Number must be less than or equal to 1/i,
      "Should reject probability > 1"
    );

    // Invalid: probability < 0
    assert.throws(
      () => FloodPredictionSchema.parse({ ...valid, probability: -0.2 }),
      /too_small|Number must be greater than or equal to 0/i,
      "Should reject negative probability"
    );

    // Invalid: invalid severity enum
    assert.throws(
      () => FloodPredictionSchema.parse({ ...valid, severity: "SUPER_HIGH" }),
      /invalid_value|invalid_enum_value/i,
      "Should reject invalid severity enum"
    );
    console.log("  ✅ FloodPredictionSchema rejects invalid probabilities and severity");
  }

  // 2. Valid FloodImpact
  {
    const valid = {
      predictionId: "123e4567-e89b-12d3-a456-426614174000",
      zoneId: "zone-b",
      affectedPopulation: 3200,
      affectedBuildingsCount: 124,
      affectedRoadsCount: 4,
      criticalFacilitiesCount: 1,
    };
    const parsed = FloodImpactSchema.parse(valid);
    assert.equal(parsed.affectedPopulation, 3200);
    console.log("  ✅ FloodImpactSchema validates correct payload");
  }

  // 3. Valid ResponsePriority
  {
    const valid = {
      zoneId: "zone-b",
      score: 0.92,
      rank: 1,
      severity: "CRITICAL",
      reason: "High compound flood risk with threatened hospital access",
      recommendedActions: ["Deploy Rescue Team A", "Secure Road R12"],
    };
    const parsed = ResponsePrioritySchema.parse(valid);
    assert.equal(parsed.rank, 1);
    assert.equal(parsed.severity, "CRITICAL");
    console.log("  ✅ ResponsePrioritySchema validates correct payload");
  }

  // 4. Valid Alert
  {
    const valid = {
      zoneId: "zone-b",
      severity: "HIGH",
      message: "Flooding expected in 35 minutes. Move valuables above floor level.",
      recommendedActions: ["Avoid Road R12", "Prepare for possible evacuation"],
    };
    const parsed = AlertSchema.parse(valid);
    assert.equal(parsed.zoneId, "zone-b");
    assert.equal(parsed.severity, "HIGH");
    console.log("  ✅ AlertSchema validates correct payload");
  }
}

// Allow running standalone
if (process.argv[1]?.endsWith("contracts.test.ts")) {
  runContractTests().catch((err) => {
    console.error("❌ Contract tests failed:", err);
    process.exit(1);
  });
}
