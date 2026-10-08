from pathlib import Path
import json
import pandas as pd
from datetime import datetime, timezone, timedelta
import sys


def clean_meteo(input_path: Path, output_path: Path) -> dict:
    print(f"\n{'='*60}")
    print(f"CLEANING OPEN-METEO: {input_path}")
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
    timezone_str = data.get("timezone", "Asia/Kolkata")
    utc_offset_seconds = data.get("utc_offset_seconds", 19800)

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

    print(f"Raw records: {len(times)}")

    # Create DataFrame
    df = pd.DataFrame({
        "timestamp_local": times,
        "precipitation_mm": precipitation,
        "rain_mm": rain,
    })

    # Convert timestamps to datetime (local time)
    df["timestamp_local"] = pd.to_datetime(df["timestamp_local"], format="ISO8601")

    # Convert to UTC
    # The timestamps are in local time (Asia/Kolkata = UTC+5:30)
    # We need to subtract the offset to get UTC
    utc_offset = timedelta(seconds=utc_offset_seconds)
    df["timestamp_utc"] = df["timestamp_local"] - utc_offset

    # Set timestamp_utc as the main timestamp
    df["timestamp"] = df["timestamp_utc"]

    # Add location metadata
    df["latitude"] = latitude
    df["longitude"] = longitude
    df["elevation_m"] = elevation
    df["source_timezone"] = timezone_str
    df["source"] = "open-meteo"

    # Sort by timestamp
    df = df.sort_values("timestamp").reset_index(drop=True)

    # Remove invalid timestamps (NaT)
    initial_count = len(df)
    df = df.dropna(subset=["timestamp"])
    if len(df) < initial_count:
        print(f"Removed {initial_count - len(df)} rows with invalid timestamps")

    # Remove duplicate timestamps
    initial_count = len(df)
    df = df.drop_duplicates(subset=["timestamp"], keep="first")
    if len(df) < initial_count:
        print(f"Removed {initial_count - len(df)} duplicate timestamp rows")

    # Ensure hourly frequency (check for gaps)
    df["timestamp_diff"] = df["timestamp"].diff().dt.total_seconds() / 3600
    gaps = df[df["timestamp_diff"] > 1.5]
    if len(gaps) > 0:
        print(f"WARNING: Found {len(gaps)} timestamp gaps > 1.5 hours")
        for _, row in gaps.iterrows():
            print(f"  Gap after {row['timestamp']}: {row['timestamp_diff']:.1f} hours")

    df = df.drop(columns=["timestamp_diff"])

    # Missing value report
    print(f"\nMissing values:")
    for col in ["precipitation_mm", "rain_mm"]:
        missing = df[col].isna().sum()
        print(f"  {col}: {missing} missing")

    # Timestamp range
    print(f"\nTimestamp range (UTC):")
    print(f"  Start: {df['timestamp'].min()}")
    print(f"  End: {df['timestamp'].max()}")
    print(f"  Frequency: ~1 hour")

    # Save to parquet
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(output_path, index=False)
    print(f"\nSaved to: {output_path}")
    print(f"Rows: {len(df)}, Columns: {list(df.columns)}")

    return {
        "status": "SUCCESS",
        "rows": len(df),
        "columns": list(df.columns),
        "timestamp_start": str(df["timestamp"].min()),
        "timestamp_end": str(df["timestamp"].max()),
        "missing_values": df[["precipitation_mm", "rain_mm"]].isna().sum().to_dict(),
        "latitude": latitude,
        "longitude": longitude,
    }


def main():
    input_path = Path("data/raw/open-meteo/open_meteo_hourly.json")
    output_path = Path("data/processed/open-meteo/open_meteo_hourly.parquet")

    result = clean_meteo(input_path, output_path)

    print(f"\n{'='*60}")
    print("RESULT:", result)
    print(f"{'='*60}")

    if result.get("status") != "SUCCESS":
        sys.exit(1)


if __name__ == "__main__":
    main()