def test_list_locations_returns_seeded_rows(client):
    response = client.get("/locations")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) > 0
    first = body[0]
    for field in ("id", "name", "latitude", "longitude", "risk_score", "risk_category"):
        assert field in first


def test_get_location_by_id_returns_full_detail(client):
    response = client.get("/locations/1")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    for field in ("ndvi", "land_surface_temperature", "built_up_density", "risk_category"):
        assert field in body


def test_get_unknown_location_returns_404(client):
    response = client.get("/locations/999999")
    assert response.status_code == 404
    assert "error" in response.json()
