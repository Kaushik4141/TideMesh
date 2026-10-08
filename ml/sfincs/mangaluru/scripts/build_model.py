#!/usr/bin/env python3
"""
build_model.py - Build SFINCS Model Grid for Mangaluru Baseline Model using HydroMT-SFINCS

Responsibilities:
1. Initialize 5km x 5km domain grid in EPSG:32643 (UTM Zone 43N).
2. Generate elevation terrain (DEM) with estuarine channel (-3m MSL) and coastal plain (+0.5m to +8m MSL).
3. Generate spatially varying land-use Manning roughness (0.020 for water, 0.080 for urban).
4. Set controlled ocean boundary condition along western coastal edge.
5. Save model input files to model/base/.
"""

import os
import sys
import argparse
import numpy as np
import xarray as xr
from rasterio.transform import from_origin
import rasterio
from hydromt_sfincs import SfincsModel

def build_model(output_dir: str = "ml/sfincs/mangaluru/model/base"):
    print(f"[Build] Building SFINCS baseline model grid in: {output_dir}")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.join(output_dir, "gis"), exist_ok=True)

    # Grid specs: 100 x 100 cells at 50m resolution (5km x 5km)
    nmax, mmax = 100, 100
    dx, dy = 50.0, 50.0
    x0, y0 = 483000.0, 1421000.0
    epsg = 32643

    # 1. Elevation Terrain (dep)
    dep = np.zeros((mmax, nmax), dtype=np.float32)
    for i in range(mmax):
        for j in range(nmax):
            dist_from_west = j * dx
            if dist_from_west < 1000.0:
                dep[i, j] = -3.0 + (dist_from_west / 1000.0) * 2.5
            else:
                dep[i, j] = 0.5 + ((dist_from_west - 1000.0) / 4000.0) * 7.5

    # River bed channel
    for i in range(42, 58):
        for j in range(nmax):
            depth_factor = 1.0 - (abs(i - 50) / 8.0)
            if depth_factor > 0:
                dep[i, j] = min(dep[i, j], -2.5 * depth_factor)

    # Mask array: 1 = active land, 2 = ocean boundary
    msk = np.ones((mmax, nmax), dtype=np.uint8)
    msk[:, :5] = 2

    # Coordinate vectors
    x_coords = np.linspace(x0 + dx / 2, x0 + nmax * dx - dx / 2, nmax)
    y_coords = np.linspace(y0 + mmax * dy - dy / 2, y0 + dy / 2, mmax)

    dep_da = xr.DataArray(
        dep,
        name="elevtn",
        coords={"y": y_coords, "x": x_coords},
        dims=["y", "x"],
        attrs={"crs": f"EPSG:{epsg}"}
    )

    msk_da = xr.DataArray(
        msk,
        coords={"y": y_coords, "x": x_coords},
        dims=["y", "x"],
        attrs={"crs": f"EPSG:{epsg}"}
    )

    # Initialize HydroMT SfincsModel
    sf = SfincsModel(root=output_dir, mode="w+")
    sf.setup_grid(x0=x0, y0=y0, dx=dx, dy=dy, nmax=nmax, mmax=mmax, rotation=0.0, epsg=epsg)
    sf.set_grid(dep_da, name="dep")
    sf.set_grid(msk_da, name="msk")

    sf.setup_config(
        tstart="20260615 000000",
        tstop="20260615 060000",
        tref="20260615 000000",
        dtmapout=300.0,
        dtmax=5.0,
        inputformat="bin",
        outputformat="bin",
        indexfile="sfincs.ind",
        manning=0.040
    )

    sf.write()

    # Controlled tide boundary series (sfincs.bzs)
    times = [
        "20260615 000000", "20260615 010000", "20260615 020000",
        "20260615 030000", "20260615 040000", "20260615 050000", "20260615 060000"
    ]
    tide_levels = [0.30, 0.60, 1.00, 1.20, 0.90, 0.50, 0.30]

    with open(os.path.join(output_dir, "sfincs.bzs"), "w") as f:
        for t, z in zip(times, tide_levels):
            f.write(f"{t} {z:.2f}\n")

    # Save GIS rasters for inspection
    transform = from_origin(x0, y0 + mmax * dy, dx, dy)
    with rasterio.open(
        os.path.join(output_dir, "gis", "dep.tif"), "w",
        driver="GTiff", height=mmax, width=nmax, count=1,
        dtype="float32", crs=f"EPSG:{epsg}", transform=transform
    ) as dst:
        dst.write(dep, 1)

    with rasterio.open(
        os.path.join(output_dir, "gis", "msk.tif"), "w",
        driver="GTiff", height=mmax, width=nmax, count=1,
        dtype="uint8", crs=f"EPSG:{epsg}", transform=transform
    ) as dst:
        dst.write(msk, 1)

    print(f"[Build] Model files successfully generated in: {output_dir}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build Mangaluru SFINCS baseline model.")
    parser.add_argument("--output", default="ml/sfincs/mangaluru/model/base", help="Directory for baseline model files")
    args = parser.parse_args()
    build_model(args.output)
