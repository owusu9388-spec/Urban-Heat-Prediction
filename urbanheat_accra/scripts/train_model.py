"""
train_model.py

Trains the UrbanHeat Accra heat-risk regression model.

IMPORTANT (see data/locations.csv generation script for full context):
The training data's input features and target risk_score are derived from a
SYNTHETIC demo dataset for this 48-hour academic MVP, not validated satellite
observations. The model and its metrics below are real (actually trained and
evaluated on this run) but the underlying data is illustrative.

Target construction:
`risk_score` (0-100) is built as a transparent weighted combination of the
normalised input features (see `compute_target_risk_score`), NOT invented
per-row. The model is then trained to learn/approximate that function from
the features, which lets `/predict` generalise to feature combinations that
don't exist in the seed CSV (e.g. the simulation endpoint's what-if inputs).

Run:
    python scripts/train_model.py
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

RANDOM_SEED = 42

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "locations.csv"
MODEL_OUTPUT_PATH = ROOT / "models" / "heat_risk_model.pkl"
METRICS_OUTPUT_PATH = ROOT / "models" / "training_metrics.json"

FEATURE_COLUMNS = [
    "ndvi",
    "land_surface_temperature",
    "built_up_density",
    "impervious_surface",
    "population_density",
    "vegetation_percentage",
]


def compute_target_risk_score(df: pd.DataFrame) -> pd.Series:
    """Derive a 0-100 heat-risk label from features via a transparent,
    documented weighting (not a black box / not fabricated per-row).

    Weights reflect a simple, literature-informed intuition: LST and
    imperviousness/built-up density raise risk; vegetation lowers it;
    population density is a (smaller) exposure multiplier. This is an
    ILLUSTRATIVE composite, explicitly labelled as such in the API/UI,
    not a peer-reviewed heat-risk index.
    """
    lst_norm = (df["land_surface_temperature"] - df["land_surface_temperature"].min()) / (
        df["land_surface_temperature"].max() - df["land_surface_temperature"].min()
    )
    ndvi_norm = (df["ndvi"] - df["ndvi"].min()) / (df["ndvi"].max() - df["ndvi"].min())
    built_norm = df["built_up_density"]  # already 0-1
    imperv_norm = df["impervious_surface"]  # already 0-1
    pop_norm = (df["population_density"] - df["population_density"].min()) / (
        df["population_density"].max() - df["population_density"].min()
    )

    raw = (
        0.35 * lst_norm
        + 0.25 * (1 - ndvi_norm)
        + 0.20 * built_norm
        + 0.10 * imperv_norm
        + 0.10 * pop_norm
    )
    return (raw * 100).round(2)


def categorise_risk(score: float) -> str:
    if score < 35:
        return "Low"
    if score < 55:
        return "Moderate"
    if score < 75:
        return "High"
    return "Very High"


def main() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"{DATA_PATH} not found. Run scripts/generate_demo_data.py first "
            "(or supply a real dataset at this path)."
        )

    df = pd.read_csv(DATA_PATH)
    missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing expected columns: {missing}")

    df = df.dropna(subset=FEATURE_COLUMNS).reset_index(drop=True)
    df["risk_score"] = compute_target_risk_score(df)
    df["risk_category"] = df["risk_score"].apply(categorise_risk)

    X = df[FEATURE_COLUMNS]
    y = df["risk_score"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=RANDOM_SEED
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=6,
        min_samples_leaf=1,
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = r2_score(y_test, y_pred)

    print("=== UrbanHeat Accra — heat_risk_model training ===")
    print(f"Rows total: {len(df)} | train: {len(X_train)} | test: {len(X_test)}")
    print(f"MAE:  {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R^2:  {r2:.4f}")
    print(
        "NOTE: small n (30 rows, 8 held out for test) means these metrics are "
        "indicative only, not statistically robust — documented as a known "
        "limitation given the synthetic-data / 48h-constraint context."
    )

    feature_importances = dict(zip(FEATURE_COLUMNS, model.feature_importances_.tolist()))

    MODEL_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "feature_columns": FEATURE_COLUMNS,
            "feature_importances": feature_importances,
            "random_seed": RANDOM_SEED,
        },
        MODEL_OUTPUT_PATH,
    )
    print(f"Saved model to {MODEL_OUTPUT_PATH}")

    metrics = {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "feature_importances": feature_importances,
        "random_seed": RANDOM_SEED,
        "note": "Metrics computed on synthetic demo dataset; indicative only given small n.",
    }
    with open(METRICS_OUTPUT_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics to {METRICS_OUTPUT_PATH}")

    # Also persist the labelled dataset (features + risk_score/category) so
    # the seed script can load it straight into SQLite without recomputation.
    labelled_path = ROOT / "data" / "processed" / "locations_labelled.csv"
    df.to_csv(labelled_path, index=False)
    print(f"Saved labelled dataset to {labelled_path}")


if __name__ == "__main__":
    main()
