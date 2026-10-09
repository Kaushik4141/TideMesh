"""Local execution evidence, not a new public snapshot or scientific model."""
import hashlib
import re
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from app.adapters.sfincs.integration import read_config

STATIC_FILES = ("sfincs.dep", "sfincs.msk", "sfincs.ind")
FORCING_FILES = ("sfincs.inp", "sfincs.precip", "sfincs.bzs", "sfincs.bnd")
EVIDENCE_FILES = (*STATIC_FILES, *FORCING_FILES, "template.inp", "extract_outputs.py",
                  "zsmax.dat", "sfincs.log", "docker_stdout.log", "docker_stderr.log",
                  "extraction_stdout.log", "extraction_stderr.log")


def file_record(path: Path) -> dict:
    if not path.is_file() or path.is_symlink():
        raise ValueError("Run evidence must be a regular file")
    before = path.stat()
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    after = path.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise ValueError("Run evidence changed during inspection")
    return {"sha256": digest.hexdigest(), "sizeBytes": after.st_size,
            "modifiedTimeNs": after.st_mtime_ns,
            "modifiedAt": datetime.fromtimestamp(after.st_mtime_ns / 1e9, timezone.utc).isoformat()}


def validate_static_grid(run_dir: Path, config: dict) -> None:
    """P1 extraction assumes a full, ordered regular grid; fail on other formats."""
    count = int(config["mmax"]) * int(config["nmax"])
    if (config.get("inputformat") != "bin" or config.get("outputformat") != "bin"
            or any(config.get(key) != value for key, value in (
                ("depfile", "sfincs.dep"), ("mskfile", "sfincs.msk"), ("indexfile", "sfincs.ind")))):
        raise RuntimeError("Template file formats are unsupported by the existing P1 extractor")
    for name in STATIC_FILES:
        file_record(run_dir / name)
    indices = np.fromfile(run_dir / "sfincs.ind", dtype="<u4")
    mask = np.fromfile(run_dir / "sfincs.msk", dtype="u1")
    bed = np.fromfile(run_dir / "sfincs.dep", dtype="<f4")
    if (indices.size != count + 1 or indices[0] != count
            or not np.array_equal(indices[1:], np.arange(1, count + 1))
            or (run_dir / "sfincs.ind").stat().st_size != (count + 1) * 4
            or mask.size != count or not np.all(np.isin(mask, [1, 2]))
            or bed.size != count or (run_dir / "sfincs.dep").stat().st_size != count * 4
            or not np.isfinite(bed).all()):
        raise RuntimeError("Static grid is unsupported by the existing P1 extractor")


def validate_solver_output(run_dir: Path, config: dict, started_ns: int) -> dict:
    """Do this before P1 clips negative levels or truncates oversized binaries."""
    for name in ("zsmax.dat", "sfincs.log"):
        record = file_record(run_dir / name)
        if not record["sizeBytes"] or record["modifiedTimeNs"] < started_ns:
            raise RuntimeError("Solver evidence is missing or stale")
    path = run_dir / "zsmax.dat"
    count = int(config["mmax"]) * int(config["nmax"])
    size = path.stat().st_size
    if size == count * 4:
        levels = np.fromfile(path, dtype="<f4")
    elif size == (count + 2) * 4:
        # This solver writes one Fortran unformatted record with byte-count markers.
        words = np.fromfile(path, dtype="<u4")
        if words[0] != count * 4 or words[-1] != count * 4:
            raise RuntimeError("Invalid solver binary record markers")
        levels = words[1:-1].view("<f4")
    else:
        raise RuntimeError("Solver peak output does not match the grid")
    if not np.isfinite(levels).all():
        raise RuntimeError("Solver produced non-finite raw water levels")
    log = (run_dir / "sfincs.log").read_text(errors="replace")
    other_logs = "\n".join((run_dir / name).read_text(errors="replace")
                           for name in ("docker_stdout.log", "docker_stderr.log"))
    if re.search(r"\b(?:error|fatal|aborted)\b|fortran runtime|floating.point exception", log + other_logs, re.I):
        raise RuntimeError("Solver log reports an execution failure")
    checks = {"completed": bool(re.search(r"100\s*% complete", log)
                                and "Simulation finished" in log and "Closing off SFINCS" in log),
              "rainfallRead": bool(re.search(r"reading (?:prcp|prc|precip) file\s+sfincs\.precip", log, re.I)),
              "rainfallEnabled": bool(re.search(r"Precipitation\s*:\s*yes", log, re.I)),
              "waterLevelBoundariesRead": "reading water level boundaries" in log.lower()}
    if not all(checks.values()):
        raise RuntimeError("Solver log does not verify completion and applied forcing")
    return {**checks, "rawPeakValueCount": int(levels.size), "rawPeakFinite": True}


def validate_manifest_forcing(run_dir: Path, manifest: dict) -> None:
    """A readable manifest must still describe the bytes actually supplied."""
    try:
        config = read_config(run_dir / "sfincs.inp")
        window = []
        for key, field in (("tstart", "simulationStart"), ("tstop", "simulationEnd")):
            value = datetime.strptime(config[key], "%Y%m%d %H%M%S").replace(tzinfo=timezone.utc)
            if value != datetime.fromisoformat(manifest[field]):
                raise ValueError("Forcing window does not match the manifest")
            window.append(value)
        if config["tref"] != config["tstart"]:
            raise ValueError("Unsupported forcing reference time")
        rain = np.loadtxt(run_dir / "sfincs.precip", ndmin=2)
        levels = np.loadtxt(run_dir / "sfincs.bzs", ndmin=2)
        boundary = np.loadtxt(run_dir / "sfincs.bnd", ndmin=2)
        rates = np.asarray(manifest["rainfallSeries"], dtype=float)
        water = np.asarray(manifest["waterLevelSeries"], dtype=float)
        seconds = np.arange(len(rates)) * 3600
        if (len(rates) < 2 or (window[1] - window[0]).total_seconds() != (len(rates) - 1) * 3600
                or rain.shape != (len(rates), 2) or water.shape != rates.shape
                or levels.shape != (len(rates), len(boundary) + 1)
                or not np.array_equal(rain[:, 0], seconds)
                or not np.array_equal(levels[:, 0], seconds)
                or not np.array_equal(rain[:, 1], rates)
                or not np.all(levels[:, 1:] == water[:, None])):
            raise ValueError("Manifest forcing differs from supplied files")
        inputs = manifest.get("inputs")
        if inputs is not None:
            profile = [0.2, 0.5, 1.0, 0.8, 0.4, 0.2, 0.05]
            prescribed = [round(inputs["rainfallRateMmHr"] * profile[min(i, 6)], 8) for i in range(len(rates))]
            if (inputs["durationHours"] != len(rates) - 1 or not np.array_equal(prescribed, rates)
                    or (len(water) > 3 and round(inputs["surgeLevelM"], 8) != water[3])):
                raise ValueError("Manifest numeric controls differ from supplied forcing")
    except (KeyError, TypeError, IndexError) as error:
        raise ValueError("Invalid manifest forcing provenance") from error
