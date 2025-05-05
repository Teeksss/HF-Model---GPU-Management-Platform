"""
Model yönetimi endpoint'leri
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.database import get_db_session
from app.db.models import User, ModelMetadata, ModelVersion
from app.auth.auth_service import get_current_active_user
from app.services.hf_integration import HuggingFaceIntegration
from app.services.gpu_manager import GPUManager
from app.services.model_optimizer import ModelOptimizer
from app.api.schemas import (
    ModelResponse, ModelCreate, ModelUpdate, 
    ModelVersionResponse, ModelOptimizeRequest
)

settings = get_settings()
router = APIRouter()
logger = logging.getLogger(__name__)

# HuggingFace ve model servisleri
hf_integration = HuggingFaceIntegration(settings.MODEL_STORAGE_PATH)
gpu_manager = GPUManager()
model_optimizer = ModelOptimizer()

@router.get("/", response_model=List[ModelResponse])
async def list_models(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    task: Optional[str] = Query(None),
    framework: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Kullanıcının erişebileceği modelleri listeler
    
    Args:
        skip: Atlanacak kayıt sayısı
        limit: Döndürülecek maksimum kayıt sayısı
        task: Görev türüne göre filtrele
        framework: Framework türüne göre filtrele
        search: Arama sorgusu
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        List[ModelResponse]: Model listesi
    """
    # Sorgu oluştur
    query = db.query(ModelMetadata)
    
    # Filtreleme - kullanıcı kendi modellerini ve public modelleri görebilir
    query = query.filter(
        (ModelMetadata.owner_id == current_user.id) | 
        (ModelMetadata.is_public == True)
    )
    
    # Görev türüne göre filtreleme
    if task:
        query = query.filter(ModelMetadata.task == task)
    
    # Framework türüne göre filtreleme  
    if framework:
        query = query.filter(ModelMetadata.framework == framework)
    
    # Arama sorgusu
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (ModelMetadata.model_name.ilike(search_term)) |
            (ModelMetadata.model_id.ilike(search_term)) |
            (ModelMetadata.description.ilike(search_term))
        )
    
    # Limit ve offset ile sorguyu çalıştır
    models = query.order_by(ModelMetadata.last_updated.desc()).offset(skip).limit(limit).all()
    
    return models

@router.post("/", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
async def create_model(
    model_data: ModelCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Hugging Face'den yeni bir model indirir
    
    Args:
        model_data: Model verileri
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        ModelResponse: İndirilen model
        
    Raises:
        HTTPException: Model indirme başarısız olursa
    """
    # Model zaten var mı kontrol et
    existing_model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_data.model_id).first()
    if existing_model:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model zaten mevcut: {model_data.model_id}"
        )
    
    # Modeli indir
    success, message, model_path = hf_integration.download_model(
        model_id=model_data.model_id,
        revision=model_data.revision or "main"
    )
    
    if not success or not model_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Veritabanından modeli al
    model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_data.model_id).first()
    
    # Model bulunamadıysa hata ver (indirme işlemi sırasında veritabanına kaydedilmiş olmalı)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model indirildi ancak veritabanında bulunamadı"
        )
    
    # Kullanıcıyı model sahibi olarak ayarla
    model.owner_id = current_user.id
    
    # Açıklama varsa ekle
    if model_data.description:
        model.description = model_data.description
    
    # Public/private ayarı
    if model_data.is_public is not None:
        model.is_public = model_data.is_public
    
    # Veritabanını güncelle
    db.add(model)
    db.commit()
    db.refresh(model)
    
    return model

@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(
    model_id: str = Path(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Belirli bir modelin detaylarını döndürür
    
    Args:
        model_id: Model ID
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        ModelResponse: Model detayları
        
    Raises:
        HTTPException: Model bulunamazsa veya erişim izni yoksa
    """
    # Modeli bul
    model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_id).first()
    
    # Model bulunamadıysa hata ver
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model bulunamadı: {model_id}"
        )
    
    # Erişim kontrolü - kullanıcı model sahibi değilse ve model public değilse erişim reddet
    if model.owner_id != current_user.id and not model.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu modele erişim izniniz yok"
        )
    
    return model

@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(
    model_id: str = Path(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> None:
    """
    Belirli bir modeli siler
    
    Args:
        model_id: Model ID
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Raises:
        HTTPException: Model bulunamazsa, erişim izni yoksa veya silme başarısız olursa
    """
    # Modeli bul
    model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_id).first()
    
    # Model bulunamadıysa hata ver
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model bulunamadı: {model_id}"
        )
    
    # Erişim kontrolü - sadece model sahibi veya admin silebilir
    if model.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu modeli silme izniniz yok"
        )
    
    # Modeli sil
    success, message = hf_integration.delete_model(model_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

@router.put("/{model_id}", response_model=ModelResponse)
async def update_model(
    model_data: ModelUpdate,
    model_id: str = Path(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Belirli bir modeli günceller
    
    Args:
        model_data: Güncellenecek model verileri
        model_id: Model ID
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        ModelResponse: Güncellenmiş model
        
    Raises:
        HTTPException: Model bulunamazsa, erişim izni yoksa veya güncelleme başarısız olursa
    """
    # Modeli bul
    model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_id).first()
    
    # Model bulunamadıysa hata ver
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model bulunamadı: {model_id}"
        )
    
    # Erişim kontrolü - sadece model sahibi veya admin güncelleyebilir
    if model.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu modeli güncelleme izniniz yok"
        )
    
    # Model açıklaması ve görünürlüğünü güncelle
    if model_data.description is not None:
        model.description = model_data.description
    
    if model_data.is_public is not None:
        model.is_public = model_data.is_public
    
    # Modelin yeni bir sürümünü indirmek için
    if model_data.update_version:
        success, message = hf_integration.update_model(
            model_id=model_id,
            revision=model_data.revision or "main"
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
    
    # Veritabanını güncelle
    db.add(model)
    db.commit()
    db.refresh(model)
    
    return model

@router.get("/{model_id}/versions", response_model=List[ModelVersionResponse])
async def list_model_versions(
    model_id: str = Path(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Bir modelin tüm versiyonlarını listeler
    
    Args:
        model_id: Model ID
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        List[ModelVersionResponse]: Model versiyonları listesi
        
    Raises:
        HTTPException: Model bulunamazsa veya erişim izni yoksa
    """
    # Modeli bul
    model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_id).first()
    
    # Model bulunamadıysa hata ver
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model bulunamadı: {model_id}"
        )
    
    # Erişim kontrolü - kullanıcı model sahibi değilse ve model public değilse erişim reddet
    if model.owner_id != current_user.id and not model.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu modele erişim izniniz yok"
        )
    
    # Model versiyonlarını al
    versions = db.query(ModelVersion).filter(ModelVersion.model_id == model_id).order_by(ModelVersion.download_date.desc()).all()
    
    return versions

@router.post("/{model_id}/optimize", response_model=Dict[str, Any])
async def optimize_model(
    optimize_data: ModelOptimizeRequest,
    model_id: str = Path(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Bir modeli GPU'ya yükler ve optimize eder
    
    Args:
        optimize_data: Optimizasyon verileri
        model_id: Model ID
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        Dict[str, Any]: Optimizasyon sonucu
        
    Raises:
        HTTPException: Model bulunamazsa, erişim izni yoksa veya optimizasyon başarısız olursa
    """
    # Modeli bul
    model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_id).first()
    
    # Model bulunamadıysa hata ver
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model bulunamadı: {model_id}"
        )
    
    # Erişim kontrolü - kullanıcı model sahibi değilse ve model public değilse erişim reddet
    if model.owner_id != current_user.id and not model.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu modele erişim izniniz yok"
        )
    
    # Belirli bir GPU seçilmişse kullan, yoksa otomatik seç
    gpu_index = optimize_data.gpu_index
    if gpu_index is None:
        # Gereken minimum bellek miktarını belirle (varsayılan 2000 MB)
        min_memory = optimize_data.min_memory_mb or settings.MIN_FREE_GPU_MEMORY_MB
        gpu_index = gpu_manager.select_optimal_gpu(min_memory_mb=min_memory)
        
        if gpu_index is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"En az {min_memory} MB belleğe sahip GPU bulunamadı"
            )
    
    # Modeli optimize et
    if optimize_data.use_onnx:
        # ONNX ile optimize et
        result = model_optimizer.optimize_with_onnx(
            model_path=model.model_path,
            model_id=model.model_id,
            gpu_index=gpu_index
        )
    else:
        # Normal yükleme ve optimizasyon
        result = model_optimizer.load_model(
            model_path=model.model_path,
            model_id=model.model_id,
            gpu_index=gpu_index,
            quantize=optimize_data.quantize,
            use_fp16=optimize_data.use_fp16
        )
    
    # Başarısızsa hata ver
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Model optimizasyonu başarısız oldu")
        )
    
    return result