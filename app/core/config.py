from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Recruitment SaaS API"
    database_url: str = "sqlite:///./recruitment.db"
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
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
