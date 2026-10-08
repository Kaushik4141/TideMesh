from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict

class SFINCSForcing(BaseModel):
    rainfall_source: Optional[str] = Field(None, description="Rainfall forcing dataset or gauge description")
    tide_source: Optional[str] = Field(None, description="Tidal or water level boundary forcing description")

class SFINCSMetadata(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    model: str = Field(default="SFINCS", description="Numerical model name")
    model_version: str = Field(default="v2.4.2", description="Model release version")
    location: str = Field(..., description="Geographic location / domain name")
    event_name: Optional[str] = Field(None, description="Name of the meteorological / flood event")
    simulation_id: str = Field(..., description="Unique simulation identifier")
    start_time: str = Field(..., description="ISO 8601 simulation start timestamp")
    end_time: str = Field(..., description="ISO 8601 simulation end timestamp")
    time_step_minutes: Optional[int] = Field(5, description="Computational timestep in minutes")
    grid_resolution_m: Optional[float] = Field(50, gt=0, description="Grid cell size in meters")
    crs: str = Field(default="EPSG:32643", description="Projected coordinate reference system")
    vertical_datum: str = Field(default="MSL", description="Vertical datum (e.g., MSL, NAVD88)")
    max_depth_m: float = Field(..., ge=0, description="Maximum peak water depth in meters")
    mean_flooded_depth_m: Optional[float] = Field(None, description="Mean depth across inundated cells")
    flooded_area_km2: Optional[float] = Field(None, ge=0, description="Total inundated footprint area in sq km")
    onset_threshold_m: Optional[float] = Field(0.05, description="Depth threshold for onset calculation")
    flood_threshold_m: Optional[float] = Field(0.10, ge=0, description="Depth threshold defining flood extent")
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
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    eventId: Optional[str] = None
    zoneId: str = "zone-mangaluru-coastal"
    rainfallRateMmHr: Optional[float] = Field(None, ge=0, le=300)
    rainfallSeries: Optional[List[float]] = None
    surgeLevelM: Optional[float] = Field(1.5, ge=0, le=5)
    durationHours: int = Field(6, ge=1, le=12, strict=True)
    scenarioName: Optional[str] = Field(None, max_length=200)

class SimulationRunResponse(BaseModel):
    status: str
    simulation_id: str
    execution_time_seconds: float
    forecast: Dict[str, Any]
