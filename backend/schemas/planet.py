from pydantic import BaseModel, Field


class PlanetInput(BaseModel):
    mass: float = Field(..., ge=0.1, le=50)
    radius: float = Field(..., ge=0.1, le=25)
    temperature: float = Field(..., ge=50, le=1000)
    pressure: float = Field(..., ge=0, le=200)
    greenhouse: float = Field(..., ge=0, le=2)
    semi_major_axis: float = Field(..., ge=0.01, le=100)
    orbital_period: float = Field(..., ge=1, le=10000)
    stellar_flux: float = Field(..., ge=0.01, le=10)
    star_temp: float = Field(..., ge=2000, le=40000)
    star_luminosity: float = Field(..., ge=0.001, le=1000)


class PlanetAnalysisResponse(BaseModel):
    input: PlanetInput
    prediction: dict
    derived_metrics: dict
    summary: str
