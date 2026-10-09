#!/usr/bin/env python3
"""Validate real-input readiness for the Mangaluru SFINCS domain.

This command only reads local files and writes the requested JSON report.  It
does not download data, invoke SFINCS, invoke Docker, or use generated model
terrain as a real DEM.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

try:  # package import when used by a caller
    from .provenance import (
        iso_timestamp,
        load_manifest,
        manifest_entry,
        provenance_result,
        resolve_manifest_path,
    )
except ImportError:  # direct ``python scripts/validate_inputs.py`` use
    from provenance import iso_timestamp, load_manifest, manifest_entry, provenance_result, resolve_manifest_path


DOMAIN_BOUNDS_UTM43N = (483000.0, 1421000.0, 488000.0, 1426000.0)
DOMAIN_BOUNDS_WGS84 = (74.8430, 12.8530, 74.8890, 12.8980)
REQUIRED_INPUTS = ("dem", "rainfall", "tide", "river", "flood_extent")


def _finite(value: Any) -> bool:
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError):
        return False


def _header(headers: Iterable[str], names: set[str]) -> str | None:
    normalized = {str(name).strip().lower(): name for name in headers}
    for name in names:
        if name in normalized:
            return normalized[name]
    return None


def _parse_record_rows(rows: list[dict[str, Any]], value_names: set[str]) -> dict[str, Any]:
    if not rows:
        raise ValueError("time series contains no records")
    time_key = _header(rows[0].keys(), {"timestamp", "time", "datetime", "date", "timestamp_utc"})
    value_key = _header(rows[0].keys(), value_names)
    if not time_key or not value_key:
        raise ValueError(f"time series requires timestamp and one of {sorted(value_names)}")
    timestamps: list[str] = []
    values: list[float] = []
    for index, row in enumerate(rows, 1):
        try:
            timestamp = iso_timestamp(row[time_key])
        except (KeyError, ValueError) as exc:
            raise ValueError(f"row {index}: {exc}") from None
        if not _finite(row.get(value_key)):
            raise ValueError(f"row {index}: value is not finite")
        timestamps.append(timestamp)
        values.append(float(row[value_key]))
    if len(set(timestamps)) != len(timestamps):
        raise ValueError("time series contains duplicate timestamps")
    if timestamps != sorted(timestamps):
        raise ValueError("time series timestamps must be monotonically increasing")
    return {
        "records": len(rows),
        "timestamp_coverage": {"start": timestamps[0], "end": timestamps[-1]},
        "value_range": {"min": min(values), "max": max(values)},
    }


def _json_time_rows(data: Any, value_names: set[str]) -> list[dict[str, Any]]:
    if isinstance(data, list):
        if not all(isinstance(item, dict) for item in data):
            raise ValueError("JSON time series list must contain objects")
        return data
    if isinstance(data, dict) and isinstance(data.get("hourly"), dict):
        hourly = data["hourly"]
        times = hourly.get("time")
        value_key = next((name for name in value_names if name in hourly), None)
        if not isinstance(times, list) or not value_key or not isinstance(hourly[value_key], list):
            raise ValueError("hourly JSON requires time and a same-length value array")
        if len(times) != len(hourly[value_key]):
            raise ValueError("hourly JSON time/value arrays differ in length")
        return [{"timestamp": timestamp, value_key: value} for timestamp, value in zip(times, hourly[value_key])]
    if isinstance(data, dict) and isinstance(data.get("records"), list):
        return _json_time_rows(data["records"], value_names)
    raise ValueError("JSON time series must be a record list or an hourly object")


def load_time_series(path: str | Path, kind: str) -> tuple[list[tuple[str, float]], dict[str, Any]]:
    """Strictly load and validate a rainfall or tide CSV/JSON file.

    Returns canonical UTC timestamps and numeric values plus summary metadata.
    No missing-file fallback, zero-filling, or synthetic values are allowed.
    """

    path = Path(path)
    value_names = {
        "rainfall": {"rainfall", "precipitation", "precipitation_mm", "rain_mm", "value"},
        "tide": {"tide", "water_level", "water_level_m", "sea_level_height_msl", "level", "elevation", "value"},
        "river": {"water_level", "water_level_m", "stage", "stage_m", "discharge", "flow", "value"},
    }.get(kind)
    if value_names is None:
        raise ValueError(f"unsupported time series kind: {kind}")
    if path.suffix.lower() == ".csv":
        with path.open("r", encoding="utf-8", newline="") as stream:
            rows = list(csv.DictReader(stream))
        metadata = _parse_record_rows(rows, value_names)
    elif path.suffix.lower() == ".json":
        with path.open("r", encoding="utf-8") as stream:
            rows = _json_time_rows(json.load(stream), value_names)
        metadata = _parse_record_rows(rows, value_names)
    else:
        raise ValueError("time series input must be .csv or .json")
    time_key = _header(rows[0].keys(), {"timestamp", "time", "datetime", "date", "timestamp_utc"})
    value_key = _header(rows[0].keys(), value_names)
    assert time_key and value_key
    records = [(iso_timestamp(row[time_key]), float(row[value_key])) for row in rows]
    return records, metadata


def validate_time_series(path: str | Path, kind: str) -> dict[str, Any]:
    """Strictly validate a rainfall or tide CSV/JSON file."""

    _, metadata = load_time_series(path, kind)
    return metadata


def _geojson_bbox(data: Any) -> tuple[float, float, float, float]:
    coordinates: list[tuple[float, float]] = []

    def visit(value: Any) -> None:
        if isinstance(value, (list, tuple)) and len(value) >= 2 and all(_finite(v) for v in value[:2]):
            coordinates.append((float(value[0]), float(value[1])))
            return
        if isinstance(value, (list, tuple)):
            for child in value:
                visit(child)

    if data.get("type") == "FeatureCollection":
        for feature in data.get("features", []):
            visit(feature.get("geometry", {}).get("coordinates", []))
    elif data.get("type") == "Feature":
        visit(data.get("geometry", {}).get("coordinates", []))
    else:
        visit(data.get("coordinates", []))
    if not coordinates:
        raise ValueError("GeoJSON contains no coordinate geometry")
    xs, ys = zip(*coordinates)
    return min(xs), min(ys), max(xs), max(ys)


def validate_flood_extent(path: str | Path) -> dict[str, Any]:
    path = Path(path)
    with path.open("r", encoding="utf-8") as stream:
        data = json.load(stream)
    bbox = _geojson_bbox(data)
    intersects = not (
        bbox[2] < DOMAIN_BOUNDS_WGS84[0]
        or bbox[0] > DOMAIN_BOUNDS_WGS84[2]
        or bbox[3] < DOMAIN_BOUNDS_WGS84[1]
        or bbox[1] > DOMAIN_BOUNDS_WGS84[3]
    )
    if not intersects:
        raise ValueError("observed flood extent does not intersect the Mangaluru domain")
    crs = "EPSG:4326"
    crs_data = data.get("crs", {})
    name = crs_data.get("properties", {}).get("name") if isinstance(crs_data, dict) else None
    if name and "3857" in str(name):
        raise ValueError("flood extent CRS EPSG:3857 is not accepted without an explicit reprojection")
    if name and not any(token in str(name).upper() for token in ("4326", "CRS84", "WGS84")):
        raise ValueError(f"unsupported flood extent CRS: {name}")
    return {"crs": crs, "bounds": bbox, "features": len(data.get("features", [])) if isinstance(data, dict) else 1}


def validate_dem_metadata(path: str | Path) -> dict[str, Any]:
    """Inspect a GeoTIFF, requiring rasterio only for this DEM-specific step."""

    try:
        import numpy as np
        import rasterio
        from rasterio.windows import from_bounds
        from rasterio.warp import transform_bounds
    except ImportError as exc:
        raise RuntimeError("DEM validation requires rasterio and numpy; install ml/sfincs/mangaluru/requirements.txt") from exc
    with rasterio.open(path) as dataset:
        if dataset.crs is None:
            raise ValueError("DEM has no CRS")
        # Validate the cells covering the actual model domain rather than the
        # whole source tile. Coastal terrain tiles may legitimately contain
        # offshore bathymetry outside the 5 km land/estuary domain.
        if dataset.crs.to_string().upper() in {"EPSG:4326", "OGC:CRS84"}:
            window = from_bounds(*DOMAIN_BOUNDS_WGS84, transform=dataset.transform)
        else:
            window = None
        values = dataset.read(1, window=window, masked=True)
        valid = np.asarray(values.compressed() if np.ma.isMaskedArray(values) else values).astype(float)
        if valid.size == 0 or not np.isfinite(valid).all():
            raise ValueError("DEM has no finite elevation cells")
        low, high = float(valid.min()), float(valid.max())
        if low < -500 or high > 10000:
            raise ValueError(f"DEM elevation range is implausible: {low:g} to {high:g} m")
        bounds = transform_bounds(dataset.crs, "EPSG:32643", *dataset.bounds)
        intersects = not (bounds[2] < DOMAIN_BOUNDS_UTM43N[0] or bounds[0] > DOMAIN_BOUNDS_UTM43N[2] or bounds[3] < DOMAIN_BOUNDS_UTM43N[1] or bounds[1] > DOMAIN_BOUNDS_UTM43N[3])
        if not intersects:
            raise ValueError("DEM coverage does not intersect the Mangaluru domain")
        tags = dataset.tags()
        datum = tags.get("vertical_datum") or tags.get("VERTICAL_DATUM") or tags.get("datum")
        return {"crs": dataset.crs.to_string(), "vertical_datum": datum, "bounds": bounds, "elevation_range_m": [low, high], "width": dataset.width, "height": dataset.height}


def _find_path(root: Path, supplied: str | None, candidates: list[str]) -> Path | None:
    if supplied:
        return Path(supplied)
    for candidate in candidates:
        path = root / candidate
        if path.is_file():
            return path
    return None


def _validate_one(name: str, path: Path | None, manifest: dict[str, Any]) -> dict[str, Any]:
    entry = manifest_entry(manifest, name)
    if path is None and entry.get("path"):
        path = resolve_manifest_path(manifest, entry["path"])
    if path is not None and not path.is_absolute():
        path = Path.cwd() / path
    if path is None:
        return provenance_result(path=None, entry=entry, error="input path was not supplied or found")
    error = None
    metadata: dict[str, Any] = {}
    if not path.is_file():
        error = "file does not exist"
    else:
        try:
            if name == "dem":
                metadata = validate_dem_metadata(path)
            elif name in {"rainfall", "tide"}:
                metadata = validate_time_series(path, name)
                metadata["vertical_datum"] = entry.get("vertical_datum")
            elif name == "flood_extent":
                metadata = validate_flood_extent(path)
            elif name == "river":
                metadata = validate_time_series(path, "river")
        except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
            error = str(exc)
    result = provenance_result(path=path, entry=entry, metadata=metadata, error=error)
    if result["status"] == "real" and not error:
        provenance_ok = bool(result["source"] and result["checksum_verified"])
        if name == "dem":
            provenance_ok = provenance_ok and bool(result["crs"] and result["vertical_datum"] and str(result["vertical_datum"]).lower() not in {"unknown", "not provided"})
        elif name == "tide":
            coverage = result["timestamp_coverage"] or {}
            provenance_ok = provenance_ok and bool(coverage.get("start") and coverage.get("end") and result["vertical_datum"])
        elif name == "rainfall":
            coverage = result["timestamp_coverage"] or {}
            provenance_ok = provenance_ok and bool(coverage.get("start") and coverage.get("end"))
        elif name == "flood_extent":
            provenance_ok = provenance_ok and bool(result["crs"])
        result["operationally_valid"] = provenance_ok
    return result


def build_readiness_report(*, root: str | Path = ".", paths: dict[str, str | None] | None = None, manifest_path: str | Path | None = None, operational: bool = False) -> dict[str, Any]:
    root = Path(root).resolve()
    paths = paths or {}
    manifest = load_manifest(manifest_path) if manifest_path else {"version": 1, "inputs": {}}
    candidates = {
        "dem": ["raw/dem/mangaluru_copernicus_dem_30m.tif", "processed/dem/mangaluru_dem_50m_msl.tif"],
        "rainfall": ["raw/rainfall/mangaluru_monsoon_rain_2024.csv", "../../../data-pipeline/data/raw/open-meteo/open_meteo_hourly.json"],
        "tide": ["raw/tide/panambur_tide_2024.csv", "raw/tide/panambur_tide.csv"],
        "river": ["../../../data-pipeline/data/raw/cwc/cwc_observations.json", "raw/observations/river_gauge.csv"],
        "flood_extent": ["raw/observations/mangaluru_2018_flood_extent.geojson"],
    }
    inputs = {}
    for name in REQUIRED_INPUTS:
        supplied = paths.get(name)
        # A manifest path is authoritative when the caller did not explicitly
        # select another local file. This prevents a synthetic manifest entry
        # from being accidentally attached to an unrelated candidate file.
        candidate = Path(supplied) if supplied else None
        if candidate is None and not manifest_entry(manifest, name).get("path"):
            candidate = _find_path(root, None, candidates[name])
        inputs[name] = _validate_one(name, candidate, manifest)
    gates = {name: inputs[name]["operationally_valid"] for name in ("dem", "rainfall", "tide", "flood_extent")}
    return {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "domain": {"crs": "EPSG:32643", "bounds": DOMAIN_BOUNDS_UTM43N, "resolution_m": 50},
        "operational": operational,
        "operational_ready": all(gates.values()),
        "requirements": {"dem_rainfall_tide_and_flood_provenance": gates},
        "inputs": inputs,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate local Mangaluru SFINCS input readiness")
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[1]), help="Mangaluru data root")
    parser.add_argument("--manifest", help="JSON provenance manifest")
    parser.add_argument("--dem")
    parser.add_argument("--rainfall")
    parser.add_argument("--tide")
    parser.add_argument("--river")
    parser.add_argument("--flood-extent")
    parser.add_argument("--output", required=True, help="Caller-supplied JSON report path")
    parser.add_argument("--operational", action="store_true", help="Exit nonzero unless all required real-input gates pass")
    args = parser.parse_args(argv)
    report_path = Path(args.output).resolve()
    supplied_paths = {name: getattr(args, name) for name in ("dem", "rainfall", "tide", "river")}
    supplied_paths["flood_extent"] = args.flood_extent
    try:
        report = build_readiness_report(root=args.root, paths=supplied_paths, manifest_path=args.manifest, operational=args.operational)
        input_paths = {item.get("path") for item in report["inputs"].values() if item.get("path")}
        if str(report_path) in {str(Path(value).resolve()) for value in input_paths}:
            raise ValueError("report output must not overwrite an input file")
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"[readiness] ERROR: {exc}", file=sys.stderr)
        return 2
    ready = report["operational_ready"]
    print(f"[readiness] report: {report_path}")
    print(f"[readiness] operational_ready={ready}")
    return 0 if (ready or not args.operational) else 1


if __name__ == "__main__":
    raise SystemExit(main())
