"""
GPU izleme ve yönetimi endpoint'leri
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from app.config import get_settings
from app.db.database import get_db_session
from app.db.models import User, GPUUsage
from app.auth.auth_service import get_current_active_user, get_current_admin_user
from app.services.gpu_manager import GPUManager
from app.api.schemas import GPUInfo, GPUUsageCreate, GPUUsageResponse

settings = get_settings()
router = APIRouter()
logger = logging.getLogger(__name__)

# GPU Manager servisi
gpu_manager = GPUManager()

@router.get("/", response_model=List[GPUInfo])
async def list_gpus(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Sunucudaki tüm GPU'ları listeler
    
    Args:
        current_user: Geçerli kullanıcı
        
    Returns:
        List[GPUInfo]: GPU listesi
    """
    gpus = gpu_manager.detect_gpus()
    return gpus

@router.get("/{gpu_index}", response_model=GPUInfo)
async def get_gpu(
    gpu_index: int = Path(..., ge=0),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Belirli bir GPU'nun detaylarını döndürür
    
    Args:
        gpu_index: GPU indeksi
        current_user: Geçerli kullanıcı
        
    Returns:
        GPUInfo: GPU detayları
        
    Raises:
        HTTPException: GPU bulunamazsa
    """
    gpus = gpu_manager.detect_gpus()
    
    # GPU indeksi geçerli mi kontrol et
    for gpu in gpus:
        if gpu["index"] == gpu_index:
            return gpu
    
    # GPU bulunamazsa hata ver
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"GPU bulunamadı: {gpu_index}"
    )

@router.get("/memory/{gpu_index}", response_model=Dict[str, Any])
async def get_gpu_memory(
    gpu_index: int = Path(..., ge=0),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Belirli bir GPU'nun bellek kullanımını döndürür
    
    Args:
        gpu_index: GPU indeksi
        current_user: Geçerli kullanıcı
        
    Returns:
        Dict[str, Any]: GPU bellek bilgileri
        
    Raises:
        HTTPException: GPU bulunamazsa
    """
    try:
        memory_info = gpu_manager.get_gpu_memory_info(gpu_index)
        
        if not memory_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GPU bulunamadı: {gpu_index}"
            )
        
        return memory_info
        
    except Exception as e:
        logger.error(f"GPU bellek bilgisi alınırken hata: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GPU bellek bilgisi alınamadı: {str(e)}"
        )

@router.post("/usage", response_model=GPUUsageResponse)
async def record_gpu_usage(
    usage_data: GPUUsageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    GPU kullanımı kaydeder
    
    Args:
        usage_data: GPU kullanım verileri
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        GPUUsageResponse: Kaydedilen GPU kullanımı
        
    Raises:
        HTTPException: GPU bulunamazsa veya veri kaydetme başarısız olursa
    """
    # GPU indeksi geçerli mi kontrol et
    gpus = gpu_manager.detect_gpus()
    valid_gpu = False
    
    for gpu in gpus:
        if gpu["index"] == usage_data.gpu_index:
            valid_gpu = True
            break
    
    if not valid_gpu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"GPU bulunamadı: {usage_data.gpu_index}"
        )
    
    # GPU kullanımı oluştur
    gpu_usage = GPUUsage(
        user_id=current_user.id,
        gpu_index=usage_data.gpu_index,
        model_id=usage_data.model_id,
        memory_used_mb=usage_data.memory_used_mb,
        utilization_percent=usage_data.utilization_percent,
        start_time=datetime.datetime.utcnow(),
        is_active=True
    )
    
    # Veritabanına ekle
    db.add(gpu_usage)
    db.commit()
    db.refresh(gpu_usage)
    
    return gpu_usage

@router.put("/usage/{usage_id}/end", response_model=GPUUsageResponse)
async def end_gpu_usage(
    usage_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    GPU kullanımını sonlandırır
    
    Args:
        usage_id: GPU kullanım ID
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        GPUUsageResponse: Güncellenen GPU kullanımı
        
    Raises:
        HTTPException: GPU kullanımı bulunamazsa veya erişim izni yoksa
    """
    # GPU kullanımını bul
    gpu_usage = db.query(GPUUsage).filter(GPUUsage.id == usage_id).first()
    
    # GPU kullanımı bulunamadıysa hata ver
    if not gpu_usage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"GPU kullanımı bulunamadı: {usage_id}"
        )
    
    # Erişim kontrolü - sadece kullanıcının kendi GPU kullanımını veya admin sonlandırabilir
    if gpu_usage.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu GPU kullanımını sonlandırma izniniz yok"
        )
    
    # GPU kullanımını sonlandır
    gpu_usage.end_time = datetime.datetime.utcnow()
    gpu_usage.is_active = False
    
    # Veritabanını güncelle
    db.add(gpu_usage)
    db.commit()
    db.refresh(gpu_usage)
    
    return gpu_usage

@router.get("/usage/active", response_model=List[GPUUsageResponse])
async def list_active_gpu_usage(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Tüm aktif GPU kullanımlarını listeler (sadece admin)
    
    Args:
        current_user: Geçerli admin kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        List[GPUUsageResponse]: Aktif GPU kullanımları
    """
    # Tüm aktif GPU kullanımlarını al
    active_usages = db.query(GPUUsage).filter(GPUUsage.is_active == True).all()
    
    return active_usages

@router.get("/usage/user/{user_id}", response_model=List[GPUUsageResponse])
async def list_user_gpu_usage(
    user_id: int = Path(..., ge=1),
    active_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Belirli bir kullanıcının GPU kullanımlarını listeler
    
    Args:
        user_id: Kullanıcı ID
        active_only: Sadece aktif kullanımları listele
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        List[GPUUsageResponse]: Kullanıcının GPU kullanımları
        
    Raises:
        HTTPException: Erişim izni yoksa
    """
    # Erişim kontrolü - kullanıcı kendi kullanımlarını veya admin tüm kullanımları görebilir
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu kullanıcının GPU kullanımlarını görüntüleme izniniz yok"
        )
    
    # Sorgu oluştur
    query = db.query(GPUUsage).filter(GPUUsage.user_id == user_id)
    
    # Sadece aktif kullanımlar isteniyorsa filtrele
    if active_only:
        query = query.filter(GPUUsage.is_active == True)
    
    # Sorguyu çalıştır ve sonuçları döndür
    usages = query.order_by(GPUUsage.start_time.desc()).all()
    
    return usages

@router.get("/optimal", response_model=Dict[str, Any])
async def get_optimal_gpu(
    min_memory_mb: int = Query(2000, ge=0),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    En uygun (optimal) GPU'yu döndürür
    
    Args:
        min_memory_mb: Gereken minimum bellek miktarı (MB)
        current_user: Geçerli kullanıcı
        
    Returns:
        Dict[str, Any]: Optimal GPU bilgisi veya bulunamadı mesajı
    """
    gpu_index = gpu_manager.select_optimal_gpu(min_memory_mb=min_memory_mb)
    
    if gpu_index is None:
        return {
            "found": False,
            "message": f"En az {min_memory_mb} MB boş belleğe sahip GPU bulunamadı"
        }
    
    # GPU bilgilerini al
    gpus = gpu_manager.detect_gpus()
    optimal_gpu = None
    
    for gpu in gpus:
        if gpu["index"] == gpu_index:
            optimal_gpu = gpu
            break
    
    return {
        "found": True,
        "gpu_index": gpu_index,
        "gpu_info": optimal_gpu
    }