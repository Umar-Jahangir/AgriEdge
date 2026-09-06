"""AgriEdge Rover — Application configuration."""

from functools import lru_cache
from pathlib import Path

import yaml
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]
CONFIG_DIR = ROOT_DIR / "config"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ROOT_DIR / ".env"), extra="ignore")

    app_name: str = "AgriEdge Rover"
    app_version: str = "0.1.0"
    mock_mode: bool = True
    demo_mode: bool = True
    cloud_sync_enabled: bool = False

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    database_url: str = f"sqlite:///{ROOT_DIR / 'data' / 'agriedge.db'}"
    images_dir: Path = ROOT_DIR / "data" / "own" / "images"
    models_dir: Path = ROOT_DIR / "models"

    esp32_serial_port: str = "COM3"
    esp32_baud_rate: int = 115200

    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def load_yaml_config(filename: str) -> dict:
    path = CONFIG_DIR / filename
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}
