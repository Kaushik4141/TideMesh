import hashlib
import json
import logging
import math
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

from rasterio.warp import transform_geom

from app.config import settings
from app.schemas.prediction import NormalizedFloodPrediction
from app.schemas.sfincs import SFINCSOutputsCatalog
from app.adapters.sfincs.parser import SFINCSOutputParser
from app.adapters.sfincs.adapter import SFINCSAdapter
from app.adapters.sfincs.integration import OUTPUTS, read_config, write_forcing, normalize_extraction

logger = logging.getLogger(__name__)
EVENT_ID = re.compile(r"^[A-Za-z0-9_-]{1,100}$")
ALIASES = {"latest", "live", "default"}


class RunConflictError(ValueError):
    pass


def validate_event_id(event_id: str) -> str:
    if not isinstance(event_id, str) or not EVENT_ID.fullmatch(event_id) or event_id.lower() in ALIASES:
        raise ValueError("An immutable simulation event ID is required")
    return event_id


def write_json(path: Path, data: dict) -> None:
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, indent=2, allow_nan=False))
    temporary.replace(path)


def solver_revision(run_dir: Path) -> Optional[str]:
    log = run_dir / "sfincs.log"
    if not log.is_file() or log.is_symlink():
        return None
    match = re.search(r"Build-Revision:\s*\$Rev:\s*([^\r\n]+)", log.read_text(errors="replace"))
    return match.group(1).strip() if match else None


class SimulationService:
    def __init__(self):
        self.parser = SFINCSOutputParser(base_outputs_dir=settings.outputs_dir)
        self.adapter = SFINCSAdapter(parser=self.parser)

    def _directories(self):
        """Never include the mutable latest mirror as an immutable event source."""
        candidates = [settings.outputs_dir, settings.sfincs_baseline_dir]
        runs = settings.repo_root / "simulations" / "runs"
        if runs.is_dir() and not runs.is_symlink():
            candidates.extend(path / "outputs" for path in sorted(runs.iterdir())
                              if path.is_dir() and not path.is_symlink())
        seen = set()
        for path in candidates:
            if not path.is_dir() or path.is_symlink() or path.resolve() in seen:
                continue
            seen.add(path.resolve())
            yield path

    def _manifest(self, directory: Path) -> Optional[dict]:
        path = directory.parent / "run_manifest.json"
        if not path.exists():
            return None
        if path.is_symlink():
            raise ValueError("Invalid run manifest")
        manifest = json.loads(path.read_text())
        if not isinstance(manifest, dict):
            raise ValueError("Invalid run manifest")
        if manifest.get("status") != "completed":
            raise FileNotFoundError("Simulation has not completed successfully")
        return manifest

    def _completed(self, directory: Path):
        metadata_path = directory / "metadata.json"
        if not metadata_path.is_file() or metadata_path.is_symlink():
            raise FileNotFoundError("Simulation metadata is missing")
        metadata = self.parser.parse_metadata(directory)
        validate_event_id(metadata.simulation_id)
        manifest = self._manifest(directory)
        if directory.parent.parent == settings.repo_root / "simulations" / "runs":
            if directory.parent.name != metadata.simulation_id:
                raise ValueError("Run directory and metadata event IDs do not match")
        if manifest and manifest.get("runId") != metadata.simulation_id:
            raise ValueError("Run manifest and metadata event IDs do not match")
        if manifest:
            if (not manifest.get("generatedAt") or manifest.get("simulationStart") != metadata.start_time
                    or manifest.get("simulationEnd") != metadata.end_time):
                raise ValueError("Run manifest execution provenance does not match metadata")
            for name in ("sfincs.inp", "sfincs.precip", "sfincs.bzs", "sfincs.bnd"):
                path = directory.parent / name
                if (not path.is_file() or path.is_symlink()
                        or hashlib.sha256(path.read_bytes()).hexdigest() != manifest.get("forcingHashes", {}).get(name)):
                    raise ValueError("Completed simulation forcing was modified")
        for name in OUTPUTS:
            path = directory / name
            # Older zero-inundation extraction legitimately omits the vector file.
            if name == "flood_extent.geojson" and not path.exists() and metadata.flooded_area_km2 == 0:
                continue
            if not path.is_file() or path.is_symlink() or path.stat().st_size == 0:
                raise FileNotFoundError("Simulation artifacts are incomplete")
            if manifest:
                expected = manifest.get("artifactHashes", {}).get(name)
                if not expected or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
                    raise ValueError("Completed simulation artifacts were modified")
        return metadata, manifest

    def _resolve(self, event_id: str) -> Path:
        validate_event_id(event_id)
        matches = []
        for directory in self._directories():
            try:
                metadata, _ = self._completed(directory)
            except (ValueError, OSError, KeyError):
                continue
            if metadata.simulation_id == event_id:
                matches.append(directory)
        if len(matches) > 1:
            raise RunConflictError("Simulation event ID is ambiguous")
        if not matches:
            raise FileNotFoundError("Simulation event was not found or is incomplete")
        return matches[0]

    def list_simulations(self) -> list[dict[str, Any]]:
        events, duplicates = {}, set()
        for directory in self._directories():
            try:
                metadata, _ = self._completed(directory)
            except (ValueError, OSError, KeyError):
                continue
            if metadata.simulation_id in events:
                duplicates.add(metadata.simulation_id)
            events[metadata.simulation_id] = {
                "eventId": metadata.simulation_id,
                "name": metadata.event_name or metadata.simulation_id,
                "location": metadata.location,
                "startTime": metadata.start_time,
                "endTime": metadata.end_time,
                "maxDepthM": metadata.max_depth_m,
                "floodedAreaKm2": metadata.flooded_area_km2,
                "model": f"{metadata.model} {metadata.model_version}",
                "status": "ready",
            }
        return [event for key, event in events.items() if key not in duplicates]

    def _extent(self, directory: Path) -> dict:
        extent = self.parser.parse_flood_extent_geojson(directory)
        if extent is None:
            if self.parser.parse_metadata(directory).flooded_area_km2 == 0:
                return {"type": "FeatureCollection", "features": []}
            raise FileNotFoundError("Flood extent is missing")
        # Explicit GeoJSON CRS takes precedence over the raster CRS in metadata.
        crs = extent.get("crs", {}).get("properties", {}).get("name", "EPSG:4326")
        wgs84 = crs in ("EPSG:4326", "urn:ogc:def:crs:OGC:1.3:CRS84",
                        "urn:ogc:def:crs:EPSG::4326")
        features = extent.get("features")
        if extent.get("type") != "FeatureCollection" or not isinstance(features, list):
            raise ValueError("Flood extent must be a FeatureCollection")
        normalized = []
        for feature in features:
            geometry = feature.get("geometry")
            if not geometry or geometry.get("type") not in ("Polygon", "MultiPolygon"):
                raise ValueError("Flood extent contains non-polygon geometry")
            if not wgs84:
                geometry = transform_geom(crs, "EPSG:4326", geometry)
            def check_coordinates(coords):
                if coords and isinstance(coords[0], (float, int)):
                    if len(coords) < 2 or not all(math.isfinite(v) for v in coords):
                        raise ValueError("Invalid flood coordinates")
                    if not -180 <= coords[0] <= 180 or not -90 <= coords[1] <= 90:
                        raise ValueError("Flood extent is not WGS84")
                else:
                    for child in coords:
                        check_coordinates(child)
            check_coordinates(geometry["coordinates"])
            normalized.append({"type": "Feature", "properties": feature.get("properties") or {},
                               "geometry": geometry})
        return {"type": "FeatureCollection", "features": normalized}

    def get_forecast(self, event_id: str, zone_id: str = "zone-mangaluru-coastal") -> NormalizedFloodPrediction:
        directory = self._resolve(event_id)
        return self.adapter.normalize(self.parser.parse_metadata(directory), self._extent(directory), zone_id)

    def get_flood_extent(self, event_id: str) -> dict:
        return self._extent(self._resolve(event_id))

    def get_catalog(self, event_id: str) -> SFINCSOutputsCatalog:
        return self.parser.catalog_outputs(self._resolve(event_id))

    def get_run(self, event_id: str) -> dict:
        directory = self._resolve(event_id)
        metadata, manifest = self._completed(directory)
        raw_metadata = json.loads((directory / "metadata.json").read_text())
        extent = self._extent(directory)
        notes = ["Model version is reported by the extraction artifact, not independently verified.",
                 "P1 onset/peak-time rasters are estimates, not extracted solver time series.",
                 "Demo-template terrain provenance and calibration are not independently validated; its generator constructs synthetic terrain.",
                 "Flood extent is the wet-cell threshold footprint; permanent waterways are not separated from land inundation."]
        revision = solver_revision(directory.parent) if manifest else None
        if revision:
            notes[0] = f"Solver software revision read from this run's sfincs.log: {revision}. This does not establish scientific calibration."
        if manifest:
            inputs = manifest["inputs"]
            rainfall = manifest["rainfallSeries"]
            levels = manifest["waterLevelSeries"]
            generated_at = manifest["generatedAt"]
            notes.extend(manifest.get("qualityNotes", []))
        else:
            inputs = rainfall = levels = generated_at = None
            notes.append("Legacy artifacts have no verified execution/forcing association; inputs and generatedAt are unknown.")
        if not extent["features"]:
            notes.append("No cells meet the inundation threshold; flood geometry is empty.")
        return {
            "runId": metadata.simulation_id,
            "generatedAt": generated_at,
            "simulationStart": metadata.start_time,
            "simulationEnd": metadata.end_time,
            "modelVersion": f"SFINCS-{revision}" if revision else f"{raw_metadata['model']}-{raw_metadata['model_version']}"
                            if raw_metadata.get("model") and raw_metadata.get("model_version") else None,
            "inputs": inputs,
            "rainfallSeries": rainfall,
            "waterLevelSeries": levels,
            "artifactIds": [f"{metadata.simulation_id}/{name}" for name in OUTPUTS
                            if (directory / name).is_file()] + (
                                [f"{metadata.simulation_id}/inputs/{name}" for name in
                                 ("sfincs.inp", "sfincs.precip", "sfincs.bzs", "sfincs.bnd")]
                                + [f"{metadata.simulation_id}/run_manifest.json"] if manifest else []),
            "floodGeometry": self.parser.extract_primary_geometry(extent) if extent["features"] else {
                "type": "Polygon", "coordinates": []
            },  # Verified dry output is an empty polygon, not missing geometry.
            "maximumDepthM": metadata.max_depth_m,
            "gridResolutionM": metadata.grid_resolution_m if raw_metadata.get("grid_resolution_m") is not None else None,
            "floodThresholdM": metadata.flood_threshold_m if raw_metadata.get("flood_threshold_m") is not None else None,
            "qualityNotes": notes,
        }

    def _publish_latest(self, output_dir: Path) -> None:
        root = settings.repo_root / "simulations"
        stage, backup = root / f".latest-{uuid4().hex}", root / f".previous-{uuid4().hex}"
        latest = root / "latest"
        try:
            shutil.copytree(output_dir, stage)
            if latest.exists():
                latest.rename(backup)
            try:
                stage.rename(latest)
            except OSError:
                if backup.exists():
                    backup.rename(latest)
                raise
            if backup.exists():
                shutil.rmtree(backup)
        finally:
            if stage.exists():
                shutil.rmtree(stage)

    def run_simulation(self, event_id: Optional[str] = None,
                       zone_id: str = "zone-mangaluru-coastal",
                       rainfall_rate_mm_hr: Optional[float] = None,
                       rainfall_series: Optional[list[float]] = None,
                       surge_level_m: Optional[float] = 1.5,
                       duration_hours: int = 6,
                       scenario_name: Optional[str] = None) -> NormalizedFloodPrediction:
        if event_id is not None:
            validate_event_id(event_id)
            if (settings.repo_root / "simulations" / "runs" / event_id).exists():
                raise RunConflictError("Simulation event IDs cannot be overwritten")
            raise ValueError("Custom event IDs are unsupported; the runner assigns a unique UUID")
        if isinstance(duration_hours, bool) or not isinstance(duration_hours, int) or not 1 <= duration_hours <= 12:
            raise ValueError("durationHours must be an integer between 1 and 12")
        def number(value, low, high):
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
                raise ValueError("Simulation forcing is outside supported bounds")
            return float(value)
        rate = number(65.0 if rainfall_rate_mm_hr is None else rainfall_rate_mm_hr, 0, 300)
        surge = number(1.5 if surge_level_m is None else surge_level_m, 0, 5)
        if rainfall_series is not None:
            if not isinstance(rainfall_series, list) or len(rainfall_series) != duration_hours + 1:
                raise ValueError("rainfallSeries must contain durationHours + 1 hourly samples")
            rates = [round(number(value, 0, 300), 8) for value in rainfall_series]
        else:
            profile = [0.2, 0.5, 1.0, 0.8, 0.4, 0.2, 0.05]
            rates = [round(rate * profile[min(i, 6)], 8) for i in range(duration_hours + 1)]
        # Preserve the original forcing nodes; P3 changes format and association only.
        profile = [0.30, 0.80, 1.30, surge, 1.40, 0.90, 0.40]
        levels = [round(profile[min(i, 6)], 8) for i in range(duration_hours + 1)]
        now = datetime.now(timezone.utc)
        start = now.replace(minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=duration_hours)
        sim_id = f"sim-{uuid4()}"
        run_dir = settings.repo_root / "simulations" / "runs" / sim_id
        run_dir.parent.mkdir(parents=True, exist_ok=True)
        if run_dir.parent.is_symlink():
            raise ValueError("Invalid simulation run directory")
        run_dir.mkdir(exist_ok=False)
        manifest_path = run_dir / "run_manifest.json"
        manifest = {
            "schemaVersion": 1, "runId": sim_id, "status": "running",
            "requestedAt": now.isoformat(), "generatedAt": None,
            "simulationStart": start.isoformat(), "simulationEnd": end.isoformat(),
            "inputs": {"rainfallRateMmHr": rate, "surgeLevelM": surge, "durationHours": duration_hours}
                      if rainfall_series is None else None,
            "rainfallSeries": rates, "waterLevelSeries": levels,
            "artifacts": [f"{sim_id}/{name}" for name in OUTPUTS], "artifactHashes": {},
            "qualityNotes": ["Forcing series are hourly samples at seconds since simulationStart.",
                             "The original rainfall and water-level forcing profiles are preserved; durations beyond six hours extend the last sample.",
                             "surgeLevelM specifies the water-level sample at +3h; it is not additive surge or a guaranteed actual peak. Short-duration runs may not reach this sample.",
                             "P3 corrected P1 artifact origin and row orientation to the unchanged template grid."],
        }
        if duration_hours < 3:
            manifest["qualityNotes"].append(
                "This run ends before +3h, so surgeLevelM is not present in the applied water-level forcing.")
        write_json(manifest_path, manifest)
        try:
            template = settings.repo_root / "simulations" / "mangaluru_demo"
            if not template.is_dir():
                template = settings.repo_root / "ml" / "sfincs" / "mangaluru" / "simulations" / "historical"
            config = read_config(template / "sfincs.inp")
            if (int(config["epsg"]) == 32643 and float(config["x0"]) == 698000
                    and float(config["y0"]) == 1422000):
                manifest["qualityNotes"].append(
                    "Known template geographic mismatch: EPSG:32643 origin (698000, 1422000) is near 76.82E, unlike Mangaluru near 74.85E. The template is unchanged; calibration and infrastructure coverage are not verified.")
            if int(config["nmax"]) != 100 or int(config["mmax"]) != 100:
                raise RuntimeError("P1 extraction supports only the existing 100x100 template")
            for name in ("sfincs.dep", "sfincs.msk", "sfincs.ind"):
                shutil.copy2(template / name, run_dir / name)
            config.update(tref=start.strftime("%Y%m%d %H%M%S"),
                          tstart=start.strftime("%Y%m%d %H%M%S"),
                          tstop=end.strftime("%Y%m%d %H%M%S"))
            write_forcing(run_dir, config, rates, levels)
            manifest["forcingHashes"] = {name: hashlib.sha256((run_dir / name).read_bytes()).hexdigest()
                                         for name in ("sfincs.inp", "sfincs.precip", "sfincs.bzs", "sfincs.bnd")}
            write_json(manifest_path, manifest)
            with (run_dir / "docker_stdout.log").open("w") as stdout, (run_dir / "docker_stderr.log").open("w") as stderr:
                result = subprocess.run(["docker", "run", "--rm", "-v", f"{run_dir.resolve()}:/data",
                                         "-w", "/data", "deltares/sfincs-cpu"],
                                        stdout=stdout, stderr=stderr, timeout=180)
            if result.returncode != 0:
                raise RuntimeError("SFINCS solver execution failed")
            # Nothing from the template's previous runs is copied; missing raw output cannot be reused.
            if not (run_dir / "zsmax.dat").is_file() or (run_dir / "zsmax.dat").stat().st_size == 0:
                raise RuntimeError("SFINCS solver did not produce peak water levels")
            output_dir = run_dir / "outputs"
            output_dir.mkdir(exist_ok=False)
            script = settings.repo_root / "ml" / "sfincs" / "mangaluru" / "scripts" / "extract_outputs.py"
            with (run_dir / "extraction_stdout.log").open("w") as stdout, (run_dir / "extraction_stderr.log").open("w") as stderr:
                result = subprocess.run([sys.executable, str(script), "--sim-dir", str(run_dir),
                                         "--output-dir", str(output_dir), "--threshold", "0.10"],
                                        stdout=stdout, stderr=stderr, timeout=60)
            if result.returncode != 0:
                raise RuntimeError("SFINCS output extraction failed")
            metadata = normalize_extraction(output_dir, config)
            metadata.update(simulation_id=sim_id, event_name=scenario_name or f"Hydrodynamic Run {sim_id}",
                            model_version=solver_revision(run_dir) or metadata.get("model_version"),
                            start_time=start.isoformat(), end_time=end.isoformat(),
                            forcing={"rainfall_source": f"Prescribed rain profile (max {max(rates):.8f} mm/hr)",
                                     "tide_source": f"Prescribed water level profile (max {max(levels):.8f} m)"})
            write_json(output_dir / "metadata.json", metadata)
            prediction = self.adapter.normalize(self.parser.parse_metadata(output_dir), self._extent(output_dir), zone_id)
            manifest.update(status="completed", generatedAt=datetime.now(timezone.utc).isoformat(),
                             artifacts=[f"{sim_id}/{name}" for name in OUTPUTS],
                             solverVersion=solver_revision(run_dir),
                             artifactHashes={name: hashlib.sha256((output_dir / name).read_bytes()).hexdigest()
                                            for name in OUTPUTS})
            write_json(manifest_path, manifest)
        except Exception:
            manifest.update(status="failed", generatedAt=None, failureReason="Simulation execution or output validation failed")
            write_json(manifest_path, manifest)
            logger.exception("Simulation %s failed", sim_id)
            raise RuntimeError("Simulation execution or output validation failed") from None
        try:
            self._publish_latest(output_dir)
        except OSError:
            logger.exception("Latest mirror update failed for completed run %s", sim_id)
        return prediction


simulation_service = SimulationService()
