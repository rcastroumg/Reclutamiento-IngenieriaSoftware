from collections.abc import Generator
import os
from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

APP_DIR = Path(__file__).resolve().parents[1] / "app"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

os.environ["DB_HOST"] = ""
os.environ["DB_USER"] = ""
os.environ["DB_NAME"] = ""
os.environ["DB_PASSWORD"] = ""
os.environ["DB_PORT"] = "3306"

from db.base import Base
from core.config import get_settings
from db.session import get_db
from main import app
from models import recruitment  # noqa: F401


SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def reset_database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_settings(tmp_path, monkeypatch) -> Generator[None, None, None]:
    monkeypatch.setenv("STORAGE_ROOT", str(tmp_path / "storage"))
    monkeypatch.setenv("MAIL_PROVIDER_MODE", "stub-success")
    get_settings.cache_clear()
    Path(get_settings().storage_root).mkdir(parents=True, exist_ok=True)
    yield
    get_settings.cache_clear()


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_user_and_token(client: TestClient, email: str = "admin@example.com", password: str = "Super1234") -> dict[str, str]:
    client.post(
        "/auth/register",
        json={"full_name": "Admin User", "email": email, "password": password},
    )
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def auth_headers(client: TestClient) -> dict[str, str]:
    return create_user_and_token(client)
