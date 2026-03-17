from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Astro-Biochemical Drift Platform"
    app_env: str = "dev"
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )

    # API keys (optional by provider)
    nasa_api_key: str | None = None
    noaa_token: str | None = None
    openaq_api_key: str | None = None
    ecmwf_api_key: str | None = None
    maptiler_key: str | None = None
    gbif_user: str | None = None
    gbif_password: str | None = None
    movebank_username: str | None = None
    movebank_password: str | None = None

    data_dir: str = "data"
    baseline_window_hours: int = 24 * 30
    live_window_hours: int = 6
    zscore_alert_threshold: float = 2.5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
