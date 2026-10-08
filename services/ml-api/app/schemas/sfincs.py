from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class SFINCSForcing(BaseModel):
    rainfall_source: Optional[str] = Field(None, description="Rainfall forcing dataset or gauge description")
    tide_source: Optional[str] = Field(None, description="Tidal or water level boundary forcing description")

class SFINCSMetadata(BaseModel):
    model: str = Field(default="SFINCS", description="Numerical model name")
    model_version: str = Field(default="v2.4.2", description="Model release version")
    location: str = Field(..., description="Geographic location / domain name")
    event_name: Optional[str] = Field(None, description="Name of the meteorological / flood event")
    simulation_id: str = Field(..., description="Unique simulation identifier")
    start_time: str = Field(..., description="ISO 8601 simulation start timestamp")
    end_time: str = Field(..., description="ISO 8601 simulation end timestamp")
    time_step_minutes: Optional[int] = Field(5, description="Computational timestep in minutes")
    grid_resolution_m: Optional[int] = Field(50, description="Grid cell size in meters")
    crs: str = Field(default="EPSG:32643", description="Projected coordinate reference system")
    vertical_datum: str = Field(default="MSL", description="Vertical datum (e.g., MSL, NAVD88)")
    max_depth_m: float = Field(..., description="Maximum peak water depth in meters")
    mean_flooded_depth_m: Optional[float] = Field(None, description="Mean depth across inundated cells")
    flooded_area_km2: Optional[float] = Field(None, description="Total inundated footprint area in sq km")
    onset_threshold_m: Optional[float] = Field(0.05, description="Depth threshold for onset calculation")
    flood_threshold_m: Optional[float] = Field(0.10, description="Depth threshold defining flood extent")
    forcing: Optional[SFINCSForcing] = None

class SFINCSOutputsCatalog(BaseModel):
    simulation_id: str
    metadata: SFINCSMetadata
    flood_extent_geojson_path: Optional[str] = None
    flood_depth_tif_path: Optional[str] = None
    peak_depth_tif_path: Optional[str] = None
    onset_time_tif_path: Optional[str] = None
    peak_time_tif_path: Optional[str] = None

class SimulationRunRequest(BaseModel):
    eventId: Optional[str] = None
    zoneId: str = "zone-mangaluru-coastal"
    rainfallRateMmHr: Optional[float] = None
    rainfallSeries: Optional[List[float]] = None
    surgeLevelM: Optional[float] = 1.5
    durationHours: int = 6
    scenarioName: Optional[str] = None

class SimulationRunResponse(BaseModel):
    status: str
    simulation_id: str
    execution_time_seconds: float
    forecast: Dict[str, Any]
