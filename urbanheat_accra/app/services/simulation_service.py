"""Simulation service: illustrative "what-if" vegetation adjustment.

Approach (transparent, documented — see Technical Debt register): increasing
vegetation_percentage nudges NDVI upward using a simple linear mapping, then
the adjusted feature vector is re-scored by the same trained model used for
/predict. This is NOT a re-derived physical NDVI<->LST relationship; it is a
simple, clearly-labelled illustrative adjustment appropriate for a 48h MVP.
"""

from app.models.location import Location
from app.schemas.simulation import SimulationResponse
from app.services.prediction_service import predict_from_features


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def simulate_vegetation_change(location: Location, delta_vegetation_pct: float) -> SimulationResponse:
    original_score, _ = (location.risk_score, location.risk_category)

    new_vegetation_pct = _clamp(location.vegetation_percentage + delta_vegetation_pct, 0, 100)

    # Simple linear coupling: vegetation_percentage is roughly (ndvi+1)/2*100,
    # so we invert that relationship to nudge NDVI in the same direction.
    new_ndvi = _clamp((new_vegetation_pct / 100.0) * 2 - 1, -1, 1)

    simulated_features = {
        "ndvi": new_ndvi,
        "land_surface_temperature": location.land_surface_temperature,
        "built_up_density": location.built_up_density,
        "impervious_surface": location.impervious_surface,
        "population_density": location.population_density,
        "vegetation_percentage": new_vegetation_pct,
    }
    simulated_score, _ = predict_from_features(simulated_features)

    difference = round(simulated_score - original_score, 2)
    percentage_change = round((difference / original_score) * 100, 2) if original_score else 0.0

    return SimulationResponse(
        location_id=location.id,
        original_risk=original_score,
        simulated_risk=simulated_score,
        difference=difference,
        percentage_change=percentage_change,
    )
