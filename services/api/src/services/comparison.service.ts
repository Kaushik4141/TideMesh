import { sql } from "drizzle-orm";
import {
  AssetImpactSchema, ComparisonRequestSchema, ComparisonSchema, GeoJsonGeometrySchema,
  type AssetImpact, type Comparison, type ComparisonRequest, type RunSnapshot,
} from "@tidemesh/contracts";
import type { DatabaseInstance } from "../db/index.js";
import { SimulationError, SimulationService, requireImmutableRunId } from "./simulation.service.js";

export class ComparisonError extends Error {
  constructor(public readonly status: 409 | 422 | 503, message: string) {
    super(message);
    this.name = "ComparisonError";
  }
}

export interface SpatialComparison {
  baselineAreaKm2: number | null;
  scenarioAreaKm2: number | null;
  assets: AssetImpact[] | null;
  newlyInundatedGeometry: RunSnapshot["floodGeometry"];
  infrastructureAvailable: boolean;
  availableKinds: AssetImpact["kind"][];
}

/** Both extents are dissolved after repairing polygons; never measure WGS84 degrees. */
export function comparisonSpatialSql(baseline: RunSnapshot, scenario: RunSnapshot) {
  const geometry = (run: RunSnapshot) => run.floodGeometry ? JSON.stringify(run.floodGeometry) : null;
  return sql`
    WITH inputs AS (
      SELECT ${geometry(baseline)}::text AS baseline_json, ${geometry(scenario)}::text AS scenario_json
    ), polygons AS (
      SELECT
        CASE WHEN baseline_json IS NULL THEN NULL ELSE
          ST_UnaryUnion(ST_CollectionExtract(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(baseline_json), 4326)), 3)) END AS baseline,
        CASE WHEN scenario_json IS NULL THEN NULL ELSE
          ST_UnaryUnion(ST_CollectionExtract(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(scenario_json), 4326)), 3)) END AS scenario
      FROM inputs
    ), inventory AS (
      SELECT id, 'road'::text AS kind, name, geometry FROM roads
      UNION ALL SELECT id, 'building'::text, NULL::text, geometry FROM buildings
      UNION ALL SELECT id, 'facility'::text, name, geometry FROM critical_facilities
    ), intersections AS (
      SELECT DISTINCT i.id, i.kind, i.name, ST_AsGeoJSON(i.geometry)::jsonb AS geometry,
        ST_Intersects(ST_MakeValid(i.geometry), p.baseline) AS baseline_affected,
        ST_Intersects(ST_MakeValid(i.geometry), p.scenario) AS scenario_affected
      FROM inventory i CROSS JOIN polygons p
      WHERE p.baseline IS NOT NULL AND p.scenario IS NOT NULL
        AND (ST_Intersects(ST_MakeValid(i.geometry), p.baseline)
          OR ST_Intersects(ST_MakeValid(i.geometry), p.scenario))
    )
    SELECT ST_Area(p.baseline::geography) / 1000000.0 AS baseline_area_km2,
      ST_Area(p.scenario::geography) / 1000000.0 AS scenario_area_km2,
      CASE WHEN p.baseline IS NULL OR p.scenario IS NULL THEN NULL ELSE
        ST_AsGeoJSON(ST_CollectionExtract(ST_MakeValid(ST_Difference(p.scenario, p.baseline)), 3))::jsonb END AS newly_inundated_geometry,
      (SELECT count(*) > 0 FROM inventory) AS infrastructure_available,
      (SELECT COALESCE(jsonb_agg(DISTINCT kind), '[]'::jsonb) FROM inventory) AS available_kinds,
      CASE WHEN p.baseline IS NULL OR p.scenario IS NULL THEN NULL ELSE
        COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'id', id, 'kind', kind, 'name', name, 'geometry', geometry,
          'baselineAffected', baseline_affected, 'scenarioAffected', scenario_affected
        ) ORDER BY kind, id) FROM intersections), '[]'::jsonb) END AS assets
    FROM polygons p
  `;
}

export async function querySpatialComparison(
  db: DatabaseInstance, baseline: RunSnapshot, scenario: RunSnapshot,
): Promise<SpatialComparison> {
  const result = await db.execute<{
    baseline_area_km2: number | null; scenario_area_km2: number | null;
    newly_inundated_geometry: unknown; assets: unknown; infrastructure_available: boolean; available_kinds: AssetImpact["kind"][];
  }>(comparisonSpatialSql(baseline, scenario));
  const row = result.rows[0];
  if (!row) throw new Error("Spatial comparison returned no row.");
  if (typeof row.infrastructure_available !== "boolean" || !Array.isArray(row.available_kinds) ||
      row.available_kinds.some(kind => !["road", "building", "facility"].includes(kind))) {
    throw new Error("Spatial inventory availability is invalid.");
  }
  const area = (value: number | null) => {
    if (value === null) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) throw new Error("Invalid spatial area.");
    return numeric;
  };
  return {
    baselineAreaKm2: area(row.baseline_area_km2), scenarioAreaKm2: area(row.scenario_area_km2),
    newlyInundatedGeometry: row.newly_inundated_geometry === null ? null : GeoJsonGeometrySchema.parse(row.newly_inundated_geometry),
    assets: row.assets === null || !row.infrastructure_available ? null : AssetImpactSchema.array().parse(row.assets),
    infrastructureAvailable: row.infrastructure_available,
    availableKinds: row.available_kinds,
  };
}

const inFlight = new Set<string>();
const MAX_IN_FLIGHT = 16;
const unavailableSpatial: SpatialComparison = {
  baselineAreaKm2: null, scenarioAreaKm2: null, assets: null,
  newlyInundatedGeometry: null, infrastructureAvailable: false, availableKinds: [],
};
const delta = (before: number | null, after: number | null) => before === null || after === null ? null : after - before;

export class ComparisonService {
  constructor(private readonly runner: SimulationService, private readonly serviceKey = "default") {}

  async compare(request: ComparisonRequest, db?: DatabaseInstance, databaseWarning?: string): Promise<Comparison> {
    // Validate again for callers other than HTTP. Fail before starting the expensive solver.
    request = ComparisonRequestSchema.parse(request);
    requireImmutableRunId(request.baselineRunId);
    const key = JSON.stringify([this.serviceKey, request.baselineRunId, request.scenario]);
    if (inFlight.has(key)) throw new ComparisonError(409, "This comparison is already running. Wait for the current request to finish.");
    if (inFlight.size >= MAX_IN_FLIGHT) throw new ComparisonError(503, "Comparison runner is at capacity. Try again after an active run completes.");
    inFlight.add(key);
    try {
      const baseline = await this.runner.getRunSnapshot(request.baselineRunId);
      if (!baseline.inputs) {
        throw new ComparisonError(422, "Baseline run has no recorded numeric forcing inputs (legacy artifact). Execute a new simulation with rainfall, surge and duration, then select that run.");
      }
      if (baseline.inputs.durationHours < 3) {
        throw new ComparisonError(422, "Select a baseline of at least 3 hours: the existing coastal water-level control is applied at +3h.");
      }
      if (baseline.inputs.rainfallRateMmHr === request.scenario.rainfallRateMmHr &&
          baseline.inputs.surgeLevelM === request.scenario.surgeLevelM) {
        throw new ComparisonError(422, "Change rainfall intensity or storm surge from the baseline before comparing.");
      }
      const comparisonId = `comparison-${crypto.randomUUID()}`;
      const inputs = { ...request.scenario, durationHours: baseline.inputs.durationHours };
      // The same real simulation integration is used; persistence is deferred until identity is verified.
      const run = await this.runner.runSimulation(undefined, {
        ...inputs, useLiveWeather: false,
        scenarioName: `Hypothetical comparison with ${baseline.runId}`,
      });
      const scenarioRunId = run.simulation.eventId;
      if (!scenarioRunId || scenarioRunId === baseline.runId) {
        throw new SimulationError(502, "Simulation runner did not return a distinct immutable scenario event ID; comparison stopped.");
      }
      requireImmutableRunId(scenarioRunId);
      const scenario = await this.runner.getRunSnapshot(scenarioRunId);
      if (!scenario.inputs || scenario.inputs.rainfallRateMmHr !== inputs.rainfallRateMmHr ||
          scenario.inputs.surgeLevelM !== inputs.surgeLevelM || scenario.inputs.durationHours !== inputs.durationHours) {
        throw new SimulationError(502, "Scenario snapshot inputs do not match the requested forcing and inherited duration.");
      }
      const warnings = [
        ...baseline.qualityNotes.map(note => `Baseline: ${note}`),
        ...scenario.qualityNotes.map(note => `Scenario: ${note}`),
        "Population exposure is unavailable: no documented population allocation source exists.",
        "Response priorities are unavailable: no executable priority scoring methodology exists; no rankings were fabricated.",
      ];
      let spatial = unavailableSpatial;
      let persistence: "database" | "unavailable" = "unavailable";
      if (db) {
        try {
          spatial = await querySpatialComparison(db, baseline, scenario);
          if (!spatial.infrastructureAvailable) warnings.push("Infrastructure inventory is empty; asset impact metrics are unavailable.");
          if (spatial.infrastructureAvailable && spatial.assets?.length === 0) {
            warnings.push("No inventory asset intersects either computed flood extent. Zero counts describe this inventory only, not verified absence of threatened infrastructure; geographic coverage is unverified.");
          }
          else for (const kind of ["road", "building", "facility"] as const) {
            if (!spatial.availableKinds.includes(kind)) warnings.push(`No ${kind} inventory is available; its affected count is null.`);
          }
          if (!baseline.floodGeometry || !scenario.floodGeometry) warnings.push("A run has no flood geometry; intersections and spatial difference are unavailable.");
        } catch {
          warnings.push("PostGIS spatial analysis failed; area, asset impact and newly inundated geometry are unavailable.");
        }
      } else {
        warnings.push(databaseWarning || "Database is not configured; PostGIS area, asset impact and comparison persistence are unavailable.");
      }
      const count = (kind: AssetImpact["kind"], flag: "baselineAffected" | "scenarioAffected") =>
        spatial.assets === null || !spatial.availableKinds.includes(kind) ? null : new Set(spatial.assets.filter(asset => asset.kind === kind && asset[flag]).map(asset => asset.id)).size;
      const metrics = (snapshot: RunSnapshot, baselineRun: boolean): Comparison["baseline"]["metrics"] => ({
        inundatedAreaKm2: baselineRun ? spatial.baselineAreaKm2 : spatial.scenarioAreaKm2,
        maximumDepthM: snapshot.maximumDepthM,
        affectedRoads: count("road", baselineRun ? "baselineAffected" : "scenarioAffected"),
        affectedBuildings: count("building", baselineRun ? "baselineAffected" : "scenarioAffected"),
        affectedFacilities: count("facility", baselineRun ? "baselineAffected" : "scenarioAffected"),
        populationExposureEstimate: null,
      });
      const before = metrics(baseline, true), after = metrics(scenario, false);
      const observed: string[] = [];
      if (before.inundatedAreaKm2 !== null && after.inundatedAreaKm2 !== null) {
        observed.push(`Computed inundated area: ${before.inundatedAreaKm2.toFixed(3)} → ${after.inundatedAreaKm2.toFixed(3)} km² (scenario minus baseline ${(after.inundatedAreaKm2 - before.inundatedAreaKm2).toFixed(3)} km²).`);
      }
      if (before.maximumDepthM !== null && after.maximumDepthM !== null) {
        observed.push(`Computed maximum depth: ${before.maximumDepthM.toFixed(3)} → ${after.maximumDepthM.toFixed(3)} m. These are observed solver-output differences, not quantitative attribution to an individual driver.`);
      }
      const result: Comparison = {
        comparisonId, createdAt: new Date().toISOString(), mode: "HYPOTHETICAL_SCENARIO",
        baseline: { ...baseline, metrics: before, priorities: null },
        scenario: { ...scenario, metrics: after, priorities: null },
        delta: {
          inundatedAreaKm2: delta(before.inundatedAreaKm2, after.inundatedAreaKm2),
          maximumDepthM: delta(before.maximumDepthM, after.maximumDepthM),
          affectedRoads: delta(before.affectedRoads, after.affectedRoads),
          affectedBuildings: delta(before.affectedBuildings, after.affectedBuildings),
          affectedFacilities: delta(before.affectedFacilities, after.affectedFacilities),
          newlyAffectedAssets: spatial.assets?.filter(asset => !asset.baselineAffected && asset.scenarioAffected) ?? null,
          newlyInundatedGeometry: spatial.newlyInundatedGeometry,
        },
        assets: spatial.assets,
        explanations: [
          `Hypothetical scenario versus immutable baseline ${baseline.runId}; duration ${inputs.durationHours} hours inherited from the baseline.`,
          `Rainfall ${baseline.inputs.rainfallRateMmHr} → ${inputs.rainfallRateMmHr} mm/hr; surge ${baseline.inputs.surgeLevelM} → ${inputs.surgeLevelM} m.`,
          "Deltas are scenario minus baseline. Newly affected assets intersect the scenario extent but not the baseline extent; this is exposure, not damage or operational closure.",
          ...observed,
        ],
        dataQuality: {
          areaMethod: spatial.baselineAreaKm2 !== null || spatial.scenarioAreaKm2 !== null
            ? "PostGIS ST_Area geography (WGS84 spheroid), repaired and dissolved flood polygons"
            : "unavailable (PostGIS analysis required; no degree-based area estimate)",
          infrastructureSource: spatial.infrastructureAvailable ? "Database roads, buildings and critical_facilities inventory; provenance/coverage not independently verified" : null,
          populationSource: null, priorityMethod: null, persistence, warnings,
        },
      };
      if (db) {
        try {
          const saved = await this.runner.persistForecast(db, run.simulation, scenarioRunId);
          // Store provenance and compact results, not rasters or duplicated asset geometries.
          const summary = {
            baselineMetrics: before, scenarioMetrics: after,
            delta: { ...result.delta, newlyAffectedAssets: result.delta.newlyAffectedAssets?.map(({ id, kind }) => ({ id, kind })) ?? null, newlyInundatedGeometry: undefined },
            dataQuality: { ...result.dataQuality, persistence: "database" },
          };
          await db.execute(sql`
            INSERT INTO simulation_comparisons (id, baseline_run_id, scenario_run_id, scenario_prediction_id, inputs, artifact_references, result_summary, created_at)
            VALUES (${comparisonId}, ${baseline.runId}, ${scenario.runId}, ${saved.prediction?.id}::uuid,
              ${JSON.stringify(inputs)}::jsonb,
              ${JSON.stringify({ baseline: baseline.artifactIds, scenario: scenario.artifactIds })}::jsonb,
              ${JSON.stringify(summary)}::jsonb, ${result.createdAt}::timestamptz);
          `);
          persistence = "database";
        } catch {
          warnings.push("Database persistence failed; this comparison is not saved. Run artifacts may still exist in the simulation service.");
        }
      }
      result.dataQuality.persistence = persistence;
      return ComparisonSchema.parse(result);
    } finally {
      inFlight.delete(key);
    }
  }
}
