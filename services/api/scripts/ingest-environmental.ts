import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { getDb } from "../src/db/index.js";
import { environmentalService } from "../src/services/environmental.service.js";

const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config();
}

async function main() {
  console.log("============================================================");
  console.log("🌊 TideMesh — Ingesting Environmental Observations into Neon");
  console.log("============================================================");

  try {
    const db = getDb();
    const report = await environmentalService.ingestToDatabase(db);

    console.log("\n📊 Ingestion Results:");
    console.log(`   Source:           ${report.source}`);
    console.log(`   Total Parsed:     ${report.totalParsed}`);
    console.log(`   Inserted/Updated: ${report.inserted}`);
    console.log(`   Skipped/Cached:   ${report.skipped}`);
    console.log(`   Time Range:       ${report.timeRange.start} → ${report.timeRange.end}`);
    console.log("   Quality Breakdown:", report.qualityBreakdown);

    console.log("\n🎉 Environmental data ingestion successfully completed!\n");
  } catch (error) {
    console.error("❌ Ingestion failed:", error);
    process.exit(1);
  }
}

main();
