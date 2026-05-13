import io

from app.models import Lineup, Map


def _create_lineup(db_session):
    m = Map(name="dust2", display_name="Dust II")
    db_session.add(m)
    db_session.commit()
    db_session.refresh(m)

    from app.models import User

    u = User(username="mediaauthor", hashed_password="x", role="author")
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)

    lineup = Lineup(name="test lineup", map_id=m.id, utility_type="smoke", side="ct", created_by=u.id)
    db_session.add(lineup)
    db_session.commit()
    db_session.refresh(lineup)
    return lineup, u


def test_upload_image(client, admin_headers, db_session):
    lineup, _ = _create_lineup(db_session)

    img_data = io.BytesIO(b"fake image content")
    resp = client.post(
        f"/api/lineups/{lineup.id}/media?file_type=image",
        files={"file": ("test.jpg", img_data, "image/jpeg")},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["file_type"] == "image"
    assert "file_path" in data


def test_upload_video(client, admin_headers, db_session):
    lineup, _ = _create_lineup(db_session)

    vid_data = io.BytesIO(b"fake video content")
    resp = client.post(
        f"/api/lineups/{lineup.id}/media?file_type=video",
        files={"file": ("test.mp4", vid_data, "video/mp4")},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["file_type"] == "video"


def test_upload_invalid_type(client, admin_headers, db_session):
    lineup, _ = _create_lineup(db_session)

    file_data = io.BytesIO(b"fake")
    resp = client.post(
        f"/api/lineups/{lineup.id}/media?file_type=image",
        files={"file": ("test.gif", file_data, "image/gif")},
        headers=admin_headers,
    )
    assert resp.status_code == 400


def test_delete_media(client, admin_headers, db_session):
    lineup, _ = _create_lineup(db_session)

    img_data = io.BytesIO(b"fake image content")
    upload_resp = client.post(
        f"/api/lineups/{lineup.id}/media?file_type=image",
        files={"file": ("test.jpg", img_data, "image/jpeg")},
        headers=admin_headers,
    )
    media_id = upload_resp.json()["id"]

    resp = client.delete(f"/api/media/{media_id}", headers=admin_headers)
    assert resp.status_code == 204


def test_upload_requires_auth(client, db_session):
    lineup, _ = _create_lineup(db_session)
    file_data = io.BytesIO(b"fake")
    resp = client.post(
        f"/api/lineups/{lineup.id}/media?file_type=image",
        files={"file": ("test.jpg", file_data, "image/jpeg")},
    )
    assert resp.status_code == 401
