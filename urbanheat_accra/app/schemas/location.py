"""Pydantic response schemas for location data."""

from pydantic import BaseModel, ConfigDict


class LocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    latitude: float
    longitude: float
    ndvi: float
    land_surface_temperature: float
    built_up_density: float
    impervious_surface: float
    population_density: float
    vegetation_percentage: float
    risk_score: float
    risk_category: str


class LocationSummary(BaseModel):
    """Lightweight shape used for map markers (list endpoint)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    latitude: float
    longitude: float
    risk_score: float
    risk_category: str
