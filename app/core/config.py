from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Recruitment SaaS API"
    db_host: str | None = None
    db_port: int = 3306
    db_user: str | None = None
    db_password: str = ""
    db_name: str | None = None
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    storage_root: str = "./storage"
    mail_provider_mode: str = "stub-success"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        if self.db_host and self.db_user and self.db_name:
            password = quote_plus(self.db_password)
            return (
                f"mysql+pymysql://{self.db_user}:{password}@"
                f"{self.db_host}:{self.db_port}/{self.db_name}"
            )

        return "sqlite:///./recruitment.db"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value):
        if isinstance(value, str):
            value = [item.strip() for item in value.split(",") if item.strip()]

        if isinstance(value, list):
            explicit_origins = [origin for origin in value if origin != "*"]
            return explicit_origins or value

        return value

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
