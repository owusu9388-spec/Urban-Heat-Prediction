"""Pydantic schemas for the /simulate what-if endpoint."""

from pydantic import BaseModel, Field


class SimulationRequest(BaseModel):
    location_id: int = Field(..., gt=0)
    delta_vegetation_pct: float = Field(
        ...,
        ge=-100,
        le=100,
        description="Change in vegetation percentage to simulate, e.g. +10 for a 10-point increase",
    )


class SimulationResponse(BaseModel):
    location_id: int
    original_risk: float
    simulated_risk: float
    difference: float
    percentage_change: float
    assumption: str = (
        "Illustrative simulation: vegetation change is translated into adjusted "
        "NDVI/vegetation-percentage inputs and re-scored by the trained model. "
        "This is not a physically validated microclimate simulation."
    )
