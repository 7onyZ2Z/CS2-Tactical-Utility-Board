# CS2 道具点位速查网站 - 后端 API 文档

Base URL: `http://127.0.0.1:8000`

Swagger UI: `http://127.0.0.1:8000/docs`

---

## 通用说明

### 认证方式

除登录接口外，所有接口均需在请求头中携带 JWT Token：

```
Authorization: Bearer <access_token>
```

Token 通过 `POST /api/auth/login` 获取，有效期 24 小时。

### 通用错误响应

| 状态码 | 含义 |
|--------|------|
| 401 | 未认证或 Token 无效/过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 400 | 请求参数错误 |

错误响应体：

```json
{
  "detail": "错误信息"
}
```

### 用户角色

| 角色 | 权限 |
|------|------|
| `admin` | 注册新用户、管理用户角色、对所有内容完全控制 |
| `author` | 查看、创建、编辑/删除自己的内容 |
| `viewer` | 仅查看 |

---

## 1. 认证模块 `/api/auth`

### 1.1 用户登录

**`POST /api/auth/login`**

无需 Token。

**请求体：**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应 `200`：**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**错误响应：**

| 状态码 | detail |
|--------|--------|
| 401 | Incorrect username or password |

---

### 1.2 获取当前用户信息

**`GET /api/auth/me`**

**成功响应 `200`：**

```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "created_at": "2026-05-13T10:00:00"
}
```

---

### 1.3 注册新用户

**`POST /api/auth/register`**

权限：`admin`

**请求体：**

```json
{
  "username": "player1",
  "password": "pass123",
  "role": "author"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，唯一 |
| password | string | 是 | 密码 |
| role | string | 否 | 角色，默认 `viewer`，可选 `admin`/`author`/`viewer` |

**成功响应 `201`：**

```json
{
  "id": 2,
  "username": "player1",
  "role": "author",
  "created_at": "2026-05-13T11:00:00"
}
```

**错误响应：**

| 状态码 | detail |
|--------|--------|
| 400 | Username already exists |
| 400 | Role must be admin, author, or viewer |

---

## 2. 地图模块 `/api/maps`

### 2.1 获取地图列表

**`GET /api/maps`**

**成功响应 `200`：**

```json
[
  {
    "id": 1,
    "name": "dust2",
    "display_name": "Dust II",
    "image_url": "uploads/map/de_dust2.png"
  },
  {
    "id": 2,
    "name": "mirage",
    "display_name": "Mirage",
    "image_url": "uploads/map/de_mirage.png"
  }
]
```

**完整地图列表：**

| name | display_name | image_url |
|------|-------------|-----------|
| dust2 | Dust II | uploads/map/de_dust2.png |
| mirage | Mirage | uploads/map/de_mirage.png |
| inferno | Inferno | uploads/map/de_inferno.png |
| nuke | Nuke | uploads/map/de_nuke.png |
| overpass | Overpass | uploads/map/de_overpass.png |
| ancient | Ancient | uploads/map/de_ancient.png |
| anubis | Anubis | uploads/map/de_anubis.png |
| vertigo | Vertigo | uploads/map/de_vertigo.png |
| cache | Cache | uploads/map/de_cache.png |
| train | Train | uploads/map/de_train.png |

**地图图片访问：** `http://127.0.0.1:8000/uploads/map/de_dust2.png`

---

## 3. 道具点位模块 `/api/lineups`

### 3.1 获取道具点位列表

**`GET /api/lineups`**

支持筛选、搜索和分页。

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| map_id | int | 否 | - | 按地图 ID 筛选 |
| utility_type | string | 否 | - | 按道具类型筛选：`smoke`/`flash`/`molotov`/`he` |
| side | string | 否 | - | 按阵营筛选：`ct`/`t` |
| keyword | string | 否 | - | 按名称模糊搜索 |
| page | int | 否 | 1 | 页码（≥1） |
| page_size | int | 否 | 20 | 每页数量（1-100） |

**请求示例：**

```
GET /api/lineups?map_id=1&utility_type=smoke&side=ct&page=1&page_size=10
GET /api/lineups?keyword=烟雾
```

**成功响应 `200`：**

```json
{
  "items": [
    {
      "id": 1,
      "name": "A大烟雾",
      "map_id": 1,
      "utility_type": "smoke",
      "side": "ct",
      "pos_x": 850.0,
      "pos_y": 420.0,
      "description": "站在A大道靠墙位置，准星对准电线杆顶部，左键投掷",
      "created_by": 1,
      "created_at": "2026-05-13T10:30:00",
      "updated_at": "2026-05-13T10:30:00",
      "media": [
        {
          "id": 1,
          "lineup_id": 1,
          "file_type": "image",
          "file_path": "uploads/utility/dust2/smoke/a_main_smoke.jpg",
          "sort_order": 0
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

---

### 3.2 获取道具点位详情

**`GET /api/lineups/{lineup_id}`**

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| lineup_id | int | 点位 ID |

**成功响应 `200`：**

```json
{
  "id": 1,
  "name": "A大烟雾",
  "map_id": 1,
  "utility_type": "smoke",
  "side": "ct",
  "pos_x": 850.0,
  "pos_y": 420.0,
  "description": "站在A大道靠墙位置，准星对准电线杆顶部，左键投掷",
  "created_by": 1,
  "created_at": "2026-05-13T10:30:00",
  "updated_at": "2026-05-13T10:30:00",
  "media": [
    {
      "id": 1,
      "lineup_id": 1,
      "file_type": "image",
      "file_path": "uploads/utility/dust2/smoke/a_main_smoke.jpg",
      "sort_order": 0
    }
  ]
}
```

**错误响应：**

| 状态码 | detail |
|--------|--------|
| 404 | Lineup not found |

---

### 3.3 创建道具点位

**`POST /api/lineups`**

权限：`author` / `admin`

**请求体：**

```json
{
  "name": "A大烟雾",
  "map_id": 1,
  "utility_type": "smoke",
  "side": "ct",
  "pos_x": 850.0,
  "pos_y": 420.0,
  "description": "站在A大道靠墙位置，准星对准电线杆顶部，左键投掷"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 道具名称 |
| map_id | int | 是 | 地图 ID |
| utility_type | string | 是 | 道具类型：`smoke`/`flash`/`molotov`/`he` |
| side | string | 是 | 阵营：`ct`/`t` |
| pos_x | float | 否 | 地图 X 坐标 |
| pos_y | float | 否 | 地图 Y 坐标 |
| description | string | 否 | 补充描述 |

**成功响应 `201`：** 返回完整的 Lineup 对象（同详情接口格式），`media` 为空数组。

**错误响应：**

| 状态码 | detail |
|--------|--------|
| 400 | Map not found |
| 400 | utility_type must be smoke, flash, molotov, or he |
| 400 | side must be ct or t |
| 403 | Insufficient permissions |

---

### 3.4 更新道具点位

**`PUT /api/lineups/{lineup_id}`**

权限：点位作者本人 / `admin`

**请求体（所有字段可选，只传需要修改的）：**

```json
{
  "name": "A大烟雾（更新）",
  "description": "改进后的投掷方法"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 道具名称 |
| map_id | int | 否 | 地图 ID |
| utility_type | string | 否 | 道具类型 |
| side | string | 否 | 阵营 |
| pos_x | float | 否 | 地图 X 坐标 |
| pos_y | float | 否 | 地图 Y 坐标 |
| description | string | 否 | 补充描述 |

**成功响应 `200`：** 返回更新后的完整 Lineup 对象。

**错误响应：**

| 状态码 | detail |
|--------|--------|
| 403 | Not authorized to edit this lineup |
| 404 | Lineup not found |

---

### 3.5 删除道具点位

**`DELETE /api/lineups/{lineup_id}`**

权限：点位作者本人 / `admin`。删除时会级联删除关联的媒体文件。

**成功响应 `204`：** 无响应体。

**错误响应：**

| 状态码 | detail |
|--------|--------|
| 403 | Not authorized to delete this lineup |
| 404 | Lineup not found |

---

## 4. 媒体模块

### 4.1 上传媒体文件

**`POST /api/lineups/{lineup_id}/media`**

权限：点位作者本人 / `admin`

**请求格式：** `multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 上传的文件 |
| file_type | string | 否 | 文件类型，默认 `image`，可选 `image`/`video` |

**文件限制：**

| 类型 | 允许格式 | 最大大小 |
|------|---------|---------|
| image | jpg, png, webp | 10MB |
| video | mp4, webm | 50MB |

**请求示例（curl）：**

```bash
curl -X POST http://127.0.0.1:8000/api/lineups/1/media \
  -H "Authorization: Bearer <token>" \
  -F "file=@demo.jpg" \
  -F "file_type=image"
```

**成功响应 `201`：**

```json
{
  "id": 1,
  "file_type": "image",
  "file_path": "uploads/1/abc123.jpg"
}
```

**错误响应：**

| 状态码 | detail |
|--------|--------|
| 400 | Image must be jpg, png, or webp |
| 400 | Video must be mp4 or webm |
| 400 | File too large. Max 10MB |
| 403 | Not authorized to upload media for this lineup |
| 404 | Lineup not found |

---

### 4.2 删除媒体文件

**`DELETE /api/media/{media_id}`**

权限：媒体所属点位的作者 / `admin`

**成功响应 `204`：** 无响应体。

**错误响应：**

| 状态码 | detail |
|--------|--------|
| 403 | Not authorized to delete this media |
| 404 | Media not found |

---

## 5. 用户管理模块 `/api/users`

### 5.1 获取用户列表

**`GET /api/users`**

权限：`admin`

**成功响应 `200`：**

```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "created_at": "2026-05-13T10:00:00"
  },
  {
    "id": 2,
    "username": "player1",
    "role": "author",
    "created_at": "2026-05-13T11:00:00"
  }
]
```

---

### 5.2 修改用户角色

**`PUT /api/users/{user_id}/role`**

权限：`admin`

**请求体：**

```json
{
  "role": "author"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 是 | 新角色：`admin`/`author`/`viewer` |

**成功响应 `200`：**

```json
{
  "id": 2,
  "username": "player1",
  "role": "author",
  "created_at": "2026-05-13T11:00:00"
}
```

**错误响应：**

| 状态码 | detail |
|--------|--------|
| 400 | Role must be admin, author, or viewer |
| 404 | User not found |

---

## 数据模型参考

### Lineup 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 点位 ID |
| name | string | 道具名称 |
| map_id | int | 所属地图 ID |
| utility_type | string | 道具类型：`smoke`/`flash`/`molotov`/`he` |
| side | string | 阵营：`ct`/`t` |
| pos_x | float? | 地图 X 坐标 |
| pos_y | float? | 地图 Y 坐标 |
| description | string? | 补充描述 |
| created_by | int | 创建者用户 ID |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |
| media | Media[] | 关联的媒体文件列表 |

### Media 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 媒体 ID |
| lineup_id | int | 关联的点位 ID |
| file_type | string | 文件类型：`image`/`video` |
| file_path | string | 文件访问路径 |
| sort_order | int | 排序序号 |

### Map 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 地图 ID |
| name | string | 地图标识名 |
| display_name | string | 显示名称 |
| image_url | string? | 地图俯视图路径 |

### User 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 用户 ID |
| username | string | 用户名 |
| role | string | 角色：`admin`/`author`/`viewer` |
| created_at | datetime | 创建时间 |

---

## 静态文件访问

上传的媒体文件和地图图片通过静态文件服务访问：

- 地图图片：`http://127.0.0.1:8000/uploads/map/de_dust2.png`
- 点位媒体：`http://127.0.0.1:8000/uploads/1/abc123.jpg`

前端直接使用 `file_path` 或 `image_url` 拼接 Base URL 即可。

---

## 默认数据

应用首次启动自动初始化：

- **管理员账号**：`admin` / `admin123`
- **10 张竞技地图**：Dust II, Mirage, Inferno, Nuke, Overpass, Ancient, Anubis, Vertigo, Cache, Train
