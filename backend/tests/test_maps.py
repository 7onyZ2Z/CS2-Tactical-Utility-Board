from app.models import Map


def test_list_maps_requires_auth(client):
    resp = client.get("/api/maps")
    assert resp.status_code == 401


def test_list_maps(client, admin_headers, db_session):
    db_session.add(Map(name="dust2", display_name="Dust II"))
    db_session.add(Map(name="mirage", display_name="Mirage"))
    db_session.commit()

    resp = client.get("/api/maps", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    names = [m["name"] for m in data]
    assert "dust2" in names
    assert "mirage" in names
