import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import StaticPool, create_engine
from sqlalchemy.orm import sessionmaker

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
