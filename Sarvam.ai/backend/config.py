import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "Sarvam AI Avatar Tutor"
    VERSION: str = "1.0.0"
    
    # Sarvam API credentials
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "").strip()
    SARVAM_BASE_URL: str = os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai")
    
    # Model defaults
    DEFAULT_STT_MODEL: str = os.getenv("SARVAM_STT_MODEL", "saaras:v4")
    DEFAULT_TTS_MODEL: str = os.getenv("SARVAM_TTS_MODEL", "bulbul:v1")
    DEFAULT_CHAT_MODEL: str = os.getenv("SARVAM_CHAT_MODEL", "sarvam-105b")
    DEFAULT_TRANSLATE_MODEL: str = os.getenv("SARVAM_TRANSLATE_MODEL", "sarvam-translate:v1")
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Static files
    FRONTEND_DIR: Path = BASE_DIR / "frontend"
    UPLOADS_DIR: Path = BASE_DIR / "uploads"

settings = Settings()
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
