from pathlib import Path
import json
from datetime import datetime
import sys


def inspect_json(path: Path) -> dict:
    print("\n" + "=" * 80)
    print(f"FILE: {path}")
    print("=" * 80)

    if not path.exists():
        print("FILE DOES NOT EXIST")
        return {"status": "ERROR", "reason": "File not found"}

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print("Top-level type:", type(data).__name__)

    result = {
        "file": str(path),
        "top_level_type": type(data).__name__,
        "top_level_keys": [],
        "status": "UNKNOWN",
        "record_count": 0,
        "fields": [],
        "timestamp_range": None,
        "lat_lon": None,
        "timezone_info": None,
        "null_counts": {},
    }

    if isinstance(data, dict):
        print("\nTop-level keys:")
        for key in data:
            value = data[key]
            result["top_level_keys"].append(key)

            if isinstance(value, list):
                print(f"  {key}: list ({len(value)} items)")
                if value:
                    print("    First item:")
                    print(f"    {value[0]}")

            elif isinstance(value, dict):
                print(f"  {key}: dict")
                print(f"    Keys: {list(value.keys())[:20]}")

            else:
                print(f"  {key}: {value}")

        # Check for API error
        if "error" in data or "message" in data:
            if data.get("error") is True or "error" in str(data).lower():
                print("\n>>> DATA STATUS: ERROR (API error detected)")
                result["status"] = "ERROR"
                return result

        # Check for hourly data
        if "hourly" in data and isinstance(data["hourly"], dict):
            hourly = data["hourly"]
            if "time" in hourly and isinstance(hourly["time"], list):
                times = hourly["time"]
                result["record_count"] = len(times)
                print(f"\nHourly records: {len(times)}")

                if times:
                    print(f"  First timestamp: {times[0]}")
                    print(f"  Last timestamp: {times[-1]}")
                    result["timestamp_range"] = {"start": times[0], "end": times[-1]}

                    # Parse timestamps to check frequency
                    try:
                        parsed_times = [datetime.fromisoformat(t.replace("Z", "+00:00")) for t in times[:5]]
                        if len(parsed_times) >= 2:
                            diff = parsed_times[1] - parsed_times[0]
                            print(f"  Apparent frequency: {diff}")
                    except Exception as e:
                        print(f"  Could not parse timestamps: {e}")

                # List all hourly fields
                print(f"\nHourly fields ({len(hourly)}):")
                for field_name, field_values in hourly.items():
                    if isinstance(field_values, list):
                        non_null = sum(1 for v in field_values if v is not None)
                        null_count = len(field_values) - non_null
                        result["fields"].append(field_name)
                        result["null_counts"][field_name] = null_count
                        print(f"  {field_name}: {len(field_values)} values, {null_count} nulls")
                        if field_values:
                            print(f"    Sample: {field_values[:3]}")

        # Latitude/Longitude
        if "latitude" in data and "longitude" in data:
            lat = data["latitude"]
            lon = data["longitude"]
            result["lat_lon"] = {"latitude": lat, "longitude": lon}
            print(f"\nLocation: lat={lat}, lon={lon}")

        # Timezone info
        tz_keys = ["timezone", "timezone_abbreviation", "utc_offset_seconds"]
        tz_info = {k: data.get(k) for k in tz_keys if k in data}
        if tz_info:
            result["timezone_info"] = tz_info
            print(f"\nTimezone info: {tz_info}")

        # Elevation
        if "elevation" in data:
            print(f"Elevation: {data['elevation']}")

        # Hourly units
        if "hourly_units" in data:
            print(f"\nHourly units: {data['hourly_units']}")

        if result["status"] == "UNKNOWN":
            if result["record_count"] > 0:
                print("\n>>> DATA STATUS: VALID")
                result["status"] = "VALID"
            else:
                print("\n>>> DATA STATUS: UNKNOWN (no hourly data found)")
                result["status"] = "UNKNOWN"

    elif isinstance(data, list):
        print("List length:", len(data))
        result["record_count"] = len(data)
        if data:
            print("\nFirst item:")
            print(data[0])
            if isinstance(data[0], dict):
                result["fields"] = list(data[0].keys())

    print("=" * 80)
    return result


def main():
    files = [
        Path("data/raw/cwc/cwc_observations.json"),
        Path("data/raw/open-meteo/open_meteo_hourly.json"),
    ]

    results = []
    for file in files:
        result = inspect_json(file)
        results.append(result)

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    for r in results:
        print(f"\nFile: {r['file']}")
        print(f"  Status: {r['status']}")
        print(f"  Records: {r['record_count']}")
        print(f"  Fields: {r['fields']}")
        print(f"  Time range: {r['timestamp_range']}")
        print(f"  Location: {r['lat_lon']}")
        print(f"  Timezone: {r['timezone_info']}")
        print(f"  Null counts: {r['null_counts']}")


if __name__ == "__main__":
    main()