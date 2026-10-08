import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config();
}

async function checkPostgis() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = neon(url);
  const db = drizzle(client);

  try {
    const versionRes = await db.execute<{ version: string }>(
      sql`SELECT version() as version;`
    );
    console.log("PostgreSQL Version:", versionRes.rows[0]?.version);

    const postgisRes = await db.execute<{ postgis_version: string }>(
      sql`SELECT PostGIS_Version() as postgis_version;`
    );
    console.log("PostGIS Version:", postgisRes.rows[0]?.postgis_version);

    const countRes = await db.execute<{ count: string }>(
      sql`SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public';`
    );
    console.log("Public Tables Count:", countRes.rows[0]?.count);
  } catch (err) {
    console.error("Check failed:", err);
    process.exit(1);
  }
}

checkPostgis();
