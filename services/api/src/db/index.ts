import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

export type DatabaseInstance = NeonHttpDatabase<typeof schema>;

// Cache client instances by connection string to reuse HTTP connection agents
const clientCache = new Map<string, DatabaseInstance>();

/**
 * Creates or retrieves a cached Drizzle instance over Neon HTTP.
 * This is connectionless and optimal for Cloudflare Workers & serverless edge environments.
 */
export function createDb(databaseUrl: string): DatabaseInstance {
  if (!databaseUrl) {
    throw new Error(
      "Database connection error: DATABASE_URL is required but was not provided."
    );
  }

  const cached = clientCache.get(databaseUrl);
  if (cached) {
    return cached;
  }

  const sql: NeonQueryFunction<boolean, boolean> = neon(databaseUrl);
  const db = drizzle(sql, { schema });
  clientCache.set(databaseUrl, db);
  return db;
}

/**
 * Contextual database resolver:
 * - If string URL passed, uses it.
 * - If object with DATABASE_URL passed (e.g. Cloudflare Worker env), extracts it.
 * - Otherwise falls back to process.env.DATABASE_URL.
 */
export function getDb(
  envOrUrl?: string | { DATABASE_URL?: string }
): DatabaseInstance {
  let url: string | undefined;

  if (typeof envOrUrl === "string") {
    url = envOrUrl;
  } else if (envOrUrl && typeof envOrUrl === "object" && "DATABASE_URL" in envOrUrl) {
    url = envOrUrl.DATABASE_URL;
  } else if (typeof process !== "undefined" && process.env?.DATABASE_URL) {
    url = process.env.DATABASE_URL;
  }

  if (!url) {
    throw new Error(
      "Missing DATABASE_URL configuration. Please ensure DATABASE_URL is set in environment bindings or .env file."
    );
  }

  return createDb(url);
}

export { schema };
