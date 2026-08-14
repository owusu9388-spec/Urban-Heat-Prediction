"""
Trains heat_risk_model.pkl.

Run once (and any time you regenerate seed data):
    python train_model.py

This generates a synthetic-but-realistic Accra dataset (replace with your real
curated/satellite-derived dataset when available — see Technical Debt register,
"Static/curated dataset instead of live satellite ingestion"). The relationship
between features and risk_score below is designed to be physically plausible:
- Higher NDVI (more vegetation) -> lower risk
- Higher built-up density -> higher risk
- Greater distance to green space -> higher risk
- Elevation has a small cooling effect at higher altitude

Outputs:
    app/heat_risk_model.pkl   (trained sklearn model, joblib-dumped)
    app/seed_locations.csv    (the data used, for the seed script to load)
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

np.random.seed(42)
N = 250

# Accra bounding box (rough)
LAT_RANGE = (5.55, 5.75)
LNG_RANGE = (-0.30, -0.05)

NEIGHBOURHOODS = [
    "Osu", "Adabraka", "Labadi", "East Legon", "Airport Residential",
    "Dansoman", "Achimota", "Madina", "Teshie", "Cantonments",
    "Nima", "Kaneshie", "Tema", "Spintex", "Dzorwulu",
]

ndvi = np.random.uniform(-0.1, 0.8, N)
built_up_density_pct = np.random.uniform(10, 95, N)
distance_to_green_space_m = np.random.exponential(scale=800, size=N).clip(0, 8000)
elevation_m = np.random.uniform(0, 90, N)

# Ground-truth-ish risk score generator (0-100), used only to synthesize labels
noise = np.random.normal(0, 4, N)
risk_score = (
    55
    - 40 * ndvi
    + 0.35 * built_up_density_pct
    + 0.004 * distance_to_green_space_m
    - 0.05 * elevation_m
    + noise
)
risk_score = risk_score.clip(0, 100)

df = pd.DataFrame({
    "name": [f"Site {i+1}" for i in range(N)],
    "neighbourhood": np.random.choice(NEIGHBOURHOODS, N),
    "latitude": np.random.uniform(*LAT_RANGE, N),
    "longitude": np.random.uniform(*LNG_RANGE, N),
    "ndvi": ndvi.round(3),
    "built_up_density_pct": built_up_density_pct.round(1),
    "distance_to_green_space_m": distance_to_green_space_m.round(1),
    "elevation_m": elevation_m.round(1),
    "risk_score": risk_score.round(1),
})


def categorize(score):
    if score < 30:
        return "Low"
    elif score < 55:
        return "Moderate"
    elif score < 75:
        return "High"
    return "Severe"


df["risk_category"] = df["risk_score"].apply(categorize)

FEATURES = ["ndvi", "built_up_density_pct", "distance_to_green_space_m", "elevation_m"]

model = RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42)
model.fit(df[FEATURES], df["risk_score"])

os.makedirs("app", exist_ok=True)
joblib.dump({"model": model, "features": FEATURES}, "app/heat_risk_model.pkl")
df.to_csv("app/seed_locations.csv", index=False)

print(f"Trained on {N} synthetic samples.")
print(f"Feature importances: {dict(zip(FEATURES, model.feature_importances_.round(3)))}")
print("Saved app/heat_risk_model.pkl and app/seed_locations.csv")
