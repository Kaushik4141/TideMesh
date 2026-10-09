#!/usr/bin/env python3
"""Prepare an explicitly supplied, local DEM for the Mangaluru SFINCS grid.

The old version was a TODO with a Copernicus claim but no input.  This module
does not download data and never falls back to ``model/base`` or any generated
terrain.  The source raster must be supplied by the caller.
"""

from __future__ import annotations

import argparse
from pathlib import Path


DOMAIN_BOUNDS_UTM43N = (483000.0, 1421000.0, 488000.0, 1426000.0)


def prepare_dem(
    raw_dem_path: str,
    output_path: str,
    target_crs: str = "EPSG:32643",
    resolution: float = 50.0,
    domain_bounds: tuple[float, float, float, float] = DOMAIN_BOUNDS_UTM43N,
) -> str:
    """Clip/reproject *raw_dem_path* to the 50 m target domain.

    Coverage is required to intersect the domain (rather than silently
    producing a wholly nodata product).  No vertical datum conversion is
    invented: the source datum is copied to output metadata and must be
    reconciled by a separately documented source/provenance record.
    """

    source = Path(raw_dem_path)
    destination = Path(output_path)
    if not source.is_file():
        raise FileNotFoundError(f"real DEM GeoTIFF not found: {source}")
    if target_crs.upper() != "EPSG:32643":
        raise ValueError("Mangaluru DEM preparation requires target CRS EPSG:32643")
    if resolution <= 0:
        raise ValueError("resolution must be positive")
    try:
        import numpy as np
        import rasterio
        from rasterio.enums import Resampling
        from rasterio.transform import from_origin
        from rasterio.warp import reproject, transform_bounds
    except ImportError as exc:
        raise RuntimeError("DEM preparation requires rasterio and numpy; install requirements.txt") from exc

    xmin, ymin, xmax, ymax = map(float, domain_bounds)
    if not (xmin < xmax and ymin < ymax):
        raise ValueError("domain bounds must be xmin, ymin, xmax, ymax")
    width = int(round((xmax - xmin) / resolution))
    height = int(round((ymax - ymin) / resolution))
    if width <= 0 or height <= 0:
        raise ValueError("domain is smaller than the requested resolution")
    transform = from_origin(xmin, ymax, resolution, resolution)

    with rasterio.open(source) as src:
        if src.crs is None:
            raise ValueError("input DEM has no CRS; provide a georeferenced GeoTIFF")
        try:
            source_bounds = transform_bounds(src.crs, target_crs, *src.bounds)
        except Exception as exc:
            raise ValueError(f"could not transform DEM bounds to {target_crs}: {exc}") from exc
        intersects = not (
            source_bounds[2] < xmin
            or source_bounds[0] > xmax
            or source_bounds[3] < ymin
            or source_bounds[1] > ymax
        )
        if not intersects:
            raise ValueError(
                "input DEM coverage does not intersect domain "
                f"({xmin:g}, {ymin:g}, {xmax:g}, {ymax:g}) in {target_crs}"
            )

        source_values = src.read(1, masked=True)
        finite = np.asarray(source_values.compressed() if np.ma.isMaskedArray(source_values) else source_values, dtype=float)
        if finite.size == 0 or not np.isfinite(finite).all():
            raise ValueError("input DEM contains no finite elevation values")
        source_min, source_max = float(finite.min()), float(finite.max())
        if source_min < -500.0 or source_max > 10000.0:
            raise ValueError(f"input DEM elevation range is implausible: {source_min:g} to {source_max:g} m")
        source_nodata = src.nodata if src.nodata is not None else -9999.0
        output = np.full((height, width), source_nodata, dtype="float32")
        reproject(
            source=rasterio.band(src, 1),
            destination=output,
            src_transform=src.transform,
            src_crs=src.crs,
            src_nodata=source_nodata,
            dst_transform=transform,
            dst_crs=target_crs,
            dst_nodata=source_nodata,
            resampling=Resampling.bilinear,
        )
        valid_output = output[output != source_nodata]
        if valid_output.size == 0 or not np.isfinite(valid_output).all():
            raise ValueError("reprojected DEM contains no finite cells in the target domain")

        destination.parent.mkdir(parents=True, exist_ok=True)
        tags = src.tags()
        vertical_datum = tags.get("vertical_datum") or tags.get("VERTICAL_DATUM") or tags.get("datum") or "unknown"
        profile = src.profile.copy()
        profile.update(
            driver="GTiff",
            height=height,
            width=width,
            count=1,
            dtype="float32",
            crs=target_crs,
            transform=transform,
            nodata=source_nodata,
            compress="deflate",
        )
        with rasterio.open(destination, "w", **profile) as dst:
            dst.write(output, 1)
            dst.update_tags(
                vertical_datum=vertical_datum,
                source_crs=src.crs.to_string(),
                source_file=str(source.resolve()),
                processing="reprojected and clipped; no vertical datum conversion applied",
                resolution_m=str(resolution),
            )
    return str(destination)


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare a local real DEM for Mangaluru SFINCS")
    parser.add_argument("--input", required=True, help="Explicit local source GeoTIFF")
    parser.add_argument("--output", required=True, help="Output GeoTIFF (EPSG:32643, 50 m)")
    parser.add_argument("--crs", default="EPSG:32643")
    parser.add_argument("--resolution", type=float, default=50.0)
    args = parser.parse_args()
    try:
        output = prepare_dem(args.input, args.output, args.crs, args.resolution)
    except (FileNotFoundError, OSError, RuntimeError, ValueError) as exc:
        parser.error(str(exc))
    print(f"[DEM] wrote validated local DEM: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
