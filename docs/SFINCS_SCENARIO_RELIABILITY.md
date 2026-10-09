# SFINCS scenario reliability — T1 incremental audit

Branch: `demo/sfincs-scenario-reliability`, isolated T1 worktree. This work builds
on the existing scenario comparison implementation; it is not a new model or a
calibration exercise. Read `PRODUCT.md`, `TECKSTACK.md` (the actual filename),
`docs/SFINCS_INTEGRATION.md`, and `docs/SCENARIO_COMPARISON.md` for context.

## Existing behavior audited and retained

The initial `.venv/bin/python -m pytest -q` run in `services/ml-api` passed all
37 existing tests. UUID run IDs, isolated directories, immutable ID resolution,
forcing linkage and seconds-since-reference formatting, fresh extraction,
output/forcing hashes, corrected P3 raster origin/orientation, nullable timing and
attribution, and solver revision capture were already working. They were reused.

The scientific template, P1 extractor source, rainfall shape, prescribed coastal
water-level shape, and solver/model parameters remain unchanged. The P1 extractor
is copied verbatim into each new run directory so its execution source can be
preserved and hashed independently of later source-code edits.

## Reliability gaps addressed

1. **Validate raw solver evidence before extraction.** P1 uses
   `maximum(0, water_level - bed)`, so a raw negative infinity could become a
   finite dry cell. P3 now checks the full raw peak binary for finite values and
   exact grid size before P1 can clip or truncate it. Both the flat float32 format
   and the observed Fortran record format are supported; record byte-count markers
   must match. Missing, symlinked, stale, malformed, or oversized raw evidence
   fails the run.
2. **Require solver completion and forcing-read evidence.** A zero process exit
   alone is insufficient. The associated fresh `sfincs.log` must show rainfall
   read/enabled, water-level boundary reads, 100% completion, simulation finished,
   and solver closing. Reported error/fatal/aborted/runtime-exception messages
   in the solver log or Docker streams fail validation.
3. **Bind static inputs, logs, and outputs to the run.** New local manifests use
   `schemaVersion: 2`. They record SHA-256, byte length, exact filesystem
   modification nanoseconds, and an ISO UTC rendering of that modification time.
   Records cover static grid files, original template input, unchanged copied
   extractor, written forcing, raw `zsmax.dat`, solver/Docker/extraction logs, and
   all six normalized output products. Prepared inputs are checked after solving;
   extraction inputs and raw solver evidence are checked again after extraction.
   Later content **or timestamp** changes make the immutable run unavailable.
4. **Check manifest claims against actual supplied forcing.** Simulation-window
   times, hourly sample times, rainfall values, water levels across all boundary
   columns, and numeric controls must match the input bytes. Corrupt manifests
   are excluded without poisoning the rest of the completed-run catalog.
5. **Preserve last-success publication under concurrency.** A POSIX file lock
   serializes latest-directory swaps across threads and service workers. A delayed
   publisher cannot replace a newer completed output generation. The existing
   rollback and failed-run exclusion remain in place. A mirror-publication error
   does not turn a valid immutable result into a failed API response.

The dense, ordered, full regular grid is checked explicitly: the current P1
extractor cannot correctly interpret sparse/reordered indices. Unsupported
templates fail before Docker rather than producing a plausible but misassociated
depth raster.

## Timestamp and source semantics

| Field / record | What it means |
| --- | --- |
| `requestedAt` | Local request creation time. |
| `simulationStart`, `simulationEnd` | Prescribed model-valid window; current UTC hour through requested duration. Not observation timestamps. |
| `sourceProvenance.rainfall` / `.waterLevel` | Manually prescribed profiles; `observedAt` and `issuedAt` are **null**. |
| Template/source file `modifiedAt`, `modifiedTimeNs` | Filesystem timestamps of the source files available in this worktree; preserved by `copy2`. Not acquisition dates, terrain observation dates, or historical source timestamps. |
| `inputsPreparedAt` | Written forcing and copied execution inputs were prepared. |
| `solverStartedAt`, `solverFinishedAt` | Local Docker-client invocation interval. On timeout, the end of the client does not prove the container ended. |
| `extractionStartedAt`, `extractionFinishedAt` | Local P1 extraction process interval. |
| `generatedAt` / output metadata `generated_at` | P3 output generation after extraction and normalization. Separate from the prescribed simulation window. |
| `completedAt` | Local completion finalization after all evidence records are collected. |
| `failedAt` | Failure recorded locally; unavailable/unreached stage timestamps remain null. |

`RunSnapshot` keeps its existing schema. Rich source/stage/file metadata stays in
the private local manifest. API responses contain relative artifact/evidence IDs
and quality notes, not absolute host paths or log contents. The forecast's
existing `timestamp` remains the simulation start; it is not silently redefined
as a source observation or output-generation timestamp.

Version-1 manifests are readable with explicit missing-evidence notes. Their
nearby unbound logs no longer override the hash-checked metadata version in a
snapshot. Legacy outputs with no execution association retain unknown inputs and
generation time. Historical missing provenance is not backfilled from current
filesystem timestamps.

## Reproduce the focused real-solver proof

Prerequisites were already available: the symlinked Python environment, existing
template and P1 extractor, and a working local Docker daemon/image. The service
configuration resolves the repository root from the **worktree's Python source**.
Run the following commands with working directory `services/ml-api` in the
intended worktree. No server, database, frontend build, or external feed is needed.

Exact baseline execution command used:

```bash
.venv/bin/python -c 'from app.services.simulation_service import simulation_service; from app.config import settings; import json; p=simulation_service.run_simulation(rainfall_rate_mm_hr=65, surge_level_m=1.5, duration_hours=6, scenario_name="T1 baseline reliability proof"); print(json.dumps({"runId":p.eventId,"repoRoot":str(settings.repo_root),"maximumDepthM":p.depthMax,"areaKm2":p.metrics["floodedAreaKm2"]}))'
```

The repository-root print is a **local terminal diagnostic**, never an API field.
It confirmed all generated files belonged to this worktree. The baseline was run
once before the incremental fix to inspect the actual solver's binary/log format.
Its version-1 manifest was retained as produced; no richer provenance was invented
afterward.

Exact changed-profile execution command used:

```bash
.venv/bin/python -c 'from app.services.simulation_service import simulation_service; import json; p=simulation_service.run_simulation(rainfall_rate_mm_hr=110, surge_level_m=2.8, duration_hours=6, scenario_name="T1 changed forcing reliability proof"); r=simulation_service.get_run(p.eventId); print(json.dumps({"runId":p.eventId,"generatedAt":r["generatedAt"],"modelVersion":r["modelVersion"],"maximumDepthM":p.depthMax,"areaKm2":p.metrics["floodedAreaKm2"],"rainfallSeries":r["rainfallSeries"],"waterLevelSeries":r["waterLevelSeries"]}))'
```

Each command creates a new UUID. The actual Docker command remains
`docker run --rm -v <isolated-run-directory>:/data -w /data deltares/sfincs-cpu`.
The unchanged P1 script is run with `--sim-dir <run-directory> --output-dir
<run-directory>/outputs --threshold 0.10`. Paths are local process arguments only.

## Actual execution receipts

| | Baseline | Changed rainfall + water level |
| --- | --- | --- |
| Immutable ID | `sim-aaf2198b-883c-4c8a-9776-1d54dc95ef2b` | `sim-0720be3c-845a-4785-94db-0fda3bc792c1` |
| Manifest version | 1, pre-fix audit execution | 2, new provenance/raw validation |
| Rain samples, mm/hr, at +0h…+6h | `[13, 32.5, 65, 52, 26, 13, 3.25]` | `[22, 55, 110, 88, 44, 22, 5.5]` |
| Water-level samples, m | `[0.3, 0.8, 1.3, 1.5, 1.4, 0.9, 0.4]` | `[0.3, 0.8, 1.3, 2.8, 1.4, 0.9, 0.4]` |
| Maximum depth, m | `2.287975311279297` | `2.805468797683716` |
| Threshold wet-cell area, km² | `14.435` | `17.7475` |
| Output generation, UTC | `2026-10-08T23:33:44.492072+00:00` | `2026-10-08T23:38:48.951647+00:00` |

Both runs' `sfincs.log` contains:

- Line 34: `Build-Revision: $Rev: v2.5.0-beta Hautacam`
- Line 45: `Info : reading prcp file sfincs.precip`
- Line 58: `Info : reading water level boundaries`
- Line 101: `100% complete`
- Line 103: `Simulation finished`
- Line 116: `Closing off SFINCS`

The changed run records successful solver/extraction exit codes, 10,000 finite
raw peak values, all forcing-read/completion checks true, source file records, and
21 final evidence/product records. Its raw peak file is 40,008 bytes with valid
40,000-byte Fortran record markers. Both completed snapshots were read through
FastAPI `TestClient` with HTTP 200 on the final code; their keys matched the current
snapshot contract and all artifact IDs were relative. This is an in-process route
check, not a deployed Hono/browser test. A read-only retrospective binary/log
validation also passed for the baseline, without claiming unrecorded stage times.

The pixel-area difference is `3.3125 km²`; maximum-depth difference is
`0.517493486404419 m`. These are wet-cell grid metrics. They are not the existing
comparison service's WGS84 spheroidal-area result, nor land-only flooding metrics.

## Checks and remaining assumptions

- Initial test suite: **37 passed**.
- Final `.venv/bin/python -m pytest -q` in `services/ml-api`: **71 passed**,
  one existing Starlette/httpx deprecation warning. New cases cover unknown source
  times, copied source timestamps, evidence content/timestamp changes, wrong
  manifest controls/series, stale/nonfinite/malformed raw output, misleading solver
  completion/forcing logs, mutations during solving/extraction, unsupported static
  grids, forcing decimal precision, and concurrent/delayed latest publication.
  Unit tests simulate Docker and execute the real unchanged P1 extractor.
- Real Docker proof is the two executions above, separate from unit-test fixtures.
- `git diff --check -- services/ml-api docs/SFINCS_SCENARIO_RELIABILITY.md`: passed.

Known limitations remain explicit:

- The template is **synthetic and unvalidated**, near 76.82°E rather than Mangaluru
  near 74.85°E. A successful solve does not establish calibration, measured skill,
  local infrastructure safety, or terrain/source authenticity.
- `surgeLevelM` sets the **absolute +3h water-level node**, not additive surge.
  For short runs ending before +3h it is not applied; existing notes say so.
- P1 timing rasters remain heuristic. The MSL datum and five-minute product labels
  are not independently verified scientific provenance. No attribution,
  probability, confidence, or calibration percentage is fabricated.
- Solver log parsing is deliberately verified against the currently available
  v2.5.0-beta image/log format. A changed solver format may require an adapter
  update. The Docker tag itself remains mutable; these records bind the observed
  revision/log, not a newly pinned image digest.
- File hashes detect drift relative to a local manifest; they are not signed
  provenance against an actor who can rewrite both files and the manifest.
  File modification timestamps require a local filesystem preserving nanoseconds.
  Copying/restoring evidence without those timestamps intentionally invalidates it.
- The file lock covers POSIX workers sharing this filesystem; no distributed job
  queue or distributed publication lock was added. Thread concurrency was tested;
  multi-process/distributed deployment was not exercised. The mutable latest
  directory can briefly be absent during the rename sequence, and is still never
  used as an immutable baseline.
- Existing Docker/extraction timeouts remain 180s/60s. Docker-client timeout does
  not guarantee container cancellation; failed/late outputs are not eligible and
  cannot replace the last successful mirror.
- Database, shared contracts, gateway, frontend/browser, and P1 scientific source
  integration were outside this T1 change. No new claim of their verification is
  made here.

## Incremental source files

Relative to the original integration workspace, only these files changed:

- `services/ml-api/app/adapters/sfincs/reliability.py` (new)
- `services/ml-api/app/services/simulation_service.py`
- `services/ml-api/tests/test_runs.py`
- `docs/SFINCS_SCENARIO_RELIABILITY.md` (new)

Real run directories and the latest mirror are ignored local outputs in this
worktree. No files were staged or committed by T1.
