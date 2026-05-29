from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from api.auth import router as auth_router
from api.companies import router as companies_router
from api.recruitment import router as recruitment_router
from core.config import get_settings
from db.base import Base
from db.session import engine
from models import recruitment  # noqa: F401


settings = get_settings()


def ensure_position_salary_columns() -> None:
    # Existing SQLite databases need explicit ALTER TABLE statements because create_all() does not add new columns.
    with engine.begin() as connection:
        if connection.dialect.name != "sqlite":
            return

        existing_columns = {
            row[1]
            for row in connection.execute(text("PRAGMA table_info('positions')"))
        }
        migrations = {
            "salary_min": "ALTER TABLE positions ADD COLUMN salary_min INTEGER NOT NULL DEFAULT 0",
            "salary_max": "ALTER TABLE positions ADD COLUMN salary_max INTEGER NOT NULL DEFAULT 0",
            "salary_frequency": "ALTER TABLE positions ADD COLUMN salary_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly'",
            "salary_currency": "ALTER TABLE positions ADD COLUMN salary_currency VARCHAR(3) NOT NULL DEFAULT 'GTQ'",
        }

        for column_name, statement in migrations.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_position_salary_columns()
    Path(settings.storage_root).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(companies_router)
app.include_router(recruitment_router)
