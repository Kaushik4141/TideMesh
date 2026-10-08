"""
combine.py - Harmonize and Combine Environmental Observation Feeds

Joins cleaned Open-Meteo local feed with the expanded GMT feed,
aligning strictly on UTC timestamps. Produces a unified dataset
ready for CoastShield backend ingestion.
"""

from pathlib import Path
import json
import pandas as pd
import sys


def combine_feeds(
    meteo_path: Path,
    cwc_path: Path,
    output_parquet: Path,
    output_json: Path,
) -> dict:
    print(f"\n{'='*60}")
    print("COMBINING ENVIRONMENTAL OBSERVATION FEEDS")
    print(f"{'='*60}")

    # Load Open-Meteo
    if meteo_path.exists():
        df_meteo = pd.read_parquet(meteo_path)
    elif meteo_path.with_suffix(".csv").exists():
        df_meteo = pd.read_csv(meteo_path.with_suffix(".csv"))
    else:
        print(f"ERROR: Open-Meteo processed file not found: {meteo_path}")
        return {"status": "ERROR", "reason": f"Missing {meteo_path}"}
    print(f"Loaded Open-Meteo records: {len(df_meteo)}")

    # Load CWC
    df_cwc = pd.DataFrame()
    if cwc_path.exists():
        df_cwc = pd.read_parquet(cwc_path)
        print(f"Loaded Unverified CWC/GMT records: {len(df_cwc)}")
    elif cwc_path.with_suffix(".csv").exists():
        df_cwc = pd.read_csv(cwc_path.with_suffix(".csv"))
        print(f"Loaded Unverified CWC/GMT records: {len(df_cwc)}")
    else:
        print(f"Notice: CWC file not found at {cwc_path}. Proceeding with Open-Meteo only.")

    # Ensure datetime on timestamp column
    df_meteo["timestamp"] = pd.to_datetime(df_meteo["timestamp"])

    if not df_cwc.empty:
        df_cwc["timestamp"] = pd.to_datetime(df_cwc["timestamp"])
        
        # Merge on timestamp
        merged = pd.merge(
            df_meteo,
            df_cwc[["timestamp", "temperature_c", "surface_pressure_hpa", "wind_speed_kmh", "data_quality"]],
            on="timestamp",
            how="outer",
            suffixes=("", "_cwc"),
        )
    else:
        merged = df_meteo.copy()
        merged["temperature_c"] = None
        merged["surface_pressure_hpa"] = None
        merged["wind_speed_kmh"] = None
        merged["data_quality"] = "VERIFIED"

    # Fill defaults and normalize columns
    merged["rainfall_mm"] = merged["rain_mm"].combine_first(merged["precipitation_mm"])
    merged["data_quality"] = merged["data_quality"].fillna("VERIFIED")

    # Add explicit coastal fields as NULL (strictly not faked!)
    merged["tide_level_m"] = None
    merged["storm_surge_m"] = None

    # Sort
    merged = merged.sort_values("timestamp").reset_index(drop=True)

    # Save to Parquet (with CSV fallback)
    output_parquet.parent.mkdir(parents=True, exist_ok=True)
    try:
        merged.to_parquet(output_parquet, index=False)
        print(f"Saved combined Parquet: {output_parquet} ({len(merged)} rows)")
    except Exception as e:
        csv_path = output_parquet.with_suffix(".csv")
        merged.to_csv(csv_path, index=False)
        print(f"Saved combined CSV: {csv_path} ({len(merged)} rows, pyarrow optional: {e})")


    # Save to JSON for universal ingestion
    records = []
    for _, row in merged.iterrows():
        ts_str = row["timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ") if pd.notna(row["timestamp"]) else None
        record = {
            "timestamp": ts_str,
            "latitude": float(row["latitude"]) if pd.notna(row["latitude"]) else None,
            "longitude": float(row["longitude"]) if pd.notna(row["longitude"]) else None,
            "elevation": float(row["elevation_m"]) if pd.notna(row.get("elevation_m")) else None,
            "rainfall": float(row["rainfall_mm"]) if pd.notna(row.get("rainfall_mm")) else 0.0,
            "precipitation": float(row["precipitation_mm"]) if pd.notna(row.get("precipitation_mm")) else 0.0,
            "temperature": float(row["temperature_c"]) if pd.notna(row.get("temperature_c")) else None,
            "surfacePressure": float(row["surface_pressure_hpa"]) if pd.notna(row.get("surface_pressure_hpa")) else None,
            "windSpeed": float(row["wind_speed_kmh"]) if pd.notna(row.get("wind_speed_kmh")) else None,
            "tideLevel": None,  # Explicitly null: P2 feed does not provide tide
            "stormSurge": None,  # Explicitly null: P2 feed does not provide storm surge
            "source": str(row.get("source", "open-meteo")),
            "sourceTimestamp": str(row.get("timestamp_local", ts_str)),
            "dataQuality": str(row.get("data_quality", "VERIFIED")),
        }
        records.append(record)

    output_json.parent.mkdir(parents=True, exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    print(f"Saved combined JSON: {output_json} ({len(records)} records)")

    return {
        "status": "SUCCESS",
        "rows": len(merged),
        "timestamp_start": str(merged["timestamp"].min()),
        "timestamp_end": str(merged["timestamp"].max()),
        "output_parquet": str(output_parquet),
        "output_json": str(output_json),
    }


def main():
    base_dir = Path(__file__).resolve().parent.parent
    meteo_path = base_dir / "data" / "processed" / "open-meteo" / "open_meteo_hourly.parquet"
    cwc_path = base_dir / "data" / "processed" / "cwc" / "cwc_observations.parquet"
    out_parquet = base_dir / "data" / "processed" / "combined" / "environmental_hourly.parquet"
    out_json = base_dir / "data" / "processed" / "combined" / "environmental_hourly.json"

    result = combine_feeds(meteo_path, cwc_path, out_parquet, out_json)
    print(f"\n{'='*60}")
    print("COMBINE RESULT:", result)
    print(f"{'='*60}")

    if result.get("status") != "SUCCESS":
        sys.exit(1)


if __name__ == "__main__":
    main()
