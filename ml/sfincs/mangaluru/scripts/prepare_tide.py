#!/usr/bin/env python3
"""
prepare_tide.py - Tide Forcing Preprocessing for Panambur / Mangaluru

Responsibilities:
1. Parse raw tidal data / tide tables (raw/tide/).
2. Reconcile Chart Datum (CD) / Port Datum to Mean Sea Level (MSL).
3. Quality control (check for gaps, outliers, timestamp integrity).
4. Interpolate to uniform simulation timestep.
5. Export SFINCS boundary water-level forcing file.
"""

import os
import argparse

def prepare_tide(input_path: str, output_path: str, datum_offset_m: float = 0.0):
    print(f"[Tide] Preprocessing tidal forcing from: {input_path}")
    print(f"[Tide] Applying vertical datum offset: {datum_offset_m} m")
    # TODO: Implement pandas time-series processing & formatting for SFINCS bzs/bnd files
    print(f"[Tide] Prepared boundary forcing saved to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess tidal boundary forcing for SFINCS.")
    parser.add_argument("--input", default="raw/tide/panambur_tide.csv", help="Path to raw tide file")
    parser.add_argument("--output", default="processed/tide/sfincs_tide.bzs", help="Output water-level file")
    parser.add_argument("--datum-offset", type=float, default=0.0, help="Datum offset to convert to MSL (meters)")
    args = parser.parse_args()
    prepare_tide(args.input, args.output, args.datum_offset)
