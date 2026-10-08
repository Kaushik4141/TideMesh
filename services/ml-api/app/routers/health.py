from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    outputs_exist = settings.outputs_dir.exists()
    has_metadata = (settings.outputs_dir / "metadata.json").exists()
    has_extent = (settings.outputs_dir / "flood_extent.geojson").exists()

    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.version,
        "sfincs": {
            "outputs_dir": str(settings.outputs_dir),
            "outputs_exist": outputs_exist,
            "has_metadata": has_metadata,
            "has_flood_extent": has_extent,
        },
    }
