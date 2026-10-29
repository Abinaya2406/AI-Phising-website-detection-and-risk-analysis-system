"""Configuration management for PhishGuard AI Backend."""
import os
from dotenv import load_dotenv

# Load .env file from backend root if present
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "phishguard-secure-dev-key-2026")
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/phishguard_db")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "phishguard_db")
    
    # Restricted CORS origins
    _cors_raw = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    CORS_ORIGINS = [orig.strip() for orig in _cors_raw.split(",") if orig.strip()]

    # Uploads
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024)) # 10MB
    UPLOAD_FOLDER = os.path.join(backend_dir, os.environ.get("UPLOAD_FOLDER", "uploads"))
    ALLOWED_EXTENSIONS = set(os.environ.get("ALLOWED_EXTENSIONS", "png,jpg,jpeg,webp").split(","))

    # Network timeout for outbound inspection
    REQUEST_TIMEOUT_SECONDS = int(os.environ.get("REQUEST_TIMEOUT_SECONDS", 8))

    # Fallback to realistic demo data if collection is empty or during standalone preview
    ENABLE_DEMO_DATA_FALLBACK = os.environ.get("ENABLE_DEMO_DATA_FALLBACK", "true").lower() == "true"
    TESTING = False

    # AI Security Assistant (Feature 4)
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    AI_API_KEY = os.environ.get("AI_API_KEY") or GEMINI_API_KEY or OPENAI_API_KEY
    AI_PROVIDER = os.environ.get("AI_PROVIDER", "auto").lower()  # 'gemini', 'openai', 'auto', 'fallback'
    AI_MODEL = os.environ.get("AI_MODEL", "gemini-1.5-flash")
    AI_TIMEOUT_SECONDS = int(os.environ.get("AI_TIMEOUT_SECONDS", 8))


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    MONGO_URI = "mongodb://localhost:27017/phishguard_test_db"
    MONGO_DB_NAME = "phishguard_test_db"
    # In tests, fallback database in-memory repository is used if real MongoDB is unavailable


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}

