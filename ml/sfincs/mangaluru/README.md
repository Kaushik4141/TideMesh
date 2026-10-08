# PERSON 1 — SFINCS Flood Physics & Prediction Engine (Mangaluru)

## Overview
This directory contains the scientific flood simulation and prediction pipeline for **TideMesh / AI for Coastal Flood Intelligence — Mangaluru**. 

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
| **M0: Environment** | **COMPLETE** | Python venv, HydroMT, HydroMT-SFINCS & Docker Desktop runtime | Benchmark run verified |
| **M1: Data Audit** | **COMPLETE** | $5\text{ km} \times 5\text{ km}$ domain (`EPSG:32643`), DEM, Panambur tide, IMD rainfall | [`DATA_SOURCES.md`](file:///c:/Users/Chaithra/Desktop/TideMesh/ml/sfincs/mangaluru/DATA_SOURCES.md), [`domain.geojson`](file:///c:/Users/Chaithra/Desktop/TideMesh/ml/sfincs/mangaluru/processed/boundaries/domain.geojson) |
| **M2: Baseline Model** | **COMPLETE** | Mesh, elevation, roughness ($n=0.035$), controlled ocean pulse run | `model/base/` |
| **M3: Compound Forcing** | **COMPLETE** | Panambur spring tide ($+2.25\text{m}$ MSL) + IMD extreme downpour ($75\text{ mm/hr}$) | [`simulations/historical/`](file:///c:/Users/Chaithra/Desktop/TideMesh/ml/sfincs/mangaluru/simulations/historical/) |
| **M4: Historical Replay** | **COMPLETE** | May 29, 2018 Cyclone Mekunu / Monsoon extreme flood event replay | `simulations/historical/` |
| **M5 & M6: Calib / Valid** | **COMPLETE** | Calibrated roughness, computed IoU (`0.3782`), CSI (`0.3782`), RMSE (`0.125m`) | [`validation/metrics/report.json`](file:///c:/Users/Chaithra/Desktop/TideMesh/ml/sfincs/mangaluru/validation/metrics/report.json) |
| **M7: Product Outputs** | **COMPLETE** | All 6 standardized geospatial deliverables exported to `outputs/` | [`outputs/`](file:///c:/Users/Chaithra/Desktop/TideMesh/outputs/) |

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
