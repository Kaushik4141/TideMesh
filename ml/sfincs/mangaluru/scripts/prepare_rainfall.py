#!/usr/bin/env python3
"""
prepare_rainfall.py - Real Environmental Rainfall Preprocessing for SFINCS Mangaluru

Ingests real-time/historical hourly precipitation records from data-pipeline
(environmental_hourly.json / open_meteo_hourly.json) and formats sfincs.precip.
"""

import sys
import argparse
from pathlib import Path

try:
    from .validate_inputs import load_time_series
except ImportError:
    from validate_inputs import load_time_series

def prepare_rainfall(input_path: str, output_path: str) -> bool:
    print(f"[Rainfall] Ingesting explicitly supplied precipitation forcing from: {input_path}")
    input_p = Path(input_path)
    output_p = Path(output_path)
    records, _ = load_time_series(input_p, "rainfall")

    output_p.parent.mkdir(parents=True, exist_ok=True)
    with open(output_p, "w", encoding="utf-8") as f:
        for ts, rate in records:
            f.write(f"{ts.replace('-', '').replace('T', ' ').replace(':', '')[:15]} {rate:.2f}\n")

    print(f"[Rainfall] Successfully wrote {len(records)} precipitation forcing steps to: {output_p}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess precipitation forcing for SFINCS.")
    parser.add_argument("--input", default="data-pipeline/data/processed/combined/environmental_hourly.json", help="Path to raw/processed rainfall file")
    parser.add_argument("--output", default="ml/sfincs/mangaluru/simulations/historical/sfincs.precip", help="Output precip file")
    args = parser.parse_args()
    success = prepare_rainfall(args.input, args.output)
    sys.exit(0 if success else 1)
