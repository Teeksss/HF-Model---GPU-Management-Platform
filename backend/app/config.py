"""
Modüler AI Yönetim Platformu - Konfigürasyon Modülü

Uygulama için gerekli tüm yapılandırma ayarlarını içerir.
"""
import os
from typing import List, Optional, Dict, Any
from pydantic import BaseSettings, validator
from functools import lru_cache

class Settings(BaseSettings):
    """
    Uygulama ayarları
    """
    # Temel ayarlar
    APP_NAME: str = "AI Model Management Platform"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Veritabanı ayarları
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://aiuser:aipassword@postgres:5432/aiplatform")
    
    # Redis ayarları
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # Qdrant ayarları
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://qdrant:6333")
    
    # JWT ayarları
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your_secret_key_here")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    
    # CORS ayarları
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Frontend geliştirme
        "https://aiplatform.example.com",  # Üretim ortamı
    ]
    
    # Rate limiting
    RATE_LIMIT: int = 100  # 100 istek / dakika
    RATE_LIMIT_WINDOW: int = 60  # saniye cinsinden
    
    # Model ayarları
    MODEL_STORAGE_PATH: str = os.getenv("MODEL_STORAGE_PATH", "/app/models")
    DEFAULT_HF_CACHE_DIR: str = os.getenv("HF_CACHE_DIR", "/app/cache")
    
    # GPU ayarları
    MIN_FREE_GPU_MEMORY_MB: int = 2000  # Minimum 2GB boş GPU belleği gerekli
    
    # Loglama ayarları
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @validator("MODEL_STORAGE_PATH", "DEFAULT_HF_CACHE_DIR")
    def create_dirs_if_not_exist(cls, path):
        """Dizin yoksa oluştur"""
        os.makedirs(path, exist_ok=True)
        return path
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """
    Ayarları önbelleğe alarak döndürür
    
    Returns:
        Settings: Uygulama ayarları
    """
    return Settings()