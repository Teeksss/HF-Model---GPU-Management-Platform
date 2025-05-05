"""
Veritabanı tablo modelleri ve ilişkileri
"""
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, 
    Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import datetime

from app.db.database import Base

class User(Base):
    """Kullanıcı tablosu"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # İlişkiler
    models = relationship("ModelMetadata", back_populates="owner")
    gpu_usages = relationship("GPUUsage", back_populates="user")

class ModelMetadata(Base):
    """Model metadata tablosu"""
    __tablename__ = "model_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String(100), unique=True, index=True, nullable=False)
    model_name = Column(String(100), nullable=False)
    model_path = Column(String(255), nullable=False)
    framework = Column(String(50))
    task = Column(String(50))
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
    
    # İlişkiler
    owner = relationship("User", back_populates="models")
    versions = relationship("ModelVersion", back_populates="model", cascade="all, delete-orphan")

class ModelVersion(Base):
    """Model versiyon tablosu"""
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String(100), ForeignKey("model_metadata.model_id"), nullable=False)
    version = Column(String(50), nullable=False)
    commit_hash = Column(String(100))
    download_date = Column(DateTime, default=datetime.datetime.utcnow)
    file_size = Column(Integer)  # Byte cinsinden
    
    # İlişkiler
    model = relationship("ModelMetadata", back_populates="versions")
    
    # Benzersiz kısıtlama: model_id + version
    __table_args__ = (
        UniqueConstraint('model_id', 'version', name='uix_model_version'),
    )

class GPUUsage(Base):
    """GPU kullanım tablosu"""
    __tablename__ = "gpu_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    gpu_index = Column(Integer, nullable=False)
    model_id = Column(String(100), ForeignKey("model_metadata.model_id"), nullable=True)
    memory_used_mb = Column(Float, nullable=False)
    utilization_percent = Column(Float, nullable=False)
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # İlişkiler
    user = relationship("User", back_populates="gpu_usages")

class SystemLog(Base):
    """Sistem log tablosu"""
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    path = Column(String(255))
    method = Column(String(20))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)