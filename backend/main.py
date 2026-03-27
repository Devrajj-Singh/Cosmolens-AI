from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.auth_api import router as auth_router
from backend.config import FRONTEND_ORIGIN
from backend.api.explorer_api import router as explorer_router
from backend.api.planet_api import router as planet_router


app = FastAPI(
    title="CosmoLens AI Backend",
    version="0.1.0",
    description="APIs for explorer insights and planet habitability analysis.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3101",
        "http://127.0.0.1:3101",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    return {
        "name": "CosmoLens AI Backend",
        "status": "ok",
        "endpoints": {
            "health": "/health",
            "auth": "/api/auth",
            "explorer": "/api/explorer",
            "planet": "/api/planet",
        },
    }


@app.get("/health")
def health() -> dict:
    return {"status": "healthy"}


app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(explorer_router, prefix="/api/explorer", tags=["explorer"])
app.include_router(planet_router, prefix="/api/planet", tags=["planet"])
