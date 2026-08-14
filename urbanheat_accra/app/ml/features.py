"""Shared feature/label helpers used by services and the training script.

Kept in sync with scripts/train_model.py's categorise_risk so the API and
the offline training script never disagree on category boundaries.
"""


def categorise_risk(score: float) -> str:
    if score < 35:
        return "Low"
    if score < 55:
        return "Moderate"
    if score < 75:
        return "High"
    return "Very High"


FEATURE_ORDER = [
    "ndvi",
    "land_surface_temperature",
    "built_up_density",
    "impervious_surface",
    "population_density",
    "vegetation_percentage",
]
