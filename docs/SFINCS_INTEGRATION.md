# SFINCS Hydrodynamic Flood Intelligence Integration

## 1. Overview & Architecture

This document describes the integration of Person 1's (Chaithra S) SFINCS hydrodynamic flood modeling pipeline into the **TideMesh (CoastShield AI)** backend architecture.

### Target Architecture Flow

```
┌──────────────────────────────────────────────┐
│  P1 SFINCS Model Engine                      │
│  - 5km x 5km Mangaluru Estuary Domain        │
│  - Compound Forcing (Tide + Extreme Rain)    │
│  - Deliverables: GeoTIFFs, GeoJSON, Metadata │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  P3 SFINCS Adapter (Python)                  │
│  - services/ml-api/app/adapters/sfincs/      │
│  - Normalizes physics outputs to TideMesh    │
│  - Preserves deterministic properties        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  FastAPI Simulation Service                  │
│  - services/ml-api/ (Port 8000)              │
│  - Serves forecasts, extents, and catalog    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Hono API Gateway                            │
│  - services/api/ (Port 3000)                 │
│  - Endpoints: /api/v1/simulations/*          │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Neon PostgreSQL + PostGIS (Cloud)           │
│  - Table: flood_predictions (SRID 4326)      │
│  - Stores ST_Polygon flood extent geometry   │
└──────────────────────────────────────────────┘
```

---

## 2. Scientific Output Contract & Normalization

SFINCS is a 2D hydrodynamic overland flow solver governed by conservation of momentum and mass. It outputs physical water levels and depths, **not statistical probabilities**.

### Core Principles
1. **No Invented Probabilities**: `probability` is explicitly `null` (with `isDeterministic: true`). We never fabricate confidence scores or fake percentages for deterministic physics simulations.
2. **Deterministic Severity Classification**:
   - Depth < 0.15m: `LOW`
   - 0.15m ≤ Depth < 0.50m: `MODERATE`
   - 0.50m ≤ Depth < 1.50m: `HIGH`
   - Depth ≥ 1.50m: `CRITICAL`
   - *Mangaluru 2018 event with 3.0m max depth is categorized as `CRITICAL`.*
3. **Spatial Reference Standardization**: Vector extents are transformed from projected UTM Zone 43N (`EPSG:32643`) to WGS 84 (`EPSG:4326`) for PostGIS and GeoJSON delivery.

### Normalized Output Schema

```json
{
  "eventId": "mangaluru-historical-2018",
  "zoneId": "zone-mangaluru-coastal",
  "timestamp": "2018-05-29T00:00:00Z",
  "probability": null,
  "isDeterministic": true,
  "severity": "CRITICAL",
  "onset": "2018-05-29T00:20:00Z",
  "peak": "2018-05-29T03:00:00Z",
  "depthMin": 0.1,
  "depthMax": 3.0,
  "confidence": null,
  "modelVersion": "SFINCS-v2.4.2",
  "source": "sfincs",
  "floodGeometry": {
    "type": "Polygon",
    "coordinates": [...]
  },
  "metrics": {
    "meanFloodedDepthM": 1.6967,
    "floodedAreaKm2": 8.8,
    "gridResolutionM": 50,
    "crs": "EPSG:32643",
    "verticalDatum": "MSL"
  },
  "forcing": {
    "rainfallSource": "IMD Mangaluru Extreme Downpour (Peak 75 mm/hr)",
    "tideSource": "Panambur Port Spring Tide + Surge (Peak 2.25m MSL)"
  }
}
```

---

## 3. API Endpoints

### Hono API Gateway (`services/api` - Port 3000)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/simulations` | Lists available hydrodynamic simulations |
| `GET` | `/api/v1/simulations/:eventId/forecast` | Returns normalized CoastShield `FloodPrediction` |
| `GET` | `/api/v1/simulations/:eventId/extent` | Returns GeoJSON FeatureCollection flood extent |
| `POST` | `/api/v1/simulations/:eventId/sync` | Persists forecast & PostGIS `flood_geometry` to Neon |

### FastAPI Simulation Microservice (`services/ml-api` - Port 8000)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Liveness and model artifact status |
| `GET` | `/api/v1/simulations` | Catalog of available simulations |
| `GET` | `/api/v1/simulations/{eventId}/forecast` | Normalized forecast |
| `GET` | `/api/v1/simulations/{eventId}/extent` | GeoJSON flood extent |
| `GET` | `/api/v1/simulations/{eventId}/catalog` | Full GeoTIFF & vector paths |

---

## 4. Neon PostgreSQL + PostGIS Persistence

Simulation results are persisted in Neon PostgreSQL via Drizzle ORM:
- **Table**: `flood_predictions`
- **Spatial Column**: `flood_geometry geometry(Geometry, 4326)`
- **Query Verification**: `ST_GeometryType(flood_geometry)` returns `ST_Polygon`.
