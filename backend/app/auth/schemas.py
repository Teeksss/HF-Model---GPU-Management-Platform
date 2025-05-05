"""
Kimlik doğrulama ve kullanıcı şemaları
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    """Token şeması"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Token verisi şeması"""
    username: Optional[str] = None

class UserBase(BaseModel):
    """Temel kullanıcı şeması"""
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    """Kullanıcı oluşturma şeması"""
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    """Kullanıcı güncelleme şeması"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)

class UserResponse(UserBase):
    """Kullanıcı yanıt şeması"""
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        orm_mode = True