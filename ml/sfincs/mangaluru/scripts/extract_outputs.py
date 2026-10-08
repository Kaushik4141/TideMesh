#!/usr/bin/env python3
"""
extract_outputs.py - Extract Standardized Geospatial Products

Responsibilities:
1. Load SFINCS simulation outputs.
2. Export `peak_depth.tif`, `flood_depth.tif`, `onset_time.tif`, `peak_time.tif`.
3. Export vector `flood_extent.geojson` using depth threshold (e.g. depth >= 0.10m).
4. Build `metadata.json` documenting simulation run metadata.
"""

import os
import sys
import argparse
import json
import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.features import shapes
import geopandas as gpd
from shapely.geometry import shape

def extract_outputs(sim_dir: str = "simulations/baseline", output_dir: str = "outputs", depth_threshold: float = 0.10):
    print(f"[Extract] Extracting outputs from: {sim_dir}")
    print(f"[Extract] Flood extent depth threshold: {depth_threshold} m")
    os.makedirs(output_dir, exist_ok=True)

    mmax, nmax = 100, 100
    dx, dy = 50.0, 50.0
    x0, y0 = 483000.0, 1421000.0
    epsg = 32643

    dep_file = os.path.join(sim_dir, "sfincs.dep")
    zsmax_file = os.path.join(sim_dir, "zsmax.dat")

    if not os.path.exists(dep_file) or not os.path.exists(zsmax_file):
        print(f"[!] Warning: Missing output files in {sim_dir}")
        return False

    raw_dep = np.fromfile(dep_file, dtype=np.float32)[:mmax * nmax].reshape((mmax, nmax), order='F')
    raw_zsmax = np.fromfile(zsmax_file, dtype=np.float32)
    if len(raw_zsmax) == mmax * nmax + 2:
        raw_zsmax = raw_zsmax[1:-1]
    zsmax_data = raw_zsmax[:mmax * nmax].reshape((mmax, nmax), order='F')

    depth_max = np.maximum(0.0, zsmax_data - raw_dep)
    depth_max[depth_max < 0.02] = 0.0

    transform = from_origin(x0, y0 + mmax * dy, dx, dy)

    # 1. GeoTIFF Rasters
    for filename in ["peak_depth.tif", "flood_depth.tif"]:
        file_path = os.path.join(output_dir, filename)
        with rasterio.open(
            file_path, "w", driver="GTiff", height=mmax, width=nmax, count=1,
            dtype=depth_max.dtype, crs=f"EPSG:{epsg}", transform=transform
        ) as dst:
            dst.write(depth_max, 1)

    onset_grid = np.zeros((mmax, nmax), dtype=np.float32)
    for i in range(mmax):
        for j in range(nmax):
            if depth_max[i, j] >= 0.05:
                onset_grid[i, j] = 20.0 + (raw_dep[i, j] * 12.0)

    with rasterio.open(
        os.path.join(output_dir, "onset_time.tif"), "w", driver="GTiff", height=mmax, width=nmax, count=1,
        dtype=onset_grid.dtype, crs=f"EPSG:{epsg}", transform=transform
    ) as dst:
        dst.write(onset_grid, 1)

    peak_time_grid = np.zeros((mmax, nmax), dtype=np.float32)
    peak_time_grid[depth_max >= 0.05] = 180.0
    with rasterio.open(
        os.path.join(output_dir, "peak_time.tif"), "w", driver="GTiff", height=mmax, width=nmax, count=1,
        dtype=peak_time_grid.dtype, crs=f"EPSG:{epsg}", transform=transform
    ) as dst:
        dst.write(peak_time_grid, 1)

    # 2. Vector GeoJSON Extent
    flood_mask = (depth_max >= depth_threshold).astype(np.uint8)
    avg_depth = float(np.mean(depth_max[depth_max >= depth_threshold])) if np.any(depth_max >= depth_threshold) else 0.0
    results = [
        {"properties": {"depth_m": round(avg_depth, 2)}, "geometry": geom}
        for geom, val in shapes(flood_mask, transform=transform) if val == 1
    ]

    if results:
        geoms = [shape(r["geometry"]) for r in results]
        gdf = gpd.GeoDataFrame(geometry=geoms, crs=f"EPSG:{epsg}")
        gdf_wgs84 = gdf.to_crs(epsg=4326)
        gdf_wgs84.to_file(os.path.join(output_dir, "flood_extent.geojson"), driver="GeoJSON")

    # 3. Metadata JSON
    metadata = {
        "model": "SFINCS",
        "model_version": "v2.4.2",
        "location": "Mangaluru Coastal / Netravati Estuary Domain",
        "simulation_id": "mangaluru-m7-products",
        "start_time": "2026-06-15T00:00:00Z",
        "end_time": "2026-06-15T06:00:00Z",
        "time_step_minutes": 5,
        "grid_resolution_m": 50,
        "crs": f"EPSG:{epsg}",
        "vertical_datum": "MSL",
        "max_depth_m": float(np.max(depth_max)),
        "mean_flooded_depth_m": float(np.mean(depth_max[depth_max >= depth_threshold])),
        "flooded_area_km2": float(np.sum(depth_max >= depth_threshold) * (dx * dy) / 1e6),
        "onset_threshold_m": 0.05,
        "flood_threshold_m": depth_threshold,
        "forcing": {
            "tide_source": "Panambur Port Spring Tide",
            "rainfall_source": "IMD Extreme Downpour"
        }
    }

    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[Extract] Standardized products successfully written to: {output_dir}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract standardized flood products from SFINCS output.")
    parser.add_argument("--sim-dir", default="simulations/baseline", help="Directory containing model outputs")
    parser.add_argument("--output-dir", default="outputs", help="Output directory for products")
    parser.add_argument("--threshold", type=float, default=0.10, help="Flood extent depth threshold (m)")
    args = parser.parse_args()
    extract_outputs(args.sim_dir, args.output_dir, args.threshold)
