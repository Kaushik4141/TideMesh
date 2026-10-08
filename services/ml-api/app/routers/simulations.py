from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.schemas.prediction import NormalizedFloodPrediction
from app.schemas.sfincs import SFINCSOutputsCatalog
from app.services.simulation_service import simulation_service

router = APIRouter(prefix="/simulations", tags=["SFINCS Hydrodynamic Simulations"])

@router.get("", response_model=List[Dict[str, Any]])
def list_simulations():
    """
    Lists available hydrodynamic simulation events.
    """
    return simulation_service.list_simulations()

@router.get("/{event_id}/forecast", response_model=NormalizedFloodPrediction)
def get_simulation_forecast(
    event_id: str,
    zone_id: str = Query("zone-mangaluru-coastal", description="Associated zone ID"),
):
    """
    Retrieves normalized CoastShield FloodPrediction for the specified simulation event.
    Returns deterministic physical metrics (depths, onset, peak, extent) without faked probability.
    """
    try:
        return simulation_service.get_forecast(event_id, zone_id=zone_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process simulation: {str(e)}")

@router.get("/{event_id}/extent")
def get_simulation_flood_extent(event_id: str):
    """
    Retrieves GeoJSON FeatureCollection of the flood inundation polygon (EPSG:4326).
    """
    try:
        return simulation_service.get_flood_extent(event_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load flood extent: {str(e)}")

@router.get("/{event_id}/catalog", response_model=SFINCSOutputsCatalog)
def get_simulation_catalog(event_id: str):
    """
    Retrieves catalog of all available raster and vector artifacts for this simulation.
    """
    try:
        return simulation_service.get_catalog(event_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load catalog: {str(e)}")

@router.post("/run", response_model=NormalizedFloodPrediction)
def run_simulation(
    req: Dict[str, Any] = {},
):
    """
    Triggers an on-demand SFINCS hydrodynamic simulation in Docker.
    Returns normalized FloodPrediction with real PostGIS geometries.
    """
    try:
        return simulation_service.run_simulation(
            event_id=req.get("eventId"),
            zone_id=req.get("zoneId", "zone-mangaluru-coastal"),
            rainfall_rate_mm_hr=req.get("rainfallRateMmHr"),
            rainfall_series=req.get("rainfallSeries"),
            surge_level_m=req.get("surgeLevelM", 1.5),
            duration_hours=req.get("durationHours", 6),
            scenario_name=req.get("scenarioName"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation run failed: {str(e)}")
