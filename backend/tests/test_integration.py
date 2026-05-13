"""端到端集成测试：管理员注册 -> 作者创建点位 -> 上传媒体 -> 搜索 -> 删除"""
import io

from app.models import Map


def test_full_workflow(client, admin_headers, db_session):
    # 0. 初始化地图数据（测试环境不运行 seed）
    db_session.add(Map(name="dust2", display_name="Dust II"))
    db_session.add(Map(name="mirage", display_name="Mirage"))
    db_session.commit()

    # 1. 管理员注册一个 author
    resp = client.post(
        "/api/auth/register",
        json={"username": "player1", "password": "pass123", "role": "author"},
        headers=admin_headers,
    )
    assert resp.status_code == 201
    author_id = resp.json()["id"]

    # 2. 作者登录
    resp = client.post("/api/auth/login", json={"username": "player1", "password": "pass123"})
    assert resp.status_code == 200
    author_token = resp.json()["access_token"]
    author_headers = {"Authorization": f"Bearer {author_token}"}

    # 3. 查看地图列表
    resp = client.get("/api/maps", headers=author_headers)
    assert resp.status_code == 200
    maps = resp.json()
    assert len(maps) > 0
    dust2 = next(m for m in maps if m["name"] == "dust2")

    # 4. 创建道具点位
    resp = client.post(
        "/api/lineups",
        json={
            "name": "A大烟雾",
            "map_id": dust2["id"],
            "utility_type": "smoke",
            "side": "ct",
            "pos_x": 150.0,
            "pos_y": 300.0,
            "description": "A大道烟雾弹",
        },
        headers=author_headers,
    )
    assert resp.status_code == 201
    lineup_id = resp.json()["id"]

    # 5. 上传图片
    img = io.BytesIO(b"fake jpg data")
    resp = client.post(
        f"/api/lineups/{lineup_id}/media?file_type=image",
        files={"file": ("demo.jpg", img, "image/jpeg")},
        headers=author_headers,
    )
    assert resp.status_code == 201
    media_id = resp.json()["id"]

    # 6. 搜索
    resp = client.get("/api/lineups?keyword=烟雾&utility_type=smoke", headers=author_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    # 7. 获取详情（含媒体）
    resp = client.get(f"/api/lineups/{lineup_id}", headers=author_headers)
    assert resp.status_code == 200
    assert len(resp.json()["media"]) == 1

    # 8. 删除点位
    resp = client.delete(f"/api/lineups/{lineup_id}", headers=author_headers)
    assert resp.status_code == 204

    # 9. 确认已删除
    resp = client.get(f"/api/lineups/{lineup_id}", headers=author_headers)
    assert resp.status_code == 404
