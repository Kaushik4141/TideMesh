# PERSON 1 — SFINCS Flood Physics & Prediction Engine (Mangaluru)

## Overview
This directory contains the scientific flood simulation and prediction pipeline for **TideMesh / AI for Coastal Flood Intelligence — Mangaluru**.

## Real-input readiness

The checked-in model and historical simulation files are reproducible synthetic
fixtures. They are not Copernicus terrain, measured rainfall, measured tide, or
validated flood observations. No real DEM is currently present in this checkout.
Use the local-only readiness validator before an operational run:

```bash
python ml/sfincs/mangaluru/scripts/validate_inputs.py \
  --manifest ml/sfincs/mangaluru/provenance/manifest.json \
  --output /tmp/mangaluru-data-readiness.json --operational
```

The command never downloads data, starts Docker, or runs SFINCS. Supply explicit
local paths and a reviewed JSON manifest with `status: real`, source, checksum,
CRS/datum, and timestamp coverage for operational inputs. DEM preparation is
also explicit and laptop-safe:

```bash
python ml/sfincs/mangaluru/scripts/prepare_dem.py \
  --input /path/to/real-dem.tif --output processed/dem/dem_utm43n.tif
```

The pipeline uses **SFINCS** (*Super-Fast INundation of CoastS*) driven by **HydroMT-SFINCS** to simulate time-varying flood depth fields, flood extent, onset times, and peak depths across Mangaluru using local terrain (DEM), tidal forcing, and rainfall data.

---

## Directory Structure

```text
ml/sfincs/mangaluru/
├── README.md                 # Project documentation & setup instructions
├── DATA_SOURCES.md           # Data audit & metadata ledger
├── config/                   # Model and HydroMT YAML/INI configuration files
│   └── roughness/            # Manning roughness land cover strategies (base.json)
├── raw/                      # Unmodified source data (DEM, rainfall, tide, surge, observations)
├── processed/                # Preprocessed geospatial data & continuous boundary conditions
│   └── boundaries/           # Domain boundary polygon (domain.geojson)
├── model/                    # SFINCS model setup files (base, calibration, validation)
├── simulations/              # Simulation runs (baseline, historical, scenarios)
├── outputs/                  # Standardized products (GeoTIFF, GeoJSON, metadata.json)
├── validation/               # Observed flood data, metrics reports, IoU/RMSE analysis
├── scripts/                  # Preprocessing, execution, extraction, and validation scripts
└── requirements.txt          # Python dependencies
```

---

## Completed Milestones Summary (M0 – M7)

| Milestone | Status | Description | Verification Artifact |
| :--- | :--- | :--- | :--- |
| **M0: Environment** | **DEPENDENCY SPEC** | Python/HydroMT dependencies are listed; this readiness flow does not require Docker or a SFINCS run | `requirements.txt` |
| **M1: Data Audit** | **READINESS CHECK** | Domain specification and input provenance requirements; real DEM, tide, rainfall, and validated observations are not present | [`DATA_SOURCES.md`](DATA_SOURCES.md), [`provenance/manifest.json`](provenance/manifest.json) |
| **M2: Baseline Model** | **SYNTHETIC FIXTURE** | Generated mesh/terrain retained for development only | [`model/base/SYNTHETIC.md`](model/base/SYNTHETIC.md) |
| **M3: Compound Forcing** | **SYNTHETIC FIXTURE** | Generated tide/rainfall forcing retained for development only | [`simulations/historical/SYNTHETIC.md`](simulations/historical/SYNTHETIC.md) |
| **M4: Historical Replay** | **NOT OPERATIONAL** | No real-input replay is claimed by this checkout | `scripts/validate_inputs.py` |
| **M5 & M6: Calib / Valid** | **NOT OPERATIONAL** | Existing metrics are not evidence of real-input validation | [`validation/metrics/report.json`](validation/metrics/report.json) |
| **M7: Product Outputs** | **SCENARIO FIXTURES** | Existing outputs are retained but are not operational observations | [`simulations/baseline/outputs/`](simulations/baseline/outputs/) |

---

## Environment & Execution Instructions

### 1. Python Environment Activation
```powershell
.\ml\sfincs\mangaluru\venv\Scripts\Activate.ps1
```

### 2. Run Historical Replay & Validation Pipeline
```powershell
python ml/sfincs/mangaluru/scripts/run_m4_historical_replay.py
```

### 3. Key Output Contract Deliverables ([`outputs/`](file:///c:/Users/Chaithra/Desktop/TideMesh/outputs/))
- `outputs/peak_depth.tif` — Peak Inundation Depth GeoTIFF (`EPSG:32643`)
- `outputs/flood_depth.tif` — Flood Snapshot Depth GeoTIFF (`EPSG:32643`)
- `outputs/onset_time.tif` — Onset Time GeoTIFF (Minutes to $0.05\text{ m}$)
- `outputs/peak_time.tif` — Time to Peak Depth GeoTIFF (Minutes)
- `outputs/flood_extent.geojson` — Vector Flood Extent Polygon ($\ge 0.10\text{ m}$ depth, `EPSG:4326`)
- `outputs/metadata.json` — Simulation Metadata Ledger
