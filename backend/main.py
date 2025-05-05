"""
Modüler AI Yönetim Platformu Ana Uygulama
"""
import logging
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.config import get_settings
from app.db.database import init_db
from app.monitoring.prometheus import setup_prometheus
from app.api.model_router import router as model_router
from app.api.gpu_router import router as gpu_router
from app.api.user_router import router as user_router
from app.api.statistics_router import router as stats_router
from app.auth.auth_router import router as auth_router
from app.middlewares.logging_middleware import RequestLoggingMiddleware
from app.middlewares.rate_limiter import RateLimiterMiddleware

# Logger yapılandırma
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Ayarları yükle
settings = get_settings()

# FastAPI uygulaması oluştur
app = FastAPI(
    title="AI Model Yönetim Platformu API",
    description="Hugging Face modellerini yönetmek ve GPU kaynaklarını optimize etmek için API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS yapılandırması
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus izleme
setup_prometheus(app)

# İstek günlüğü
app.add_middleware(RequestLoggingMiddleware)

# Rate limiter (istek sınırlayıcı)
app.add_middleware(
    RateLimiterMiddleware,
    rate_limit=settings.RATE_LIMIT,
    time_window=settings.RATE_LIMIT_WINDOW
)

# Router'ları ekle
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(model_router, prefix="/models", tags=["Models"])
app.include_router(gpu_router, prefix="/gpus", tags=["GPU Management"])
app.include_router(user_router, prefix="/users", tags=["User Management"])
app.include_router(stats_router, prefix="/stats", tags=["Statistics"])

@app.get("/health", tags=["System"])
async def health_check():
    """
    Sistemin sağlık durumunu kontrol eder
    
    Returns:
        dict: Sistem durumu
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }

@app.on_event("startup")
async def startup_event():
    """
    Uygulama başlatıldığında çalışan fonksiyon
    """
    logger.info("Uygulama başlatılıyor...")
    
    # Veritabanı tablolarını oluştur
    init_db()
    
    logger.info(f"Uygulama başlatıldı: {settings.ENVIRONMENT} ortamında")
    logger.info(f"Belgelere erişim: http://{settings.HOST}:{settings.PORT}/docs")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Uygulama kapatıldığında çalışan fonksiyon
    """
    logger.info("Uygulama kapatılıyor...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=settings.DEBUG
    )