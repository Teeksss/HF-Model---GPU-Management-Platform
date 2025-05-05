"""
Kullanıcı yönetimi endpoint'leri
"""
import logging
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.database import get_db_session
from app.db.models import User
from app.auth.auth_service import (
    get_current_active_user, get_current_admin_user,
    get_password_hash
)
from app.auth.schemas import UserResponse, UserUpdate

settings = get_settings()
router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    active_only: bool = Query(False),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """
    Tüm kullanıcıları listeler (sadece admin)
    
    Args:
        skip: Atlanacak kayıt sayısı
        limit: Döndürülecek maksimum kayıt sayısı
        active_only: Sadece aktif kullanıcıları listele
        current_user: Geçerli admin kullanıcı
        
    Returns:
        List[UserResponse]: Kullanıcı listesi
    """
    db = next(get_db_session())
    
    # Sorgu oluştur
    query = db.query(User)
    
    # Sadece aktif kullanıcılar isteniyorsa filtrele
    if active_only:
        query = query.filter(User.is_active == True)
    
    # Limit ve offset ile sorguyu çalıştır
    users = query.order_by(User.username).offset(skip).limit(limit).all()
    
    # UserResponse listesine dönüştür
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at
        )
        for user in users
    ]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Belirli bir kullanıcının detaylarını döndürür
    
    Args:
        user_id: Kullanıcı ID
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        UserResponse: Kullanıcı detayları
        
    Raises:
        HTTPException: Kullanıcı bulunamazsa veya erişim izni yoksa
    """
    # Kullanıcı kendisi veya admin değilse erişim reddet
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu kullanıcının bilgilerine erişim izniniz yok"
        )
    
    # Kullanıcıyı bul
    user = db.query(User).filter(User.id == user_id).first()
    
    # Kullanıcı bulunamadıysa hata ver
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kullanıcı bulunamadı: {user_id}"
        )
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at
    )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_data: UserUpdate,
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Belirli bir kullanıcıyı günceller
    
    Args:
        user_data: Güncellenecek kullanıcı verileri
        user_id: Kullanıcı ID
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        UserResponse: Güncellenmiş kullanıcı
        
    Raises:
        HTTPException: Kullanıcı bulunamazsa veya erişim izni yoksa
    """
    # Kullanıcı kendisi veya admin değilse erişim reddet
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu kullanıcıyı güncelleme izniniz yok"
        )
    
    # Kullanıcıyı bul
    user = db.query(User).filter(User.id == user_id).first()
    
    # Kullanıcı bulunamadıysa hata ver
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kullanıcı bulunamadı: {user_id}"
        )
    
    # Kullanıcıyı güncelle
    if user_data.email is not None:
        # E-posta değişiyorsa, kullanılıyor mu kontrol et
        if user.email != user_data.email:
            if db.query(User).filter(User.email == user_data.email).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bu e-posta zaten kayıtlı"
                )
            user.email = user_data.email
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    
    if user_data.password is not None:
        user.hashed_password = get_password_hash(user_data.password)
    
    # Veritabanını güncelle
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at
    )

@router.patch("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Bir kullanıcıyı aktifleştirir (sadece admin)
    
    Args:
        user_id: Kullanıcı ID
        current_user: Geçerli admin kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        UserResponse: Aktifleştirilmiş kullanıcı
        
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
    
    # Kullanıcıyı aktifleştir
    user.is_active = True
    
    # Veritabanını güncelle
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at
    )

@router.patch("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Bir kullanıcıyı devre dışı bırakır (sadece admin)
    
    Args:
        user_id: Kullanıcı ID
        current_user: Geçerli admin kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        UserResponse: Devre dışı bırakılan kullanıcı
        
    Raises:
        HTTPException: Kullanıcı bulunamazsa veya son admin devre dışı bırakılmaya çalışılırsa
    """
    # Kullanıcıyı bul
    user = db.query(User).filter(User.id == user_id).first()
    
    # Kullanıcı bulunamadıysa hata ver
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kullanıcı bulunamadı: {user_id}"
        )
    
    # Son admin kullanıcı devre dışı bırakılamaz
    if user.is_admin:
        admin_count = db.query(User).filter(User.is_admin == True, User.is_active == True).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Son admin kullanıcı devre dışı bırakılamaz"
            )
    
    # Kullanıcıyı devre dışı bırak
    user.is_active = False
    
    # Veritabanını güncelle
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at
    )

@router.patch("/{user_id}/make-admin", response_model=UserResponse)
async def make_user_admin(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Bir kullanıcıyı admin yapar (sadece admin)
    
    Args:
        user_id: Kullanıcı ID
        current_user: Geçerli admin kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        UserResponse: Admin yapılan kullanıcı
        
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
    
    # Kullanıcıyı admin yap
    user.is_admin = True
    
    # Veritabanını güncelle
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at
    )

@router.patch("/{user_id}/remove-admin", response_model=UserResponse)
async def remove_user_admin(
    user_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Bir kullanıcının admin yetkisini kaldırır (sadece admin)
    
    Args:
        user_id: Kullanıcı ID
        current_user: Geçerli admin kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        UserResponse: Admin yetkisi kaldırılan kullanıcı
        
    Raises:
        HTTPException: Kullanıcı bulunamazsa veya son admin yetkisi kaldırılmaya çalışılırsa
    """
    # Kullanıcıyı bul
    user = db.query(User).filter(User.id == user_id).first()
    
    # Kullanıcı bulunamadıysa hata ver
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kullanıcı bulunamadı: {user_id}"
        )
    
    # Son admin kullanıcının yetkisi kaldırılamaz
    if user.is_admin:
        admin_count = db.query(User).filter(User.is_admin == True).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Son admin kullanıcının yetkisi kaldırılamaz"
            )
    
    # Kullanıcının admin yetkisini kaldır
    user.is_admin = False
    
    # Veritabanını güncelle
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at
    )