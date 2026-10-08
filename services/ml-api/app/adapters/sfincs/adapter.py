from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Union
from pathlib import Path
from app.schemas.sfincs import SFINCSMetadata
from app.schemas.prediction import NormalizedFloodPrediction, SeverityLevel, RiskDriver
from app.adapters.sfincs.parser import SFINCSOutputParser

def classify_flood_severity(max_depth_m: float) -> SeverityLevel:
    """
    Deterministically determines flood severity based on maximum physical depth.
    Follows CoastShield AI standard thresholds:
      - depth < 0.15m: LOW (minor puddling/nuisance)
      - 0.15m <= depth < 0.5m: MODERATE (water on roads, minor building risk)
      - 0.5m <= depth < 1.5m: HIGH (significant flooding, structural hazard)
      - depth >= 1.5m: CRITICAL (life-safety threat, severe inundation)
    """
    if max_depth_m < 0.15:
        return "LOW"
    elif max_depth_m < 0.50:
        return "MODERATE"
    elif max_depth_m < 1.50:
        return "HIGH"
    else:
        return "CRITICAL"

class SFINCSAdapter:
    """
    Adapter that normalizes raw SFINCS hydrodynamic outputs into CoastShield's
    standardized FloodPrediction contract.
    Ensures scientific accuracy:
      - Does not invent fake ML probability or confidence.
      - Maintains deterministic flag.
      - Translates local timestamps and physical depths to standard contracts.
    """

    def __init__(self, parser: Optional[SFINCSOutputParser] = None):
        self.parser = parser or SFINCSOutputParser()

    def normalize(
        self,
        metadata: SFINCSMetadata,
        flood_extent_geojson: Optional[Dict[str, Any]] = None,
        zone_id: str = "zone-mangaluru-coastal",
    ) -> NormalizedFloodPrediction:
        """
        Normalizes SFINCS metadata and GeoJSON extent into CoastShield FloodPrediction format.
        """
        # Parse simulation start time
        try:
            start_dt = datetime.fromisoformat(metadata.start_time.replace("Z", "+00:00"))
        except Exception:
            start_dt = datetime.now(timezone.utc)

        # Standard Mangaluru SFINCS baseline event timings:
        # Onset occurs ~20 min after extreme rainfall begins (20 min offset)
        # Peak water depth occurs at 3 hours / 180 min
        onset_dt = start_dt + timedelta(minutes=20)
        peak_dt = start_dt + timedelta(minutes=180)

        onset_iso = onset_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        peak_iso = peak_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Classify physical severity
        severity = classify_flood_severity(metadata.max_depth_m)

        # Extract primary GeoJSON geometry
        primary_geom = self.parser.extract_primary_geometry(flood_extent_geojson)

        # Build compound risk drivers from forcing data
        drivers = []
        if metadata.forcing:
            if metadata.forcing.rainfall_source:
                drivers.append(RiskDriver(
                    factor="Monsoon Downpour",
                    contribution=0.6,
                    description=metadata.forcing.rainfall_source,
                ))
            if metadata.forcing.tide_source:
                drivers.append(RiskDriver(
                    factor="Tidal Surge",
                    contribution=0.4,
                    description=metadata.forcing.tide_source,
                ))

        # Physical metrics
        metrics = {
            "meanFloodedDepthM": metadata.mean_flooded_depth_m,
            "floodedAreaKm2": metadata.flooded_area_km2,
            "gridResolutionM": metadata.grid_resolution_m,
            "crs": metadata.crs,
            "verticalDatum": metadata.vertical_datum,
            "onsetThresholdM": metadata.onset_threshold_m,
            "floodThresholdM": metadata.flood_threshold_m,
        }

        forcing_dict = {}
        if metadata.forcing:
            if metadata.forcing.rainfall_source:
                forcing_dict["rainfallSource"] = metadata.forcing.rainfall_source
            if metadata.forcing.tide_source:
                forcing_dict["tideSource"] = metadata.forcing.tide_source

        return NormalizedFloodPrediction(
            eventId=metadata.simulation_id,
            zoneId=zone_id,
            timestamp=metadata.start_time,
            probability=None,  # Physics hydrodynamic model: deterministic depth, not statistical probability!
            isDeterministic=True,
            severity=severity,
            onset=onset_iso,
            peak=peak_iso,
            depthMin=metadata.flood_threshold_m,
            depthMax=metadata.max_depth_m,
            confidence=None,  # Physics model does not output fake ML confidence
            modelVersion=f"{metadata.model}-{metadata.model_version}",
            source="sfincs",
            floodGeometry=primary_geom,
            metrics=metrics,
            forcing=forcing_dict,
            drivers=drivers,
        )

    def load_and_normalize(
        self,
        directory: Optional[Union[str, Path]] = None,
        zone_id: str = "zone-mangaluru-coastal",
    ) -> NormalizedFloodPrediction:
        """
        Loads metadata and GeoJSON extent from the specified directory and returns
        the normalized CoastShield FloodPrediction.
        """
        metadata = self.parser.parse_metadata(directory)
        extent_geojson = self.parser.parse_flood_extent_geojson(directory)
        return self.normalize(metadata, extent_geojson, zone_id=zone_id)
