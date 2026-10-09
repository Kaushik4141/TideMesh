import os
import shutil
import subprocess
import sys
import json
import re
import uuid
from datetime import datetime, timezone, timedelta
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

        return events

    def get_forecast(
        self,
        event_id: str,
        zone_id: str = "zone-mangaluru-coastal",
    ) -> NormalizedFloodPrediction:
        """
        Retrieves the normalized FloodPrediction for the specified event ID.
        """
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,127}", event_id):
            raise FileNotFoundError("Invalid simulation event ID")
        # Look in immutable run directories only when the exact ID exists.
        if event_id.startswith("sim-"):
            run_out = settings.repo_root / "simulations" / "runs" / event_id / "outputs"
            if run_out.exists():
                return self.adapter.load_and_normalize(run_out, zone_id=zone_id)

        # Look in outputs_dir only for the exact event ID.
        try:
            prediction = self.adapter.load_and_normalize(settings.outputs_dir, zone_id=zone_id)
            if prediction.eventId == event_id:
                return prediction
        except Exception:
            pass

        raise FileNotFoundError(f"Simulation event '{event_id}' outputs not found.")

    def get_flood_extent(self, event_id: str) -> Dict[str, Any]:
        """
        Retrieves the GeoJSON FeatureCollection flood extent polygon for the specified event ID.
        """
        if event_id.startswith("sim-"):
            run_out = settings.repo_root / "simulations" / "runs" / event_id / "outputs"
            if run_out.exists():
                extent = self.parser.parse_flood_extent_geojson(run_out)
                if extent:
                    return extent

        # Check outputs_dir only after exact event validation.
        try:
            metadata = self.parser.parse_metadata(settings.outputs_dir)
            if metadata.simulation_id != event_id:
                raise FileNotFoundError
        except Exception:
            metadata = None
        extent = self.parser.parse_flood_extent_geojson(settings.outputs_dir)
        if extent and metadata:
            return extent

        raise FileNotFoundError(f"Flood extent GeoJSON for event '{event_id}' not found.")

    def get_catalog(self, event_id: str) -> SFINCSOutputsCatalog:
        """
        Returns full file artifact catalog for the specified event.
        """
        if event_id.startswith("sim-"):
            run_out = settings.repo_root / "simulations" / "runs" / event_id / "outputs"
            if run_out.exists():
                return self.parser.catalog_outputs(run_out)

        try:
            catalog = self.parser.catalog_outputs(settings.outputs_dir)
            if catalog.simulation_id != event_id:
                raise FileNotFoundError
            return catalog
        except Exception as exc:
            raise FileNotFoundError(f"Simulation event '{event_id}' outputs not found") from exc

    def get_frames(self, event_id: str) -> Dict[str, Any]:
        """Return only solver-produced timestep frames; maximum-only artifacts have none."""
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,127}", event_id):
            raise FileNotFoundError("Invalid simulation event ID")
        candidates = []
        if event_id.startswith("sim-"):
            candidates.append(settings.repo_root / "simulations" / "runs" / event_id / "outputs")
        candidates.append(settings.outputs_dir)
        for directory in candidates:
            try:
                metadata = self.parser.parse_metadata(directory)
                if metadata.simulation_id == event_id:
                    return {"success": True, "eventId": event_id, "artifactKind": metadata.artifact_kind,
                            "operational": False, "validationStatus": "unvalidated", "frames": metadata.frames}
            except Exception:
                continue
        raise FileNotFoundError(f"Simulation event '{event_id}' outputs not found")

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
        # A local hydrodynamic run is deliberately opt-in. SFINCS starts a Docker
        # workload and can exhaust a laptop when invoked by a dashboard or cron
        # request accidentally. Production/background workers should set this
        # explicitly after applying their own CPU and memory limits.
        if os.getenv("ENABLE_SFINCS_LOCAL_RUNNER", "false").lower() != "true":
            raise RuntimeError(
                "Local SFINCS execution is disabled; set ENABLE_SFINCS_LOCAL_RUNNER=true "
                "only on a bounded background runner"
            )
        if zone_id != "zone-mangaluru-coastal":
            raise ValueError("No model configured for the requested zone")
        if duration_hours != 6:
            raise ValueError("Scenario runs must cover exactly six hours")
        if rainfall_rate_mm_hr is None and not rainfall_series:
            raise ValueError("Explicit scenario rainfall is required")
        if rainfall_series is not None and (len(rainfall_series) != 7 or any(not isinstance(v, (int, float)) or v < 0 or v > 1000 for v in rainfall_series)):
            raise ValueError("Rainfall series must contain seven values in range 0–1000 mm/hr")
        if rainfall_rate_mm_hr is not None and (rainfall_rate_mm_hr < 0 or rainfall_rate_mm_hr > 1000):
            raise ValueError("Rainfall rate must be in range 0–1000 mm/hr")
        if surge_level_m is not None and (surge_level_m < -5 or surge_level_m > 10):
            raise ValueError("Boundary water level must be in range -5–10 m")
        now = datetime.now(timezone.utc)
        # IDs are immutable and generated server-side; callers cannot overwrite a prior run.
        sim_id = f"sim-{uuid.uuid4().hex}"

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
        docker_cpus = os.getenv("SFINCS_DOCKER_CPUS", "2")
        docker_memory = os.getenv("SFINCS_DOCKER_MEMORY", "4g")
        docker_cmd = [
            "docker", "run", "--rm",
            "--cpus", docker_cpus,
            "--memory", docker_memory,
            "--pids-limit", "256",
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
            meta_json["event_name"] = scenario_name or f"Private scenario run {sim_id}"
            meta_json["purpose"] = "scenario"
            meta_json["operational"] = False
            meta_json["validation_status"] = "unvalidated"
            meta_json["terrain_source"] = "Mangaluru synthetic template"
            meta_json["artifact_kind"] = meta_json.get("artifact_kind", "maximum_extent")
            meta_json["provenance"] = {
                "runner": "services/ml-api/app/services/simulation_service.py",
                "terrain": "synthetic Mangaluru template; nonoperational",
                "forcing": "caller-supplied scenario forcing",
            }
            meta_json["start_time"] = now.isoformat()
            meta_json["end_time"] = tstop_dt.isoformat()
            if "forcing" not in meta_json:
                meta_json["forcing"] = {}
            meta_json["forcing"]["rainfall_source"] = f"Dynamic Forcing (Peak {max(rates):.1f} mm/hr)"
            meta_json["forcing"]["tide_source"] = f"Panambur Dynamic Tide (Peak {max(tides):.2f}m MSL)"
            with open(meta_file, "w") as f:
                json.dump(meta_json, f, indent=2)

        return self.adapter.load_and_normalize(run_out_dir, zone_id=zone_id)

simulation_service = SimulationService()
