from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.schemas.prediction import NormalizedFloodPrediction
from app.schemas.sfincs import SFINCSOutputsCatalog, SimulationRunRequest
from app.services.simulation_service import simulation_service, RunConflictError

router = APIRouter(prefix="/simulations", tags=["SFINCS Hydrodynamic Simulations"])

def simulation_error(error: Exception) -> HTTPException:
    if isinstance(error, RunConflictError):
        return HTTPException(status_code=409, detail="Simulation event cannot be resolved uniquely or overwritten")
    if isinstance(error, FileNotFoundError):
        return HTTPException(status_code=404, detail="Simulation event was not found or is incomplete")
    if isinstance(error, ValueError):
        return HTTPException(status_code=400, detail="Invalid simulation event or inputs")
    return HTTPException(status_code=500, detail="Simulation processing failed")

@router.get("/{event_id}/run")
def get_simulation_run(event_id: str):
    """Immutable RunSnapshot, with execution provenance unknown for legacy outputs."""
    try:
        return simulation_service.get_run(event_id)
    except Exception as error:
        raise simulation_error(error) from None

@router.get("", response_model=List[Dict[str, Any]])
def list_simulations():
    """
    Lists available hydrodynamic simulation events.
    """
    try:
        return simulation_service.list_simulations()
    except Exception as error:
        raise simulation_error(error) from None

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
    except Exception as error:
        raise simulation_error(error) from None

@router.get("/{event_id}/extent")
def get_simulation_flood_extent(event_id: str):
    """
    Retrieves GeoJSON FeatureCollection of the flood inundation polygon (EPSG:4326).
    """
    try:
        return simulation_service.get_flood_extent(event_id)
    except Exception as error:
        raise simulation_error(error) from None

@router.get("/{event_id}/catalog", response_model=SFINCSOutputsCatalog)
def get_simulation_catalog(event_id: str):
    """
    Retrieves catalog of all available raster and vector artifacts for this simulation.
    """
    try:
        return simulation_service.get_catalog(event_id)
    except Exception as error:
        raise simulation_error(error) from None

@router.post("/run", response_model=NormalizedFloodPrediction)
def run_simulation(
    req: SimulationRunRequest,
):
    """
    Triggers an on-demand SFINCS hydrodynamic simulation in Docker.
    Returns normalized FloodPrediction with real PostGIS geometries.
    """
    try:
        return simulation_service.run_simulation(
            event_id=req.eventId,
            zone_id=req.zoneId,
            rainfall_rate_mm_hr=req.rainfallRateMmHr,
            rainfall_series=req.rainfallSeries,
            surge_level_m=req.surgeLevelM,
            duration_hours=req.durationHours,
            scenario_name=req.scenarioName,
        )
    except Exception as error:
        raise simulation_error(error) from None
