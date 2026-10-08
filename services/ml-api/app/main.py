from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers.health import router as health_router
from app.routers.simulations import router as simulations_router

app = FastAPI(
    title=settings.service_name,
    version=settings.version,
    description="CoastShield AI / TideMesh Hydrodynamic SFINCS ML Simulation Microservice",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for internal Hono backend and development frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(health_router, prefix="/api/v1")
app.include_router(simulations_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "service": settings.service_name,
        "status": "online",
        "version": settings.version,
        "docs": "/docs",
        "endpoints": {
            "health": "/api/v1/health",
            "simulations": "/api/v1/simulations",
            "mangaluru_forecast": "/api/v1/simulations/mangaluru-historical-2018/forecast",
            "mangaluru_extent": "/api/v1/simulations/mangaluru-historical-2018/extent",
        },
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
