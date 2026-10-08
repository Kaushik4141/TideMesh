import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema.js";

// Load .env.local if present, else .env
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config();
}

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error(
      "❌ Migration failed: Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is defined."
    );
    process.exit(1);
  }

  console.log("🔗 Connecting to Neon PostgreSQL...");
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient, { schema });

  try {
    // 1. Ensure PostGIS is enabled
    console.log("🌍 Ensuring PostGIS extension is enabled...");
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // 2. Verify PostGIS version
    const postgisRes = await db.execute<{ postgis_version: string }>(
      sql`SELECT PostGIS_Version() as postgis_version;`
    );
    const postgisVersion = postgisRes.rows[0]?.postgis_version;
    console.log(`✅ PostGIS verified: ${postgisVersion}`);

    // 3. Apply migrations from drizzle folder
    console.log("🚀 Applying Drizzle migrations from ./drizzle...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations applied successfully!");

    // 4. Verify created tables in PostgreSQL
    const tablesRes = await db.execute<{ table_name: string }>(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
    );
    const tableNames = tablesRes.rows.map((r) => r.table_name);
    console.log(`📊 Verified ${tableNames.length} tables in database:`);
    tableNames.forEach((name) => console.log(`   - ${name}`));

    console.log("\n🎉 Database migration complete and ready for CoastShield AI!");
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    process.exit(1);
  }
}

runMigrations();
