"""
Model loading + inference. Loaded once at startup (module import), reused
across requests -> keeps /predict well under NFR1's <1s target.

Explainability uses the model's global feature_importances_ combined with the
direction of each feature's relationship to risk (feature-importance approach,
not full SHAP — see Technical Debt register: "Acceptable temporarily").
"""
import os
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "heat_risk_model.pkl")

_bundle = joblib.load(MODEL_PATH)
MODEL = _bundle["model"]
FEATURES = _bundle["features"]

# Known direction of each feature's effect on risk, used for /explain.
# (More vegetation -> less risk; more built-up/farther from green space -> more risk.)
FEATURE_DIRECTIONS = {
    "ndvi": "decreases_risk",
    "built_up_density_pct": "increases_risk",
    "distance_to_green_space_m": "increases_risk",
    "elevation_m": "decreases_risk",
}

RISK_BANDS = [(30, "Low"), (55, "Moderate"), (75, "High"), (100.01, "Severe")]


def categorize(score: float) -> str:
    for threshold, label in RISK_BANDS:
        if score < threshold:
            return label
    return "Severe"


def predict_risk(ndvi: float, built_up_density_pct: float,
                  distance_to_green_space_m: float, elevation_m: float) -> dict:
    row = pd.DataFrame([{
        "ndvi": ndvi,
        "built_up_density_pct": built_up_density_pct,
        "distance_to_green_space_m": distance_to_green_space_m,
        "elevation_m": elevation_m,
    }])[FEATURES]
    score = float(MODEL.predict(row)[0])
    score = max(0.0, min(100.0, score))
    return {"risk_score": round(score, 1), "risk_category": categorize(score)}


def top_factors(n: int = 4) -> list[dict]:
    """Global feature importances, ranked — same ranking used for every /explain
    call since this is a feature-importance explanation, not a per-instance SHAP value."""
    importances = MODEL.feature_importances_
    ranked = sorted(zip(FEATURES, importances), key=lambda x: x[1], reverse=True)
    return [
        {
            "feature": f,
            "importance": round(float(imp), 3),
            "direction": FEATURE_DIRECTIONS.get(f, "unknown"),
        }
        for f, imp in ranked[:n]
    ]
