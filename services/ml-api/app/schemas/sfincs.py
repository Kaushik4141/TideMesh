from typing import Optional, Dict, Any, List, Literal, Annotated
from pydantic import BaseModel, Field, ConfigDict, model_validator

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
    purpose: str = "scenario"
    operational: bool = False
    validation_status: str = "unvalidated"
    terrain_source: str = "unknown"
    artifact_kind: str = "maximum_extent"
    frames: List[Dict[str, Any]] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)

class SFINCSOutputsCatalog(BaseModel):
    simulation_id: str
    metadata: SFINCSMetadata
    flood_extent_geojson_path: Optional[str] = None
    flood_depth_tif_path: Optional[str] = None
    peak_depth_tif_path: Optional[str] = None
    onset_time_tif_path: Optional[str] = None
    peak_time_tif_path: Optional[str] = None
    artifact_kind: str = "maximum_extent"
    frames: List[Dict[str, Any]] = Field(default_factory=list)

class SimulationRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    # Callers cannot choose filesystem IDs or repurpose the Mangaluru terrain.
    zoneId: Literal["zone-mangaluru-coastal"] = "zone-mangaluru-coastal"
    rainfallRateMmHr: Optional[Annotated[float, Field(ge=0, le=1000)]] = None
    rainfallSeries: Optional[List[Annotated[float, Field(ge=0, le=1000)]]] = Field(None, min_length=7, max_length=7)
    surgeLevelM: float = Field(1.5, ge=-5, le=10)
    durationHours: Literal[6] = 6
    scenarioName: Optional[str] = Field(None, max_length=200)

    @model_validator(mode="after")
    def explicit_rainfall(self):
        if self.rainfallRateMmHr is None and self.rainfallSeries is None:
            raise ValueError("Explicit scenario rainfall rate or seven hourly values are required")
        return self

class SimulationRunResponse(BaseModel):
    status: str
    simulation_id: str
    execution_time_seconds: float
    forecast: Dict[str, Any]
