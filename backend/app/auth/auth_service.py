"""
Kullanıcı kimlik doğrulama ve yetkilendirme hizmetleri
"""
import logging
from typing import Optional
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.database import get_db_session
from app.db.models import User

logger = logging.getLogger(__name__)
settings = get_settings()

# Şifre hashleme için
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Token endpoint'i
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Şifreyi doğrular
    
    Args:
        plain_password: Düz metin şifre
        hashed_password: Hashelenmiş şifre
        
    Returns:
        bool: Şifre doğru mu
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Şifreyi hasheler
    
    Args:
        password: Düz metin şifre
        
    Returns:
        str: Hashelenmiş şifre
    """
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Kullanıcıyı doğrular
    
    Args:
        db: Veritabanı oturumu
        username: Kullanıcı adı
        password: Şifre
        
    Returns:
        Optional[User]: Doğrulanmış kullanıcı veya None
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT token oluşturur
    
    Args:
        data: Token verileri
        expires_delta: Süre aşımı
        
    Returns:
        str: JWT token
    """
    to_encode = data.copy()
    
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET, 
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

async def get_current_user(
    db: Session = Depends(get_db_session), 
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Geçerli kullanıcıyı döndürür
    
    Args:
        db: Veritabanı oturumu
        token: JWT token
        
    Returns:
        User: Geçerli kullanıcı
        
    Raises:
        HTTPException: Token geçersizse veya kullanıcı bulunamazsa
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz kimlik bilgileri",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Token'ı doğrula
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Kullanıcı ID'sini al
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        
    except JWTError as e:
        logger.error(f"JWT doğrulama hatası: {e}")
        raise credentials_exception
    
    # Kullanıcıyı bul
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        logger.warning(f"Kullanıcı bulunamadı: {username}")
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Aktif kullanıcıyı döndürür
    
    Args:
        current_user: Geçerli kullanıcı
        
    Returns:
        User: Aktif kullanıcı
        
    Raises:
        HTTPException: Kullanıcı aktif değilse
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı devre dışı"
        )
    return current_user

async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Admin kullanıcıyı döndürür
    
    Args:
        current_user: Geçerli aktif kullanıcı
        
    Returns:
        User: Admin kullanıcı
        
    Raises:
        HTTPException: Kullanıcı admin değilse
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yetkilendirme hatası: Admin yetkisi gerekli"
        )
    return current_user