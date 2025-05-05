"""
İstatistik ve analiz endpoint'leri
"""
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.config import get_settings
from app.db.database import get_db_session
from app.db.models import User, ModelMetadata, ModelVersion, GPUUsage, SystemLog
from app.auth.auth_service import get_current_admin_user
from app.api.schemas import ModelStatistics, UserStatistics, SystemStatistics

settings = get_settings()
router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/summary", response_model=SystemStatistics)
async def get_system_statistics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Sistemin genel istatistiklerini döndürür
    
    Args:
        days: Geçmiş gün sayısı
        current_user: Geçerli admin kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        SystemStatistics: Sistem istatistikleri
    """
    # Tarih aralığı
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Toplam model sayısı
    total_models = db.query(func.count(ModelMetadata.id)).scalar()
    
    # Toplam kullanıcı sayısı
    total_users = db.query(func.count(User.id)).scalar()
    
    # Aktif kullanıcı sayısı
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    
    # GPU kullanım saatleri
    gpu_usage_hours = {}
    
    # Aktif ve tamamlanmış GPU kullanımlarını al
    active_usages = db.query(GPUUsage).filter(GPUUsage.is_active == True).all()
    completed_usages = db.query(GPUUsage).filter(
        GPUUsage.is_active == False,
        GPUUsage.start_time >= start_date,
        GPUUsage.end_time <= end_date
    ).all()
    
    # GPU indekslerine göre kullanım saatlerini hesapla
    for usage in active_usages + completed_usages:
        gpu_index = usage.gpu_index
        
        # Kullanım süresi (saat)
        if usage.is_active:
            # Aktif kullanım için şu ana kadar geçen süre
            duration = (datetime.utcnow() - usage.start_time).total_seconds() / 3600
        else:
            # Tamamlanmış kullanım için toplam süre
            duration = (usage.end_time - usage.start_time).total_seconds() / 3600
        
        # GPU indeksine göre toplam saati güncelle
        if gpu_index in gpu_usage_hours:
            gpu_usage_hours[gpu_index] += duration
        else:
            gpu_usage_hours[gpu_index] = duration
    
    # Popüler modeller
    popular_models_query = db.query(
        ModelMetadata.model_id,
        ModelMetadata.model_name,
        func.count(ModelVersion.id).label("version_count"),
        func.count(GPUUsage.id).label("total_downloads"),
        func.max(ModelMetadata.last_updated).label("last_updated")
    ).join(
        ModelVersion, ModelMetadata.model_id == ModelVersion.model_id, isouter=True
    ).join(
        GPUUsage, ModelMetadata.model_id == GPUUsage.model_id, isouter=True
    ).filter(
        ModelMetadata.last_updated >= start_date
    ).group_by(
        ModelMetadata.model_id, ModelMetadata.model_name
    ).order_by(
        desc("total_downloads")
    ).limit(10).all()
    
    popular_models = [
        ModelStatistics(
            model_id=model[0],
            model_name=model[1],
            version_count=model[2],
            total_downloads=model[3],
            last_updated=model[4]
        )
        for model in popular_models_query
    ]
    
    # Aktif kullanıcılar
    active_users_query = db.query(
        User.id,
        User.username,
        func.count(ModelMetadata.id).label("model_count"),
        func.sum(
            func.extract('epoch', func.coalesce(GPUUsage.end_time, datetime.utcnow()) - GPUUsage.start_time) / 3600
        ).label("gpu_usage_hours"),
        func.max(func.coalesce(GPUUsage.end_time, datetime.utcnow())).label("last_active")
    ).join(
        ModelMetadata, User.id == ModelMetadata.owner_id, isouter=True
    ).join(
        GPUUsage, User.id == GPUUsage.user_id, isouter=True
    ).filter(
        User.is_active == True,
        GPUUsage.start_time >= start_date
    ).group_by(
        User.id, User.username
    ).order_by(
        desc("gpu_usage_hours")
    ).limit(10).all()
    
    active_users_data = [
        UserStatistics(
            user_id=user[0],
            username=user[1],
            model_count=user[2],
            gpu_usage_hours=user[3] or 0.0,
            last_active=user[4] or datetime.utcnow()
        )
        for user in active_users_query
    ]
    
    return SystemStatistics(
        total_models=total_models,
        total_users=total_users,
        active_users=active_users,
        gpu_usage_hours=gpu_usage_hours,
        popular_models=popular_models,
        active_users_data=active_users_data
    )

@router.get("/models/{model_id}", response_model=ModelStatistics)
async def get_model_statistics(
    model_id: str = Path(...),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Belirli bir modelin istatistiklerini döndürür
    
    Args:
        model_id: Model ID
        days: Geçmiş gün sayısı
        current_user: Geçerli admin kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        ModelStatistics: Model istatistikleri
        
    Raises:
        HTTPException: Model bulunamazsa
    """
    # Modeli bul
    model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_id).first()
    
    # Model bulunamadıysa hata ver
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model bulunamadı: {model_id}"
        )
    
    # Tarih aralığı
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Versiyon sayısı
    version_count = db.query(func.count(ModelVersion.id)).filter(
        ModelVersion.model_id == model_id
    ).scalar()
    
    # İndirme sayısı (GPU kullanımı sayısı)
    total_downloads = db.query(func.count(GPUUsage.id)).filter(
        GPUUsage.model_id == model_id,
        GPUUsage.start_time >= start_date
    ).scalar()
    
    return ModelStatistics(
        model_id=model.model_id,
        model_name=model.model_name,
        version_count=version_count,
        total_downloads=total_downloads,
        last_updated=model.last_updated
    )

@router.get("/users/{user_id}", response_model=UserStatistics)
async def get_user_statistics(
    user_id: int = Path(..., ge=1),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Belirli bir kullanıcının istatistiklerini döndürür
    
    Args:
        user_id: Kullanıcı ID
        days: Geçmiş gün sayısı
        current_user: Geçerli admin kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        UserStatistics: Kullanıcı istatistikleri
        
    Raises:
        HTTPException: Kullanıcı bulunamazsa
    """
    # Kullanıcıyı bul
    user = db.query(User).filter(User.id == user_id).first()
    
    # Kullanıcı bulunamadıysa hata ver
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kullanıcı bulunamadı: {user_id}"
        )
    
    # Tarih aralığı
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Model sayısı
    model_count = db.query(func.count(ModelMetadata.id)).filter(
        ModelMetadata.owner_id == user_id
    ).scalar()
    
    # GPU kullanım süresi (saat)
    gpu_usage_hours_query = db.query(
        func.sum(
            func.extract('epoch', func.coalesce(GPUUsage.end_time, datetime.utcnow()) - GPUUsage.start_time) / 3600
        )
    ).filter(
        GPUUsage.user_id == user_id,
        GPUUsage.start_time >= start_date
    ).scalar()
    
    gpu_usage_hours = gpu_usage_hours_query or 0.0
    
    # Son aktif zaman
    last_active_query = db.query(
        func.max(func.coalesce(GPUUsage.end_time, datetime.utcnow()))
    ).filter(
        GPUUsage.user_id == user_id
    ).scalar()
    
    last_active = last_active_query or user.created_at
    
    return UserStatistics(
        user_id=user.id,
        username=user.username,
        model_count=model_count,
        gpu_usage_hours=gpu_usage_hours,
        last_active=last_active
    )

@router.get("/logs", response_model=List[Dict[str, Any]])
async def get_system_logs(
    days: int = Query(7, ge=1, le=30),
    level: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Sistem loglarını döndürür
    
    Args:
        days: Geçmiş gün sayısı
        level: Log seviyesi (INFO, WARNING, ERROR)
        limit: Döndürülecek maksimum log sayısı
        current_user: Geçerli admin kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        List[Dict[str, Any]]: Sistem logları
    """
    # Tarih aralığı
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Sorgu oluştur
    query = db.query(SystemLog).filter(SystemLog.timestamp >= start_date)
    
    # Log seviyesine göre filtrele
    if level:
        query = query.filter(SystemLog.level == level.upper())
    
    # Limit ile sorguyu çalıştır
    logs = query.order_by(SystemLog.timestamp.desc()).limit(limit).all()
    
    # Dict listesine dönüştür
    return [
        {
            "id": log.id,
            "level": log.level,
            "message": log.message,
            "path": log.path,
            "method": log.method,
            "user_id": log.user_id,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]