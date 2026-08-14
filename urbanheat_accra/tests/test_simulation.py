def test_simulate_vegetation_increase(client):
    response = client.post("/simulate", json={"location_id": 1, "delta_vegetation_pct": 10})
    assert response.status_code == 200
    body = response.json()
    assert body["location_id"] == 1
    assert "original_risk" in body
    assert "simulated_risk" in body
    assert "difference" in body
    assert "percentage_change" in body
    assert "assumption" in body


def test_simulate_unknown_location_returns_404(client):
    response = client.post("/simulate", json={"location_id": 999999, "delta_vegetation_pct": 10})
    assert response.status_code == 404


def test_simulate_out_of_bounds_delta_returns_422(client):
    response = client.post("/simulate", json={"location_id": 1, "delta_vegetation_pct": 500})
    assert response.status_code == 422


def test_explain_returns_ranked_factors(client):
    response = client.get("/explain/1")
    assert response.status_code == 200
    body = response.json()
    assert body["location_id"] == 1
    assert len(body["factors"]) > 0
    importances = [f["importance"] for f in body["factors"]]
    assert importances == sorted(importances, reverse=True)


def test_explain_unknown_location_returns_404(client):
    response = client.get("/explain/999999")
    assert response.status_code == 404
