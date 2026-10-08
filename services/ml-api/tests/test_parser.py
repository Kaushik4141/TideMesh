import pytest
from pathlib import Path
from app.adapters.sfincs.parser import SFINCSOutputParser
from app.config import settings

target_dir = settings.sfincs_baseline_dir if settings.sfincs_baseline_dir.exists() else settings.outputs_dir

def test_parse_metadata():
    parser = SFINCSOutputParser(base_outputs_dir=target_dir)
    metadata = parser.parse_metadata()

    assert metadata.model == "SFINCS"
    assert metadata.model_version == "v2.4.2"
    assert metadata.simulation_id == "mangaluru-historical-2018"
    assert metadata.max_depth_m == 3.0
    assert metadata.flooded_area_km2 == 8.8
    assert metadata.crs == "EPSG:32643"
    assert metadata.forcing is not None
    assert "IMD" in metadata.forcing.rainfall_source
    assert "Panambur" in metadata.forcing.tide_source

def test_parse_flood_extent():
    parser = SFINCSOutputParser(base_outputs_dir=target_dir)
    geojson = parser.parse_flood_extent_geojson()

    assert geojson is not None
    assert geojson.get("type") == "FeatureCollection"
    assert len(geojson.get("features", [])) > 0

    geom = parser.extract_primary_geometry(geojson)
    assert geom is not None
    assert geom.get("type") in ("Polygon", "MultiPolygon")
    assert len(geom.get("coordinates", [])) > 0

def test_catalog_outputs():
    parser = SFINCSOutputParser(base_outputs_dir=target_dir)
    catalog = parser.catalog_outputs()

    assert catalog.simulation_id == "mangaluru-historical-2018"
    assert catalog.flood_extent_geojson_path is not None
    assert Path(catalog.flood_extent_geojson_path).exists()
