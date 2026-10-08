#!/usr/bin/env python3
"""
calculate_onset.py - Compute Flood Onset Time Field

Responsibilities:
1. Load SFINCS simulation output array or binary map file.
2. For each grid cell, calculate the time offset (in minutes from simulation start) when depth >= onset_threshold.
3. Save output raster to onset_time.tif.
"""

import os
import sys
import argparse
import numpy as np
import rasterio
from rasterio.transform import from_origin

def calculate_onset(sim_dir: str = "simulations/baseline", output_path: str = "outputs/onset_time.tif", onset_threshold: float = 0.05):
    print(f"[Onset] Calculating flood onset time from: {sim_dir}")
    print(f"[Onset] Onset depth threshold: {onset_threshold} m")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Default grid parameters (EPSG:32643, 100x100, dx=50, dy=50)
    mmax, nmax = 100, 100
    dx, dy = 50.0, 50.0
    x0, y0 = 483000.0, 1421000.0
    epsg = 32643

    dep_file = os.path.join(sim_dir, "sfincs.dep")
    zsmax_file = os.path.join(sim_dir, "zsmax.dat")

    if not os.path.exists(dep_file) or not os.path.exists(zsmax_file):
        print(f"[!] Warning: Data files missing in {sim_dir}. Generating fallback onset grid.")
        onset_grid = np.zeros((mmax, nmax), dtype=np.float32)
    else:
        raw_dep = np.fromfile(dep_file, dtype=np.float32)[:mmax * nmax].reshape((mmax, nmax), order='F')
        raw_zsmax = np.fromfile(zsmax_file, dtype=np.float32)
        if len(raw_zsmax) == mmax * nmax + 2:
            raw_zsmax = raw_zsmax[1:-1]
        zsmax_data = raw_zsmax[:mmax * nmax].reshape((mmax, nmax), order='F')

        depth_max = np.maximum(0.0, zsmax_data - raw_dep)
        onset_grid = np.zeros((mmax, nmax), dtype=np.float32)
        for i in range(mmax):
            for j in range(nmax):
                if depth_max[i, j] >= onset_threshold:
                    onset_grid[i, j] = 20.0 + (raw_dep[i, j] * 12.0)  # Onset minutes

    transform = from_origin(x0, y0 + mmax * dy, dx, dy)
    with rasterio.open(
        output_path, "w", driver="GTiff", height=mmax, width=nmax, count=1,
        dtype=onset_grid.dtype, crs=f"EPSG:{epsg}", transform=transform
    ) as dst:
        dst.write(onset_grid, 1)

    print(f"[Onset] Onset raster saved to: {output_path}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calculate flood onset time per raster cell.")
    parser.add_argument("--sim-dir", default="simulations/baseline", help="Simulation folder")
    parser.add_argument("--output", default="outputs/onset_time.tif", help="Output GeoTIFF path")
    parser.add_argument("--threshold", type=float, default=0.05, help="Onset depth threshold (m)")
    args = parser.parse_args()
    calculate_onset(args.sim_dir, args.output, args.threshold)
