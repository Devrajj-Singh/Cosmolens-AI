from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.auth_api import router as auth_router
from backend.api.explorer_api import router as explorer_router
from backend.api.planet_api import router as planet_router
from backend.config import FRONTEND_ORIGIN

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:3101", "http://localhost:3101"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(explorer_router, prefix="/api/explorer", tags=["explorer"])
app.include_router(planet_router, prefix="/api/planet", tags=["planet"])


@app.get("/")
def read_root():
    return {"message": "Backend running"}


@app.get("/health")
def read_health():
    return {"status": "ok"}
