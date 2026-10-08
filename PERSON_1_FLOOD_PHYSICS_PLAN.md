# PERSON 1 — FLOOD PHYSICS & PREDICTION ENGINE
## TIDEMESH/ AI for Coastal Flood Intelligence — Mangaluru

**Document status:** Development specification  
**Owner:** Person 1 — Flood Physics & Prediction  
**Primary objective:** Build, calibrate, validate, and expose a physics-based flood simulation pipeline for Mangaluru using SFINCS.

---

# 1. Role Definition

Person 1 owns the scientific prediction layer of CoastShield.

The responsibility is **not** to build a new hydraulic solver or a generic ML classifier.

The responsibility is to:

1. Configure an established physics-based hydrodynamic model.
2. Prepare Mangaluru-specific terrain and forcing data.
3. Run reproducible flood simulations.
4. Replay at least one historical flood event.
5. Calibrate physically meaningful parameters.
6. Validate the model against independent observations where possible.
7. Produce standardized geospatial outputs.
8. Provide those outputs to the geospatial/impact, backend, and product teams.
9. Optionally build an ML surrogate only after the physics pipeline is working.

### Core statement

> Given Mangaluru terrain, rainfall, and coastal water-level forcing, produce a time-varying physically simulated flood-depth field and demonstrate measurable agreement with a historical flood event.

---

# 2. What Person 1 Does NOT Own

The following are outside this role:

- Expo/mobile UI
- Next.js/web UI
- MapLibre presentation
- PostGIS impact analysis
- Building/road/hospital intersection logic
- Population exposure calculations
- Alert UX
- LLM conversational layer
- Authentication
- Hono API architecture
- Routing
- Shelter optimization
- Notification delivery
- Final product design

Person 1 supplies the physical flood outputs consumed by those systems.

---

# 3. Scientific Architecture

```text
                    MANGALURU DATA
                         |
        +----------------+----------------+
        |                |                |
       DEM           RAINFALL            TIDE
        |                |                |
        +----------------+----------------+
                         |
                         v
                    SFINCS MODEL
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
     Water Depth     Flood Extent    Velocity
          |
          +-----------------------------+
          |
          v
   Temporal Analysis
          |
     +----+---------+
     |              |
     v              v
 Flood Onset     Peak Flood
     |              |
     +------+-------+
            |
            v
      VALIDATED OUTPUTS
            |
    +-------+--------+
    |       |        |
    v       v        v
 Person 2  Person 3  Person 4
 Impact    Backend   Product/UI
```

---

# 4. Technology Stack

## Primary

- SFINCS — physics-based flood model
- HydroMT-SFINCS — model setup and preprocessing
- Python — data preparation, orchestration, validation
- Docker — reproducible SFINCS runtime
- NumPy — numerical processing
- Pandas — tabular/time-series processing
- Xarray — multidimensional scientific data
- Rasterio — raster processing
- GeoPandas — vector geospatial processing
- Shapely — geometry operations
- PyProj — CRS/transformation handling

## Visualization / inspection

- QGIS
- Python plotting where useful

## Optional later

- XGBoost — surrogate/accelerator model
- Dask — large scenario batches
- Zarr — scalable multidimensional outputs

---

# 5. Repository Ownership

Person 1 should own:

```text
ml/
└── sfincs/
    └── mangaluru/
        ├── README.md
        ├── DATA_SOURCES.md
        ├── config/
        ├── raw/
        │   ├── dem/
        │   ├── rainfall/
        │   ├── tide/
        │   ├── surge/
        │   └── observations/
        ├── processed/
        │   ├── dem/
        │   ├── rainfall/
        │   ├── tide/
        │   └── boundaries/
        ├── model/
        │   ├── base/
        │   ├── calibration/
        │   └── validation/
        ├── simulations/
        │   ├── baseline/
        │   ├── historical/
        │   └── scenarios/
        ├── outputs/
        ├── validation/
        │   ├── observed/
        │   ├── metrics/
        │   └── reports/
        ├── scripts/
        │   ├── prepare_dem.py
        │   ├── prepare_rainfall.py
        │   ├── prepare_tide.py
        │   ├── build_model.py
        │   ├── run_simulation.py
        │   ├── extract_outputs.py
        │   ├── calculate_onset.py
        │   ├── calculate_peak.py
        │   └── validate.py
        └── requirements.txt
```

Do not place application code from other team members inside this directory.

---

# 6. Development Principles

## 6.1 Physics first

The flood prediction should originate from SFINCS simulations.

The LLM must never generate flood depth, extent, onset time, or peak time.

## 6.2 No fabricated confidence

Do not display a percentage such as "92% confidence" unless it is backed by a defined and calculated uncertainty methodology.

## 6.3 No fabricated outputs

Demo values must originate from real model runs or clearly be labelled as illustrative/test data.

## 6.4 Reproducibility

Every simulation must be reproducible from:

- model version
- configuration
- input data versions
- parameter values
- simulation start/end
- timestep
- CRS
- grid resolution

## 6.5 Separate calibration and validation

Whenever data allows:

```text
Event A -> calibration
Event B -> independent validation
```

Do not tune and validate on exactly the same observations without explicitly calling it calibration performance.

## 6.6 Preserve raw data

Never overwrite original source data.

```text
raw/
processed/
```

must remain separate.

---

# 7. Phase 0 — Environment Setup

## Objective

Run SFINCS successfully before introducing Mangaluru data.

## Tasks

- Install Python
- Create isolated environment
- Install HydroMT
- Install HydroMT-SFINCS
- Install Docker
- Obtain SFINCS runtime
- Run an official example
- Inspect outputs

## Deliverable

A reproducible successful SFINCS example.

## Definition of Done

All of the following are true:

- SFINCS starts successfully.
- Example simulation completes.
- Output files are generated.
- Outputs can be opened/read.
- The procedure is documented in `README.md`.

---

# 8. Phase 1 — Mangaluru Data Audit

Create:

```text
DATA_SOURCES.md
```

## DEM

Record:

```text
Source:
Dataset name:
Resolution:
CRS:
Vertical datum:
Coverage:
License/access:
Download location:
Processing performed:
```

## Rainfall

Record:

```text
Source:
Station/grid:
Temporal resolution:
Spatial resolution:
Units:
Historical coverage:
Quality/control:
License/access:
```

## Tide

Record:

```text
Source:
Station:
Coordinates:
Temporal resolution:
Units:
Vertical datum:
Historical coverage:
Observed or predicted:
License/access:
```

## Flood observations

Record:

```text
Event:
Date:
Geographic coverage:
Observation type:
Observed inundation:
Observed depths:
Photos:
News reports:
Government reports:
Satellite evidence:
Dataset:
```

---

# 9. Initial Mangaluru Data Strategy

The initial model should prioritize authoritative or scientifically defensible sources.

## Tide

The New Mangalore Port Authority publishes predicted Panambur tidal data, including a 2026 tide table.

Use it as a documented forcing source after resolving its vertical datum.

Important:

**Do not directly mix the tide-table heights with DEM elevations until the vertical reference systems are reconciled.**

## Historical observed tide

Search for observed tide/water-level measurements from relevant Mangaluru/Panambur tide-gauge sources.

Observed data is preferred for historical-event replay where available.

## DEM

Start with the best practically accessible DEM.

Do not block the project waiting for a perfect 0.5 m dataset.

A lower-resolution but documented DEM is preferable to an inaccessible high-resolution dataset for the first model.

---

# 10. Phase 2 — Select the Initial Domain

Do not begin with the entire Mangaluru region.

Start with a manageable domain, approximately 5 km × 5 km or another size justified by the selected flood event and data.

Domain selection criteria:

1. Coastal exposure
2. Low-lying terrain
3. Urban development
4. Documented flood history
5. Availability of DEM
6. Availability of forcing data
7. Relevant river/estuary/coastal geometry

Create:

```text
domain.geojson
```

Document why the domain was selected.

---

# 11. Coordinate Reference System

Use an appropriate projected CRS for the local Mangaluru domain.

Do not perform hydraulic grid calculations in an inappropriate geographic latitude/longitude coordinate system.

Record:

```text
CRS:
EPSG:
Units:
Reason for selection:
```

Every output must preserve its CRS metadata.

---

# 12. Vertical Datum Strategy

This is a high-priority scientific task.

Establish relationships among:

```text
DEM vertical datum
       |
       v
Mean Sea Level / local reference
       |
       v
Chart Datum
       |
       v
Tide measurements
       |
       v
SFINCS model elevation reference
```

Record all conversions explicitly.

Never assume that:

```text
1.50 m tide
```

means the same elevation reference as:

```text
1.50 m DEM
```

without checking.

---

# 13. Phase 3 — DEM Processing

Pipeline:

```text
Raw DEM
  |
  v
Validate metadata
  |
  v
Reproject
  |
  v
Clip to domain
  |
  v
Vertical datum conversion if required
  |
  v
Resample/grid preparation
  |
  v
SFINCS elevation input
```

## Validation checks

- No unexpected NoData holes
- Correct CRS
- Correct units
- Correct vertical reference
- Correct geographic coverage
- Coastline represented correctly
- River/estuary geometry plausible
- Elevation range plausible

Generate a DEM QA report.

---

# 14. Phase 4 — SFINCS Baseline Model

Build the simplest valid Mangaluru model first.

Initial configuration:

```text
Mangaluru DEM
+
SFINCS grid
+
basic roughness
+
controlled boundary condition
```

Do not immediately combine:

- historical rainfall
- tide
- storm surge
- river flow
- all possible forcing

The first goal is to prove that the model behaves correctly.

---

# 15. Baseline Model Definition of Done

A baseline simulation is complete when:

- Model initializes successfully.
- Model completes without numerical failure.
- Water propagates in physically plausible directions.
- Wetting/drying behaves plausibly.
- No obvious boundary artefacts dominate the domain.
- Output depth is readable.
- Output CRS is correct.
- Maximum depth is plausible.
- Results can be visualized in QGIS.

---

# 16. Phase 5 — Roughness

Create a documented roughness strategy.

Possible land classes:

```text
Open water
Beach/sand
Open ground
Urban
Road
Vegetation
Wetland
Agriculture
```

Map land-cover classes to defensible roughness values.

Do not randomly tune every class independently.

Maintain:

```text
roughness/
├── base.json
├── calibration-001.json
└── calibration-002.json
```

Every calibration experiment must be reproducible.

---

# 17. Phase 6 — Tide Forcing

Pipeline:

```text
Panambur tide source
        |
        v
Datum verification
        |
        v
Quality control
        |
        v
Time normalization
        |
        v
Continuous forcing
        |
        v
SFINCS boundary
```

Record:

- timezone
- timestamp format
- units
- datum
- interpolation/reconstruction method
- boundary location
- boundary orientation

Never silently modify tide data.

---

# 18. Phase 7 — Rainfall Forcing

Start with the simplest defensible representation.

### First version

Spatially uniform:

```text
rainfall(t)
```

### Improved version

Spatially distributed:

```text
rainfall(t, x, y)
```

Prefer spatial rainfall when data quality supports it.

Document:

- temporal resolution
- spatial resolution
- units
- missing data treatment
- interpolation
- quality control

---

# 19. Phase 8 — Compound Flooding

The target model is:

```text
          Rainfall
             |
             v
        +---------+
        |         |
Tide -> | SFINCS  | <- coastal boundary
        |         |
        +---------+
             |
             v
        Flood depth
```

The model should support the project's compound-flooding story where appropriate.

Do not claim a forcing mechanism is included unless it is actually represented in the model.

---

# 20. Phase 9 — Historical Event Selection

Select an event only after confirming data availability.

A candidate event must have enough information to establish:

```text
Rainfall
+
Coastal water level
+
Terrain
+
Observed flood evidence
```

Preferred evidence:

1. Official government observations
2. Tide-gauge observations
3. Rain gauges
4. Satellite-derived inundation
5. Official flood reports
6. Georeferenced field observations
7. Credible news reports as supplementary evidence

News articles alone should not be treated as precise flood-depth ground truth.

---

# 21. Historical Replay

For selected event:

```text
Historical DEM
+
Historical rainfall
+
Historical tide/water level
+
Other justified forcing
        |
        v
      SFINCS
        |
        v
Simulated flood field
```

Save the complete simulation configuration.

---

# 22. Output Extraction

For every timestep, extract:

```text
Water depth
Water level
Velocity
```

where available and relevant.

Derived products:

```text
Flood extent
Onset time
Peak depth
Peak time
Duration above threshold
```

---

# 23. Flood Extent Definition

Define flood extent using an explicit depth threshold.

Example:

```text
flooded = depth >= threshold
```

The threshold must be:

- documented
- physically justified
- consistent across comparisons

Do not change the threshold simply to improve validation results.

---

# 24. Flood Onset

For each cell:

```text
onset_time =
first timestep where
depth >= onset_threshold
```

Output:

```text
onset_time.tif
```

Also calculate zone-level onset where required.

---

# 25. Peak Depth

For each cell:

```text
peak_depth = max(depth over simulation)
```

Output:

```text
peak_depth.tif
```

---

# 26. Peak Time

For each cell:

```text
peak_time = timestamp(argmax(depth))
```

Output:

```text
peak_time.tif
```

---

# 27. Calibration Strategy

Calibration must be systematic.

Potential parameters:

- roughness
- boundary representation
- forcing assumptions
- selected model parameters
- grid resolution where scientifically justified

Do not tune parameters without documenting the physical reason.

## Experiment structure

```text
calibration/
├── experiment-001/
│   ├── config.json
│   ├── metrics.json
│   └── notes.md
├── experiment-002/
│   ├── config.json
│   ├── metrics.json
│   └── notes.md
└── best/
```

---

# 28. Calibration Metrics

Possible metrics:

## Flood extent IoU

```text
IoU = intersection / union
```

## Area error

```text
area_error =
|predicted_area - observed_area|
/ observed_area
```

## Depth error

Use MAE/RMSE where observed depth measurements exist.

## Onset error

```text
predicted_onset - observed_onset
```

Only calculate metrics for observations that actually exist.

---

# 29. Validation Strategy

Ideal:

```text
Historical Event A
       |
       v
Calibration
       |
       v
Fixed model
       |
       v
Historical Event B
       |
       v
Independent validation
```

If only one suitable event exists:

- clearly label results as calibration/reconstruction
- do not call them independent validation
- report the limitation

---

# 30. Model Uncertainty

Do not use arbitrary confidence percentages.

Potential future uncertainty approaches:

- parameter ensembles
- forcing ensembles
- DEM uncertainty
- rainfall uncertainty
- tide uncertainty
- scenario ranges
- quantile/ensemble statistics

For the MVP, uncertainty may be represented as scenario ranges rather than a statistically calibrated probability.

Example:

```text
Expected depth:
0.45–0.70 m
```

only if the range is generated by a documented methodology.

---

# 31. Standard Output Contract

Person 1 must provide standardized outputs.

```text
outputs/
├── flood_depth.nc
├── flood_depth.tif
├── flood_extent.geojson
├── onset_time.tif
├── peak_depth.tif
├── peak_time.tif
├── velocity.nc
└── metadata.json
```

## metadata.json

Example:

```json
{
  "model": "SFINCS",
  "model_version": "VERSION",
  "location": "Mangaluru",
  "simulation_id": "sim-001",
  "start_time": "ISO-8601",
  "end_time": "ISO-8601",
  "time_step_minutes": 10,
  "grid_resolution_m": 10,
  "crs": "EPSG:XXXX",
  "vertical_datum": "DOCUMENTED_DATUM",
  "max_depth_m": 0.0,
  "onset_threshold_m": 0.05,
  "flood_threshold_m": 0.10,
  "forcing": {
    "rainfall_source": "SOURCE",
    "tide_source": "SOURCE"
  }
}
```

---

# 32. Interface With Person 2

Person 2 consumes:

```text
flood_depth.tif
flood_extent.geojson
peak_depth.tif
onset_time.tif
peak_time.tif
```

Person 2 then performs:

```text
Flood field
    |
    v
Buildings
Roads
Hospitals
Population
    |
    v
Impact assessment
```

Person 1 should not implement the impact intersection logic.

---

# 33. Interface With Person 3

Person 3 eventually exposes the physics engine through an API.

Conceptual request:

```http
POST /simulation
```

```json
{
  "scenario_id": "compound-001",
  "rainfall_multiplier": 1.25,
  "tide_offset_m": 0.25
}
```

Conceptual response:

```json
{
  "simulation_id": "sim-001",
  "status": "completed",
  "max_depth_m": 0.91,
  "onset_time": "ISO-8601",
  "peak_time": "ISO-8601",
  "outputs": {
    "depth": "PATH_OR_OBJECT_REFERENCE",
    "extent": "PATH_OR_OBJECT_REFERENCE"
  }
}
```

The actual API contract is owned by Person 3 after discussion with Person 1.

---

# 34. Interface With Person 4

Person 4 should receive static outputs early.

Create demo datasets:

```text
demo/
├── 14-00.geojson
├── 14-30.geojson
├── 15-00.geojson
└── 15-30.geojson
```

This allows UI development while Person 1 continues scientific work.

---

# 35. Scenario Engine

After validation, support controlled scenarios.

Example:

```text
Scenario A:
rainfall multiplier = 1.00
tide offset = 0.00 m

Scenario B:
rainfall multiplier = 1.25
tide offset = 0.00 m

Scenario C:
rainfall multiplier = 1.00
tide offset = 0.25 m

Scenario D:
rainfall multiplier = 1.25
tide offset = 0.25 m
```

Every scenario must produce real model-derived output.

If simulations are too slow for live interaction, precompute scenarios.

---

# 36. Performance Strategy

Do not assume SFINCS must run from scratch for every UI slider movement.

Preferred hackathon architecture:

```text
Offline
  |
  +-- baseline scenario
  +-- high rainfall
  +-- high tide
  +-- compound extreme
  |
  v
Precomputed SFINCS results
  |
  v
Fast product UI
```

Optional:

```text
Live scenario
    |
    v
SFINCS job
    |
    v
Result
```

---

# 37. Optional ML Surrogate

Only start after the physics model is credible.

Generate:

```text
Rainfall
Tide
Surge
Other parameters
      |
      v
   SFINCS
      |
      v
Flood depth
```

Generate many scenarios.

Then train:

```text
XGBoost
```

or another suitable surrogate.

Purpose:

> Approximate SFINCS quickly for interactive scenario exploration.

The surrogate is **not** the scientific source of truth.

SFINCS remains the reference model.

---

# 38. Testing

## Data tests

- CRS valid
- units valid
- timestamps valid
- no unexpected missing data
- bounds correct
- vertical datum documented

## Model tests

- model initializes
- simulation completes
- outputs have expected dimensions
- no NaN explosion
- depth non-negative where expected
- output CRS correct

## Physics sanity tests

- water moves downhill/according to hydraulic forcing
- removing rainfall changes rainfall-driven response
- changing tide changes coastal boundary response
- extreme forcing produces stronger response
- dry cells remain dry when physically appropriate

## Regression tests

Store a small baseline simulation and compare future changes against it.

---

# 39. Git Strategy

Use a dedicated branch:

```text
feature/person1-sfincs
```

Prefer commits such as:

```text
chore: initialize sfincs workspace
docs: add Mangaluru data audit
feat: add DEM preprocessing
feat: add tide preprocessing
feat: add rainfall preprocessing
feat: add baseline sfincs model
feat: add historical replay
feat: add validation metrics
feat: add output exporter
```

Avoid editing shared application files unless necessary.

---

# 40. Development Milestones

## M0 — Environment

```text
SFINCS installed
Official example works
```

## M1 — Data

```text
Mangaluru domain selected
DEM acquired
Tide source documented
Rainfall source identified
```

## M2 — Baseline

```text
Mangaluru grid
DEM
Roughness
Controlled forcing
Successful simulation
```

## M3 — Compound Forcing

```text
Tide
+
Rainfall
+
DEM
+
SFINCS
```

## M4 — Historical Replay

```text
Historical event
      |
      v
SFINCS replay
```

## M5 — Calibration

```text
Observed
vs
Simulated
```

## M6 — Validation

```text
Independent event if available
```

## M7 — Product Outputs

```text
Depth
Extent
Onset
Peak
Metadata
```

## M8 — Scenario Engine

```text
Rainfall/tide scenarios
```

## M9 — Integration

```text
Person 2
Person 3
Person 4
```

## M10 — Optional Surrogate

```text
SFINCS-generated dataset
        |
        v
XGBoost surrogate
```

---

# 41. Priority Order

If time is limited:

### P0 — Absolutely required

1. SFINCS runs
2. Mangaluru DEM
3. Valid model grid
4. Rainfall forcing
5. Tide forcing
6. Historical event replay
7. Calibration/validation
8. Flood depth output
9. Flood extent output

### P1 — Strongly recommended

10. Onset time
11. Peak depth
12. Peak time
13. Scenario simulations
14. Reproducible metadata
15. Validation report

### P2 — Bonus

16. Velocity output
17. Uncertainty ensemble
18. Live SFINCS jobs
19. ML surrogate
20. Advanced uncertainty quantification

---

# 42. Final Demo Story From Person 1

The final system should be able to demonstrate:

```text
Mangaluru
    |
    v
Current/forecast rainfall
    +
Panambur coastal water level
    +
Terrain
    |
    v
Physics-based SFINCS simulation
    |
    v
Flood propagation over time
    |
    +----------------------+
    |                      |
    v                      v
Where?                   When?
    |                      |
Flood extent            Onset/peak
    |
    v
Person 2
    |
    v
Buildings / roads /
hospitals / population
```

The important statement is:

> **The flood map is generated by a physics-based model; the downstream AI layer interprets its consequences.**

---

# 43. Definition of Complete

Person 1 is finished when the team can give you:

```text
Mangaluru rainfall
+
Mangaluru coastal water level
+
Mangaluru terrain
```

and you can return:

```text
Flood depth over time
Flood extent
Flood onset
Peak depth
Peak time
```

with:

- documented data sources
- documented coordinate/vertical references
- reproducible configuration
- historical-event comparison
- measurable validation/calibration results
- machine-readable outputs
- no fabricated confidence values

---

# 44. Immediate Execution Checklist

Do these in this exact order:

```text
[ ] 1. Create ml/sfincs/mangaluru/
[ ] 2. Create Python environment
[ ] 3. Install HydroMT + HydroMT-SFINCS
[ ] 4. Install/prepare SFINCS runtime
[ ] 5. Run official SFINCS example
[ ] 6. Document successful run
[ ] 7. Create DATA_SOURCES.md
[ ] 8. Select initial Mangaluru domain
[ ] 9. Acquire usable DEM
[ ] 10. Verify DEM CRS + vertical datum
[ ] 11. Obtain/document NMPA Panambur tide source
[ ] 12. Find authoritative rainfall data
[ ] 13. Select historical event
[ ] 14. Build baseline Mangaluru SFINCS model
[ ] 15. Add tide
[ ] 16. Add rainfall
[ ] 17. Run historical replay
[ ] 18. Extract flood depth/extent
[ ] 19. Calibrate
[ ] 20. Validate
[ ] 21. Export standardized outputs
[ ] 22. Hand outputs to Person 2/3/4
```

# 45. The One Rule

**Do not skip ahead because something looks more exciting.**

Your dependency chain is:

```text
SFINCS works
    ↓
Data is trustworthy
    ↓
Terrain is correct
    ↓
Forcing is correct
    ↓
Model runs
    ↓
Historical event works
    ↓
Calibration
    ↓
Validation
    ↓
Product integration
```

If the first five are wrong, the beautiful dashboard at the end doesn't matter.

**Person 1's job is to make the flood prediction credible.**
