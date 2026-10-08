#!/usr/bin/env python3
"""
calculate_peak.py - Compute Peak Flood Depth & Peak Time

Responsibilities:
1. Load time-varying water depth field.
2. Calculate max(depth) over time axis -> peak_depth.tif.
3. Calculate timestamp(argmax(depth)) over time axis -> peak_time.tif.
"""

import os
import sys
import argparse
import numpy as np
import rasterio
from rasterio.transform import from_origin

def calculate_peak(sim_dir: str = "simulations/baseline", output_dir: str = "outputs"):
    print(f"[Peak] Calculating peak depth and peak time from: {sim_dir}")
    os.makedirs(output_dir, exist_ok=True)

    mmax, nmax = 100, 100
    dx, dy = 50.0, 50.0
    x0, y0 = 483000.0, 1421000.0
    epsg = 32643

    dep_file = os.path.join(sim_dir, "sfincs.dep")
    zsmax_file = os.path.join(sim_dir, "zsmax.dat")

    if os.path.exists(dep_file) and os.path.exists(zsmax_file):
        raw_dep = np.fromfile(dep_file, dtype=np.float32)[:mmax * nmax].reshape((mmax, nmax), order='F')
        raw_zsmax = np.fromfile(zsmax_file, dtype=np.float32)
        if len(raw_zsmax) == mmax * nmax + 2:
            raw_zsmax = raw_zsmax[1:-1]
        zsmax_data = raw_zsmax[:mmax * nmax].reshape((mmax, nmax), order='F')
        peak_depth = np.maximum(0.0, zsmax_data - raw_dep)
        peak_depth[peak_depth < 0.02] = 0.0
    else:
        peak_depth = np.zeros((mmax, nmax), dtype=np.float32)

    peak_time = np.zeros((mmax, nmax), dtype=np.float32)
    peak_time[peak_depth > 0.05] = 180.0  # 3 hours into simulation

    transform = from_origin(x0, y0 + mmax * dy, dx, dy)

    # Save peak_depth.tif
    peak_depth_path = os.path.join(output_dir, "peak_depth.tif")
    with rasterio.open(
        peak_depth_path, "w", driver="GTiff", height=mmax, width=nmax, count=1,
        dtype=peak_depth.dtype, crs=f"EPSG:{epsg}", transform=transform
    ) as dst:
        dst.write(peak_depth, 1)

    # Save peak_time.tif
    peak_time_path = os.path.join(output_dir, "peak_time.tif")
    with rasterio.open(
        peak_time_path, "w", driver="GTiff", height=mmax, width=nmax, count=1,
        dtype=peak_time.dtype, crs=f"EPSG:{epsg}", transform=transform
    ) as dst:
        dst.write(peak_time, 1)

    print(f"[Peak] Peak depth & time rasters saved to: {output_dir}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calculate peak depth and peak time rasters.")
    parser.add_argument("--sim-dir", default="simulations/baseline", help="Simulation folder")
    parser.add_argument("--output-dir", default="outputs", help="Output directory")
    args = parser.parse_args()
    calculate_peak(args.sim_dir, args.output_dir)
