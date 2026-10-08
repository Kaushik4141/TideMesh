import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema.js";

const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config();
}

/**
 * ==============================================================================
 * MOCK / DEMO SEED DATA
 * ==============================================================================
 * CAUTION: These records are purely synthetic development mock data for testing
 * database schema, spatial PostGIS queries, and UI layouts.
 * They DO NOT represent real flood predictions or real geographic boundaries.
 * Coordinates are formatted in WGS 84 (SRID 4326) longitude / latitude.
 * ==============================================================================
 */

async function seedDatabase() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ Seed failed: DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("🌱 Seeding TideMesh database with mock development data...");
  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient, { schema });

  try {
    // Clean up previous mock seed data in dependency order
    console.log("🧹 Clearing old mock records...");
    await db.delete(schema.alerts);
    await db.delete(schema.responsePriorities);
    await db.delete(schema.floodImpacts);
    await db.delete(schema.floodPredictions);
    await db.delete(schema.criticalFacilities);
    await db.delete(schema.roads);
    await db.delete(schema.buildings);
    await db.delete(schema.zones);
    await db.delete(schema.users);

    // 1. Seed Zones (SRID 4326 Polygons)
    console.log("📍 Inserting mock zones...");
    await db.execute(sql`
      INSERT INTO zones (id, name, elevation, geometry) VALUES
      (
        'zone-a',
        'Downtown Waterfront',
        2.4,
        ST_GeomFromText('POLYGON((-74.015 40.700, -74.005 40.700, -74.005 40.710, -74.015 40.710, -74.015 40.700))', 4326)
      ),
      (
        'zone-b',
        'Bayside Residential',
        1.1,
        ST_GeomFromText('POLYGON((-74.025 40.700, -74.015 40.700, -74.015 40.710, -74.025 40.710, -74.025 40.700))', 4326)
      ),
      (
        'zone-c',
        'Hillside Heights',
        18.5,
        ST_GeomFromText('POLYGON((-74.035 40.710, -74.025 40.710, -74.025 40.720, -74.035 40.720, -74.035 40.710))', 4326)
      );
    `);

    // 2. Seed Critical Facilities (SRID 4326 Points)
    console.log("🏥 Inserting mock critical facilities...");
    await db.execute(sql`
      INSERT INTO critical_facilities (id, name, type, geometry) VALUES
      ('fac-hosp-01', 'Coastal Memorial Hospital', 'hospital', ST_GeomFromText('POINT(-74.018 40.705)', 4326)),
      ('fac-shelter-01', 'Civic Center Shelter', 'shelter', ST_GeomFromText('POINT(-74.030 40.715)', 4326)),
      ('fac-fire-01', 'Harbor Fire Station #4', 'fire_station', ST_GeomFromText('POINT(-74.012 40.708)', 4326));
    `);

    // 3. Seed Roads (SRID 4326 LineStrings)
    console.log("🛣️ Inserting mock roads...");
    await db.execute(sql`
      INSERT INTO roads (id, name, road_type, geometry) VALUES
      ('road-r12', 'Harbor Blvd', 'primary', ST_GeomFromText('LINESTRING(-74.020 40.702, -74.015 40.706, -74.010 40.709)', 4326)),
      ('road-r18', 'Bayside Avenue', 'secondary', ST_GeomFromText('LINESTRING(-74.024 40.701, -74.018 40.705, -74.012 40.707)', 4326));
    `);

    // 4. Seed Mock Flood Prediction
    console.log("🌊 Inserting mock flood prediction for Zone B...");
    const now = new Date();
    const onsetTime = new Date(now.getTime() + 35 * 60 * 1000); // +35 min
    const peakTime = new Date(now.getTime() + 130 * 60 * 1000); // +130 min

    const [pred] = await db
      .insert(schema.floodPredictions)
      .values({
        zoneId: "zone-b",
        eventId: "mock-storm-event-2026",
        timestamp: now,
        probability: 0.87,
        severity: "HIGH",
        onsetTime,
        peakTime,
        depthMin: 0.45,
        depthMax: 0.8,
        modelVersion: "flood-xgb-v1",
      })
      .returning();

    // 5. Seed Mock Flood Impact
    console.log("💥 Inserting mock flood impact...");
    await db.insert(schema.floodImpacts).values({
      predictionId: pred.id,
      affectedPopulation: 3200,
      affectedBuildingsCount: 124,
      affectedRoadsCount: 4,
      criticalFacilitiesCount: 1,
    });

    // 6. Seed Mock Response Priority
    console.log("🚨 Inserting mock response priorities...");
    await db.insert(schema.responsePriorities).values([
      {
        zoneId: "zone-b",
        score: 0.92,
        rank: 1,
        severity: "CRITICAL",
        reason:
          "Compound risk: High tide peak coincides with rainfall. Hospital access road R12 threatened.",
        recommendedActions: [
          "Deploy Rescue Team A",
          "Secure Road R12 with sandbags",
          "Verify Coastal Memorial Hospital access",
          "Pre-stage pumps at Bayside Avenue",
        ],
      },
      {
        zoneId: "zone-a",
        score: 0.65,
        rank: 2,
        severity: "HIGH",
        reason: "Waterfront surge risk; commercial area inundation likely.",
        recommendedActions: [
          "Issue resident advisory",
          "Monitor harbor water level sensors",
        ],
      },
    ]);

    // 7. Seed Mock Alert
    console.log("📢 Inserting mock alert...");
    await db.insert(schema.alerts).values({
      zoneId: "zone-b",
      severity: "HIGH",
      message:
        "Flooding expected to begin in ~35 minutes. Peak water levels estimated between 0.45m and 0.80m.",
      recommendedActions: [
        "Avoid Road R12 and Bayside Avenue",
        "Move valuables and equipment to upper levels",
        "Civic Center Shelter is open at high elevation",
      ],
      expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
    });

    console.log("\n✅ Database seeded successfully with demo mock data!");
  } catch (err) {
    console.error("❌ Seed script failed:", err);
    process.exit(1);
  }
}

seedDatabase();
