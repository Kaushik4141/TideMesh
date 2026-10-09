"""Run isolation tests. Docker is simulated; no test starts the actual solver.

Successful runner tests execute the real P1 extraction script against binary fixtures.
"""
import json
import os
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from uuid import UUID

import numpy as np
import pytest
import rasterio
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.adapters.sfincs.integration import OUTPUTS, read_config
from app.adapters.sfincs.reliability import EVIDENCE_FILES, file_record
from app.services.simulation_service import SimulationService, RunConflictError, solver_revision

REPO = settings.repo_root


def test_solver_revision_uses_actual_log_or_unknown(tmp_path):
    assert solver_revision(tmp_path) is None
    (tmp_path / "sfincs.log").write_text("Build-Revision: $Rev: v2.5.0-beta Hautacam\n")
    assert solver_revision(tmp_path) == "v2.5.0-beta Hautacam"


def legacy(directory, event_id, *, empty=False):
    directory.mkdir(parents=True)
    metadata = json.loads((REPO / "outputs" / "metadata.json").read_text())
    metadata.update(simulation_id=event_id, flooded_area_km2=0 if empty else 1,
                    max_depth_m=0 if empty else 1)
    (directory / "metadata.json").write_text(json.dumps(metadata))
    polygon = {"type": "Polygon", "coordinates": [[[74, 12], [74.01, 12],
                                                      [74.01, 12.01], [74, 12]]]}
    (directory / "flood_extent.geojson").write_text(json.dumps({
        "type": "FeatureCollection", "features": [] if empty else [
            {"type": "Feature", "geometry": polygon, "properties": {}},
            {"type": "Feature", "geometry": {"type": "MultiPolygon", "coordinates": [
                [[[75, 12], [75.01, 12], [75.01, 12.01], [75, 12]]]]}, "properties": {}},
        ]}))
    for name in OUTPUTS:
        if name.endswith(".tif"):
            (directory / name).write_bytes(b"legacy artifact")
    return directory


@pytest.fixture
def isolated(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "repo_root", tmp_path)
    monkeypatch.setattr(settings, "outputs_dir", tmp_path / "outputs")
    monkeypatch.setattr(settings, "sfincs_baseline_dir", tmp_path / "baseline" / "outputs")
    legacy(settings.outputs_dir, "historical")
    return SimulationService()


@pytest.fixture
def runner(isolated, monkeypatch):
    template = settings.repo_root / "simulations" / "mangaluru_demo"
    template.mkdir(parents=True)
    config = (REPO / "simulations" / "mangaluru_demo" / "sfincs.inp").read_text()
    (template / "sfincs.inp").write_text(config)
    np.zeros(10000, dtype="<f4").tofile(template / "sfincs.dep")
    mask = np.ones(10000, dtype="u1")
    mask[:100] = 2
    mask.tofile(template / "sfincs.msk")
    np.r_[10000, np.arange(1, 10001)].astype("<u4").tofile(template / "sfincs.ind")
    # Intentionally put stale outputs in the template: they must never be reused.
    (template / "zsmax.dat").write_bytes(b"stale")
    script = settings.repo_root / "ml" / "sfincs" / "mangaluru" / "scripts" / "extract_outputs.py"
    script.parent.mkdir(parents=True)
    shutil.copy2(REPO / "ml" / "sfincs" / "mangaluru" / "scripts" / "extract_outputs.py", script)
    real_run = subprocess.run
    state = {"calls": [], "mode": "success", "depth": 2.0}

    def mock_solver(command, **kwargs):
        state["calls"].append(command)
        if command[0] == "docker":
            run_dir = Path(command[command.index("-v") + 1].removesuffix(":/data"))
            before = json.loads((run_dir / "run_manifest.json").read_text())
            assert before["status"] == "running" and before["generatedAt"] is None
            assert before["artifacts"] and before["forcingHashes"]
            if state["mode"] == "failure":
                return SimpleNamespace(returncode=1)
            if state["mode"] == "missing_raw":
                return SimpleNamespace(returncode=0)
            depth = np.zeros((100, 100), dtype="<f4")
            depth[0, 0] = state["depth"]
            depth[99, 99] = state["depth"]
            if state["mode"] == "raw_nonfinite":
                depth[5, 5] = -np.inf  # P1 previously clips this to a finite dry cell.
            depth.ravel(order="F").tofile(run_dir / "zsmax.dat")
            log = ("Build-Revision: $Rev: v2.5.0-beta Hautacam\n"
                   "Info : reading prcp file sfincs.precip\n"
                   "Info : reading water level boundaries\n"
                   "Precipitation : yes\n"
                   "100% complete\nSimulation finished\nClosing off SFINCS\n")
            if state["mode"] == "incomplete_log":
                log = log.replace("Simulation finished", "Simulation stopped")
            if state["mode"] == "no_forcing_read":
                log = log.replace("reading water level boundaries", "no water level boundaries")
            if state["mode"] == "error_log":
                log += "ERROR: solver aborted\n"
            (run_dir / "sfincs.log").write_text(log)
            if state["mode"] == "stale_raw":
                os.utime(run_dir / "zsmax.dat", (1, 1))
            if state["mode"] == "oversized_raw":
                with (run_dir / "zsmax.dat").open("ab") as stream:
                    stream.write(b"ignored by P1")
            if state["mode"] == "corrupt_record":
                np.r_[np.uint32(0), depth.ravel(order="F").view("<u4"), np.uint32(0)].astype("<u4").tofile(run_dir / "zsmax.dat")
            if state["mode"] == "mutated_static":
                with (run_dir / "sfincs.dep").open("ab") as stream:
                    stream.write(b"changed by solver")
            return SimpleNamespace(returncode=0)
        if state["mode"] == "missing_extraction":
            # Mirrors P1's successful process exit despite missing deliverables.
            return SimpleNamespace(returncode=0)
        result = real_run(command, **kwargs)
        if state["mode"] == "missing_vector":
            Path(command[command.index("--output-dir") + 1], "flood_extent.geojson").unlink()
        if state["mode"] == "missing_raster":
            Path(command[command.index("--output-dir") + 1], "peak_time.tif").unlink()
        if state["mode"] == "mutated_raw_extraction":
            with Path(command[command.index("--sim-dir") + 1], "zsmax.dat").open("ab") as stream:
                stream.write(b"changed by extractor")
        return result

    monkeypatch.setattr(subprocess, "run", mock_solver)
    return isolated, state


def test_exact_event_association_and_all_completed_runs(isolated):
    legacy(settings.repo_root / "simulations" / "runs" / "sim-one" / "outputs", "sim-one")
    legacy(settings.repo_root / "simulations" / "runs" / "sim-two" / "outputs", "sim-two")
    legacy(settings.repo_root / "simulations" / "runs" / "wrong" / "outputs", "sim-other")
    legacy(settings.repo_root / "simulations" / "latest", "mutable-event")
    assert {event["eventId"] for event in isolated.list_simulations()} == {"historical", "sim-one", "sim-two"}
    assert isolated.get_forecast("sim-two").eventId == "sim-two"
    assert isolated.get_catalog("sim-one").simulation_id == "sim-one"
    for method in (isolated.get_forecast, isolated.get_flood_extent, isolated.get_catalog, isolated.get_run):
        with pytest.raises(FileNotFoundError):
            method("unknown")


@pytest.mark.parametrize("event_id", ["latest", "live", "default", "../historical", "sim-../../outputs", "/tmp/run", "a.b", "a b"])
def test_invalid_ids_rejected(isolated, event_id):
    for method in (isolated.get_run, isolated.get_forecast, isolated.get_flood_extent, isolated.get_catalog):
        with pytest.raises(ValueError):
            method(event_id)
    with pytest.raises(ValueError):
        isolated.run_simulation(event_id=event_id)


def test_no_custom_ids_or_overwrite(isolated):
    run_dir = settings.repo_root / "simulations" / "runs" / "sim-existing"
    legacy(run_dir / "outputs", "sim-existing")
    before = (run_dir / "outputs" / "metadata.json").read_bytes()
    with pytest.raises(RunConflictError):
        isolated.run_simulation(event_id="sim-existing")
    with pytest.raises(ValueError):
        isolated.run_simulation(event_id="custom-safe-id")
    assert (run_dir / "outputs" / "metadata.json").read_bytes() == before


def test_duplicate_ids_not_resolved_by_fallback(isolated):
    legacy(settings.sfincs_baseline_dir, "historical")
    assert isolated.list_simulations() == []
    with pytest.raises(RunConflictError):
        isolated.get_run("historical")


def test_legacy_snapshot_unknown_provenance_and_all_polygons(isolated):
    # A nearby old input file is not proof the extraction used it.
    (settings.outputs_dir.parent / "sfincs.precip").write_text("20180529 000000 65\n")
    run = isolated.get_run("historical")
    assert run["generatedAt"] is None and run["inputs"] is None
    assert run["rainfallSeries"] is None and run["waterLevelSeries"] is None
    assert run["floodGeometry"]["type"] == "MultiPolygon"
    assert len(run["floodGeometry"]["coordinates"]) == 2
    assert all(identifier.startswith("historical/") and not identifier.startswith("/")
               for identifier in run["artifactIds"])


def test_empty_legacy_geometry_is_honest(isolated):
    legacy(settings.sfincs_baseline_dir, "zero", empty=True)
    (settings.sfincs_baseline_dir / "flood_extent.geojson").unlink()
    snapshot = isolated.get_run("zero")
    assert snapshot["floodGeometry"] == {"type": "Polygon", "coordinates": []}
    assert snapshot["maximumDepthM"] == 0
    assert any("No cells" in note for note in snapshot["qualityNotes"])


def test_missing_output_and_symlink_are_not_completed(isolated):
    (settings.outputs_dir / "peak_time.tif").unlink()
    assert isolated.list_simulations() == []
    with pytest.raises(FileNotFoundError):
        isolated.get_run("historical")
    (settings.outputs_dir / "peak_time.tif").symlink_to(REPO / "outputs" / "peak_time.tif")
    assert isolated.list_simulations() == []


def test_runner_real_extraction_forcing_georef_and_unique_ids(runner):
    service, state = runner
    prediction = service.run_simulation(rainfall_rate_mm_hr=80, surge_level_m=2, duration_hours=6)
    snapshot = service.get_run(prediction.eventId)
    UUID(snapshot["runId"].removeprefix("sim-"))
    run_dir = settings.repo_root / "simulations" / "runs" / snapshot["runId"]
    config = read_config(run_dir / "sfincs.inp")
    assert config["x0"] == "698000.0" and config["y0"] == "1422000.0"
    assert config["precipfile"] == "sfincs.precip"
    assert config["bndfile"] == "sfincs.bnd" and config["bzsfile"] == "sfincs.bzs"
    rainfall = np.loadtxt(run_dir / "sfincs.precip")
    tide = np.loadtxt(run_dir / "sfincs.bzs")
    assert rainfall[:, 0].tolist() == list(range(0, 21601, 3600))
    assert rainfall[:, 1].tolist() == snapshot["rainfallSeries"]
    assert tide[:, 1].tolist() == snapshot["waterLevelSeries"]
    assert snapshot["rainfallSeries"] == [16, 40, 80, 64, 32, 16, 4]
    assert snapshot["waterLevelSeries"] == [0.30, 0.80, 1.30, 2, 1.40, 0.90, 0.40]
    assert tide.shape == (7, 101)  # one water-level column per unchanged boundary cell
    assert np.all(tide[:, 1:] == tide[:, 1:2])
    assert snapshot["inputs"] == {"rainfallRateMmHr": 80, "surgeLevelM": 2, "durationHours": 6}
    assert snapshot["generatedAt"] is not None
    assert any("sample at +3h" in note and "not additive surge" in note for note in snapshot["qualityNotes"])
    assert any("76.82E" in note and "74.85E" in note and "not verified" in note
               for note in snapshot["qualityNotes"])
    assert snapshot["simulationStart"] == datetime_string(config["tstart"])
    with rasterio.open(run_dir / "outputs" / "peak_depth.tif") as raster:
        assert raster.bounds.left == 698000
        assert raster.bounds.bottom == 1422000 and raster.bounds.top == 1427000
        assert raster.read(1)[99, 0] == 2 and raster.read(1)[0, 99] == 2
    polygons = snapshot["floodGeometry"]["coordinates"]
    assert len(polygons) == 2
    # Actual template EPSG:32643 x0=698000 is ~76.82 E, not the historic extent ~74.85 E.
    assert all(76 < point[0] < 78 and 12 < point[1] < 14
               for polygon in polygons for ring in polygon for point in ring)
    second = service.run_simulation(rainfall_rate_mm_hr=0, surge_level_m=0, duration_hours=12)
    assert second.eventId != prediction.eventId
    second_run = service.get_run(second.eventId)
    assert len(second_run["rainfallSeries"]) == 13
    assert second_run["rainfallSeries"] == [0] * 13
    assert second_run["waterLevelSeries"] == [0.30, 0.80, 1.30, 0, 1.40, 0.90, 0.40] + [0.40] * 6
    assert {event["eventId"] for event in service.list_simulations()} == {"historical", prediction.eventId, second.eventId}
    assert all(command[0] == "docker" or command[1].endswith("extract_outputs.py") for command in state["calls"])


def datetime_string(sfincs_time):
    from datetime import datetime, timezone
    return datetime.strptime(sfincs_time, "%Y%m%d %H%M%S").replace(tzinfo=timezone.utc).isoformat()


@pytest.mark.parametrize("mode", ["failure", "missing_raw", "missing_extraction", "missing_raster", "missing_vector",
                                   "raw_nonfinite", "stale_raw", "oversized_raw", "corrupt_record", "incomplete_log",
                                   "no_forcing_read", "error_log", "mutated_static", "mutated_raw_extraction"])
def test_failed_run_preserves_success_and_rejects_stale_outputs(runner, mode):
    service, state = runner
    previous = service.run_simulation()
    latest = settings.repo_root / "simulations" / "latest"
    before = {path.name: path.read_bytes() for path in latest.iterdir()}
    state["mode"] = mode
    with pytest.raises(RuntimeError, match="output validation failed"):
        service.run_simulation()
    assert {path.name: path.read_bytes() for path in latest.iterdir()} == before
    runs = settings.repo_root / "simulations" / "runs"
    failed = [json.loads((path / "run_manifest.json").read_text()) for path in runs.iterdir()
              if path.is_dir() and path.name != previous.eventId]
    assert len(failed) == 1 and failed[0]["status"] == "failed"
    assert failed[0]["generatedAt"] is None
    with pytest.raises(FileNotFoundError):
        service.get_run(failed[0]["runId"])
    assert service.get_run(previous.eventId)["runId"] == previous.eventId


def test_zero_inundation_after_real_extraction(runner):
    service, state = runner
    state["depth"] = 0
    prediction = service.run_simulation(rainfall_rate_mm_hr=0, surge_level_m=0)
    snapshot = service.get_run(prediction.eventId)
    assert snapshot["maximumDepthM"] == 0
    assert snapshot["floodGeometry"] == {"type": "Polygon", "coordinates": []}
    assert service.get_flood_extent(prediction.eventId)["features"] == []
    assert prediction.metrics["meanFloodedDepthM"] == 0


def test_completed_artifact_tampering_invalidates_run(runner):
    service, _ = runner
    prediction = service.run_simulation()
    (settings.repo_root / "simulations" / "runs" / prediction.eventId / "sfincs.precip").write_text("0 999\n")
    with pytest.raises(FileNotFoundError):
        service.get_run(prediction.eventId)


def test_custom_series_snapshot_records_written_precision(runner):
    service, _ = runner
    prediction = service.run_simulation(rainfall_series=[1.123456789, 2.987654321], duration_hours=1)
    snapshot = service.get_run(prediction.eventId)
    assert snapshot["inputs"] is None
    assert snapshot["rainfallSeries"] == [1.12345679, 2.98765432]


def test_short_duration_does_not_apply_three_hour_control(runner):
    service, _ = runner
    prediction = service.run_simulation(rainfall_rate_mm_hr=80, surge_level_m=5, duration_hours=2)
    snapshot = service.get_run(prediction.eventId)
    assert snapshot["inputs"]["surgeLevelM"] == 5
    assert snapshot["waterLevelSeries"] == [0.30, 0.80, 1.30]
    assert snapshot["rainfallSeries"] == [16, 40, 80]
    assert any("surgeLevelM is not present" in note for note in snapshot["qualityNotes"])


def test_routes_sanitize_errors_and_expose_snapshot(isolated, monkeypatch):
    import app.routers.simulations as routes
    monkeypatch.setattr(routes, "simulation_service", isolated)
    client = TestClient(app)
    assert client.get("/api/v1/simulations/historical/run").json()["runId"] == "historical"
    assert client.get("/api/v1/simulations/default/run").status_code == 400
    assert client.get("/api/v1/simulations/unknown/run").status_code == 404
    assert client.post("/api/v1/simulations/run", json={"eventId": "../../tmp"}).status_code == 400
    assert client.post("/api/v1/simulations/run", json={"durationHours": 0}).status_code == 422
    def broken(*args, **kwargs):
        raise RuntimeError("private /home/user/token stderr")
    monkeypatch.setattr(isolated, "run_simulation", broken)
    response = client.post("/api/v1/simulations/run", json={})
    assert response.status_code == 500
    assert response.json() == {"detail": "Simulation processing failed"}


def test_run_records_unknown_source_times_and_preserved_file_times(runner):
    service, _ = runner
    prediction = service.run_simulation()
    run_dir = settings.repo_root / "simulations" / "runs" / prediction.eventId
    manifest = json.loads((run_dir / "run_manifest.json").read_text())
    assert manifest["schemaVersion"] == 2
    for key in ("rainfall", "waterLevel"):
        source = manifest["sourceProvenance"][key]
        assert source == {"kind": "manual_prescribed_profile", "observedAt": None, "issuedAt": None}
    source = manifest["sourceProvenance"]["template"]["sourceFileRecords"]["sfincs.dep"]
    assert source == file_record(run_dir / "sfincs.dep")
    assert source == file_record(settings.repo_root / "simulations" / "mangaluru_demo" / "sfincs.dep")
    times = [manifest["requestedAt"], *manifest["timestamps"].values()]
    assert all(time is not None for time in times)
    assert [datetime.fromisoformat(time) for time in times] == sorted(datetime.fromisoformat(time) for time in times)
    assert (datetime.fromisoformat(manifest["timestamps"]["extractionFinishedAt"])
            <= datetime.fromisoformat(manifest["generatedAt"])
            <= datetime.fromisoformat(manifest["timestamps"]["completedAt"]))
    for name in EVIDENCE_FILES:
        assert manifest["fileRecords"][name] == file_record(run_dir / name)
    assert manifest["solverValidation"] == {"completed": True, "rainfallRead": True, "rainfallEnabled": True,
                                            "waterLevelBoundariesRead": True, "rawPeakValueCount": 10000,
                                            "rawPeakFinite": True}
    assert service.get_run(prediction.eventId)["generatedAt"] == manifest["generatedAt"]


@pytest.mark.parametrize("name", ["sfincs.dep", "sfincs.msk", "sfincs.ind", "sfincs.log", "zsmax.dat",
                                 "docker_stdout.log", "extract_outputs.py", "outputs/peak_depth.tif"])
@pytest.mark.parametrize("change", ["content", "timestamp"])
def test_completed_evidence_content_or_timestamp_tampering_invalidates_run(runner, name, change):
    service, _ = runner
    prediction = service.run_simulation()
    path = settings.repo_root / "simulations" / "runs" / prediction.eventId / name
    if change == "content":
        with path.open("ab") as stream:
            stream.write(b"tampered")
    else:
        os.utime(path, ns=(path.stat().st_atime_ns, path.stat().st_mtime_ns - 1000000))
    with pytest.raises(FileNotFoundError):
        service.get_run(prediction.eventId)
    assert prediction.eventId not in {event["eventId"] for event in service.list_simulations()}


@pytest.mark.parametrize("field", ["rainfallSeries", "inputs", "schemaVersion", "sourceProvenance"])
def test_manifest_cannot_report_different_forcing_or_invalid_provenance(runner, field):
    service, _ = runner
    prediction = service.run_simulation()
    path = settings.repo_root / "simulations" / "runs" / prediction.eventId / "run_manifest.json"
    manifest = json.loads(path.read_text())
    if field == "rainfallSeries":
        manifest["rainfallSeries"][2] = 299
    elif field == "inputs":
        manifest["inputs"]["rainfallRateMmHr"] = 299
    elif field == "schemaVersion":
        manifest["schemaVersion"] = "2"
    else:
        manifest["sourceProvenance"] = None
    path.write_text(json.dumps(manifest))
    with pytest.raises(FileNotFoundError):
        service.get_run(prediction.eventId)
    assert {event["eventId"] for event in service.list_simulations()} == {"historical"}


def test_numeric_control_precision_still_matches_written_forcing(runner):
    service, _ = runner
    prediction = service.run_simulation(rainfall_rate_mm_hr=65.123456789, surge_level_m=2.123456789)
    run = service.get_run(prediction.eventId)
    assert run["inputs"]["surgeLevelM"] == 2.123456789
    assert run["waterLevelSeries"][3] == 2.12345679


@pytest.mark.parametrize("kind", ["nonfinite_bed", "sparse_grid"])
def test_unsupported_template_rejected_before_docker(runner, kind):
    service, state = runner
    template = settings.repo_root / "simulations" / "mangaluru_demo"
    if kind == "nonfinite_bed":
        bed = np.zeros(10000, dtype="<f4")
        bed[0] = -np.inf
        bed.tofile(template / "sfincs.dep")
    else:
        np.r_[9999, np.arange(1, 10000)].astype("<u4").tofile(template / "sfincs.ind")
    with pytest.raises(RuntimeError):
        service.run_simulation()
    assert state["calls"] == []


def test_concurrent_latest_publication_keeps_newest_completed_run(isolated):
    root = settings.repo_root / "simulations"
    dirs = []
    for index in range(6):
        directory = root / f"source-{index}"
        directory.mkdir(parents=True)
        (directory / "metadata.json").write_text(json.dumps({"simulation_id": str(index),
                                                            "generated_at": f"2026-10-09T00:00:0{index}+00:00"}))
        (directory / "peak_depth.tif").write_bytes(str(index).encode())
        dirs.append(directory)
    isolated._publish_latest(dirs[0])
    with ThreadPoolExecutor(max_workers=5) as pool:
        list(pool.map(isolated._publish_latest, reversed(dirs[1:])))
    # A delayed publication of the oldest run must not downgrade the newest one.
    isolated._publish_latest(dirs[0])
    latest = root / "latest"
    assert json.loads((latest / "metadata.json").read_text())["simulation_id"] == "5"
    assert (latest / "peak_depth.tif").read_bytes() == b"5"
    assert not list(root.glob(".latest-*")) and not list(root.glob(".previous-*"))
