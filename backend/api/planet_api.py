from fastapi import APIRouter

from backend.schemas.planet import PlanetAnalysisResponse, PlanetInput
from backend.services.planet_backend import analyze_planet


router = APIRouter()


@router.post("/analyze", response_model=PlanetAnalysisResponse)
def analyze(body: PlanetInput) -> PlanetAnalysisResponse:
    return PlanetAnalysisResponse(**analyze_planet(body))
