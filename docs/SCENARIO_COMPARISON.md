# Scenario Impact Comparison — implementation and demo report

## Status

Branch: `feature/scenario-impact-comparison`. No commit or deployment was made.

Actual baseline/scenario SFINCS execution, unique artifacts, numeric differences,
PostGIS difference geometry, persistence, and the existing-dashboard workflow are
implemented. **The full requested acceptance criteria are not met:** the repository
has no executable priority methodology and the connected asset inventory does not
cover the model domain. Browser/WebGL interaction has not been verified.

This is an **unvalidated hypothetical solver experiment**, not an operational
Mangaluru forecast. Do not describe zero asset intersections as infrastructure safety.

## Reproduce the local demo

Prerequisites: Node 22+ (the frontend tests use type stripping), npm, Python with
Rasterio/GeoPandas support, Docker, the existing `simulations/mangaluru_demo`
template, and the existing P1 extractor. Use the intended **demo Neon branch**.
Keep credentials only in the ignored `services/api/.env.local`.

From repository root:

```bash
npm install
npm --prefix web-dashboard install
python3 -m venv services/ml-api/.venv
services/ml-api/.venv/bin/python -m pip install -r services/ml-api/requirements.txt
docker pull deltares/sfincs-cpu
npm run build --workspace=@tidemesh/contracts
npm --prefix services/api run db:migrate
```

In this existing checkout the root workspace compiler shim was missing. The
following alternative contract build was actually verified:

```bash
services/api/node_modules/.bin/tsc -p packages/contracts/tsconfig.json
```

Start three terminals, all from repository root. These alternate ports avoid the
unrelated checkout already running on 3000/8000:

```bash
# Terminal 1: existing FastAPI service, this checkout
services/ml-api/.venv/bin/python -m uvicorn app.main:app --app-dir services/ml-api --host 127.0.0.1 --port 8100

# Terminal 2: existing Hono service; .env.local is loaded from services/api
PORT=3100 ML_API_URL=http://127.0.0.1:8100 npm --prefix services/api start

# Terminal 3: existing Next.js dashboard and its configured proxy convention
INTERNAL_API_URL=http://127.0.0.1:3100 npm --prefix web-dashboard run dev -- --hostname 127.0.0.1 --port 3200
```

Use `http://localhost:3200/?compare=1`:

1. Choose a completed baseline in the scenario comparison dialog.
2. Inspect its immutable ID, generation time, simulation window, forcing, and
   quality notes. Legacy artifacts without recorded forcing are intentionally
   not eligible for comparison.
3. For a fresh baseline, set rainfall to **65 mm/hr**, coastal water-level control
   to **1.5 m**, and choose **Create baseline (6h, current controls)**. Wait for
   actual completion and automatic catalog selection.
4. Change rainfall to **110 mm/hr** and water level to **2.8 m**.
5. Choose **Compare impacts**. Progress and elapsed seconds stay visible. Do not
   reload or repeat the request while the solver is running.
6. Use **Baseline**, **Scenario**, and **Difference** to inspect actual geometry.
   Read peak-summary metrics, the exact run IDs, and source limitations. The
   comparison intentionally replaces fixture KPI/drawer/timeline/map layers.
7. An invalid, unchanged, or failed scenario shows an error without replacing the
   last successful comparison. Retention is within the current page session.

The water-level input sets the **+3h sample** in the existing prescribed profile;
it is not additive storm surge, a return period, or necessarily the maximum level.
Comparison duration is inherited from the baseline and must be at least 3 hours.
The existing rainfall profile is retained. No model parameters were tuned.

## API and comparison contract

- Existing `POST /api/v1/simulations/run`: actual SFINCS runner, now unique UUID
  run IDs, exact returned-forecast persistence, and honest persistence status.
- New `GET /api/v1/simulations/:eventId/run` in Hono and FastAPI: an exact,
  immutable `RunSnapshot`, not a mutable latest alias.
- New `POST /api/v1/simulations/compare`: `201 { success: true, comparison }`.
  Bad request shape is 400; an unknown run is 404; unsupported baseline or unchanged
  forcing is 422; a pending duplicate is 409; upstream failures are sanitized 502/504.

```json
{
  "baselineRunId": "<completed immutable run ID>",
  "scenario": { "rainfallRateMmHr": 110, "surgeLevelM": 2.8 }
}
```

The shared Zod schemas live in `packages/contracts/src/comparison.ts`.
Unavailable fields are `null`, never fabricated zeros. A verified dry run is an
empty polygon; this is distinct from unavailable geometry. Legacy generation time
and numeric inputs remain null when execution association is unknown. Artifact
identifiers are relative references; host paths are not returned.

## How actual differences are computed

The route validates input and delegates to `ComparisonService`. It reads an exact
baseline snapshot, invokes the existing simulation integration, accepts the UUID
assigned by Python, and validates the exact scenario snapshot and requested inputs.

Python uses an isolated run directory, writes a manifest, and copies only static
grid inputs—not old solver outputs. It configures the existing forcing files in
SFINCS's seconds-since-reference format and references them in the input file.
Docker runs the existing solver; the existing P1 extraction script runs afterward.
Missing raw or extracted outputs fail the run. P3 corrects extracted origin and row
orientation to the unchanged template grid and combines all flood polygons.
Completed artifacts and forcing files have integrity hashes. Failed runs never
become eligible baselines or replace the last successful latest mirror.

PostGIS repairs and dissolves flood polygons (`ST_MakeValid`, `ST_UnaryUnion`),
uses WGS84 spheroidal `ST_Area(geometry::geography) / 1e6`, and computes
`ST_Difference(scenario, baseline)`. Each extent is independently intersected with
the database roads, buildings, and facilities. Counts use distinct IDs per asset
kind. Newly affected means scenario intersection and no baseline intersection;
it does not imply damage, road closure, or loss of facility operation.

Maximum depth comes from the actual extracted peak-depth product. All numeric
deltas are scenario minus baseline. Explanations show changed inputs and observed
output differences—not invented driver percentages or emergency actions.

The compact `simulation_comparisons` migration stores run IDs, forcing, artifact
references, result summaries, and a scenario-prediction reference. Rasters remain
outside PostgreSQL. Missing PostGIS/persistence yields explicit unavailable states.

## Audit: what existed and was reused

The canonical stack file is actually named `TECKSTACK.md`; there is no
`TECHSTACK.md` in this checkout. Read alongside `PRODUCT.md`, `docs/backend.md`,
`docs/SFINCS_INTEGRATION.md`, contracts, and current implementation.

| Claim | Repository / runtime finding |
| --- | --- |
| Next responder dashboard | Exists; built successfully and served HTTP 200. Same navigation and MapLibre library retained. |
| Hono and FastAPI | Exist. Initial services on 3000/8000 were another checkout; verification used this checkout on 3100/8100. |
| Neon/PostGIS | Workspace `.env.local` supported a connection; PostGIS 3.6 and the additive migration were verified. No secret copied into documentation. |
| Environmental ingestion | Existing feed normalization, database ingestion/deduplication, and environment/forcing endpoints passed integration tests. No fresh external weather acquisition was claimed. |
| Historical replay | Existing aggregator scripts zone depths, populations, priorities, and progression. It reuses one extent, not solver timestep surfaces. |
| On-demand SFINCS | Existing runner reused; real Docker runs verified after fixing P3 forcing linkage/format and output association. |
| Infrastructure impacts | Tables existed, but no executable intersection engine was found. Comparison adds actual PostGIS intersection analysis. |
| Priorities | Contract/table and fixture rankings existed, but no callable scoring methodology. Comparison returns null priorities. |
| Scenario controls | Existing modal was UI/scripted contingency flow; now invokes actual comparison. Old scripted route remains separate for compatibility and is not used by comparison. |
| Selected-zone details | Overview hook selected a zone from scripted API/mocks. Comparison does not reuse those as computed results. |

### Zone B measurement discrepancies

Overview's live-mode aggregator uses population 4,820 and factor-dependent depths;
historical replay uses population 3,420 and another scripted depth profile. The
Zones page's independent `ZONES_DATA` includes 4,820 and 0.31–0.71m. Critical
Facilities starts with independent `FACILITIES_DATA`, including City Hospital's
0.4–0.7m example depth. Hook fallbacks introduce another fixture source.

These differences are attributable to **separate scripted datasets and modes**,
not verified model versions, stale cache, or measured run timestamps. The existing
screens now prominently disclose illustrative/unvalidated data and direct users to
Overview for run-linked comparison. Their individual example numbers were not
replaced with guessed measurements.

### Data honesty and scientific limitations

- SFINCS is deterministic; probability/confidence remain null. Fixture probabilities
  are not a calibrated probabilistic model or a validated risk score.
- Numerical marine inputs here are manually prescribed water-level profiles, not
  gauge observations or independently verified marine forecasts.
- No documented population allocation dataset is connected. Exposure stays null.
- Sensor/gauge health, calibration percentages, and waterway depths on legacy
  views are illustrative/unverified, not evidence of measured operational health.
- P1 onset and peak-time products use heuristic formulas. P3's normalized forecast
  no longer substitutes fixed onset/peak timestamps or 60%/40% driver contributions.
- Template-generation code constructs synthetic terrain. Real DEM provenance and
  calibration were not independently established. Wet-cell extents include water
  areas; this is not a verified land-only flood footprint.
- **Domain mismatch:** template EPSG:32643 origin `(698000, 1422000)` places it
  near 76.82°E. P1 extraction had assumed `(483000, 1421000)`. P3 now preserves
  the actual grid location; it does not relocate or recalibrate the model.
- Existing metadata declared v2.4.2, but actual solver logs report
  **v2.5.0-beta Hautacam**. Snapshots read the revision from the associated solver
  log when available; new run metadata records that revision. Legacy artifact
  versions without this evidence are explicitly unverified.
- The queried database had **2 roads and 3 facilities near -74°E, 40.7°N**, matching
  the synthetic seed dataset, and **no buildings**. No local infrastructure safety
  inference is supported. Do not run the destructive seed command on shared data.
- No auth middleware was found in the existing API. This sprint preserves that
  architecture; the local unauthenticated solver routes are not production-ready.
- Duplicate protection is process-local. Requests use a 210s gateway timeout,
  with solver/extraction limits of 180s/60s; unusually slow runs may outlive the
  gateway. Inspect the completed-run catalog before retrying. No job system added.

## Actual verification evidence

One verified actual comparison:

- Baseline: `sim-59c19f5e-11e1-45e9-b35f-3de24c1c8bd0`
- Scenario: `sim-a1a3e633-4764-4d05-b8f6-634550213876`
- Comparison: `comparison-ae318a0d-1232-42f0-846d-316ac6b51a92`
- Baseline execution: about 7.18s; full Hono comparison: about 21.06s.
- Spheroidal inundated area: **14.432101 → 17.743983 km²**, delta **3.311882 km²**.
- Extracted maximum depth: **2.287975 → 2.805469 m**, delta **0.517493 m**.
- Distinct scenario ID, real MultiPolygon difference, and database persistence verified.
- A read-back join confirmed comparison scenario ID equals the persisted prediction
  event ID and its geometry is SRID 4326.
- A second real request through the Next.js proxy returned HTTP 201 and the same
  numerical deltas, with a new scenario ID and explicit inventory-coverage warning.
  Its receipt was `comparison-0c8503ee-2817-4393-a450-ae455e853c1c`.
- The final normalized-run changes were also checked through the Next.js proxy:
  `sim-d79e8b23-1914-4e5d-8003-0c46864a829a` completed in about 6.97s, returned
  HTTP 201 with database persistence, and forecast/snapshot both reported
  `SFINCS-v2.5.0-beta Hautacam`. Onset/peak were null and driver contributions empty.
  This completed baseline is available in the current catalog as
  **Demo baseline with recorded solver revision** (65 mm/hr, 1.5m, 6h).

Zero roads/facilities affected in these receipts refer only to that nonlocal
inventory. Building counts, population, and priorities were unavailable.

| Command (working directory) | Actual result |
| --- | --- |
| `npm test` (`services/api`) | 6 suites passed, 0 failed; includes existing DB/ingestion checks and comparison mocks. Existing suites write test/prediction records. |
| `npm run build` (`services/api`) | Passed. |
| `COMPARISON_LIVE_DB=1 npm run test:comparison` (`services/api`) | Passed read-only real PostGIS area, repair, difference, dry/missing geometry, and distinct-asset fixtures. Fixture assets are CTEs, not real threatened facilities. |
| `.venv/bin/python -m pytest -q` (`services/ml-api`) | 37 passed, one dependency deprecation warning; Docker is mocked in unit tests, while success tests execute the real P1 extractor against binary fixtures. Actual Docker proof is the separate live requests above. |
| `npm test` (`web-dashboard`) | 8 tests passed: rendered loading/error/success, legacy eligibility, locking, retained result, map adapter and API handling. |
| `npm run typecheck` (`web-dashboard`) | Passed. |
| `npm run build` (`web-dashboard`) | Passed. |
| Focused ESLint on new comparison workflow | Passed. |
| Full `npm run lint` (`web-dashboard`) | Failed: legacy explicit-any/state-in-effect issues and pre-existing vendored MapLibre files; not repaired as unrelated cleanup. |
| `git diff --check` | Passed. |
| Dashboard `/` and proxied DB health | HTTP 200; real proxied comparison HTTP 201. |
| Browser / WebGL user interaction | Not verified. Built-in browser opening timed out; no alternate external-browser control attempted. |

## Changed implementation files

- Shared: `packages/contracts/src/comparison.ts`, `packages/contracts/src/index.ts`.
- Hono: `services/api/src/services/comparison.service.ts`,
  `services/api/src/services/simulation.service.ts`, `services/api/src/routes/simulation.ts`.
- Database: `services/api/src/db/schema.ts`,
  `services/api/drizzle/0003_simulation_comparisons.sql`,
  `services/api/drizzle/meta/0003_snapshot.json`, `services/api/drizzle/meta/_journal.json`.
- API checks/config: `services/api/tests/comparison.test.ts`,
  `services/api/tests/run-all.ts`, `services/api/package.json`, `services/api/.env.example`.
- Python: `services/ml-api/app/services/simulation_service.py`,
  `services/ml-api/app/adapters/sfincs/integration.py`,
  `services/ml-api/app/adapters/sfincs/adapter.py`,
  `services/ml-api/app/adapters/sfincs/parser.py`,
  `services/ml-api/app/routers/simulations.py`, `services/ml-api/app/schemas/sfincs.py`,
  `services/ml-api/requirements.txt`, `services/ml-api/tests/test_runs.py`,
  `services/ml-api/tests/test_adapter.py`, `services/ml-api/tests/test_parser.py`.
- Dashboard: `web-dashboard/src/app/page.tsx`, `web-dashboard/src/hooks/useScenarioComparison.ts`,
  `web-dashboard/src/lib/comparison/state.ts`, `web-dashboard/src/lib/comparison/mapData.ts`,
  `web-dashboard/src/components/dashboard/ComparisonResults.tsx`,
  `web-dashboard/src/components/dashboard/ScenarioModal.tsx`,
  `web-dashboard/src/components/dashboard/FloodMap.tsx`, `web-dashboard/src/lib/api/client.ts`,
  `web-dashboard/src/hooks/useFloodDashboard.ts`, `web-dashboard/tests/comparison.test.mjs`,
  `web-dashboard/package.json`.
- Minimal honesty/navigation labels: `web-dashboard/src/app/zones/page.tsx`,
  `web-dashboard/src/app/critical-facilities/page.tsx`, and dashboard
  `Sidebar.tsx`, `TopHeader.tsx`, `ZoneDrawer.tsx`, `WhyPanel.tsx`.
- Documentation: this file and `README.md`.

P3 adapter/API/database scope and P4 dashboard scope were separated during
implementation. P1 `ml/` scientific code/template and P2 ingestion source files
were not edited. Pre-existing edits in API `index.ts`, dashboard package/client/map,
and public MapLibre artifacts were preserved. Simulation outputs/manifests are
ignored local artifacts, not new checked-in rasters or private configuration.

## Remaining acceptance gaps

1. A versioned executable **priority scoring methodology** must be supplied before
   scores/ranks and why-rank-changed explanations can be recalculated honestly.
2. P1 must resolve/validate model-domain and terrain provenance; P2/P3 must provide
   documented infrastructure covering that same domain. Current data cannot
   demonstrate genuine newly threatened local roads/buildings/facilities.
3. Browser/WebGL interactions need a manual smoke test with the steps above.
4. Deployment, operational calibration, production authorization, and a durable
   comparison re-open UI were not implemented or verified.

Stop at this scoped comparison implementation; do not infer that these unresolved
dependencies have been completed from passing integration tests.
