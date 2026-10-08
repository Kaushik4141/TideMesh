import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["sfincs"]["has_metadata"] is True

def test_list_simulations():
    res = client.get("/api/v1/simulations")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(e["eventId"] == "mangaluru-historical-2018" for e in data)

def test_get_forecast():
    res = client.get("/api/v1/simulations/mangaluru-historical-2018/forecast?zone_id=zone-mangaluru-coastal")
    assert res.status_code == 200
    data = res.json()
    assert data["eventId"] == "mangaluru-historical-2018"
    assert data["zoneId"] == "zone-mangaluru-coastal"
    assert data["probability"] is None
    assert data["isDeterministic"] is True
    assert data["severity"] == "CRITICAL"
    assert data["depthMax"] > 0.0
    assert data["floodGeometry"] is not None

def test_get_flood_extent():
    res = client.get("/api/v1/simulations/mangaluru-historical-2018/extent")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0

def test_get_catalog():
    res = client.get("/api/v1/simulations/mangaluru-historical-2018/catalog")
    assert res.status_code == 200
    data = res.json()
    assert data["simulation_id"] == "mangaluru-historical-2018"
    assert data["flood_extent_geojson_path"] is not None
