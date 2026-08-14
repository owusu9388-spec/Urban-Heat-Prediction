def test_predict_by_location_id(client):
    response = client.post("/predict", json={"location_id": 1})
    assert response.status_code == 200
    body = response.json()
    assert body["location_id"] == 1
    assert 0 <= body["risk_score"] <= 100
    assert body["risk_category"] in {"Low", "Moderate", "High", "Very High"}
    assert "disclaimer" in body


def test_predict_by_raw_features(client):
    payload = {
        "ndvi": 0.25,
        "land_surface_temperature": 34.5,
        "built_up_density": 0.72,
        "impervious_surface": 0.65,
        "population_density": 8500,
        "vegetation_percentage": 45,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["location_id"] is None
    assert 0 <= body["risk_score"] <= 100


def test_predict_invalid_ndvi_returns_422(client):
    payload = {
        "ndvi": 5,  # out of [-1, 1] bounds
        "land_surface_temperature": 34.5,
        "built_up_density": 0.72,
        "impervious_surface": 0.65,
        "population_density": 8500,
        "vegetation_percentage": 45,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_predict_unknown_location_returns_404(client):
    response = client.post("/predict", json={"location_id": 999999})
    assert response.status_code == 404


def test_predict_latency_under_one_second(client):
    import time

    start = time.time()
    response = client.post("/predict", json={"location_id": 1})
    elapsed = time.time() - start
    assert response.status_code == 200
    assert elapsed < 1.0
