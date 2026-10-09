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
        # Only observed solver map timestamps can establish onset and peak.
        # A maximum extent raster contains no timing information.
        frames = metadata.frames if metadata.artifact_kind == "time_series" else []
        onset_iso = next((frame["timestamp"] for frame in frames
                          if frame.get("maxDepthM", 0) >= (metadata.onset_threshold_m or 0.05)), None)
        peak_frame = max(frames, key=lambda frame: frame.get("maxDepthM", 0), default=None)
        peak_iso = peak_frame["timestamp"] if peak_frame and peak_frame.get("maxDepthM", 0) > 0 else None

        # Classify physical severity
        severity = classify_flood_severity(metadata.max_depth_m)

        # Extract primary GeoJSON geometry
        primary_geom = self.parser.extract_primary_geometry(flood_extent_geojson)

        # Forcing is not a causal attribution calculation.
        drivers = []

        # Physical metrics
        metrics = {
            "meanFloodedDepthM": metadata.mean_flooded_depth_m,
            "floodedAreaKm2": metadata.flooded_area_km2,
            "gridResolutionM": metadata.grid_resolution_m,
            "crs": metadata.crs,
            "verticalDatum": metadata.vertical_datum,
            "onsetThresholdM": metadata.onset_threshold_m,
            "floodThresholdM": metadata.flood_threshold_m,
            "purpose": "scenario",
            "operational": False,
            "validationStatus": "unvalidated",
            "terrainSource": metadata.terrain_source,
            "artifactKind": metadata.artifact_kind,
            "frameCount": len(frames),
            "frames": frames,
            "provenance": metadata.provenance,
            "startTime": metadata.start_time,
            "endTime": metadata.end_time,
            "timingBasis": "solver_map_time_series" if frames else None,
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
