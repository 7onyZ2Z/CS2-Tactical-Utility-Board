# CS2 Utility Lookup

CS2 道具战术查询系统 —— 为 CS2 战队提供道具点位（烟雾弹、闪光弹、燃烧瓶、手雷）的存储、查询和战术编排功能。

## 功能概览

- **道具学院**：按地图、道具类型、阵营筛选道具点位，支持图片/视频上传和雷达图标注
- **战术学院**：创建战术，在雷达图上分配 5 个位置的站位，关联已有道具点位
- **权限管理**：admin / author / viewer 三级角色，道具和战术仅创建者和管理员可编辑/删除
- **雷达图标注**：在 CS2 雷达图上可视化标记道具落点和玩家站位
- **多媒体支持**：每个道具点位可上传多张图片和一个视频

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Ant Design 6 |
| 后端 | FastAPI + SQLAlchemy 2.0 + SQLite |
| 认证 | JWT (python-jose) + bcrypt (passlib) |
| 文件 | python-multipart，图片最大 10MB，视频最大 50MB |

## 项目结构

```
Utility_Lookup/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 应用入口，中间件，路由注册
│   │   ├── config.py            # 环境变量配置
│   │   ├── database.py          # SQLAlchemy 引擎和会话
│   │   ├── models.py            # 数据库模型定义
│   │   ├── schemas.py           # Pydantic 请求/响应模型
│   │   ├── auth.py              # JWT 生成、密码哈希
│   │   ├── dependencies.py      # 依赖注入（鉴权、角色校验）
│   │   ├── seed.py              # 初始数据（管理员账号、地图列表）
│   │   └── routers/
│   │       ├── auth.py          # POST /api/login, POST /api/register
│   │       ├── lineups.py       # CRUD /api/lineups, 战术关联
│   │       ├── tactics.py       # CRUD /api/tactics, 级联清理
│   │       ├── maps.py          # GET /api/maps
│   │       ├── media.py         # POST/DELETE /api/lineups/{id}/media
│   │       └── users.py         # GET/PUT /api/users
│   ├── tests/                   # pytest 测试（29 个用例）
│   ├── requirements.txt
│   └── .env                     # 环境变量（需自行创建）
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # React 入口
│   │   ├── App.tsx              # 路由配置，登录/主界面切换
│   │   ├── animations.css       # 竞技风格 CSS 动画
│   │   ├── types.ts             # TypeScript 类型定义
│   │   ├── hooks/useAuth.ts     # 认证状态管理
│   │   ├── api/                 # Axios API 封装
│   │   │   ├── client.ts        # Axios 实例（拦截器、token）
│   │   │   ├── auth.ts          # 登录、注册
│   │   │   ├── lineups.ts       # 道具 CRUD + 媒体上传
│   │   │   ├── tactics.ts       # 战术 CRUD
│   │   │   └── maps.ts          # 地图列表
│   │   └── components/
│   │       ├── LoginPage.tsx     # 登录页面
│   │       ├── MainLayout.tsx    # 主布局（Header + Sidebar + Content）
│   │       ├── Header.tsx        # 顶部导航栏
│   │       ├── Sidebar.tsx       # 左侧筛选栏（地图/道具/阵营）
│   │       ├── LineupGrid.tsx    # 道具卡片网格
│   │       ├── LineupCard.tsx    # 道具卡片组件
│   │       ├── LineupDetail.tsx  # 道具详情（轮播图、雷达图、编辑）
│   │       ├── TacticGrid.tsx    # 战术卡片网格
│   │       ├── TacticDetail.tsx  # 战术详情（雷达图、位置标记、道具关联）
│   │       ├── RadarPicker.tsx   # 雷达图坐标选择器
│   │       └── PositionPicker.tsx # 战术位置分配器
│   ├── public/
│   │   ├── radar/               # CS2 雷达图
│   │   ├── map_icon/            # 地图图标
│   │   ├── side_icon/           # CT/T 阵营图标
│   │   ├── utility_icon/        # 道具图标（侧边栏）
│   │   └── utility_icon2/       # 道具图标（雷达标记）
│   ├── package.json
│   └── vite.config.ts           # Vite 配置（API 代理）
│
└── .gitignore
```

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- npm 9+

### 1. 后端

```bash
cd backend

# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 创建 .env 文件
cat > .env << 'EOF'
SECRET_KEY=your-random-secret-key-here
DATABASE_URL=sqlite:///./utility_lookup.db
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EOF

# 启动服务（自动创建数据库表和初始数据）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

首次启动会自动：
- 创建 SQLite 数据库
- 创建管理员账号 `admin` / `admin123`
- 插入 10 张 CS2 竞技地图数据

### 2. 前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式（自动代理后端 API 到 localhost:8000）
npm run dev

# 生产构建
npm run build
```

开发服务器默认运行在 `http://localhost:5173`，API 请求自动代理到后端 `http://127.0.0.1:8000`。

## 数据模型

```
User ──< Lineup >── Map
                  ├── Media (图片/视频)
                  └── tactics JSON [{tactic_id, executor}]

Map ──< Tactic
         ├── created_by → User
         └── positions JSON [{x, y, z, duty}]
```

- **Lineup.tactics**：JSON 数组，实现道具与战术的多对多关联，每个条目包含 `tactic_id` 和 `executor`（1-5 号位）
- **Tactic.positions**：JSON 对象，键为位置编号（1-5），值为 `{x, y, z, duty}` 坐标和职责描述
- 删除战术时自动清理所有道具中对该战术的引用

## 用户角色

| 角色 | 权限 |
|------|------|
| admin | 全部操作：管理用户、创建/编辑/删除所有道具和战术 |
| author | 创建道具和战术，编辑/删除自己创建的内容 |
| viewer | 仅查看，不能创建、编辑或删除 |

## API 概览

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/login | 登录获取 JWT | 公开 |
| POST | /api/register | 注册新用户 | 公开 |
| GET | /api/users | 用户列表 | admin |
| PUT | /api/users/{id} | 修改用户角色 | admin |
| GET | /api/maps | 地图列表 | 已登录 |
| GET | /api/lineups | 道具列表（支持筛选） | 已登录 |
| POST | /api/lineups | 创建道具 | author+ |
| PUT | /api/lineups/{id} | 更新道具 | 创建者/admin |
| DELETE | /api/lineups/{id} | 删除道具 | 创建者/admin |
| POST | /api/lineups/{id}/media | 上传图片/视频 | author+ |
| DELETE | /api/media/{id} | 删除媒体文件 | 创建者/admin |
| GET | /api/tactics | 战术列表 | 已登录 |
| POST | /api/tactics | 创建战术 | author+ |
| PUT | /api/tactics/{id} | 更新战术 | 创建者/admin |
| DELETE | /api/tactics/{id} | 删除战术（级联清理） | 创建者/admin |

## 部署

### 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run build
# 将 frontend/dist/ 目录部署到 Nginx 或其他静态服务器
```

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/Utility_Lookup/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件访问
    location /uploads/ {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| SECRET_KEY | JWT 签名密钥 | change-me-to-a-random-string-in-production |
| DATABASE_URL | 数据库连接字符串 | sqlite:///./utility_lookup.db |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token 过期时间（分钟） | 1440（24 小时） |

## 测试

```bash
cd backend
pytest tests/ -v
```

共 29 个测试用例，覆盖认证、道具 CRUD、战术关联、媒体上传、权限校验等场景。
