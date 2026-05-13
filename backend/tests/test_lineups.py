from app.models import Lineup, Map


def _create_map(db_session):
    m = Map(name="dust2", display_name="Dust II")
    db_session.add(m)
    db_session.commit()
    db_session.refresh(m)
    return m


def test_list_lineups_requires_auth(client):
    resp = client.get("/api/lineups")
    assert resp.status_code == 401


def test_create_lineup(client, author_headers, db_session):
    m = _create_map(db_session)
    resp = client.post(
        "/api/lineups",
        json={
            "name": "Xbox烟",
            "map_id": m.id,
            "utility_type": "smoke",
            "side": "ct",
            "pos_x": 100.5,
            "pos_y": 200.3,
            "description": "从T出生点扔",
        },
        headers=author_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Xbox烟"
    assert data["utility_type"] == "smoke"
    assert data["side"] == "ct"
    assert data["pos_x"] == 100.5


def test_create_lineup_viewer_forbidden(client, viewer_headers, db_session):
    m = _create_map(db_session)
    resp = client.post(
        "/api/lineups",
        json={"name": "test", "map_id": m.id, "utility_type": "smoke", "side": "ct"},
        headers=viewer_headers,
    )
    assert resp.status_code == 403


def test_list_lineups_with_filters(client, admin_headers, db_session):
    m = _create_map(db_session)
    from app.auth import hash_password
    from app.models import User

    u = User(username="testauthor", hashed_password=hash_password("p"), role="author")
    db_session.add(u)
    db_session.commit()

    db_session.add(Lineup(name="烟1", map_id=m.id, utility_type="smoke", side="ct", created_by=u.id))
    db_session.add(Lineup(name="闪1", map_id=m.id, utility_type="flash", side="t", created_by=u.id))
    db_session.commit()

    resp = client.get("/api/lineups?utility_type=smoke", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1

    resp = client.get("/api/lineups?side=t", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1

    resp = client.get("/api/lineups?keyword=烟", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1


def test_get_lineup_detail(client, admin_headers, db_session):
    m = _create_map(db_session)
    from app.models import User

    u = User(username="auth2", hashed_password="x", role="author")
    db_session.add(u)
    db_session.commit()

    lineup = Lineup(name="测试", map_id=m.id, utility_type="he", side="ct", created_by=u.id)
    db_session.add(lineup)
    db_session.commit()
    db_session.refresh(lineup)

    resp = client.get(f"/api/lineups/{lineup.id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "测试"


def test_update_lineup_by_author(client, author_headers, db_session):
    m = _create_map(db_session)
    resp_me = client.get("/api/auth/me", headers=author_headers)
    author_id = resp_me.json()["id"]

    lineup = Lineup(name="旧名", map_id=m.id, utility_type="smoke", side="ct", created_by=author_id)
    db_session.add(lineup)
    db_session.commit()
    db_session.refresh(lineup)

    resp = client.put(
        f"/api/lineups/{lineup.id}",
        json={"name": "新名"},
        headers=author_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "新名"


def test_update_lineup_other_author_forbidden(client, author_headers, db_session):
    m = _create_map(db_session)
    lineup = Lineup(name="别人的", map_id=m.id, utility_type="smoke", side="ct", created_by=9999)
    db_session.add(lineup)
    db_session.commit()
    db_session.refresh(lineup)

    resp = client.put(
        f"/api/lineups/{lineup.id}",
        json={"name": "试图修改"},
        headers=author_headers,
    )
    assert resp.status_code == 403


def test_delete_lineup(client, author_headers, db_session):
    m = _create_map(db_session)
    resp_me = client.get("/api/auth/me", headers=author_headers)
    author_id = resp_me.json()["id"]

    lineup = Lineup(name="待删", map_id=m.id, utility_type="smoke", side="ct", created_by=author_id)
    db_session.add(lineup)
    db_session.commit()
    db_session.refresh(lineup)

    resp = client.delete(f"/api/lineups/{lineup.id}", headers=author_headers)
    assert resp.status_code == 204


def test_admin_can_delete_any(client, admin_headers, db_session):
    m = _create_map(db_session)
    lineup = Lineup(name="别人删", map_id=m.id, utility_type="smoke", side="ct", created_by=9999)
    db_session.add(lineup)
    db_session.commit()
    db_session.refresh(lineup)

    resp = client.delete(f"/api/lineups/{lineup.id}", headers=admin_headers)
    assert resp.status_code == 204
