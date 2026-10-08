from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.schemas.prediction import NormalizedFloodPrediction
from app.schemas.sfincs import SFINCSOutputsCatalog, SimulationRunRequest
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

@router.post("/run", response_model=NormalizedFloodPrediction, status_code=201)
def run_simulation(request: SimulationRunRequest):
    """
    Triggers an on-demand SFINCS hydrodynamic simulation (<10-15s execution).
    Accepts dynamic boundary forcing (rainfall, tide, storm surge),
    runs the hydrodynamic solver in Docker, extracts flood extent polygons,
    and returns a normalized CoastShield FloodPrediction.
    """
    try:
        return simulation_service.run_simulation(
            event_id=request.eventId,
            zone_id=request.zoneId or "zone-mangaluru-coastal",
            rainfall_rate_mm_hr=request.rainfallRateMmHr,
            rainfall_series=request.rainfallSeries,
            surge_level_m=request.surgeLevelM,
            duration_hours=request.durationHours,
            scenario_name=request.scenarioName,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation run failed: {str(e)}")

