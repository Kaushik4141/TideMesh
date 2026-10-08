import os
from pathlib import Path
from pydantic import BaseModel

# Resolve repository root from services/ml-api/app/config.py
APP_DIR = Path(__file__).resolve().parent
SERVICE_DIR = APP_DIR.parent
REPO_ROOT = SERVICE_DIR.parent.parent

class Settings(BaseModel):
    service_name: str = "TideMesh ML / Hydrodynamic Simulation Service"
    version: str = "0.1.0"
    host: str = os.getenv("ML_API_HOST", "0.0.0.0")
    port: int = int(os.getenv("ML_API_PORT", "8000"))
    
    # Path configurations
    repo_root: Path = REPO_ROOT
    outputs_dir: Path = Path(os.getenv("SFINCS_OUTPUTS_DIR", str(REPO_ROOT / "outputs")))
    sfincs_baseline_dir: Path = REPO_ROOT / "ml" / "sfincs" / "mangaluru" / "simulations" / "baseline" / "outputs"
    sfincs_mangaluru_dir: Path = REPO_ROOT / "ml" / "sfincs" / "mangaluru"
    
settings = Settings()
