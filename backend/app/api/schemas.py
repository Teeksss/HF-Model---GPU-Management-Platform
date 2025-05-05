"""
API endpoint'leri için şemalar
"""
from datetime import datetime
from typing import Dict, List, Optional, Any

from pydantic import BaseModel, Field

# Model şemaları
class ModelBase(BaseModel):
    """Temel model şeması"""
    model_id: str
    description: Optional[str] = None
    is_public: Optional[bool] = True

class ModelCreate(ModelBase):
    """Model oluşturma şeması"""
    revision: Optional[str] = None

class ModelUpdate(BaseModel):
    """Model güncelleme şeması"""
    description: Optional[str] = None
    is_public: Optional[bool] = None
    update_version: Optional[bool] = False
    revision: Optional[str] = None

class ModelResponse(ModelBase):
    """Model yanıt şeması"""
    id: int
    model_name: str
    model_path: str
    framework: Optional[str] = None
    task: Optional[str] = None
    owner_id: Optional[int] = None
    created_at: datetime
    last_updated: datetime
    
    class Config:
        orm_mode = True

class ModelVersionBase(BaseModel):
    """Temel model versiyon şeması"""
    model_id: str
    version: str
    commit_hash: Optional[str] = None

class ModelVersionResponse(ModelVersionBase):
    """Model versiyon yanıt şeması"""
    id: int
    download_date: datetime
    file_size: Optional[int] = None
    
    class Config:
        orm_mode = True

class ModelOptimizeRequest(BaseModel):
    """Model optimizasyon şeması"""
    gpu_index: Optional[int] = None
    quantize: bool = True
    use_fp16: bool = True
    use_onnx: bool = False
    min_memory_mb: Optional[int] = None

# GPU şemaları
class GPUInfo(BaseModel):
    """GPU bilgi şeması"""
    index: int
    name: str
    total_memory_mb: float
    used_memory_mb: float
    free_memory_mb: float
    temperature_c: float
    utilization_percent: float

class GPUUsageCreate(BaseModel):
    """GPU kullanım oluşturma şeması"""
    gpu_index: int
    model_id: Optional[str] = None
    memory_used_mb: float
    utilization_percent: float

class GPUUsageResponse(GPUUsageCreate):
    """GPU kullanım yanıt şeması"""
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    is_active: bool
    
    class Config:
        orm_mode = True

# İstatistik şemaları
class ModelStatistics(BaseModel):
    """Model istatistik şeması"""
    model_id: str
    model_name: str
    version_count: int
    total_downloads: int
    last_updated: datetime

class UserStatistics(BaseModel):
    """Kullanıcı istatistik şeması"""
    user_id: int
    username: str
    model_count: int
    gpu_usage_hours: float
    last_active: datetime

class SystemStatistics(BaseModel):
    """Sistem istatistik şeması"""
    total_models: int
    total_users: int
    active_users: int
    gpu_usage_hours: Dict[int, float]  # GPU indeksi -> saat
    popular_models: List[ModelStatistics]
    active_users_data: List[UserStatistics]