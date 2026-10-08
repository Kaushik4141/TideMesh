# TideMesh — TECHSTACK.md

> **Purpose:** Canonical technical-stack reference for TideMesh.
> Read this file together with `PRODUCT.md` before making architecture, dependency, API, database, or frontend decisions.

---

## 1. Architecture Summary

TideMesh uses a **hybrid web + mobile + AI/geospatial architecture**.

```text
                            TIDEMESH
                              |
              +---------------+---------------+
              |                               |
        CITIZEN MOBILE                  COMMAND CENTER
              |                               |
      Expo / React Native                    Next.js
              |                               |
              +---------------+---------------+
                              |
                         HTTPS / JSON
                              |
                       Hono.js API
                    Cloudflare Workers
                              |
             +----------------+----------------+
             |                                 |
       Application Data                  ML / GEO API
             |                                 |
      PostgreSQL + PostGIS                 FastAPI
             |                                 |
             |                    +------------+------------+
             |                    |            |            |
             |                 XGBoost      Geo stack      SHAP
             |                    |            |            |
             +--------------------+------------+------------+
                              |
                         Object Storage
                         Cloudflare R2
```

### Core architectural principle

Keep these responsibilities separate:

```text
Prediction
    ↓
Impact Analysis
    ↓
Explainability
    ↓
Decision / Prioritization
    ↓
User Action
```

Do not put everything into one ML model or one service.

---

# 2. Technology Stack

## 2.1 Citizen Mobile App

### Expo + React Native

Use for the citizen-facing mobile experience.

**Responsibilities:**
- Location-aware risk
- Flood alerts
- Forecast timeline
- Safety instructions
- Shelter information
- Safe route visualization
- Mobile map
- Push notifications

### Stack

```text
Expo
React Native
TypeScript
Expo Router
NativeWind
Expo Notifications
Expo Location
```

### Why Expo

- Fast cross-platform development
- Native access to location and notifications
- Reuses React/TypeScript knowledge
- Good fit for a focused citizen emergency app
- Avoids maintaining separate Android and iOS codebases

### Scope rule

The Expo application should remain **small and focused**.

Do not recreate the responder command center inside the mobile app.

---

# 3. Responder / Authority Web Application

## Next.js + TypeScript

The responder command center is the primary product interface for the hackathon.

### Stack

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
MapLibre GL JS
Recharts
```

### Responsibilities

- Live/historical flood map
- Time slider
- Flood forecast
- Zone details
- Risk drivers
- Impact analysis
- Response priority
- Scenario controls
- Route visualization
- Incident briefing
- Citizen alert preview

### Why Next.js

- Fast dashboard development
- Excellent React ecosystem
- Easy deployment
- Strong TypeScript support
- Good component architecture
- Suitable for complex data-heavy interfaces

---

# 4. UI System

## Tailwind CSS

Use Tailwind for layout, spacing, responsiveness, and utility styling.

## shadcn/ui

Use for reusable interface primitives:

- Buttons
- Dialogs
- Tabs
- Cards
- Dropdowns
- Tooltips
- Tables
- Sliders
- Alerts

Avoid introducing multiple UI component libraries.

## NativeWind

Use NativeWind for Tailwind-style styling in Expo.

### Design principle

The responder interface should feel like a **professional emergency operations dashboard**, not a generic SaaS dashboard.

The citizen interface should feel **simple, clear, and safety-oriented**.

---

# 5. Mapping

## MapLibre GL JS

Use MapLibre for the responder web dashboard.

### Required map layers

```text
Base map
|
+-- Flood extent
+-- Flood depth
+-- Risk zones
+-- Roads
+-- Buildings
+-- Hospitals
+-- Shelters
+-- Other critical facilities
+-- Emergency routes
```

## React Native map

Use a React Native-compatible MapLibre solution for the Expo application when map functionality is required.

Keep map data in a common GeoJSON/vector format so web and mobile can consume the same backend outputs.

---

# 6. Main Backend

## Hono.js on Cloudflare Workers

Hono is the main application API layer.

### Responsibilities

- Authentication
- Authorization
- API routing
- Request validation
- Scenario requests
- Flood prediction requests
- Impact queries
- Response-priority queries
- Alert creation
- Citizen location/risk lookup
- API aggregation
- Rate limiting
- Lightweight orchestration

### Why Hono + Workers

The team is already familiar with this stack and it provides:

- TypeScript-first development
- Fast edge APIs
- Simple routing
- Low operational overhead
- Easy integration with Cloudflare services

### Important rule

Do **not** run heavy scientific/geospatial computation inside Cloudflare Workers.

Workers should orchestrate and serve data, not perform large raster processing or long ML jobs.

---

# 7. ML and Geospatial Service

## FastAPI + Python

Use FastAPI as a dedicated service for ML and scientific/geospatial workloads.

### Responsibilities

- Feature engineering
- Model inference
- Model evaluation
- Flood simulation
- Raster processing
- Geospatial processing
- SHAP explanations
- Scenario execution
- Batch processing

### Why Python

The required scientific ecosystem is strongest in Python.

---

# 8. Machine Learning

## Primary model

### XGBoost

Use XGBoost as the initial flood-risk model.

Primary task:

> Predict the probability that a location/zone will experience meaningful flooding within a defined forecast horizon.

### Example features

```text
rainfall
rainfall_1h
rainfall_3h
rainfall_6h
antecedent_rainfall
tide_level
storm_surge
elevation
slope
HAND / height-above-drainage
distance_to_drainage
land_use
historical_flood_frequency
```

### Why XGBoost

- Strong performance on tabular data
- Fast training
- Fast inference
- Works well with engineered geospatial/environmental features
- Straightforward to explain
- Easy to iterate during a hackathon

### Future upgrade path

Potential future models:

```text
LightGBM
CatBoost
Temporal Fusion Transformer
LSTM
Physics-informed neural networks
```

Do not add these until the baseline is measurable and validated.

---

# 9. Flood Depth / Severity

Use a regression model or time-stepped prediction pipeline for estimated flood depth.

Output should be a range where possible:

```text
Expected depth: 0.35–0.70 m
```

Do not display false precision.

Convert depth/risk into understandable severity classes:

```text
LOW
MODERATE
HIGH
CRITICAL
```

The exact thresholds should be configured centrally rather than hardcoded in frontend components.

---

# 10. Time Prediction

Prefer a **time-stepped forecast** over a completely separate opaque onset model.

Example:

```text
14:00 → predicted depth
14:10 → predicted depth
14:20 → predicted depth
14:30 → predicted depth
14:40 → predicted depth
...
```

### Definitions

**Onset time**

The first forecast timestep where the predicted depth crosses the configured meaningful-flood threshold.

**Peak time**

The timestep with the maximum predicted depth.

This keeps:

- map
- depth
- onset
- peak
- timeline

consistent with one another.

---

# 11. Explainability

## SHAP

Use SHAP for model explanations.

Example:

```text
Rainfall       41%
Tide           29%
Elevation      19%
Drainage       11%
```

The frontend should translate technical explanations into natural language.

Example:

> Heavy rainfall is increasing runoff while the high tide is reducing drainage outflow. Low elevation further increases the expected water accumulation.

### Important rule

The LLM may explain model outputs, but it must not invent model outputs.

---

# 12. Geospatial Processing

## Core libraries

```text
GeoPandas
Shapely
Rasterio
pyproj
NumPy
Pandas
```

### GeoPandas

Use for:

- GeoDataFrame operations
- Spatial joins
- Vector data processing
- Impact calculations

### Shapely

Use for:

- Geometry creation
- Intersections
- Buffers
- Polygon operations

### Rasterio

Use for:

- DEM processing
- Raster reading/writing
- Rasterization
- Raster/vector conversion
- Grid-based flood calculations

### pyproj

Use for:

- CRS conversion
- Projection handling
- Geographic coordinate transformations

---

# 13. Database

## PostgreSQL + PostGIS

PostgreSQL is the primary application database.

PostGIS is mandatory for the spatial side of the product.

### Why PostGIS

TideMesh needs spatial queries such as:

- Which buildings intersect the predicted flood polygon?
- Which roads are affected?
- Which hospitals are within a threatened area?
- Which zone contains this citizen?
- What is the distance between a response team and an incident?

These are native PostGIS problems.

---

# 14. ORM / Database Access

## Drizzle ORM

Use Drizzle from the TypeScript/Hono side where appropriate.

### Rule

Complex geospatial queries should remain explicit SQL/PostGIS queries when necessary.

Do not force every spatial operation through the ORM abstraction.

Python/FastAPI may use an appropriate PostgreSQL client/ORM for ML service workloads, but keep the canonical database schema shared and documented.

---

# 15. Core Database Tables

A minimum schema should include:

### users

```text
id
name
role
location
notification_preferences
created_at
updated_at
```

### zones

```text
id
name
geometry
elevation
created_at
```

### roads

```text
id
name
geometry
road_type
```

### buildings

```text
id
geometry
building_type
```

### critical_facilities

```text
id
name
type
geometry
```

### environmental_observations

```text
id
timestamp
rainfall
tide_level
storm_surge
source
```

### flood_predictions

```text
id
event_id
zone_id
timestamp
probability
depth_min
depth_max
severity
onset_time
peak_time
```

### flood_impacts

```text
id
prediction_id
affected_buildings
affected_roads
affected_population
critical_facilities
```

### response_priorities

```text
id
zone_id
score
rank
reason
recommended_actions
```

### alerts

```text
id
zone_id
severity
message
recommended_actions
created_at
```

---

# 16. Data Sources

The initial development should focus on **one city and one historical flood event**.

Potential data categories:

## Environmental

- Historical rainfall
- Rainfall forecast
- Tide/water level
- Storm surge
- Wave/coastal conditions where available

## Terrain

- DEM
- Slope
- HAND / drainage-related terrain features

## Geographic

- OpenStreetMap roads
- Buildings
- Hospitals
- Schools
- Shelters
- Other points of interest

## Ground truth

Observed historical flood extent/depth or another defensible flood observation source.

### Critical rule

Every dataset must be documented with:

```text
name
source
coverage
resolution
time range
format
license
preprocessing
```

Do not silently use data without recording its provenance.

---

# 17. Data Processing Pipeline

```text
Raw Data
   ↓
Validation
   ↓
Cleaning
   ↓
Coordinate Alignment
   ↓
Temporal Alignment
   ↓
Feature Engineering
   ↓
Feature Dataset
   ↓
Train / Validation / Test
```

### Spatial rule

All datasets must be transformed into a clearly defined coordinate reference system before spatial analysis.

### Temporal rule

Environmental observations must be aligned to the forecast timestep.

Do not mix daily rainfall, hourly tide, and 10-minute predictions without explicitly defining the temporal transformation.

---

# 18. Model Validation

Validation is a core product requirement, not an optional research detail.

## Recommended validation strategy

Use **event-level validation** where possible.

Example:

```text
Train:
Event 1
Event 2
Event 3
Event 4

Test:
Event 5
```

Then rotate the held-out event.

This helps evaluate generalization to unseen flood events.

### Metrics

Depending on model task:

#### Classification

```text
Precision
Recall
F1
ROC-AUC
PR-AUC
Brier Score
```

#### Flood extent

```text
IoU
Intersection over Union
Precision
Recall
```

#### Depth

```text
MAE
RMSE
```

#### Time

```text
Onset MAE (minutes)
Peak-time error (minutes)
```

Do not publish example metrics in the UI or presentation until they are produced by actual experiments.

---

# 19. Baseline Model

Before XGBoost, implement a simple baseline.

For example:

```text
Rainfall contribution
+
Tide contribution
+
Low-elevation contribution
=
baseline flood-risk score
```

Then compare:

```text
Baseline
   ↓
XGBoost
   ↓
Measured improvement
```

This gives the team a meaningful benchmark.

---

# 20. Historical Replay Mode

This should be a major demonstration feature.

The dashboard can load a historical event and replay it through time.

```text
Event Start
   ↓
T0
   ↓
T1
   ↓
T2
   ↓
...
   ↓
Peak
   ↓
Recession
```

At each timestep:

- Environmental inputs change
- Flood prediction changes
- Flood map changes
- Affected assets change
- Priority ranking changes

The replay must use actual stored model outputs or rerun the documented prediction pipeline.

Do not fake the progression with hardcoded animation.

---

# 21. Scenario / What-if Engine

After the validated historical replay works, add scenario controls.

Example:

```text
Rainfall      85 mm
Tide         +0.35 m
Storm surge  +0.60 m
```

User changes rainfall:

```text
85 mm → 110 mm
```

Then run the prediction again and update:

```text
Flood probability
Depth
Extent
Affected roads
Affected buildings
Response priority
```

### Rule

A scenario must trigger actual model/engine logic.

Do not only recolor the map visually.

---

# 22. Impact Engine

The impact engine converts flood prediction into infrastructure intelligence.

```text
Flood Polygon
      |
      +----> Roads
      |
      +----> Buildings
      |
      +----> Critical Facilities
      |
      +----> Population Estimate
```

Use spatial joins/intersections to derive affected assets.

### Population

If using gridded/census population data, label the result according to its actual source and uncertainty.

Do not present an estimate as an exact count.

---

# 23. Response Priority Engine

The response engine ranks zones.

Conceptually:

```text
Priority =
Flood Risk
× Population Exposure
× Infrastructure Criticality
× Accessibility
× Vulnerability
```

The initial implementation can be rule-based and deterministic.

Do not use an LLM to decide emergency priorities.

### Output

```text
#1 Zone B — CRITICAL
#2 Zone D — HIGH
#3 Zone A — HIGH
```

Each priority should include an explanation.

---

# 24. Routing

Routing is a **P1 feature**, not a dependency for the first working prototype.

Preferred approach:

```text
OpenStreetMap road network
        ↓
OSRM / GraphHopper
        ↓
Flood-risk penalty per road segment
        ↓
Safest practical route
```

Do not optimize only for shortest distance.

Potential route cost:

```text
travel_time
+
flood_penalty
+
closure_penalty
```

The flood penalty must be derived from predicted conditions.

---

# 25. Alerts

## Citizen alerts

Use:

**Expo Notifications** for the mobile app.

Potential future/secondary channels:

- SMS
- WhatsApp
- Email

### Alert structure

```text
severity
location
expected_onset
expected_depth
affected_roads
recommended_action
```

Alerts must be localized and actionable.

---

# 26. LLM Usage

An LLM should be a **supporting interface**, not the scientific model.

### Good uses

- Explain predictions
- Generate incident briefs
- Summarize model outputs
- Convert structured risk into natural language
- Multilingual assistance
- Citizen Q&A grounded in backend data

### Bad uses

Do not ask the LLM to directly determine:

- Flood probability
- Flood depth
- Flood timing
- Emergency priority
- Safe route

Those must come from deterministic/model-based systems.

---

# 27. API Architecture

A basic Hono API could look like:

```text
/api/v1/auth/*
/api/v1/events/*
/api/v1/zones/*
/api/v1/predictions/*
/api/v1/impacts/*
/api/v1/priorities/*
/api/v1/routes/*
/api/v1/alerts/*
/api/v1/scenarios/*
```

### Example

```http
GET /api/v1/zones/:zoneId/forecast
```

Response:

```json
{
  "zoneId": "zone-b",
  "probability": 0.847,
  "severity": "HIGH",
  "onset": "2026-10-08T14:30:00+05:30",
  "peak": "2026-10-08T15:00:00+05:30",
  "depth": {
    "min": 0.31,
    "max": 0.71,
    "unit": "m"
  }
}
```

The exact data contract should be documented centrally and shared with the frontend.

---

# 28. API Validation

Use **Zod** on the TypeScript API boundary.

Validate:

- request bodies
- query parameters
- path parameters
- external ML-service responses

Do not trust data coming from external services.

---

# 29. ML API Contract

Hono should call the Python service using a well-defined contract.

```text
Hono
  ↓
POST /predict
  ↓
FastAPI
  ↓
XGBoost
  ↓
Prediction JSON
  ↓
Hono
  ↓
Client
```

Potential request:

```json
{
  "eventId": "event-01",
  "timestamp": "2026-10-08T14:20:00Z",
  "rainfall": 85,
  "tide": 0.35,
  "stormSurge": 0.60
}
```

Potential response:

```json
{
  "probability": 0.847,
  "depthMin": 0.31,
  "depthMax": 0.71,
  "risk": "HIGH"
}
```

---

# 30. Storage

## Cloudflare R2

Use R2 for large/non-relational files:

- GeoTIFF
- GeoJSON exports
- Model artifacts
- Historical event files
- Raster data
- Generated reports

Keep large binary/geospatial files out of PostgreSQL.

---

# 31. Local Development

## Docker Compose

Local environment should run:

```text
Next.js
Hono / Workers-compatible API
FastAPI
PostgreSQL + PostGIS
MinIO (optional)
```

A developer should be able to start the main local services with one command.

---

# 32. Repository Structure

Recommended:

```text
tidemesh/
│
├── PRODUCT.md
├── TECHSTACK.md
├── README.md
├── docker-compose.yml
│
├── apps/
│   ├── citizen/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   │
│   └── dashboard/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── types/
│
├── services/
│   ├── api/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   ├── schemas/
│   │   │   └── index.ts
│   │   └── wrangler.toml
│   │
│   └── ml-api/
│       ├── app/
│       ├── requirements.txt
│       └── Dockerfile
│
├── ml/
│   ├── data/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── features/
│   ├── notebooks/
│   ├── models/
│   ├── experiments/
│   └── src/
│       ├── ingestion/
│       ├── preprocessing/
│       ├── features/
│       ├── models/
│       ├── evaluation/
│       └── explainability/
│
├── data/
│   ├── osm/
│   ├── dem/
│   ├── rainfall/
│   ├── tide/
│   └── flood-events/
│
├── packages/
│   └── shared-types/
│
└── docs/
    ├── architecture.md
    ├── data.md
    ├── model.md
    └── api.md
```

---

# 33. Shared Types

Because both the Expo app and Next.js dashboard use TypeScript, create shared types for API/domain objects.

```text
packages/shared-types/
```

Potential shared models:

```text
User
Zone
FloodPrediction
FloodImpact
ResponsePriority
Alert
Route
Scenario
```

Avoid duplicating interfaces across apps.

---

# 34. Authentication / Authorization

Roles:

```text
citizen
responder
municipality
admin
```

The main backend must enforce authorization.

Do not trust a role sent by the frontend.

The server should determine permissions from authenticated user/session data.

---

# 35. Observability

At minimum record:

- API errors
- ML inference failures
- Data-source freshness
- Prediction timestamps
- Scenario execution
- Model version

Every prediction should be traceable to:

```text
model_version
data_timestamp
event_id
prediction_timestamp
```

This is important for reproducibility and judging.

---

# 36. Model Versioning

Predictions should record the model version.

Example:

```text
model_version: flood-xgb-v1
feature_schema: v1
```

When the model changes:

```text
flood-xgb-v2
```

This helps compare experiments and prevents confusion during the demo.

---

# 37. Security Principles

- Validate all API inputs.
- Keep secrets out of source code.
- Use environment variables/secrets.
- Restrict admin/responder routes.
- Never expose database credentials to clients.
- Limit sensitive location data to what the product actually needs.
- Do not expose internal model or infrastructure endpoints publicly without authentication.

---

# 38. Performance Principles

### Client

- Load map layers lazily where possible.
- Avoid sending massive GeoJSON payloads to mobile clients.
- Prefer simplified/vectorized spatial layers for visualization.

### Backend

- Cache static geospatial metadata where useful.
- Keep API responses small.
- Paginate large infrastructure lists.
- Avoid synchronous long-running simulations in request handlers.

### ML

- Precompute historical replay predictions.
- Cache repeated scenarios where useful.
- Separate batch processing from real-time inference.

---

# 39. What NOT to Add Initially

Do not introduce these before the core system works:

```text
Kafka
Kubernetes
Microservices for every feature
Redis
LangGraph
Multi-agent systems
Complex event streaming
Large LLM orchestration
Advanced deep learning
Full citizen social features
```

These add infrastructure complexity without directly improving the initial rubric score.

---

# 40. Recommended Build Order

## Phase 1 — Data

```text
Choose city
↓
Choose historical event
↓
Acquire data
↓
Create reproducible preprocessing
```

## Phase 2 — Scientific baseline

```text
Feature dataset
↓
Simple baseline
↓
XGBoost
↓
Evaluation
```

## Phase 3 — Time forecast

```text
Time-stepped prediction
↓
Onset
↓
Peak
↓
Depth
```

## Phase 4 — Geospatial impact

```text
Flood extent
↓
Roads
↓
Buildings
↓
Critical facilities
↓
Population estimate
```

## Phase 5 — Explainability

```text
SHAP
↓
Risk drivers
↓
Plain-language explanation
```

## Phase 6 — Decision support

```text
Priority ranking
↓
Recommended actions
```

## Phase 7 — Dashboard

```text
Map
↓
Timeline
↓
Zone panel
↓
Why panel
↓
Priority panel
```

## Phase 8 — Advanced features

```text
What-if scenario
↓
Citizen alert
↓
Flood-aware routing
```

---

# 41. Technology Decision Rules

Before adding a new technology, ask:

### Does it directly help one of these?

```text
Prediction quality
Geospatial depth
Explainability
Actionability
```

If not, do not add it to the MVP.

### Prefer:

```text
Simple
Typed
Measurable
Reproducible
Explainable
```

over:

```text
Complex
Distributed
Hard to debug
AI-for-the-sake-of-AI
```

---

# 42. Final Stack

```text
MOBILE
Expo
React Native
TypeScript
Expo Router
NativeWind
Expo Notifications
Expo Location

WEB
Next.js
TypeScript
Tailwind
shadcn/ui
MapLibre GL JS
Recharts

API
Hono.js
Cloudflare Workers
Zod
Drizzle

DATABASE
PostgreSQL
PostGIS

ML / GEO
Python
FastAPI
XGBoost
SHAP
Pandas
NumPy
GeoPandas
Shapely
Rasterio
pyproj

ROUTING
OpenStreetMap
OSRM / GraphHopper

STORAGE
Cloudflare R2

LOCAL DEV
Docker Compose

DEPLOYMENT
Cloudflare Workers
Vercel
Cloud Run / Render
Managed PostgreSQL + PostGIS
```

---

# 43. Architecture Principle to Remember

The final TideMesh architecture should be:

```text
         EXPO                         NEXT.JS
      CITIZEN APP                 RESPONDER WEB
           |                            |
           +------------+---------------+
                        |
                    Hono API
                Cloudflare Workers
                        |
          +-------------+-------------+
          |                           |
     PostgreSQL                    FastAPI
       PostGIS                        |
          |                  +--------+--------+
          |                  |        |        |
          |               XGBoost  Geo/GIS   SHAP
          |                  |        |        |
          +------------------+--------+--------+
                        |
                    Cloudflare R2
```

## Core engineering philosophy

**Hono handles the product.**

**Python handles the intelligence.**

**PostGIS handles geography.**

**Expo handles citizens.**

**Next.js handles responders.**

**ML predicts.**

**Geospatial analysis determines impact.**

**Decision logic determines priority.**

**The LLM explains; it does not invent the science.**
