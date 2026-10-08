from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, Field

SeverityLevel = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]

class RiskDriver(BaseModel):
    factor: str
    contribution: float = Field(..., ge=0.0, le=1.0)
    description: Optional[str] = None

class NormalizedFloodPrediction(BaseModel):
    id: Optional[str] = None
    eventId: Optional[str] = Field(None, description="Identifier for historical or scenario event")
    zoneId: str = Field(..., description="Target municipal / coastal zone identifier")
    timestamp: str = Field(..., description="Forecast / simulation baseline ISO timestamp")
    probability: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Statistical probability (null for deterministic physics hydrodynamic models)",
    )
    isDeterministic: bool = Field(
        True,
        description="True if generated from deterministic physical hydrodynamic laws rather than statistical classifiers",
    )
    severity: SeverityLevel = Field(..., description="Standardized severity level: LOW, MODERATE, HIGH, CRITICAL")
    onset: Optional[str] = Field(None, description="Estimated time of flood onset ISO timestamp")
    peak: Optional[str] = Field(None, description="Estimated time of maximum flood depth ISO timestamp")
    depthMin: Optional[float] = Field(None, ge=0.0, description="Minimum flood threshold depth in meters")
    depthMax: Optional[float] = Field(None, ge=0.0, description="Maximum peak water depth in meters")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence metric if calculated")
    modelVersion: str = Field(..., description="Model identifier and version, e.g. SFINCS-v2.4.2")
    source: str = Field("sfincs", description="Model engine source (e.g. sfincs, xgb, ensemble)")
    floodGeometry: Optional[Dict[str, Any]] = Field(
        None,
        description="GeoJSON Polygon/MultiPolygon representation in WGS 84 (EPSG:4326)",
    )
    metrics: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Physical metrics such as floodedAreaKm2, meanFloodedDepthM, gridResolutionM",
    )
    forcing: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Compound boundary forcing descriptions (rainfall, tide, storm surge)",
    )
    drivers: Optional[List[RiskDriver]] = Field(
        default_factory=list,
        description="Key contributing environmental drivers",
    )
