"""
Kimlik doğrulama ve yetkilendirme endpoint'leri
"""
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.database import get_db_session
from app.db.models import User
from app.auth.auth_service import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_active_user
)
from app.auth.schemas import (
    Token, UserCreate, UserResponse, UserUpdate
)

settings = get_settings()
router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    JWT token almak için kimlik doğrulama yapar
    
    Args:
        form_data: OAuth2 form verileri
        db: Veritabanı oturumu
        
    Returns:
        Token: Access token ve token türü
        
    Raises:
        HTTPException: Kimlik doğrulama başarısız olursa
    """
    # Kullanıcıyı doğrula
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Kullanıcı aktif mi kontrol et
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı devre dışı"
        )
    
    # Token oluştur
    access_token_expires = timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Yeni kullanıcı kaydı oluşturur
    
    Args:
        user_data: Kullanıcı verileri
        db: Veritabanı oturumu
        
    Returns:
        UserResponse: Oluşturulan kullanıcı
        
    Raises:
        HTTPException: Kullanıcı adı veya e-posta zaten kayıtlıysa
    """
    # Kullanıcı adı kullanılıyor mu kontrol et
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcı adı zaten kayıtlı"
        )
    
    # E-posta kullanılıyor mu kontrol et
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta zaten kayıtlı"
        )
    
    # Yeni kullanıcı oluştur
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_active=True,
        is_admin=False  # Yeni kullanıcı varsayılan olarak admin değil
    )
    
    # Veritabanına ekle
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

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Geçerli kullanıcının bilgilerini döndürür
    
    Args:
        current_user: Geçerli kullanıcı
        
    Returns:
        UserResponse: Kullanıcı bilgileri
    """
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at
    )

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
) -> Any:
    """
    Geçerli kullanıcının bilgilerini günceller
    
    Args:
        user_data: Güncellenecek kullanıcı verileri
        current_user: Geçerli kullanıcı
        db: Veritabanı oturumu
        
    Returns:
        UserResponse: Güncellenmiş kullanıcı bilgileri
    """
    # Kullanıcıyı güncelle
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    
    if user_data.email is not None:
        # E-posta değişiyorsa, kullanılıyor mu kontrol et
        if current_user.email != user_data.email:
            if db.query(User).filter(User.email == user_data.email).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bu e-posta zaten kayıtlı"
                )
            current_user.email = user_data.email
    
    if user_data.password is not None:
        current_user.hashed_password = get_password_hash(user_data.password)
    
    # Veritabanını güncelle
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at
    )