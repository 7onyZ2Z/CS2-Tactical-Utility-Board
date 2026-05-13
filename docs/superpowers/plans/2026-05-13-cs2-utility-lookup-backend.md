# CS2 道具点位速查网站 - 后端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 CS2 小队构建道具点位速查网站的后端 API，支持用户认证、地图管理、道具点位的 CRUD 和媒体文件上传。

**Architecture:** FastAPI 单体应用，SQLAlchemy 2.0 同步模式连接 SQLite，JWT 无状态认证，本地文件存储媒体。路由按领域拆分到独立 router 文件。

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.0, SQLite, python-jose (JWT), passlib[bcrypt], python-multipart, Pydantic v2

---

## File Structure

```
backend/
├── app/
│   ├── __init__.py              # 空
│   ├── main.py                  # FastAPI 入口，CORS，路由注册，启动事件
│   ├── config.py                # Settings (pydantic-settings)
│   ├── database.py              # engine, SessionLocal, Base, get_db
│   ├── models.py                # User, Map, Lineup, Media ORM 模型
│   ├── schemas.py               # Pydantic 请求/响应 schema
│   ├── auth.py                  # 密码哈希、JWT 创建/验证
│   ├── dependencies.py          # get_current_user, require_role
│   ├── routers/
│   │   ├── __init__.py          # 空
│   │   ├── auth.py              # POST register, POST login, GET me
│   │   ├── maps.py              # GET maps
│   │   ├── lineups.py           # CRUD + 列表搜索
│   │   ├── media.py             # 上传/删除媒体
│   │   └── users.py             # 用户管理
│   └── seed.py                  # 初始化地图和管理员
├── tests/
│   ├── __init__.py              # 空
│   ├── conftest.py              # 测试 fixtures (client, db, auth)
│   ├── test_auth.py             # 认证测试
│   ├── test_maps.py             # 地图测试
│   ├── test_lineups.py          # 道具点位测试
│   ├── test_media.py            # 媒体上传测试
│   └── test_users.py            # 用户管理测试
├── uploads/                     # 媒体文件目录
├── requirements.txt
└── .env
```

---

### Task 1: 项目初始化和基础配置

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`

- [ ] **Step 1: 创建 requirements.txt**

```txt
fastapi==0.115.12
uvicorn[standard]==0.34.2
sqlalchemy==2.0.41
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.20
pydantic-settings==2.9.1
httpx==0.28.1
pytest==8.3.5
```

- [ ] **Step 2: 安装依赖**

Run: `cd backend && pip install -r requirements.txt`
Expected: 所有依赖安装成功

- [ ] **Step 3: 创建 .env 文件**

```
SECRET_KEY=change-me-to-a-random-string-in-production
DATABASE_URL=sqlite:///./utility_lookup.db
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

- [ ] **Step 4: 创建 app/__init__.py**

空文件。

- [ ] **Step 5: 创建 app/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "change-me-to-a-random-string-in-production"
    DATABASE_URL: str = "sqlite:///./utility_lookup.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_VIDEO_SIZE_MB: int = 50
    UPLOAD_DIR: str = "uploads"

    model_config = {"env_file": ".env"}


settings = Settings()
```

- [ ] **Step 6: 创建 app/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 7: 提交**

```bash
git add backend/requirements.txt backend/.env backend/app/__init__.py backend/app/config.py backend/app/database.py
git commit -m "feat: project init with FastAPI config and database setup"
```

---

### Task 2: ORM 模型

**Files:**
- Create: `backend/app/models.py`

- [ ] **Step 1: 创建 models.py**

```python
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    lineups = relationship("Lineup", back_populates="author")


class Map(Base):
    __tablename__ = "maps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    image_url = Column(String, nullable=True)

    lineups = relationship("Lineup", back_populates="map")


class Lineup(Base):
    __tablename__ = "lineups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    map_id = Column(Integer, ForeignKey("maps.id"), nullable=False, index=True)
    utility_type = Column(String, nullable=False)
    side = Column(String, nullable=False)
    pos_x = Column(Float, nullable=True)
    pos_y = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    map = relationship("Map", back_populates="lineups")
    author = relationship("User", back_populates="lineups")
    media = relationship("Media", back_populates="lineup", cascade="all, delete-orphan")


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lineup_id = Column(Integer, ForeignKey("lineups.id"), nullable=False, index=True)
    file_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)

    lineup = relationship("Lineup", back_populates="media")
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/models.py
git commit -m "feat: add SQLAlchemy ORM models for users, maps, lineups, media"
```

---

### Task 3: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas.py`

- [ ] **Step 1: 创建 schemas.py**

```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# --- Auth ---

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "viewer"


# --- Users ---

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserRoleUpdate(BaseModel):
    role: str


# --- Maps ---

class MapResponse(BaseModel):
    id: int
    name: str
    display_name: str
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


# --- Lineups ---

class LineupCreate(BaseModel):
    name: str
    map_id: int
    utility_type: str
    side: str
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    description: Optional[str] = None


class LineupUpdate(BaseModel):
    name: Optional[str] = None
    map_id: Optional[int] = None
    utility_type: Optional[str] = None
    side: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    description: Optional[str] = None


class MediaResponse(BaseModel):
    id: int
    lineup_id: int
    file_type: str
    file_path: str
    sort_order: int

    model_config = {"from_attributes": True}


class LineupResponse(BaseModel):
    id: int
    name: str
    map_id: int
    utility_type: str
    side: str
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    description: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    media: list[MediaResponse] = []

    model_config = {"from_attributes": True}


class LineupListResponse(BaseModel):
    items: list[LineupResponse]
    total: int
    page: int
    page_size: int
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/schemas.py
git commit -m "feat: add Pydantic schemas for all API requests and responses"
```

---

### Task 4: 认证模块

**Files:**
- Create: `backend/app/auth.py`
- Create: `backend/app/dependencies.py`

- [ ] **Step 1: 创建 auth.py**

```python
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
```

- [ ] **Step 2: 创建 dependencies.py**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .auth import decode_access_token
from .database import get_db
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def require_role(*roles: str):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return checker
```

- [ ] **Step 3: 提交**

```bash
git add backend/app/auth.py backend/app/dependencies.py
git commit -m "feat: add JWT auth and role-based access dependencies"
```

---

### Task 5: 认证路由 + 测试

**Files:**
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/auth.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: 创建 routers/__init__.py**

空文件。

- [ ] **Step 2: 创建 routers/auth.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import create_access_token, hash_password, verify_password
from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..models import User
from ..schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("admin")),
):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    if body.role not in ("admin", "author", "viewer"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be admin, author, or viewer",
        )
    user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
```

- [ ] **Step 3: 创建 tests/__init__.py**

空文件。

- [ ] **Step 4: 创建 tests/conftest.py**

```python
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import StaticPool, create_engine
from sqlalchemy.orm import sessionmaker

# 确保测试环境使用测试配置
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"

from app.database import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_token(client):
    from app.auth import hash_password
    from app.models import User

    db = TestSessionLocal()
    user = User(
        username="admin",
        hashed_password=hash_password("admin123"),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.close()

    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    return resp.json()["access_token"]


@pytest.fixture
def author_token(client):
    from app.auth import hash_password
    from app.models import User

    db = TestSessionLocal()
    user = User(
        username="author1",
        hashed_password=hash_password("pass123"),
        role="author",
    )
    db.add(user)
    db.commit()
    db.close()

    resp = client.post("/api/auth/login", json={"username": "author1", "password": "pass123"})
    return resp.json()["access_token"]


@pytest.fixture
def viewer_token(client):
    from app.auth import hash_password
    from app.models import User

    db = TestSessionLocal()
    user = User(
        username="viewer1",
        hashed_password=hash_password("pass123"),
        role="viewer",
    )
    db.add(user)
    db.commit()
    db.close()

    resp = client.post("/api/auth/login", json={"username": "viewer1", "password": "pass123"})
    return resp.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def author_headers(author_token):
    return {"Authorization": f"Bearer {author_token}"}


@pytest.fixture
def viewer_headers(viewer_token):
    return {"Authorization": f"Bearer {viewer_token}"}
```

- [ ] **Step 5: 创建 tests/test_auth.py**

```python
AUTH_HEADERS_KEY = "Authorization"


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
```

- [ ] **Step 6: 运行测试**

Run: `cd backend && python -m pytest tests/test_auth.py -v`
Expected: 所有测试通过

- [ ] **Step 7: 提交**

```bash
git add backend/app/routers/ backend/tests/
git commit -m "feat: add auth router with registration, login, and me endpoints + tests"
```

---

### Task 6: FastAPI 入口 + Seed 数据

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/seed.py`

- [ ] **Step 1: 创建 seed.py**

```python
from sqlalchemy.orm import Session

from .auth import hash_password
from .models import Map, User

MAPS = [
    ("dust2", "Dust II"),
    ("mirage", "Mirage"),
    ("inferno", "Inferno"),
    ("nuke", "Nuke"),
    ("overpass", "Overpass"),
    ("ancient", "Ancient"),
    ("anubis", "Anubis"),
    ("vertigo", "Vertigo"),
    ("cache", "Cache"),
]


def seed(db: Session):
    if not db.query(User).filter(User.username == "admin").first():
        admin = User(
            username="admin",
            hashed_password=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)

    for name, display_name in MAPS:
        if not db.query(Map).filter(Map.name == name).first():
            db.add(Map(name=name, display_name=display_name))

    db.commit()
```

- [ ] **Step 2: 创建 main.py**

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import SessionLocal, engine
from .models import Base
from .routers import auth, lineups, maps, media, users
from .seed import seed

import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    os.makedirs("uploads", exist_ok=True)
    yield


app = FastAPI(title="CS2 Utility Lookup", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(maps.router)
app.include_router(lineups.router)
app.include_router(media.router)
app.include_router(users.router)

if os.path.isdir("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

- [ ] **Step 3: 运行测试确认认证仍然通过**

Run: `cd backend && python -m pytest tests/test_auth.py -v`
Expected: 所有测试通过（main.py 的 import 会验证模块都能加载）

- [ ] **Step 4: 提交**

```bash
git add backend/app/main.py backend/app/seed.py
git commit -m "feat: add FastAPI entry point with CORS, lifespan seed, and static files"
```

---

### Task 7: 地图路由 + 测试

**Files:**
- Create: `backend/app/routers/maps.py`
- Create: `backend/tests/test_maps.py`

- [ ] **Step 1: 创建 routers/maps.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_current_user
from ..database import get_db
from ..models import Map
from ..schemas import MapResponse

router = APIRouter(prefix="/api/maps", tags=["maps"])


@router.get("", response_model=list[MapResponse])
def list_maps(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return db.query(Map).order_by(Map.id).all()
```

- [ ] **Step 2: 创建 tests/test_maps.py**

```python
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
```

- [ ] **Step 3: 运行测试**

Run: `cd backend && python -m pytest tests/test_maps.py -v`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add backend/app/routers/maps.py backend/tests/test_maps.py
git commit -m "feat: add maps list endpoint with auth + tests"
```

---

### Task 8: 道具点位路由 + 测试

**Files:**
- Create: `backend/app/routers/lineups.py`
- Create: `backend/tests/test_lineups.py`

- [ ] **Step 1: 创建 routers/lineups.py**

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..models import Lineup, Map, User
from ..schemas import LineupCreate, LineupListResponse, LineupResponse, LineupUpdate

router = APIRouter(prefix="/api/lineups", tags=["lineups"])


@router.get("", response_model=LineupListResponse)
def list_lineups(
    map_id: int | None = None,
    utility_type: str | None = None,
    side: str | None = None,
    keyword: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Lineup).options(joinedload(Lineup.media))

    if map_id is not None:
        query = query.filter(Lineup.map_id == map_id)
    if utility_type:
        query = query.filter(Lineup.utility_type == utility_type)
    if side:
        query = query.filter(Lineup.side == side)
    if keyword:
        query = query.filter(Lineup.name.ilike(f"%{keyword}%"))

    total = query.count()
    items = (
        query.order_by(Lineup.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return LineupListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{lineup_id}", response_model=LineupResponse)
def get_lineup(
    lineup_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    lineup = (
        db.query(Lineup)
        .options(joinedload(Lineup.media))
        .filter(Lineup.id == lineup_id)
        .first()
    )
    if not lineup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    return lineup


@router.post("", response_model=LineupResponse, status_code=status.HTTP_201_CREATED)
def create_lineup(
    body: LineupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "author")),
):
    if not db.query(Map).filter(Map.id == body.map_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Map not found")
    if body.utility_type not in ("smoke", "flash", "molotov", "he"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="utility_type must be smoke, flash, molotov, or he",
        )
    if body.side not in ("ct", "t"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="side must be ct or t",
        )
    lineup = Lineup(
        name=body.name,
        map_id=body.map_id,
        utility_type=body.utility_type,
        side=body.side,
        pos_x=body.pos_x,
        pos_y=body.pos_y,
        description=body.description,
        created_by=current_user.id,
    )
    db.add(lineup)
    db.commit()
    db.refresh(lineup)
    return lineup


@router.put("/{lineup_id}", response_model=LineupResponse)
def update_lineup(
    lineup_id: int,
    body: LineupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lineup = db.query(Lineup).filter(Lineup.id == lineup_id).first()
    if not lineup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    if current_user.role != "admin" and lineup.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this lineup",
        )

    update_data = body.model_dump(exclude_unset=True)
    if "map_id" in update_data and not db.query(Map).filter(Map.id == update_data["map_id"]).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Map not found")
    if "utility_type" in update_data and update_data["utility_type"] not in ("smoke", "flash", "molotov", "he"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid utility_type")
    if "side" in update_data and update_data["side"] not in ("ct", "t"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid side")

    for key, value in update_data.items():
        setattr(lineup, key, value)
    db.commit()
    db.refresh(lineup)
    return lineup


@router.delete("/{lineup_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lineup(
    lineup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lineup = (
        db.query(Lineup)
        .options(joinedload(Lineup.media))
        .filter(Lineup.id == lineup_id)
        .first()
    )
    if not lineup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    if current_user.role != "admin" and lineup.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this lineup",
        )
    # 删除关联的媒体文件
    import os

    from .media import delete_media_files

    delete_media_files(lineup.media)

    db.delete(lineup)
    db.commit()
```

- [ ] **Step 2: 创建 tests/test_lineups.py**

```python
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

    # 按道具类型筛选
    resp = client.get("/api/lineups?utility_type=smoke", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1

    # 按阵营筛选
    resp = client.get("/api/lineups?side=t", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1

    # 关键字搜索
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
    from app.models import User

    # 获取 author fixture 的用户 ID
    resp_login = client.post("/api/auth/login", json={"username": "author1", "password": "pass123"})
    author_id = int(resp_login.json().get("access_token") and 0)
    # 通过 /me 获取
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
    # 创建另一个用户的 lineup
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
```

- [ ] **Step 3: 运行测试**

Run: `cd backend && python -m pytest tests/test_lineups.py -v`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add backend/app/routers/lineups.py backend/tests/test_lineups.py
git commit -m "feat: add lineups CRUD with filtering, search, pagination + tests"
```

---

### Task 9: 媒体上传路由 + 测试

**Files:**
- Create: `backend/app/routers/media.py`
- Create: `backend/tests/test_media.py`

- [ ] **Step 1: 创建 routers/media.py**

```python
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Lineup, Media, User

router = APIRouter(prefix="/api", tags=["media"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm"}


def delete_media_files(media_list: list[Media]):
    for m in media_list:
        filepath = m.file_path
        if os.path.exists(filepath):
            os.remove(filepath)
        # 尝试清理空目录
        dirpath = os.path.dirname(filepath)
        if os.path.isdir(dirpath) and not os.listdir(dirpath):
            os.rmdir(dirpath)


@router.post("/lineups/{lineup_id}/media", status_code=status.HTTP_201_CREATED)
def upload_media(
    lineup_id: int,
    file: UploadFile,
    file_type: str = "image",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lineup = db.query(Lineup).filter(Lineup.id == lineup_id).first()
    if not lineup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lineup not found")
    if current_user.role != "admin" and lineup.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload media for this lineup",
        )

    content_type = file.content_type or ""
    if file_type == "image":
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image must be jpg, png, or webp. Got: {content_type}",
            )
        max_size = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    elif file_type == "video":
        if content_type not in ALLOWED_VIDEO_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video must be mp4 or webm. Got: {content_type}",
            )
        max_size = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_type must be image or video",
        )

    contents = file.file.read()
    if len(contents) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max {settings.MAX_IMAGE_SIZE_MB if file_type == 'image' else settings.MAX_VIDEO_SIZE_MB}MB",
        )

    ext = content_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    lineup_dir = os.path.join(settings.UPLOAD_DIR, str(lineup_id))
    os.makedirs(lineup_dir, exist_ok=True)
    filepath = os.path.join(lineup_dir, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    # 获取当前最大 sort_order
    max_order = (
        db.query(Media)
        .filter(Media.lineup_id == lineup_id)
        .order_by(Media.sort_order.desc())
        .first()
    )
    next_order = (max_order.sort_order + 1) if max_order else 0

    media = Media(
        lineup_id=lineup_id,
        file_type=file_type,
        file_path=filepath,
        sort_order=next_order,
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    return {"id": media.id, "file_type": media.file_type, "file_path": media.file_path}


@router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    lineup = db.query(Lineup).filter(Lineup.id == media.lineup_id).first()
    if current_user.role != "admin" and lineup.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this media",
        )

    delete_media_files([media])
    db.delete(media)
    db.commit()
```

- [ ] **Step 2: 创建 tests/test_media.py**

```python
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
```

- [ ] **Step 3: 运行测试**

Run: `cd backend && python -m pytest tests/test_media.py -v`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add backend/app/routers/media.py backend/tests/test_media.py
git commit -m "feat: add media upload/delete with file validation + tests"
```

---

### Task 10: 用户管理路由 + 测试

**Files:**
- Create: `backend/app/routers/users.py`
- Create: `backend/tests/test_users.py`

- [ ] **Step 1: 创建 routers/users.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_role
from ..models import User
from ..schemas import UserRoleUpdate, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("admin")),
):
    return db.query(User).order_by(User.id).all()


@router.put("/{user_id}/role", response_model=UserResponse)
def update_role(
    user_id: int,
    body: UserRoleUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("admin")),
):
    if body.role not in ("admin", "author", "viewer"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be admin, author, or viewer",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = body.role
    db.commit()
    db.refresh(user)
    return user
```

- [ ] **Step 2: 创建 tests/test_users.py**

```python
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
```

- [ ] **Step 3: 运行测试**

Run: `cd backend && python -m pytest tests/test_users.py -v`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
git add backend/app/routers/users.py backend/tests/test_users.py
git commit -m "feat: add user management endpoints for admin + tests"
```

---

### Task 11: 全量集成测试 + 启动验证

**Files:**
- Modify: `backend/tests/conftest.py` (确认 uploads 目录在测试时不影响)
- Create: `backend/tests/test_integration.py`

- [ ] **Step 1: 创建 tests/test_integration.py** — 端到端流程测试

```python
"""端到端集成测试：管理员注册 -> 作者创建点位 -> 上传媒体 -> 搜索 -> 删除"""
import io


def test_full_workflow(client, admin_headers):
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
```

- [ ] **Step 2: 运行全部测试**

Run: `cd backend && python -m pytest tests/ -v`
Expected: 所有测试通过

- [ ] **Step 3: 手动启动验证**

Run: `cd backend && uvicorn app.main:app --reload`
Expected: 服务器启动在 http://127.0.0.1:8000，访问 /docs 可看到 Swagger UI

- [ ] **Step 4: 提交**

```bash
git add backend/tests/test_integration.py
git commit -m "feat: add end-to-end integration test for full workflow"
```

---

### Task 12: 初始化 Git 仓库

- [ ] **Step 1: 初始化 git**

```bash
cd /Users/tony/Code/Utility_Lookup
git init
```

- [ ] **Step 2: 创建 .gitignore**

```
__pycache__/
*.pyc
.env
*.db
uploads/
.pytest_cache/
.venv/
venv/
```

- [ ] **Step 3: 首次提交**

```bash
git add .
git commit -m "feat: CS2 utility lookup backend - initial implementation"
```

---

## Self-Review

**Spec coverage:**
- [x] 用户认证 (register/login/me) → Task 5
- [x] 三级权限 (admin/author/viewer) → Task 4 (dependencies), Task 5/8/9/10
- [x] 地图列表 → Task 7
- [x] 道具点位 CRUD → Task 8
- [x] 筛选 & 搜索 → Task 8
- [x] 媒体上传/删除 → Task 9
- [x] 用户管理 → Task 10
- [x] Seed 数据 → Task 6
- [x] 文件上传限制 → Task 9
- [x] Cache 地图 → Task 6 (seed.py MAPS 列表)

**Placeholder scan:** 无 TBD/TODO。

**Type consistency:** 所有 schema 字段名、模型字段名在各 Task 间保持一致。
