import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus Life OS"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'campus_life.db'}")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campus-life-os-super-secure-hackathon-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for demo convenience
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    
    # Offline voice configuration
    VOICE_OFFLINE_DIR: Path = BASE_DIR / "voice_models"
    
    # Ageing thresholds in hours
    AGEING_AMBER_HOURS: int = 24
    AGEING_ORANGE_HOURS: int = 48
    AGEING_RED_HOURS: int = 72

    class Config:
        env_file = ".env"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.VOICE_OFFLINE_DIR.mkdir(parents=True, exist_ok=True)
