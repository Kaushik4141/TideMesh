import {
  pgTable,
  text,
  uuid,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  customType,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

/**
 * Spatial Reference System Identifier (SRID)
 * SRID 4326 is the standard WGS 84 (GPS longitude/latitude in degrees).
 * Used across TideMesh / CoastShield AI for all geospatial vector assets.
 */
export const DEFAULT_SRID = 4326;

/**
 * Reusable PostGIS Geometry Column Definition (SRID 4326)
 * Enables spatial indexes (GIST) and queries (ST_Intersects, ST_DWithin, ST_AsGeoJSON).
 */
export const postgisGeometry = (
  name: string,
  options: { type?: string; srid?: number } = {}
) => {
  const geomType = options.type ?? "Geometry";
  const srid = options.srid ?? DEFAULT_SRID;
  return customType<{
    data: string;
    driverData: string;
  }>({
    dataType() {
      return `geometry(${geomType}, ${srid})`;
    },
  })(name);
};

// =============================================================================
// ENUMS
// =============================================================================

export const userRoleEnum = pgEnum("user_role", [
  "citizen",
  "responder",
  "municipality",
  "admin",
]);

export const severityLevelEnum = pgEnum("severity_level", [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
]);

export const facilityTypeEnum = pgEnum("facility_type", [
  "hospital",
  "shelter",
  "fire_station",
  "police_station",
  "school",
  "other",
]);

// =============================================================================
// 1. USERS
// =============================================================================
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    role: userRoleEnum("role").default("citizen").notNull(),
    location: postgisGeometry("location", { type: "Point", srid: DEFAULT_SRID }),
    notificationPreferences: jsonb("notification_preferences").$type<{
      push?: boolean;
      sms?: boolean;
      email?: boolean;
      highRiskOnly?: boolean;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("users_role_idx").on(table.role),
  ]
);

// =============================================================================
// 2. ZONES
// =============================================================================
export const zones = pgTable(
  "zones",
  {
    id: text("id").primaryKey(), // e.g., 'zone-a', 'zone-b'
    name: text("name").notNull(),
    geometry: postgisGeometry("geometry", {
      type: "Geometry",
      srid: DEFAULT_SRID,
    }).notNull(),
    elevation: doublePrecision("elevation"), // mean terrain elevation in meters
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("zones_geom_gist_idx").using("gist", table.geometry),
  ]
);

// =============================================================================
// 3. ROADS
// =============================================================================
export const roads = pgTable(
  "roads",
  {
    id: text("id").primaryKey(), // e.g. OSM road id or segment id
    name: text("name").notNull(),
    roadType: text("road_type"), // e.g., 'primary', 'secondary', 'residential'
    geometry: postgisGeometry("geometry", {
      type: "Geometry",
      srid: DEFAULT_SRID,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("roads_geom_gist_idx").using("gist", table.geometry),
  ]
);

// =============================================================================
// 4. BUILDINGS
// =============================================================================
export const buildings = pgTable(
  "buildings",
  {
    id: text("id").primaryKey(), // e.g. OSM building id
    buildingType: text("building_type"), // e.g., 'residential', 'commercial', 'industrial'
    geometry: postgisGeometry("geometry", {
      type: "Geometry",
      srid: DEFAULT_SRID,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("buildings_geom_gist_idx").using("gist", table.geometry),
  ]
);

// =============================================================================
// 5. CRITICAL FACILITIES
// =============================================================================
export const criticalFacilities = pgTable(
  "critical_facilities",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: facilityTypeEnum("type").notNull(),
    geometry: postgisGeometry("geometry", {
      type: "Geometry",
      srid: DEFAULT_SRID,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("critical_facilities_geom_gist_idx").using("gist", table.geometry),
    index("critical_facilities_type_idx").on(table.type),
  ]
);

// =============================================================================
// 6. ENVIRONMENTAL OBSERVATIONS
// =============================================================================
export const environmentalObservations = pgTable(
  "environmental_observations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    rainfall: doublePrecision("rainfall"), // mm
    tideLevel: doublePrecision("tide_level"), // meters
    stormSurge: doublePrecision("storm_surge"), // meters
    source: text("source"), // e.g. 'station-01', 'simulated', 'noaa'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("env_obs_timestamp_idx").on(table.timestamp),
  ]
);

// =============================================================================
// 7. FLOOD PREDICTIONS
// =============================================================================
export const floodPredictions = pgTable(
  "flood_predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: text("event_id"),
    zoneId: text("zone_id")
      .notNull()
      .references(() => zones.id, { onDelete: "cascade" }),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    probability: doublePrecision("probability"), // normalized: 0.0 to 1.0 (nullable for physics simulations)
    isDeterministic: boolean("is_deterministic").default(false).notNull(),
    severity: severityLevelEnum("severity").notNull(),
    onsetTime: timestamp("onset_time", { withTimezone: true }),
    peakTime: timestamp("peak_time", { withTimezone: true }),
    depthMin: doublePrecision("depth_min"), // meters
    depthMax: doublePrecision("depth_max"), // meters
    floodGeometry: postgisGeometry("flood_geometry", {
      type: "Geometry",
      srid: DEFAULT_SRID,
    }),
    modelVersion: text("model_version").default("flood-xgb-v1").notNull(),
    source: text("source").default("ml"),
    metrics: jsonb("metrics"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("predictions_zone_id_idx").on(table.zoneId),
    index("predictions_timestamp_idx").on(table.timestamp),
    index("predictions_severity_idx").on(table.severity),
  ]
);

// =============================================================================
// 8. FLOOD IMPACTS
// =============================================================================
export const floodImpacts = pgTable(
  "flood_impacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    predictionId: uuid("prediction_id")
      .notNull()
      .references(() => floodPredictions.id, { onDelete: "cascade" }),
    affectedPopulation: integer("affected_population"),
    affectedBuildingsCount: integer("affected_buildings_count"),
    affectedRoadsCount: integer("affected_roads_count"),
    criticalFacilitiesCount: integer("critical_facilities_count"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("impacts_prediction_id_idx").on(table.predictionId),
  ]
);

// =============================================================================
// 9. RESPONSE PRIORITIES
// =============================================================================
export const responsePriorities = pgTable(
  "response_priorities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zoneId: text("zone_id")
      .notNull()
      .references(() => zones.id, { onDelete: "cascade" }),
    score: doublePrecision("score").notNull(),
    rank: integer("rank").notNull(),
    severity: severityLevelEnum("severity").notNull(),
    reason: text("reason"),
    recommendedActions: jsonb("recommended_actions")
      .$type<string[]>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("priorities_zone_id_idx").on(table.zoneId),
    index("priorities_rank_idx").on(table.rank),
  ]
);

// =============================================================================
// 10. ALERTS
// =============================================================================
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zoneId: text("zone_id")
      .notNull()
      .references(() => zones.id, { onDelete: "cascade" }),
    severity: severityLevelEnum("severity").notNull(),
    message: text("message").notNull(),
    recommendedActions: jsonb("recommended_actions")
      .$type<string[]>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    index("alerts_zone_id_idx").on(table.zoneId),
    index("alerts_severity_idx").on(table.severity),
  ]
);

// =============================================================================
// DRIZZLE RELATIONS
// =============================================================================

export const zonesRelations = relations(zones, ({ many }) => ({
  predictions: many(floodPredictions),
  priorities: many(responsePriorities),
  alerts: many(alerts),
}));

export const floodPredictionsRelations = relations(
  floodPredictions,
  ({ one, many }) => ({
    zone: one(zones, {
      fields: [floodPredictions.zoneId],
      references: [zones.id],
    }),
    impacts: many(floodImpacts),
  })
);

export const floodImpactsRelations = relations(floodImpacts, ({ one }) => ({
  prediction: one(floodPredictions, {
    fields: [floodImpacts.predictionId],
    references: [floodPredictions.id],
  }),
}));

export const responsePrioritiesRelations = relations(
  responsePriorities,
  ({ one }) => ({
    zone: one(zones, {
      fields: [responsePriorities.zoneId],
      references: [zones.id],
    }),
  })
);

export const alertsRelations = relations(alerts, ({ one }) => ({
  zone: one(zones, {
    fields: [alerts.zoneId],
    references: [zones.id],
  }),
}));
