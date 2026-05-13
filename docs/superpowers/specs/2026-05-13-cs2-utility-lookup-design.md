# CS2 道具点位速查网站 - 后端设计

## 概述

为 CS2 五人小队构建一个道具点位速查网站后端。前后端分离，本次先开发后端 API。

- **用户规模**：5-10 人
- **技术栈**：FastAPI + SQLite + 本地文件存储
- **架构**：单体应用

## 数据模型

### users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 自增主键 |
| username | TEXT | UNIQUE, NOT NULL | 用户名 |
| hashed_password | TEXT | NOT NULL | bcrypt 加密密码 |
| role | TEXT | NOT NULL, DEFAULT 'viewer' | 角色：admin / author / viewer |
| created_at | DATETIME | NOT NULL | 创建时间 |

### maps 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 自增主键 |
| name | TEXT | UNIQUE, NOT NULL | 地图名 (dust2, mirage, ...) |
| display_name | TEXT | NOT NULL | 显示名 (Dust II, Mirage, ...) |
| image_url | TEXT | | 地图俯视图路径 |

### lineups 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 自增主键 |
| name | TEXT | NOT NULL | 道具名称 |
| map_id | INTEGER | FK → maps.id, NOT NULL | 所属地图 |
| utility_type | TEXT | NOT NULL | smoke / flash / molotov / he |
| side | TEXT | NOT NULL | ct / t |
| pos_x | REAL | | 地图 X 坐标 |
| pos_y | REAL | | 地图 Y 坐标 |
| description | TEXT | | 补充描述 |
| created_by | INTEGER | FK → users.id, NOT NULL | 创建者 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

### media 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 自增主键 |
| lineup_id | INTEGER | FK → lineups.id, NOT NULL | 关联点位 |
| file_type | TEXT | NOT NULL | image / video |
| file_path | TEXT | NOT NULL | 文件存储路径 |
| sort_order | INTEGER | DEFAULT 0 | 排序 |

## API 端点

### 认证 `/api/auth`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册新用户 | admin |
| POST | `/api/auth/login` | 登录，返回 JWT | 公开 |
| GET | `/api/auth/me` | 获取当前用户信息 | 已登录 |

### 地图 `/api/maps`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/maps` | 获取所有地图列表 | 已登录 |

### 道具点位 `/api/lineups`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/lineups` | 列表（支持筛选 & 搜索） | 已登录 |
| GET | `/api/lineups/{id}` | 获取点位详情（含媒体） | 已登录 |
| POST | `/api/lineups` | 创建点位 | author / admin |
| PUT | `/api/lineups/{id}` | 更新点位 | 作者本人 / admin |
| DELETE | `/api/lineups/{id}` | 删除点位（级联删除媒体文件） | 作者本人 / admin |

**GET /api/lineups 查询参数：**

- `map_id` (int, optional) — 按地图筛选
- `utility_type` (str, optional) — 按道具类型筛选 (smoke/flash/molotov/he)
- `side` (str, optional) — 按阵营筛选 (ct/t)
- `keyword` (str, optional) — 按名称模糊搜索
- `page` (int, default 1) — 页码
- `page_size` (int, default 20) — 每页数量

### 媒体 `/api/lineups/{id}/media`, `/api/media`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/lineups/{id}/media` | 上传媒体文件 | 点位作者 / admin |
| DELETE | `/api/media/{id}` | 删除媒体文件 | 点位作者 / admin |

### 用户管理 `/api/users`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 获取用户列表 | admin |
| PUT | `/api/users/{id}/role` | 修改用户角色 | admin |

## 项目结构

```
Utility_Lookup/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 应用入口，CORS 配置，路由注册
│   │   ├── config.py            # 配置（数据库路径、JWT 密钥、文件大小限制）
│   │   ├── database.py          # SQLite 连接 & session 管理
│   │   ├── models.py            # SQLAlchemy ORM 模型
│   │   ├── schemas.py           # Pydantic 请求/响应 schema
│   │   ├── auth.py              # JWT 创建/验证，密码哈希
│   │   ├── dependencies.py      # 依赖注入（获取当前用户、权限检查）
│   │   ├── routers/
│   │   │   ├── auth.py          # 认证路由
│   │   │   ├── maps.py          # 地图路由
│   │   │   ├── lineups.py       # 道具点位路由
│   │   │   ├── media.py         # 媒体文件路由
│   │   │   └── users.py         # 用户管理路由
│   │   └── seed.py              # 初始化数据（地图列表、默认管理员）
│   ├── uploads/                  # 媒体文件存储目录
│   ├── requirements.txt
│   └── .env                     # 环境变量
```

## 技术决策

| 领域 | 选择 | 原因 |
|------|------|------|
| 认证 | JWT (python-jose) | 无状态，前后端分离友好 |
| 密码加密 | bcrypt (passlib) | 行业标准 |
| ORM | SQLAlchemy 2.0 同步模式 | SQLite 无需异步，同步更简单 |
| 文件上传 | python-multipart | FastAPI 标准文件上传方案 |
| API 文档 | FastAPI 内建 Swagger UI | 零配置，自动生成 |
| CORS | 允许前端跨域 | 前后端分离必须 |

## 文件上传限制

- 图片：最大 10MB，格式 jpg/png/webp
- 视频：最大 50MB，格式 mp4/webm
- 文件存储路径：`uploads/{lineup_id}/{filename}`

## 权限模型

- **viewer**：查看所有内容
- **author**：查看 + 创建/编辑/删除自己的内容
- **admin**：管理用户 + 对所有内容完全控制 + 注册新用户

## 初始数据

应用首次启动时自动 seed：

- **管理员账号**：admin / admin123（首次登录后建议修改密码）
- **竞技地图**：Dust2, Mirage, Inferno, Nuke, Overpass, Ancient, Anubis, Vertigo

## 竞技地图列表

| name | display_name |
|------|-------------|
| dust2 | Dust II |
| mirage | Mirage |
| inferno | Inferno |
| nuke | Nuke |
| overpass | Overpass |
| ancient | Ancient |
| anubis | Anubis |
| vertigo | Vertigo |
| cache | Cache |
