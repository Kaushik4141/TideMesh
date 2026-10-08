import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import settings
from app.schemas.prediction import NormalizedFloodPrediction
from app.schemas.sfincs import SFINCSMetadata, SFINCSOutputsCatalog
from app.adapters.sfincs.parser import SFINCSOutputParser
from app.adapters.sfincs.adapter import SFINCSAdapter

class SimulationService:
    """
    SimulationService orchestrates SFINCS hydrodynamic model runs, caches,
    and normalized intelligence serving for CoastShield.
    """

    def __init__(self):
        self.parser = SFINCSOutputParser(base_outputs_dir=settings.outputs_dir)
        self.adapter = SFINCSAdapter(parser=self.parser)

    def list_simulations(self) -> List[Dict[str, Any]]:
        """
        Returns catalog of available precomputed / historical hydrodynamic simulation events.
        """
        events = []
        # Check standard outputs directory
        try:
            metadata = self.parser.parse_metadata(settings.outputs_dir)
            events.append({
                "eventId": metadata.simulation_id,
                "name": metadata.event_name or "Mangaluru Historical Flood 2018",
                "location": metadata.location,
                "startTime": metadata.start_time,
                "endTime": metadata.end_time,
                "maxDepthM": metadata.max_depth_m,
                "floodedAreaKm2": metadata.flooded_area_km2,
                "model": f"{metadata.model} {metadata.model_version}",
                "status": "ready",
            })
        except Exception:
            pass

        # Check baseline simulations dir if distinct
        if settings.sfincs_baseline_dir.exists() and settings.sfincs_baseline_dir != settings.outputs_dir:
            try:
                meta_base = self.parser.parse_metadata(settings.sfincs_baseline_dir)
                if not any(e["eventId"] == meta_base.simulation_id for e in events):
                    events.append({
                        "eventId": meta_base.simulation_id,
                        "name": meta_base.event_name or "Mangaluru Baseline Event",
                        "location": meta_base.location,
                        "startTime": meta_base.start_time,
                        "endTime": meta_base.end_time,
                        "maxDepthM": meta_base.max_depth_m,
                        "floodedAreaKm2": meta_base.flooded_area_km2,
                        "model": f"{meta_base.model} {meta_base.model_version}",
                        "status": "ready",
                    })
            except Exception:
                pass

        return events

    def get_forecast(
        self,
        event_id: str,
        zone_id: str = "zone-mangaluru-coastal",
    ) -> NormalizedFloodPrediction:
        """
        Retrieves the normalized FloodPrediction for the specified event ID.
        """
        # Look in outputs_dir first
        try:
            prediction = self.adapter.load_and_normalize(settings.outputs_dir, zone_id=zone_id)
            if prediction.eventId == event_id or event_id in ("default", "latest", "mangaluru-historical-2018"):
                return prediction
        except Exception:
            pass

        # Look in baseline outputs
        if settings.sfincs_baseline_dir.exists():
            prediction = self.adapter.load_and_normalize(settings.sfincs_baseline_dir, zone_id=zone_id)
            return prediction

        raise FileNotFoundError(f"Simulation event '{event_id}' outputs not found.")

    def get_flood_extent(self, event_id: str) -> Dict[str, Any]:
        """
        Retrieves the GeoJSON FeatureCollection flood extent polygon for the specified event ID.
        """
        # Check outputs_dir
        extent = self.parser.parse_flood_extent_geojson(settings.outputs_dir)
        if extent:
            return extent

        if settings.sfincs_baseline_dir.exists():
            extent = self.parser.parse_flood_extent_geojson(settings.sfincs_baseline_dir)
            if extent:
                return extent

        raise FileNotFoundError(f"Flood extent GeoJSON for event '{event_id}' not found.")

    def get_catalog(self, event_id: str) -> SFINCSOutputsCatalog:
        """
        Returns full file artifact catalog for the specified event.
        """
        try:
            return self.parser.catalog_outputs(settings.outputs_dir)
        except Exception:
            return self.parser.catalog_outputs(settings.sfincs_baseline_dir)

simulation_service = SimulationService()
