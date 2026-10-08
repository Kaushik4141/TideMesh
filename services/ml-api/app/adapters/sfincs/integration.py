"""P3 integration fixes; the P1 solver template and extractor remain unchanged."""
import json
import math
from pathlib import Path

import numpy as np
import rasterio
from affine import Affine
from rasterio.features import shapes
from rasterio.warp import transform_geom

RASTERS = ("peak_depth.tif", "flood_depth.tif", "onset_time.tif", "peak_time.tif")
OUTPUTS = ("metadata.json", "flood_extent.geojson", *RASTERS)


def read_config(path: Path) -> dict:
    return {
        key.strip().lower(): value.split("#", 1)[0].strip()
        for line in path.read_text().splitlines() if "=" in line
        for key, value in [line.split("=", 1)]
    }


def grid_transform(config: dict) -> Affine:
    # SFINCS origin is the lower-left cell edge. Raster rows run north to south.
    angle = math.radians(float(config.get("rotation", 0)))
    cosine, sine = math.cos(angle), math.sin(angle)
    dx, dy = float(config["dx"]), float(config["dy"])
    height = int(config["nmax"]) * dy
    return Affine(dx * cosine, dy * sine, float(config["x0"]) - height * sine,
                  dx * sine, -dy * cosine, float(config["y0"]) + height * cosine)


def write_forcing(run_dir: Path, config: dict, rates: list, levels: list) -> None:
    """Official ASCII format: seconds since tref, rain mm/hr, boundary levels m.

    https://sfincs.readthedocs.io/en/latest/input_forcing.html
    Boundary points use existing msk=2 cells; no changes to model/grid parameters.
    """
    indices = np.fromfile(run_dir / "sfincs.ind", dtype="<u4")
    mask = np.fromfile(run_dir / "sfincs.msk", dtype="u1")
    count = int(config["mmax"]) * int(config["nmax"])
    if (not indices.size or indices[0] != len(mask) or len(indices) != len(mask) + 1
            or np.any(indices[1:] < 1) or np.any(indices[1:] > count)
            or len(np.unique(indices[1:])) != len(mask)):
        raise RuntimeError("Unsupported SFINCS binary grid indexing")
    boundary = indices[1:][mask == 2].astype(int) - 1
    if len(boundary) < 2:
        raise RuntimeError("Template needs at least two water-level boundary cells")
    angle = math.radians(float(config.get("rotation", 0)))
    cosine, sine = math.cos(angle), math.sin(angle)
    points = []
    for i in boundary:
        x = (i // int(config["nmax"]) + 0.5) * float(config["dx"])
        y = (i % int(config["nmax"]) + 0.5) * float(config["dy"])
        points.append((float(config["x0"]) + x * cosine - y * sine,
                       float(config["y0"]) + x * sine + y * cosine))
    (run_dir / "sfincs.bnd").write_text("".join(f"{x:.8f} {y:.8f}\n" for x, y in points))
    (run_dir / "sfincs.precip").write_text(
        "".join(f"{i * 3600} {rate:.8f}\n" for i, rate in enumerate(rates)))
    (run_dir / "sfincs.bzs").write_text(
        "".join(f"{i * 3600} " + " ".join([f"{level:.8f}"] * len(points)) + "\n"
                for i, level in enumerate(levels)))
    config.update(precipfile="sfincs.precip", bndfile="sfincs.bnd", bzsfile="sfincs.bzs")
    (run_dir / "sfincs.inp").write_text(
        "".join(f"{key:<21}= {value}\n" for key, value in config.items()))


def normalize_extraction(output_dir: Path, config: dict, threshold: float = 0.1) -> dict:
    """Validate fresh P1 products, correct origin and bottom-up array orientation.

    The extractor assumes 100x100 and writes lower-left-first rows as north-up.
    Rebuild the vector from corrected depth, including an honest empty collection.
    """
    for name in ("metadata.json", *RASTERS):
        path = output_dir / name
        if not path.is_file() or path.is_symlink() or path.stat().st_size == 0:
            raise RuntimeError("SFINCS extraction did not produce all required artifacts")
    metadata = json.loads((output_dir / "metadata.json").read_text())
    transform = grid_transform(config)
    crs = f"EPSG:{int(config['epsg'])}"
    for name in RASTERS:
        with rasterio.open(output_dir / name, "r+") as raster:
            if raster.shape != (int(config["nmax"]), int(config["mmax"])):
                raise RuntimeError("Extraction raster does not match the solver grid")
            values = raster.read(1)
            if not np.all(np.isfinite(values)):
                raise RuntimeError("Extraction produced non-finite raster values")
            raster.write(np.flipud(values), 1)
            raster.transform = transform
            raster.crs = crs
    with rasterio.open(output_dir / "peak_depth.tif") as raster:
        depth = raster.read(1)
    if np.any(depth < 0):
        raise RuntimeError("Extraction produced negative flood depth")
    flooded = depth >= threshold
    vector = output_dir / "flood_extent.geojson"
    if vector.is_symlink():
        raise RuntimeError("Invalid extracted vector artifact")
    if np.any(flooded) and not vector.is_file():
        raise RuntimeError("SFINCS extraction omitted nonempty flood extent")
    features = [
        {"type": "Feature", "properties": {},
         "geometry": transform_geom(crs, "EPSG:4326", geom)}
        for geom, value in shapes(flooded.astype("uint8"), transform=transform) if value == 1
    ]
    (output_dir / "flood_extent.geojson").write_text(json.dumps(
        {"type": "FeatureCollection", "features": features}, allow_nan=False))
    metadata.update(
        crs=crs, grid_resolution_m=float(config["dx"]),
        max_depth_m=float(depth.max()),
        mean_flooded_depth_m=float(depth[flooded].mean()) if np.any(flooded) else 0.0,
        flooded_area_km2=float(flooded.sum() * abs(transform.determinant) / 1e6),
        flood_threshold_m=threshold,
    )
    return metadata
