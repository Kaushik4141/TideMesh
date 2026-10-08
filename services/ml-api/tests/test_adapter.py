import pytest
from app.adapters.sfincs.adapter import SFINCSAdapter, classify_flood_severity
from app.adapters.sfincs.parser import SFINCSOutputParser
from app.config import settings

def test_classify_flood_severity():
    assert classify_flood_severity(0.05) == "LOW"
    assert classify_flood_severity(0.14) == "LOW"
    assert classify_flood_severity(0.15) == "MODERATE"
    assert classify_flood_severity(0.49) == "MODERATE"
    assert classify_flood_severity(0.50) == "HIGH"
    assert classify_flood_severity(1.49) == "HIGH"
    assert classify_flood_severity(1.50) == "CRITICAL"
    assert classify_flood_severity(3.0) == "CRITICAL"

def test_adapter_normalization():
    parser = SFINCSOutputParser(base_outputs_dir=settings.outputs_dir)
    adapter = SFINCSAdapter(parser=parser)
    prediction = adapter.load_and_normalize(settings.outputs_dir, zone_id="zone-mangaluru-coastal")

    # Contract verification
    assert prediction.eventId == "mangaluru-historical-2018"
    assert prediction.zoneId == "zone-mangaluru-coastal"
    assert prediction.timestamp == "2018-05-29T00:00:00Z"

    # Physics vs Statistics verification: SFINCS is deterministic!
    assert prediction.probability is None, "Deterministic physics simulations must NOT have invented probability"
    assert prediction.isDeterministic is True
    assert prediction.confidence is None

    # Severity and depth checks
    assert prediction.severity == "CRITICAL"
    assert prediction.depthMin == 0.10
    assert prediction.depthMax > 0.0

    # Model provenance
    assert prediction.modelVersion == "SFINCS-v2.4.2"
    assert prediction.source == "sfincs"

    # Geometry verification
    assert prediction.floodGeometry is not None
    assert prediction.floodGeometry["type"] in ("Polygon", "MultiPolygon")
    assert len(prediction.floodGeometry["coordinates"]) > 0

    # Physical metrics and drivers
    assert prediction.metrics["floodedAreaKm2"] == 8.8
    assert prediction.metrics["gridResolutionM"] == 50
    assert prediction.drivers == [], "Prescribed forcing is not quantitative attribution"
    assert prediction.onset is None and prediction.peak is None
    assert "heuristic" in prediction.metrics["timingSource"]
