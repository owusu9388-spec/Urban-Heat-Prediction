"""
Core API tests. Run:
    pytest -v

These map to Testing_Report.pdf test cases (TC-prefixed in comments) so you can
copy pass/fail results straight into your documentation.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import Location

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    """Ensure at least one known location exists for tests that need an id."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(Location).count() == 0:
        db.add(Location(
            name="Test Site", neighbourhood="Test Area",
            latitude=5.6, longitude=-0.2,
            ndvi=0.3, built_up_density_pct=60,
            distance_to_green_space_m=500, elevation_m=40,
            risk_score=62.0, risk_category="High",
        ))
        db.commit()
    db.close()
    yield


# TC1 — health check
def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# TC2 — list locations (functional + integration: hits DB)
def test_list_locations():
    r = client.get("/api/locations")
    assert r.status_code == 200
    body = r.json()
    assert "results" in body
    assert body["count"] == len(body["results"])


# TC3 — predict with valid input
def test_predict_valid():
    r = client.post("/api/predict", json={
        "ndvi": 0.4,
        "built_up_density_pct": 50,
        "distance_to_green_space_m": 300,
        "elevation_m": 30,
    })
    assert r.status_code == 200
    body = r.json()
    assert 0 <= body["risk_score"] <= 100
    assert body["risk_category"] in {"Low", "Moderate", "High", "Severe"}


# TC4 — predict with invalid input (out-of-range NDVI) -> 422, satisfies NFR6
def test_predict_invalid_ndvi():
    r = client.post("/api/predict", json={
        "ndvi": 5.0,  # out of [-1, 1]
        "built_up_density_pct": 50,
        "distance_to_green_space_m": 300,
        "elevation_m": 30,
    })
    assert r.status_code == 422


# TC5 — unknown location -> 404, not a 500
def test_get_unknown_location():
    r = client.get("/api/locations/999999")
    assert r.status_code == 404


# TC6 — explain for an existing location
def test_explain_first_location():
    locs = client.get("/api/locations").json()["results"]
    assert len(locs) > 0
    loc_id = locs[0]["id"]
    r = client.get(f"/api/explain/{loc_id}")
    assert r.status_code == 200
    body = r.json()
    assert len(body["top_factors"]) > 0


# TC7 — simulate a vegetation increase and confirm risk moves down or stays equal
def test_simulate_reduces_or_maintains_risk():
    locs = client.get("/api/locations").json()["results"]
    loc_id = locs[0]["id"]
    r = client.post("/api/simulate", json={
        "location_id": loc_id,
        "delta_vegetation_pct": 20,
    })
    assert r.status_code == 200
    body = r.json()
    assert body["after_risk_score"] <= body["before_risk_score"] + 0.01  # allow float noise


# TC8 — malformed simulate body -> 422
def test_simulate_malformed():
    r = client.post("/api/simulate", json={"location_id": "not-an-int"})
    assert r.status_code == 422
