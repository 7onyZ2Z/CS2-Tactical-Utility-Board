def test_register_requires_admin(client):
    resp = client.post(
        "/api/auth/register",
        json={"username": "newuser", "password": "pass123"},
    )
    assert resp.status_code == 401


def test_register_success(client, admin_headers):
    resp = client.post(
        "/api/auth/register",
        json={"username": "newuser", "password": "pass123", "role": "author"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "newuser"
    assert data["role"] == "author"
    assert "id" in data


def test_register_duplicate_username(client, admin_headers):
    client.post(
        "/api/auth/register",
        json={"username": "dup", "password": "pass123"},
        headers=admin_headers,
    )
    resp = client.post(
        "/api/auth/register",
        json={"username": "dup", "password": "pass123"},
        headers=admin_headers,
    )
    assert resp.status_code == 400


def test_login_success(client, admin_token):
    assert admin_token is not None
    assert len(admin_token) > 0


def test_login_wrong_password(client):
    resp = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrong"},
    )
    assert resp.status_code == 401


def test_login_nonexistent_user(client):
    resp = client.post(
        "/api/auth/login",
        json={"username": "nobody", "password": "pass"},
    )
    assert resp.status_code == 401


def test_me_success(client, admin_headers):
    resp = client.get("/api/auth/me", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == "admin"


def test_me_no_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
