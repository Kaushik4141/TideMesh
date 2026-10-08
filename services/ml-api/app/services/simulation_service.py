import os
import sys
import shutil
import subprocess
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import settings
from app.schemas.prediction import NormalizedFloodPrediction
from app.schemas.sfincs import SFINCSMetadata, SFINCSOutputsCatalog
from app.adapters.sfincs.parser import SFINCSOutputParser
from app.adapters.sfincs.adapter import SFINCSAdapter

class SimulationService:
    """
    SimulationService orchestrates SFINCS hydrodynamic model runs, caches,
    and normalized intelligence serving for CoastShield.
    """

    def __init__(self):
        self.parser = SFINCSOutputParser(base_outputs_dir=settings.outputs_dir)
        self.adapter = SFINCSAdapter(parser=self.parser)

    def list_simulations(self) -> List[Dict[str, Any]]:
        """
        Returns catalog of available precomputed / historical hydrodynamic simulation events.
        """
        events = []
        # Check standard outputs directory
        try:
            metadata = self.parser.parse_metadata(settings.outputs_dir)
            events.append({
                "eventId": metadata.simulation_id,
                "name": metadata.event_name or "Mangaluru Historical Flood 2018",
                "location": metadata.location,
                "startTime": metadata.start_time,
                "endTime": metadata.end_time,
                "maxDepthM": metadata.max_depth_m,
                "floodedAreaKm2": metadata.flooded_area_km2,
                "model": f"{metadata.model} {metadata.model_version}",
                "status": "ready",
            })
        except Exception:
            pass

        # Check baseline simulations dir if distinct
        if settings.sfincs_baseline_dir.exists() and settings.sfincs_baseline_dir != settings.outputs_dir:
            try:
                meta_base = self.parser.parse_metadata(settings.sfincs_baseline_dir)
                if not any(e["eventId"] == meta_base.simulation_id for e in events):
                    events.append({
                        "eventId": meta_base.simulation_id,
                        "name": meta_base.event_name or "Mangaluru Baseline Event",
                        "location": meta_base.location,
                        "startTime": meta_base.start_time,
                        "endTime": meta_base.end_time,
                        "maxDepthM": meta_base.max_depth_m,
                        "floodedAreaKm2": meta_base.flooded_area_km2,
                        "model": f"{meta_base.model} {meta_base.model_version}",
                        "status": "ready",
                    })
            except Exception:
                pass

        # Ensure canonical historical replay event is always cataloged
        if not any(e["eventId"] == "mangaluru-historical-2018" for e in events):
            events.insert(0, {
                "eventId": "mangaluru-historical-2018",
                "name": "Mangaluru Historical Flood 2018",
                "location": "Mangaluru Coastal / Netravati Estuary Domain",
                "startTime": "2018-05-29T00:00:00Z",
                "endTime": "2018-05-29T06:00:00Z",
                "maxDepthM": 1.0,
                "floodedAreaKm2": 1.075,
                "model": "SFINCS v2.4.2",
                "status": "ready",
            })

        return events

    def get_forecast(
        self,
        event_id: str,
        zone_id: str = "zone-mangaluru-coastal",
    ) -> NormalizedFloodPrediction:
        """
        Retrieves the normalized FloodPrediction for the specified event ID.
        """
        # If requesting historical baseline event, load from baseline outputs
        if event_id in ("mangaluru-historical-2018", "mangaluru-baseline-m2") and settings.sfincs_baseline_dir.exists():
            prediction = self.adapter.load_and_normalize(settings.sfincs_baseline_dir, zone_id=zone_id)
            prediction.eventId = event_id
            return prediction

        # Look in outputs_dir
        try:
            prediction = self.adapter.load_and_normalize(settings.outputs_dir, zone_id=zone_id)
            if prediction.eventId == event_id or event_id in ("default", "latest"):
                return prediction
        except Exception:
            pass

        # Look in baseline outputs as fallback
        if settings.sfincs_baseline_dir.exists():
            prediction = self.adapter.load_and_normalize(settings.sfincs_baseline_dir, zone_id=zone_id)
            return prediction

        raise FileNotFoundError(f"Simulation event '{event_id}' outputs not found.")

    def get_flood_extent(self, event_id: str) -> Dict[str, Any]:
        """
        Retrieves the GeoJSON FeatureCollection flood extent polygon for the specified event ID.
        """
        # Check outputs_dir
        extent = self.parser.parse_flood_extent_geojson(settings.outputs_dir)
        if extent:
            return extent

        if settings.sfincs_baseline_dir.exists():
            extent = self.parser.parse_flood_extent_geojson(settings.sfincs_baseline_dir)
            if extent:
                return extent

        raise FileNotFoundError(f"Flood extent GeoJSON for event '{event_id}' not found.")

    def get_catalog(self, event_id: str) -> SFINCSOutputsCatalog:
        """
        Returns full file artifact catalog for the specified event.
        """
        if event_id in ("mangaluru-historical-2018", "mangaluru-baseline-m2") and settings.sfincs_baseline_dir.exists():
            return self.parser.catalog_outputs(settings.sfincs_baseline_dir)
        try:
            return self.parser.catalog_outputs(settings.outputs_dir)
        except Exception:
            return self.parser.catalog_outputs(settings.sfincs_baseline_dir)

    def run_simulation(
        self,
        event_id: Optional[str] = None,
        zone_id: str = "zone-mangaluru-coastal",
        rainfall_rate_mm_hr: Optional[float] = None,
        rainfall_series: Optional[List[float]] = None,
        surge_level_m: Optional[float] = 1.5,
        duration_hours: int = 6,
        scenario_name: Optional[str] = None,
    ) -> NormalizedFloodPrediction:
        """
        Runs an on-demand SFINCS hydrodynamic simulation in Docker, extracts standardized
        rasters and PostGIS-compatible GeoJSON polygons, and produces a normalized FloodPrediction.
        """
        now = datetime.now(timezone.utc)
        sim_id = event_id or f"sim-{now.strftime('%Y%m%d-%H%M%S')}"

        run_dir = settings.repo_root / "simulations" / "runs" / sim_id
        run_dir.mkdir(parents=True, exist_ok=True)

        # Locate base template directory containing grid definition
        template_dir = settings.repo_root / "simulations" / "mangaluru_demo"
        if not template_dir.exists():
            template_dir = settings.repo_root / "ml" / "sfincs" / "mangaluru" / "simulations" / "historical"

        # Copy static grid & elevation binaries
        for fname in ["sfincs.dep", "sfincs.msk", "sfincs.ind"]:
            src = template_dir / fname
            if src.exists():
                shutil.copy2(src, run_dir / fname)

        # Build timestamps (YYYYMMDD HHMMSS)
        tstart_str = now.strftime("%Y%m%d %H0000")
        tstop_dt = now + timedelta(hours=duration_hours)
        tstop_str = tstop_dt.strftime("%Y%m%d %H0000")

        # Configure sfincs.inp
        inp_template_path = template_dir / "sfincs.inp"
        inp_lines = []
        if inp_template_path.exists():
            with open(inp_template_path, "r") as f:
                for line in f:
                    if line.strip().startswith("tstart"):
                        inp_lines.append(f"tstart               = {tstart_str}\n")
                    elif line.strip().startswith("tref"):
                        inp_lines.append(f"tref                 = {tstart_str}\n")
                    elif line.strip().startswith("tstop"):
                        inp_lines.append(f"tstop                = {tstop_str}\n")
                    else:
                        inp_lines.append(line)
        else:
            raise FileNotFoundError("sfincs.inp template not found in simulations/mangaluru_demo")

        with open(run_dir / "sfincs.inp", "w") as f:
            f.writelines(inp_lines)

        # Generate sfincs.precip & sfincs.bzs
        times = [(now + timedelta(hours=i)).strftime("%Y%m%d %H0000") for i in range(duration_hours + 1)]

        if rainfall_series and len(rainfall_series) > 0:
            rates = [rainfall_series[min(i, len(rainfall_series) - 1)] for i in range(duration_hours + 1)]
        elif rainfall_rate_mm_hr is not None:
            shape = [0.2, 0.5, 1.0, 0.8, 0.4, 0.2, 0.05]
            rates = [shape[min(i, len(shape) - 1)] * rainfall_rate_mm_hr for i in range(duration_hours + 1)]
        else:
            rates = [10.0, 35.0, 65.0, 50.0, 20.0, 10.0, 5.0][: duration_hours + 1]

        with open(run_dir / "sfincs.precip", "w") as f:
            for t, p in zip(times, rates):
                f.write(f"{t} {p:.2f}\n")

        surge = surge_level_m if surge_level_m is not None else 1.5
        tide_profile = [0.30, 0.80, 1.30, surge, 1.40, 0.90, 0.40]
        tides = [tide_profile[min(i, len(tide_profile) - 1)] for i in range(duration_hours + 1)]

        with open(run_dir / "sfincs.bzs", "w") as f:
            for t, z in zip(times, tides):
                f.write(f"{t} {z:.2f}\n")

        # Execute SFINCS in Docker
        docker_cmd = [
            "docker", "run", "--rm",
            "-v", f"{str(run_dir.resolve())}:/data",
            "-w", "/data",
            "deltares/sfincs-cpu"
        ]

        stdout_log = run_dir / "docker_stdout.log"
        stderr_log = run_dir / "docker_stderr.log"
        with open(stdout_log, "w") as out_f, open(stderr_log, "w") as err_f:
            res = subprocess.run(docker_cmd, stdout=out_f, stderr=err_f, timeout=120)

        if res.returncode != 0:
            raise RuntimeError(f"SFINCS execution failed with exit code {res.returncode}. See {stderr_log}")

        # Extract outputs into run_dir/outputs
        run_out_dir = run_dir / "outputs"
        run_out_dir.mkdir(parents=True, exist_ok=True)

        extract_script = settings.repo_root / "ml" / "sfincs" / "mangaluru" / "scripts" / "extract_outputs.py"
        extract_res = subprocess.run([
            sys.executable,
            str(extract_script),
            "--sim-dir", str(run_dir),
            "--output-dir", str(run_out_dir),
            "--threshold", "0.10"
        ], capture_output=True, text=True, timeout=60)

        if extract_res.returncode != 0:
            raise RuntimeError(f"Output extraction failed: {extract_res.stderr}")

        # Update metadata.json with actual simulation run ID
        meta_file = run_out_dir / "metadata.json"
        if meta_file.exists():
            with open(meta_file, "r") as f:
                meta_json = json.load(f)
            meta_json["simulation_id"] = sim_id
            meta_json["event_name"] = scenario_name or f"Live Hydrodynamic Run {sim_id}"
            meta_json["start_time"] = now.isoformat()
            meta_json["end_time"] = tstop_dt.isoformat()
            if "forcing" not in meta_json:
                meta_json["forcing"] = {}
            meta_json["forcing"]["rainfall_source"] = f"Dynamic Forcing (Peak {max(rates):.1f} mm/hr)"
            meta_json["forcing"]["tide_source"] = f"Panambur Dynamic Tide (Peak {max(tides):.2f}m MSL)"
            with open(meta_file, "w") as f:
                json.dump(meta_json, f, indent=2)

        # Sync deliverables to simulations/latest directory
        latest_dir = settings.repo_root / "simulations" / "latest"
        latest_dir.mkdir(parents=True, exist_ok=True)
        for f in run_out_dir.glob("*"):
            if f.is_file():
                shutil.copy2(f, latest_dir / f.name)

        return self.adapter.load_and_normalize(run_out_dir, zone_id=zone_id)

simulation_service = SimulationService()

