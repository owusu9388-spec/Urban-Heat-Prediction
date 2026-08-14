"""Explanation service: surfaces model feature importance for a location.

For this MVP, global model feature-importance (from the trained RandomForest)
is used rather than a per-instance method like SHAP — a deliberate,
documented scope decision (see Technical Debt register). This is explicitly
labelled as feature importance, not a causal explanation.
"""

from app.ml.model_loader import get_model_bundle
from app.models.location import Location
from app.schemas.prediction import ExplainResponse, FactorImportance


def explain_location(location: Location) -> ExplainResponse:
    bundle = get_model_bundle()
    # Sort features by importance, descending, and return the top contributors.
    sorted_factors = sorted(
        bundle.feature_importances.items(), key=lambda kv: kv[1], reverse=True
    )
    factors = [
        FactorImportance(feature=name, importance=round(importance, 4))
        for name, importance in sorted_factors
    ]
    return ExplainResponse(
        location_id=location.id,
        risk_score=location.risk_score,
        factors=factors,
    )
