#!/usr/bin/env python3
"""Export only products supported by the SFINCS artifacts on disk.

``zsmax.dat`` is a maximum-only product: it cannot establish onset, peak time, or
intermediate flood frames.  Those products are exported only when a time-varying
NetCDF map is present.  This keeps the catalog honest instead of filling timing
rasters with guessed offsets.
"""

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import shapes
from rasterio.transform import from_origin
import geopandas as gpd
from shapely.geometry import shape


def _iso(value):
    try:
        return datetime.strptime(value, "%Y%m%d %H%M%S").replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    except (TypeError, ValueError):
        return None


def _input_times(sim_dir):
    start = end = None
    inp = Path(sim_dir) / "sfincs.inp"
    if inp.exists():
        for line in inp.read_text().splitlines():
            key, _, value = line.partition("=")
            if key.strip() == "tstart": start = _iso(value.strip())
            if key.strip() == "tstop": end = _iso(value.strip())
    return start, end


def _read_frames(sim_dir, dep, shape_2d):
    """Read an actual SFINCS time map NetCDF, if one exists."""
    try:
        import xarray as xr
    except ImportError:
        return []
    for nc in sorted(Path(sim_dir).glob("*.nc")):
        try:
            ds = xr.open_dataset(nc)
            var = next((ds[name] for name in ds.data_vars if name.lower() in {"zs", "waterlevel", "depth"}), None)
            if var is None or var.ndim < 3:
                ds.close()
                continue
            values = np.asarray(var.values)
            if values.shape[-2:] != shape_2d:
                values = values.reshape((values.shape[0],) + shape_2d)
            frames = []
            times = var.coords.get("time")
            for index, values_at_time in enumerate(values):
                depth = values_at_time if var.name.lower() == "depth" else np.maximum(0.0, values_at_time - dep)
                timestamp = str(times.values[index]) if times is not None else None
                if timestamp and timestamp.endswith(".000000000"):
                    timestamp = timestamp[:-10] + "Z"
                frames.append({"timestamp": timestamp, "maxDepthM": float(np.nanmax(depth)),
                               "depth": depth})
            ds.close()
            return frames
        except Exception:
            continue
    return []


def _write_raster(path, array, transform, epsg):
    with rasterio.open(path, "w", driver="GTiff", height=array.shape[0], width=array.shape[1], count=1,
                       dtype=array.dtype, crs=f"EPSG:{epsg}", transform=transform, nodata=0) as dst:
        dst.write(array, 1)


def extract_outputs(sim_dir="simulations/baseline", output_dir="outputs", depth_threshold=0.10):
    print(f"[Extract] Extracting actual outputs from: {sim_dir}")
    os.makedirs(output_dir, exist_ok=True)
    mmax, nmax, dx, dy, x0, y0, epsg = 100, 100, 50.0, 50.0, 483000.0, 1421000.0, 32643
    dep_file, zsmax_file = Path(sim_dir) / "sfincs.dep", Path(sim_dir) / "zsmax.dat"
    if not dep_file.exists() or not zsmax_file.exists():
        print(f"[!] Missing required maximum output in {sim_dir}")
        return False
    dep = np.fromfile(dep_file, dtype=np.float32)[:mmax * nmax].reshape((mmax, nmax), order="F")
    raw = np.fromfile(zsmax_file, dtype=np.float32)
    if len(raw) == mmax * nmax + 2: raw = raw[1:-1]
    depth_max = np.maximum(0.0, raw[:mmax * nmax].reshape((mmax, nmax), order="F") - dep)
    depth_max[depth_max < 0.02] = 0.0
    transform = from_origin(x0, y0 + mmax * dy, dx, dy)
    _write_raster(Path(output_dir) / "peak_depth.tif", depth_max, transform, epsg)
    _write_raster(Path(output_dir) / "flood_depth.tif", depth_max, transform, epsg)

    frames = _read_frames(sim_dir, dep, depth_max.shape)
    # Timing products and frame catalogs are derived exclusively from actual maps.
    if frames:
        stack = np.stack([frame.pop("depth") for frame in frames])
        onset = np.zeros(depth_max.shape, dtype=np.float32)
        peak_time = np.zeros(depth_max.shape, dtype=np.float32)
        for i, frame in enumerate(frames):
            onset[(onset == 0) & (stack[i] >= 0.05)] = float(i)
        peak_time[np.max(stack, axis=0) >= 0.05] = np.argmax(stack, axis=0)[np.max(stack, axis=0) >= 0.05]
        _write_raster(Path(output_dir) / "onset_time.tif", onset, transform, epsg)
        _write_raster(Path(output_dir) / "peak_time.tif", peak_time, transform, epsg)
        for frame in frames:
            frame["artifactKind"] = "timestep_extent"
            mask = (stack[len([f for f in frames if f is not frame])] >= depth_threshold).astype(np.uint8)
            frame["floodedAreaKm2"] = float(np.sum(mask) * dx * dy / 1e6)
    else:
        # Remove stale timing products from a prior run; they are not valid for this run.
        for name in ("onset_time.tif", "peak_time.tif"):
            try: (Path(output_dir) / name).unlink()
            except FileNotFoundError: pass

    flood_mask = (depth_max >= depth_threshold).astype(np.uint8)
    results = [{"properties": {"depth_m": round(float(np.mean(depth_max[depth_max >= depth_threshold])), 2)}, "geometry": geom}
               for geom, val in shapes(flood_mask, transform=transform) if val == 1]
    if results:
        gdf = gpd.GeoDataFrame(geometry=[shape(r["geometry"]) for r in results], crs=f"EPSG:{epsg}")
        gdf.to_crs(epsg=4326).to_file(Path(output_dir) / "flood_extent.geojson", driver="GeoJSON")
    start, end = _input_times(sim_dir)
    metadata = {
        "model": "SFINCS", "model_version": "unknown", "location": "Mangaluru synthetic terrain domain",
        "simulation_id": Path(sim_dir).name, "start_time": start or "unknown", "end_time": end or "unknown",
        "time_step_minutes": None, "grid_resolution_m": 50, "crs": f"EPSG:{epsg}", "vertical_datum": "unknown",
        "max_depth_m": float(np.max(depth_max)),
        "mean_flooded_depth_m": float(np.mean(depth_max[depth_max >= depth_threshold])) if np.any(depth_max >= depth_threshold) else 0.0,
        "flooded_area_km2": float(np.sum(flood_mask) * dx * dy / 1e6), "flood_threshold_m": depth_threshold,
        "purpose": "scenario", "operational": False, "validation_status": "unvalidated",
        "terrain_source": "synthetic terrain template", "artifact_kind": "time_series" if frames else "maximum_extent",
        "frames": [{k: v for k, v in frame.items() if k != "depth"} for frame in frames],
        "provenance": {"sim_dir": str(Path(sim_dir).resolve()), "timing": "actual NetCDF map time series" if frames else "maximum-only artifact"},
    }
    with open(Path(output_dir) / "metadata.json", "w") as f: json.dump(metadata, f, indent=2)
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sim-dir", default="simulations/baseline")
    parser.add_argument("--output-dir", default="outputs")
    parser.add_argument("--threshold", type=float, default=0.10)
    args = parser.parse_args()
    raise SystemExit(0 if extract_outputs(args.sim_dir, args.output_dir, args.threshold) else 1)
