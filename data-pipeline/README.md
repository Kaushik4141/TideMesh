# TideMesh Environmental Data Pipeline

This package contains the ingestion, cleaning, and normalization pipeline for environmental and hydrometeorological observations supporting TideMesh (CoastShield AI).

---

## 1. Directory Structure

```
data-pipeline/
├── .gitignore
├── README.md
├── requirements.txt
├── data/
│   ├── raw/
│   │   ├── cwc/
│   │   │   └── cwc_observations.json          # Open-Meteo GMT response (Mislabeled CWC)
│   │   └── open-meteo/
│   │       └── open_meteo_hourly.json         # Open-Meteo Asia/Kolkata response
│   └── processed/
│       ├── cwc/
│       │   └── cwc_observations.parquet
│       ├── open-meteo/
│       │   └── open_meteo_hourly.parquet
│       └── combined/
│           ├── environmental_hourly.parquet
│           └── environmental_hourly.json      # Standardized ingestion artifact
└── src/
    ├── inspect.py                             # Audits raw JSON files and schema
    ├── clean_meteo.py                         # Cleans and timezone-converts Open-Meteo feed
    ├── clean_cwc.py                           # Cleans and flags unverified CWC feed
    └── combine.py                             # Merges feeds on UTC timestamps
```

---

## 2. Data Sources & Provenance Audit

### A. Open-Meteo Hourly Feed (`data/raw/open-meteo/open_meteo_hourly.json`)
- **Origin**: Open-Meteo Weather Forecast API
- **Location**: Mangaluru, Karnataka (`12.899824° N, 74.87738° E`), Elevation `22.0 m`
- **Timezone**: `Asia/Kolkata` (`UTC+5:30`, offset `19800` seconds)
- **Time Range**: 168 hourly steps (7 days, `2026-10-08T00:00` to `2026-10-14T23:00` local)
- **Variables**: `precipitation` (mm), `rain` (mm)
- **Status**: **VERIFIED**

### B. CWC Observations Feed (`data/raw/cwc/cwc_observations.json`)
- **CRITICAL PROVENANCE AUDIT**:
  Despite the file location and name `cwc_observations.json`, inspection confirms this file is **NOT** official Central Water Commission (CWC) river gauge data.
  It is an Open-Meteo weather model query for Mangaluru (`12.899824, 74.87738`) returned in `GMT` (`UTC+0`) with parameters: `precipitation`, `rain`, `temperature_2m`, `surface_pressure`, and `wind_speed_10m`.
  It does **not** contain river gauge levels, water discharge (cumecs), or danger/warning marks.
- **Data Quality Tag**: `UNVERIFIED_SOURCE`
- **Source Label**: `unverified-cwc`

---

## 3. Data Flow & Normalization

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│  Raw Open-Meteo Local Feed           │     │  Raw GMT Feed (Mislabeled CWC)       │
│  - Asia/Kolkata (UTC+5:30)           │     │  - GMT (UTC+0)                       │
│  - Rain, Precipitation               │     │  - Rain, Temp, Pressure, Wind        │
└──────────────────┬───────────────────┘     └──────────────────┬───────────────────┘
                   │                                            │
                   ▼                                            ▼
           src/clean_meteo.py                           src/clean_cwc.py
         (Converts to UTC ISO)                       (Flags UNVERIFIED_SOURCE)
                   │                                            │
                   └──────────────────┬─────────────────────────┘
                                      │
                                      ▼
                                src/combine.py
                    (Outer join on UTC timestamp, deduplicate)
                                      │
                                      ▼
             data/processed/combined/environmental_hourly.json
                                      │
                                      ▼
                   P3 Backend Ingestion (Neon PostGIS)
```

---

## 4. Canonical Observation Schema

All outputs conform to the TideMesh canonical schema:

| Field | Type | Units / Format | Description |
|---|---|---|---|
| `timestamp` | String | ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`) | Standardized UTC timestamp |
| `latitude` | Float | Degrees | Sensor / forecast latitude |
| `longitude` | Float | Degrees | Sensor / forecast longitude |
| `elevation` | Float | Meters | Terrain elevation |
| `rainfall` | Float | mm | Hourly rainfall |
| `precipitation`| Float | mm | Total precipitation |
| `temperature` | Float | °C | 2m Air temperature |
| `surfacePressure`| Float | hPa | Surface atmospheric pressure |
| `windSpeed` | Float | km/h | 10m Wind speed |
| `tideLevel` | Float / null | Meters MSL | Tide level (**null**: not measured in P2 feed) |
| `stormSurge` | Float / null | Meters | Storm surge (**null**: not measured in P2 feed) |
| `source` | String | Text | Origin feed identifier (`open-meteo`, `unverified-cwc`) |
| `sourceTimestamp` | String | Text | Original timestamp string before UTC conversion |
| `dataQuality` | String | Enum | `VERIFIED`, `UNVERIFIED_SOURCE`, `RAW` |

---

## 5. Execution Commands

### 1. Inspect Raw Datasets
```bash
python data-pipeline/src/inspect.py
```

### 2. Clean Feeds
```bash
python data-pipeline/src/clean_meteo.py
python data-pipeline/src/clean_cwc.py
```

### 3. Harmonize & Combine
```bash
python data-pipeline/src/combine.py
```

### 4. Ingest into Neon PostgreSQL + PostGIS
```bash
npm --prefix services/api run ingest:env
# Or via API
curl -X POST http://localhost:3000/api/v1/environmental-observations/ingest
```

---

## 6. SFINCS Hydrodynamic Model Compatibility

SFINCS requires two primary boundary inputs:
1. **Rainfall forcing (`sfincs.precip`)**: Fully supplied by normalized `rainfall` / `precipitation` time series.
2. **Water level boundary (`sfincs.bzs`)**: Requires **Tide + Storm Surge**.
   - *P2's current feed does not supply tide or storm surge.*
   - Coastal tide levels must come from astronomical tide tables (e.g. Panambur Port spring tide) or marine surge models. TideMesh preserves `tideLevel: null` rather than fabricating synthetic oceanographic values.
