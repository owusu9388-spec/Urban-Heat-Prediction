"""
Pydantic schemas. Every POST body is validated here — this is the server-side
input-validation layer that satisfies NFR6 "for free" (per Section 8.7).
FastAPI auto-returns 422 with field-level errors on violation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List


# ---------- Locations ----------

class LocationOut(BaseModel):
    id: int
    name: str
    neighbourhood: Optional[str] = None
    latitude: float
    longitude: float
    ndvi: float
    built_up_density_pct: float
    distance_to_green_space_m: float
    elevation_m: float
    risk_score: float
    risk_category: str

    class Config:
        from_attributes = True


class LocationListOut(BaseModel):
    count: int
    results: List[LocationOut]


# ---------- Predict ----------

class PredictRequest(BaseModel):
    ndvi: float = Field(..., ge=-1, le=1, description="Normalised Difference Vegetation Index")
    built_up_density_pct: float = Field(..., ge=0, le=100)
    distance_to_green_space_m: float = Field(..., ge=0, le=20000)
    elevation_m: float = Field(..., ge=0, le=1000)


class PredictResponse(BaseModel):
    risk_score: float
    risk_category: str


# ---------- Explain ----------

class FeatureContribution(BaseModel):
    feature: str
    importance: float
    direction: str  # "increases_risk" | "decreases_risk"


class ExplainResponse(BaseModel):
    location_id: int
    risk_score: float
    risk_category: str
    top_factors: List[FeatureContribution]


# ---------- Simulate ----------

class SimulateRequest(BaseModel):
    location_id: int
    delta_vegetation_pct: float = Field(
        ..., ge=0, le=100,
        description="Percentage-point increase in vegetation cover to simulate"
    )


class SimulateResponse(BaseModel):
    location_id: int
    before_risk_score: float
    after_risk_score: float
    before_risk_category: str
    after_risk_category: str
    ndvi_before: float
    ndvi_after: float
    note: str = "Simplified linear NDVI adjustment — illustrative, not a physical model."


# ---------- Errors ----------

class ErrorResponse(BaseModel):
    error: str
