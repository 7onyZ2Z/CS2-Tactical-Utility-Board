def test_list_users_requires_admin(client, viewer_headers):
    resp = client.get("/api/users", headers=viewer_headers)
    assert resp.status_code == 403


def test_list_users(client, admin_headers):
    resp = client.get("/api/users", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_update_role(client, admin_headers, db_session):
    from app.auth import hash_password
    from app.models import User

    u = User(username="target", hashed_password=hash_password("p"), role="viewer")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)

    resp = client.put(
        f"/api/users/{u.id}/role",
        json={"role": "author"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "author"


def test_update_role_invalid(client, admin_headers, db_session):
    from app.auth import hash_password
    from app.models import User

    u = User(username="target2", hashed_password=hash_password("p"), role="viewer")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)

    resp = client.put(
        f"/api/users/{u.id}/role",
        json={"role": "superadmin"},
        headers=admin_headers,
    )
    assert resp.status_code == 400
