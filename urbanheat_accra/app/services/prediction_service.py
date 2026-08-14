"""Prediction service: turns feature vectors into a risk_score/category using
the singleton-loaded model. Contains no I/O beyond the model bundle."""

import pandas as pd

from app.ml.features import categorise_risk
from app.ml.model_loader import get_model_bundle
from app.models.location import Location


def predict_from_features(features: dict[str, float]) -> tuple[float, str]:
    """Run the trained model on a feature dict, returning (risk_score, category)."""
    bundle = get_model_bundle()
    row = pd.DataFrame([{col: features[col] for col in bundle.feature_columns}])
    raw_score = float(bundle.model.predict(row)[0])
    score = round(max(0.0, min(100.0, raw_score)), 2)
    category = categorise_risk(score)
    return score, category


def predict_from_location(location: Location) -> tuple[float, str]:
    features = {
        "ndvi": location.ndvi,
        "land_surface_temperature": location.land_surface_temperature,
        "built_up_density": location.built_up_density,
        "impervious_surface": location.impervious_surface,
        "population_density": location.population_density,
        "vegetation_percentage": location.vegetation_percentage,
    }
    return predict_from_features(features)
