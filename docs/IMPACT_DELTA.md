# Impact delta — T2 residual audit

Branch/worktree: `demo/impact-delta`, `/tmp/omnirush/coastshield-agent2`.
This is an incremental audit of the completed comparison implementation described
in `docs/SCENARIO_COMPARISON.md`, using the agreed
`packages/contracts/src/comparison.ts` contract.

## Changes and existing work reused

The existing engine already repairs/dissolves polygons with PostGIS,
measures WGS84 spheroidal area in km², computes a true spatial difference,
intersects the database inventory, counts distinct IDs separately by kind,
preserves missing values as null, and persists compact run-linked summaries.
These working implementations were retained. No new impact or priority model was
introduced.

Residual corrections:

1. Require canonical Polygon/MultiPolygon GeoJSON, finite WGS84 coordinates,
   closed rings of at least four positions, and no explicit CRS override before
   PostGIS. The broad shared schema remains unchanged. This is validation, not
   proof of real-world geographic alignment or terrain provenance.
2. Nonempty polygons repaired into lines/points/empty geometry have unavailable
   area (`null`), not false zero-area/dry results. Explicitly empty top-level
   Polygon/MultiPolygon has genuine zero area. Self-intersections with surviving
   area are still repaired by `ST_MakeValid`.
3. Unequal/unknown flood thresholds make extent/count deltas, newly affected assets,
   and difference geometry unavailable. Per-run metrics retain their own threshold.
   Maximum-depth delta remains independent of the vector-mask threshold.
4. Missing-kind warnings survive the no-intersection branch. No buildings inventory
   means unavailable counts, not a zero-building-safety claim.
5. Source/coverage messages distinguish database storage from documented datasets.
   The +3h coastal water-level control is not described as additive storm surge.

## Metric sources, units, null and zero meanings

All numeric deltas are scenario minus baseline; negative changes remain valid.
No square-degree areas, population multipliers, emergency scores, damage/closure
claims or driver-attribution percentages are inferred from geometry.

| Metric / field | Source, method and units | Missing/zero meanings and limitations |
| --- | --- | --- |
| `metrics.inundatedAreaKm2` | Exact run flood geometry; repaired/dissolved PostGIS polygons, `ST_Area(geometry::geography)/1e6`, WGS84 spheroid; km². | Null for missing/invalid/collapsed geometry or unavailable spatial analysis. Explicit empty extent is zero. Threshold wet-cell footprint may include permanent water; not validated land-only inundation or observed damage. |
| `metrics.maximumDepthM` | Exact run snapshot associated with extracted solver peak-depth product; raster-wide maximum in metres. | Null is missing, never substituted with zero. A supplied finite zero remains zero. Maxima may occur at different cells; no depth-difference surface or depth-at-asset claim. |
| `metrics.affectedRoads` | Distinct stored road IDs intersecting the run's repaired extent; count of records. | Null for no road inventory or unavailable paired intersections. Zero means no stored record intersects; no assertion of no local threat. A record can be a segment; not kilometres, accessibility, closure or damage. Boundary contact counts. |
| `metrics.affectedBuildings` | Distinct stored building IDs intersecting the run extent; count of records. | Null for no building inventory or unavailable analysis. Current table is empty. Not occupants, residents or damaged structures. |
| `metrics.affectedFacilities` | Distinct stored facility IDs intersecting the run extent; count of records. | Null for no inventory or unavailable analysis. Zero is inventory-only. No operation/access, asset-depth or damage inference; boundary contact counts. |
| `metrics.populationExposureEstimate` | No connected/documented population allocation source or callable method; intended unit estimated people. | Always null; `populationSource` null. No assumed census vintage, resolution, occupancy or area-to-people multiplier. |
| `priorities`, `priorityMethod` | No executable scoring methodology exists. | Both null. Fixture rankings and table records are not recalculated priorities; no invented rank-change reasons or actions. |
| `delta.inundatedAreaKm2` | Scenario genuine area minus baseline genuine area; km². | Null if either area unavailable or threshold unequal/unknown. Zero is equal net total area, not necessarily identical geometry; not newly inundated area alone. |
| `delta.maximumDepthM` | Scenario raster maximum minus baseline raster maximum; metres. | Null when either maximum missing. Negative/zero valid. Threshold equality is not required for raster-wide maxima, but does not prove equal terrain, solver or domain. |
| Count deltas | Scenario distinct-count minus baseline distinct-count per kind, from the same inventory query. | Null for missing counts or unequal/unknown thresholds. Zero can conceal asset turnover; not counts of newly affected IDs. |
| `assets` | Stored asset geometries/names/IDs with baseline/scenario intersection flags; WGS84. IDs scoped by kind. | Null for empty inventory or unavailable paired analysis. Empty array is no intersections in inventory. With different thresholds flags describe each run, not a comparable change classification. |
| `delta.newlyAffectedAssets` | Scenario-intersecting IDs not baseline-intersecting. | Null for unavailable analysis/inventory or threshold mismatch/unknown. Empty array means none in inventory; missing asset kinds still unavailable. No damage/closure/severity inference. |
| `delta.newlyInundatedGeometry` | Repaired/polygon-extracted `ST_Difference(scenario,baseline)`; WGS84 geometry. | Null for unavailable analysis or incompatible thresholds. Empty polygon means no added footprint. Excludes baseline-only recession; differs from net area change. |

If either extent is missing/collapsed, paired asset flags/counts are null for both
runs; a valid other-run area/depth can still be retained. Unknown intersections
must not be false boolean flags. An empty extent means no cell reaches its threshold,
not necessarily zero depth below that threshold.

`gridResolutionM` is solver metadata, not population/infrastructure resolution.
`floodThresholdM` is the extraction-mask threshold and is never guessed when absent.
Forcing units are mm/hr and prescribed coastal water level metres; the +3h control
is not necessarily the profile maximum, a return period or an additive surge estimate.

## Infrastructure provenance and coverage

`services/api/scripts/seed.ts` explicitly identifies its records as synthetic.
A read-only inventory summary during T2 found:

| Kind | Records | SRID | Longitude span | Latitude span |
| --- | ---: | ---: | --- | --- |
| roads | 2 | 4326 | -74.024 to -74.010 | 40.701 to 40.709 |
| facilities | 3 | 4326 | -74.030 to -74.012 | 40.705 to 40.715 |
| buildings | 0 | — | — | — |

These match the repository's NYC seed, not the unvalidated solver near 76.82°E.
No assets were moved, seeded or inserted by T2. Tables do not document dataset
coverage, resolution, license or source vintage/import provenance. `created_at`
does not establish a dataset observation time. Messages identify the repository
seed's limitations, not automatic classification of arbitrary future imported rows.
Asset bounds are not proof of complete dataset coverage.

## Verification performed for this increment

- Baseline focused tests passed before edits. New regressions first reproduced the
  permissive-geometry bug (`Missing expected exception` on invalid/non-area input).
- `npm run test:comparison` in `services/api`: passed. Solver/HTTP/database writes
  and persistence in this focused suite are **mocks**, not new model execution.
  Added cases cover invalid/projected coordinates, unknown/unequal thresholds,
  missing buildings with no intersections, negative deltas and empty/null results.
- `npm run build` in `services/api`: passed.
- `COMPARISON_LIVE_DB=1` checks passed actual **read-only PostGIS** area/repair/
  difference queries, including empty MultiPolygon, collapsed Polygon and overlapping
  polygon area. Asset tests use labelled temporary CTE geometry fixtures, not real
  local threatened infrastructure. Live queries are SELECT-only; persistence tests
  use mock databases. Credentials were loaded only at runtime from the original
  API environment; no credential file or value was copied into the worktree/docs.
- No new SFINCS solve or scientific calibration was performed by T2. Prior real
  comparison evidence remains separately recorded in `SCENARIO_COMPARISON.md`.
- Main integration runs the combined regression suites separately.

## Incremental files and unresolved dependencies

1. `services/api/src/services/comparison.service.ts`
2. `services/api/tests/comparison.test.ts`
3. `docs/IMPACT_DELTA.md`

Required inputs remain a validated georeferenced model/terrain/domain, documented
infrastructure covering it, a population allocation source if exposure is needed,
and a versioned executable priority methodology if ranking changes are needed.
The agreed snapshot cannot prove equal terrain/grid origin/vertical datum or complete
inventory coverage; matching thresholds remove only one known incompatibility.
No zero-intersection result resolves these dependencies.
