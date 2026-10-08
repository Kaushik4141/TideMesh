#!/usr/bin/env python3
"""
prepare_rainfall.py - Real Environmental Rainfall Preprocessing for SFINCS Mangaluru

Ingests real-time/historical hourly precipitation records from data-pipeline
(environmental_hourly.json / open_meteo_hourly.json) and formats sfincs.precip.
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path

def prepare_rainfall(input_path: str, output_path: str) -> bool:
    print(f"[Rainfall] Ingesting real environmental precipitation forcing from: {input_path}")
    input_p = Path(input_path)
    output_p = Path(output_path)
    
    # Fallback search if path doesn't exist
    if not input_p.exists():
        candidates = [
            Path("data-pipeline/data/processed/combined/environmental_hourly.json"),
            Path("data-pipeline/data/raw/open-meteo/open_meteo_hourly.json"),
            Path("../../data-pipeline/data/processed/combined/environmental_hourly.json"),
        ]
        for c in candidates:
            if c.exists():
                input_p = c
                print(f"[Rainfall] Found input at fallback path: {input_p}")
                break

    records = []
    if input_p.exists():
        with open(input_p, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, list):
            # Format from environmental_hourly.json
            for entry in data:
                ts_str = entry.get("timestamp") or entry.get("timestamp_utc") or entry.get("timestamp_local")
                precip = float(entry.get("precipitation") if entry.get("precipitation") is not None else entry.get("rainfall", 0.0))
                if ts_str:
                    try:
                        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                        formatted_ts = dt.strftime("%Y%m%d %H%M%S")
                        records.append((formatted_ts, precip))
                    except Exception:
                        pass
        elif isinstance(data, dict) and "hourly" in data:
            # Format directly from raw open_meteo_hourly.json
            times = data["hourly"].get("time", [])
            precip_list = data["hourly"].get("precipitation", [])
            for t, p in zip(times, precip_list):
                try:
                    dt = datetime.fromisoformat(t.replace("Z", "+00:00"))
                    formatted_ts = dt.strftime("%Y%m%d %H%M%S")
                    records.append((formatted_ts, float(p)))
                except Exception:
                    pass

    if not records:
        print("[Rainfall] Warning: No valid records found. Using baseline storm profile.")
        records = [
            ("20260615 000000", 15.0),
            ("20260615 010000", 45.0),
            ("20260615 020000", 75.0),
            ("20260615 030000", 60.0),
            ("20260615 040000", 30.0),
            ("20260615 050000", 15.0),
            ("20260615 060000", 5.0),
        ]

    output_p.parent.mkdir(parents=True, exist_ok=True)
    with open(output_p, "w", encoding="utf-8") as f:
        for ts, rate in records:
            f.write(f"{ts} {rate:.2f}\n")

    print(f"[Rainfall] Successfully wrote {len(records)} precipitation forcing steps to: {output_p}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess precipitation forcing for SFINCS.")
    parser.add_argument("--input", default="data-pipeline/data/processed/combined/environmental_hourly.json", help="Path to raw/processed rainfall file")
    parser.add_argument("--output", default="ml/sfincs/mangaluru/simulations/historical/sfincs.precip", help="Output precip file")
    args = parser.parse_args()
    success = prepare_rainfall(args.input, args.output)
    sys.exit(0 if success else 1)

