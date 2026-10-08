"""
clean_cwc.py - Clean and Normalize CWC Observations

CRITICAL PROVENANCE AUDIT:
This file processes `data/raw/cwc/cwc_observations.json`.
Audit Finding:
  Despite being located under `data/raw/cwc/`, inspection reveals that this dataset
  is NOT derived from Central Water Commission (CWC) river gauges.
  It is an Open-Meteo weather model API response for Mangaluru (lat 12.899824, lon 74.87738)
  requested in GMT with meteorological parameters (precipitation, rain, temperature_2m,
  surface_pressure, wind_speed_10m).
  It does NOT contain river discharge, river water level, or hydrological station codes.

  Accordingly, all records from this source are explicitly labeled:
    source: "unverified-cwc"
    data_quality: "UNVERIFIED_SOURCE"
"""

from pathlib import Path
import json
import pandas as pd
from datetime import datetime, timezone, timedelta
import sys


def clean_cwc(input_path: Path, output_path: Path) -> dict:
    print(f"\n{'='*60}")
    print(f"CLEANING UNVERIFIED CWC / METEO DATA: {input_path}")
    print(f"[NOTICE] PROVENANCE NOTICE: Source is Open-Meteo GMT response, labeled as UNVERIFIED_SOURCE")
    print(f"{'='*60}")

    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}")
        return {"status": "ERROR", "reason": "Input file not found"}

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Extract metadata
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    elevation = data.get("elevation")
    timezone_str = data.get("timezone", "GMT")
    utc_offset_seconds = data.get("utc_offset_seconds", 0)

    print(f"Location: lat={latitude}, lon={longitude}, elevation={elevation}")
    print(f"Timezone: {timezone_str} (UTC offset: {utc_offset_seconds}s)")

    # Parse hourly data
    hourly = data.get("hourly", {})
    if not hourly or "time" not in hourly:
        print("ERROR: No hourly data found")
        return {"status": "ERROR", "reason": "No hourly data"}

    times = hourly["time"]
    precipitation = hourly.get("precipitation", [])
    rain = hourly.get("rain", [])
    temperature = hourly.get("temperature_2m", [])
    pressure = hourly.get("surface_pressure", [])
    wind_speed = hourly.get("wind_speed_10m", [])

    print(f"Raw records: {len(times)}")

    df = pd.DataFrame({
        "timestamp_raw": times,
        "precipitation_mm": precipitation,
        "rain_mm": rain,
        "temperature_c": temperature if temperature else [None] * len(times),
        "surface_pressure_hpa": pressure if pressure else [None] * len(times),
        "wind_speed_kmh": wind_speed if wind_speed else [None] * len(times),
    })

    # Since timezone is GMT (UTC+0), ISO8601 timestamps are already in UTC
    df["timestamp_utc"] = pd.to_datetime(df["timestamp_raw"], format="ISO8601")
    if utc_offset_seconds != 0:
        df["timestamp_utc"] = df["timestamp_utc"] - timedelta(seconds=utc_offset_seconds)

    df["timestamp"] = df["timestamp_utc"]

    # Metadata & Quality
    df["latitude"] = latitude
    df["longitude"] = longitude
    df["elevation_m"] = elevation
    df["source"] = "unverified-cwc"
    df["data_quality"] = "UNVERIFIED_SOURCE"
    df["provenance_note"] = "Open-Meteo GMT response mislabeled as CWC observations"

    # Sort and clean
    df = df.sort_values("timestamp").reset_index(drop=True)
    df = df.dropna(subset=["timestamp"])
    df = df.drop_duplicates(subset=["timestamp"], keep="first")

    # Save to parquet (with CSV fallback if pyarrow missing)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        df.to_parquet(output_path, index=False)
        print(f"Saved to: {output_path}")
    except Exception as e:
        csv_path = output_path.with_suffix(".csv")
        df.to_csv(csv_path, index=False)
        print(f"Saved to fallback CSV: {csv_path} (pyarrow not present: {e})")
    print(f"Rows: {len(df)}, Columns: {list(df.columns)}")


    return {
        "status": "SUCCESS",
        "rows": len(df),
        "columns": list(df.columns),
        "timestamp_start": str(df["timestamp"].min()),
        "timestamp_end": str(df["timestamp"].max()),
        "data_quality": "UNVERIFIED_SOURCE",
        "latitude": latitude,
        "longitude": longitude,
    }


def main():
    base_dir = Path(__file__).resolve().parent.parent
    input_path = base_dir / "data" / "raw" / "cwc" / "cwc_observations.json"
    output_path = base_dir / "data" / "processed" / "cwc" / "cwc_observations.parquet"

    result = clean_cwc(input_path, output_path)
    print(f"\n{'='*60}")
    print("RESULT:", result)
    print(f"{'='*60}")

    if result.get("status") != "SUCCESS":
        sys.exit(1)


if __name__ == "__main__":
    main()
