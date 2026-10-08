#!/usr/bin/env python3
"""
prepare_rainfall.py - Rainfall Forcing Preprocessing for SFINCS Mangaluru

Responsibilities:
1. Parse raw rainfall gauge or gridded data (raw/rainfall/).
2. Handle uniform rainfall(t) or spatially distributed rainfall(t, x, y).
3. Convert rainfall rates to mm/hr or m/s as required by SFINCS.
4. Export rainfall forcing files (sfincs.inp precipitation entries / netCDF).
"""

import os
import argparse

def prepare_rainfall(input_path: str, output_path: str):
    print(f"[Rainfall] Preprocessing rainfall forcing from: {input_path}")
    # TODO: Implement time-series / NetCDF spatial precipitation processing
    print(f"[Rainfall] Prepared precipitation forcing saved to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess precipitation forcing for SFINCS.")
    parser.add_argument("--input", default="raw/rainfall/mangalore_rainfall.csv", help="Path to raw rainfall file")
    parser.add_argument("--output", default="processed/rainfall/sfincs_precip.precip", help="Output precip file")
    args = parser.parse_args()
    prepare_rainfall(args.input, args.output)
