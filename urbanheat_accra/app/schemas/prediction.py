"""Pydantic schemas for the /predict and /explain endpoints.

All numeric bounds are enforced server-side (NFR6). Client-side constraints
in the frontend are a UX convenience only and must never be relied upon as
the sole validation layer.
"""

from pydantic import BaseModel, Field


class PredictByLocationRequest(BaseModel):
    """Predict using a location already stored in the database."""

    location_id: int = Field(..., gt=0, description="ID of a seeded location")


class PredictByFeaturesRequest(BaseModel):
    """Predict directly from raw features (no location_id required)."""

    ndvi: float = Field(..., ge=-1, le=1)
    land_surface_temperature: float = Field(..., ge=0, le=60)
    built_up_density: float = Field(..., ge=0, le=1)
    impervious_surface: float = Field(..., ge=0, le=1)
    population_density: float = Field(..., ge=0, le=100000)
    vegetation_percentage: float = Field(..., ge=0, le=100)


class PredictResponse(BaseModel):
    location_id: int | None = None
    risk_score: float
    risk_category: str
    disclaimer: str = "Relative urban heat-risk indicator, not a validated absolute measurement."


class FactorImportance(BaseModel):
    feature: str
    importance: float


class ExplainResponse(BaseModel):
    location_id: int
    risk_score: float
    factors: list[FactorImportance]
    disclaimer: str = (
        "Values reflect model feature importance, not proven causal effect. "
        "Feature importance indicates how much a variable influenced this "
        "prediction, not that it causes higher heat risk in reality."
    )
