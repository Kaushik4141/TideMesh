import { sql } from "drizzle-orm";
import type { DatabaseInstance } from "../db/index.js";

export interface DatabaseHealthResult {
  status: "ok" | "degraded" | "error";
  database: "connected" | "disconnected";
  postgis: "available" | "unavailable";
  postgisVersion?: string;
  error?: string;
  timestamp: string;
}

export async function checkDatabaseHealth(
  db: DatabaseInstance
): Promise<DatabaseHealthResult> {
  const timestamp = new Date().toISOString();

  try {
    // 1. Basic query check
    await db.execute(sql`SELECT 1 as ping;`);

    // 2. PostGIS verification query
    const postgisRes = await db.execute<{ postgis_version: string }>(
      sql`SELECT PostGIS_Version() as postgis_version;`
    );

    const postgisVersion = postgisRes.rows[0]?.postgis_version;

    if (!postgisVersion) {
      return {
        status: "degraded",
        database: "connected",
        postgis: "unavailable",
        timestamp,
      };
    }

    return {
      status: "ok",
      database: "connected",
      postgis: "available",
      postgisVersion,
      timestamp,
    };
  } catch (err: unknown) {
    // Sanitize error message to prevent leaking credentials or connection strings
    const errorMessage =
      err instanceof Error ? err.message : "Unknown database connection failure";

    // Remove any embedded passwords or connection parameters from error message
    const sanitizedError = errorMessage.replace(/:\/\/[^@]+@/, "://***:***@");

    return {
      status: "error",
      database: "disconnected",
      postgis: "unavailable",
      error: sanitizedError,
      timestamp,
    };
  }
}
