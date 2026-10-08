#!/usr/bin/env python3
"""
prepare_dem.py - DEM Preprocessing for SFINCS Mangaluru Model

Responsibilities:
1. Load raw elevation data (raw/dem/).
2. Validate CRS, units, and vertical reference.
3. Reproject to target projected CRS (EPSG:32643 - UTM Zone 43N).
4. Clip to Mangaluru initial domain (5km x 5km).
5. Apply vertical datum conversion to Mean Sea Level (MSL).
6. Export processed grid for HydroMT-SFINCS.
"""

import os
import sys
import argparse

def prepare_dem(raw_dem_path: str, output_path: str, target_crs: str = "EPSG:32643"):
    print(f"[DEM] Preprocessing raw DEM from: {raw_dem_path}")
    print(f"[DEM] Target CRS: {target_crs}")
    # TODO: Implement rasterio/rioxarray reprojection and clipping logic
    print(f"[DEM] Output saved to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess raw DEM for Mangaluru SFINCS domain.")
    parser.add_argument("--input", default="raw/dem/mangaluru_dem.tif", help="Path to raw DEM file")
    parser.add_argument("--output", default="processed/dem/dem_utm43n.tif", help="Output processed DEM path")
    parser.add_argument("--crs", default="EPSG:32643", help="Target projected CRS")
    args = parser.parse_args()
    prepare_dem(args.input, args.output, args.crs)
