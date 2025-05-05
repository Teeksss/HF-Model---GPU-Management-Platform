"""
Hugging Face Hub ile entegrasyonu sağlayan servis
"""
import logging
import os
import shutil
import time
import tempfile
from typing import Dict, List, Optional, Tuple, Any, Union
import json

import requests
from sqlalchemy.orm import Session
from huggingface_hub import snapshot_download, Repository, create_repo, HfApi
from huggingface_hub.utils import RepositoryNotFoundError, RevisionNotFoundError

from app.config import get_settings
from app.db.database import get_db_session
from app.db.models import ModelMetadata, ModelVersion

settings = get_settings()
logger = logging.getLogger(__name__)

class HuggingFaceIntegration:
    """
    Hugging Face Hub ile entegrasyonu sağlayan sınıf
    """
    
    def __init__(self, model_storage_path: Optional[str] = None):
        """
        HuggingFace entegrasyonunu başlat
        
        Args:
            model_storage_path: Modellerin kaydedileceği dizin
        """
        self.model_storage_path = model_storage_path or settings.MODEL_STORAGE_PATH
        
        # Model dizini yoksa oluştur
        os.makedirs(self.model_storage_path, exist_ok=True)
        
        # Hugging Face API nesnesi
        self.hf_api = HfApi()
        
        # Cache dizini ayarla
        os.environ["HF_HOME"] = settings.DEFAULT_HF_CACHE_DIR
    
    def download_model(self, model_id: str, revision: str = "main") -> Tuple[bool, str, Optional[str]]:
        """
        Modeli Hugging Face Hub'dan indirir
        
        Args:
            model_id: Hugging Face model ID
            revision: Branch/tag/commit (varsayılan: "main")
            
        Returns:
            Tuple[bool, str, Optional[str]]: (Başarı durumu, mesaj, model dizini)
        """
        db = next(get_db_session())
        
        try:
            # Model zaten var mı kontrol et
            existing_model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_id).first()
            
            if existing_model:
                # İndirilen model dizini yoksa yeniden indir
                if not os.path.exists(existing_model.model_path):
                    logger.warning(f"Model dizini bulunamadı, yeniden indiriliyor: {model_id}")
                else:
                    logger.info(f"Model zaten indirilmiş: {model_id}")
                    return True, "Model zaten indirilmiş", existing_model.model_path
            
            # İndirme başlangıç zamanı
            start_time = time.time()
            
            # Model indirme dizini oluştur
            model_dir = os.path.join(self.model_storage_path, model_id.replace("/", "_"))
            os.makedirs(model_dir, exist_ok=True)
            
            # İndirilecek dosya türleri
            allowed_patterns = ["*.json", "*.txt", "*.py", "*.md", "*.bin", "*.onnx", "*.safetensors", "*.model", "config.*", "vocab.*", "tokenizer.*"]
            
            # Model versiyonu hakkında bilgi al
            model_info = self._get_model_info(model_id, revision)
            
            # Modeli indir
            try:
                snapshot_download(
                    repo_id=model_id,
                    revision=revision,
                    local_dir=model_dir,
                    allow_patterns=allowed_patterns,
                    cache_dir=settings.DEFAULT_HF_CACHE_DIR,
                    resume_download=True,
                    local_files_only=False,
                )
            except (RepositoryNotFoundError, RevisionNotFoundError) as e:
                logger.error(f"Model indirme hatası: {str(e)}")
                return False, f"Model bulunamadı: {str(e)}", None
            
            # Veritabanına kaydet
            if existing_model:
                # Mevcut modeli güncelle
                existing_model.model_path = model_dir
                existing_model.last_updated = time.time()
                
                # Versiyon ekle
                model_version = ModelVersion(
                    model_id=model_id,
                    version=revision,
                    commit_hash=model_info.get("commit_hash"),
                    file_size=self._get_directory_size(model_dir)
                )
                
                db.add(model_version)
                db.add(existing_model)
                db.commit()
                
                logger.info(f"Model güncellendi: {model_id}, revision: {revision}")
                return True, "Model başarıyla güncellendi", model_dir
            else:
                # Yeni model oluştur
                model_name = model_id.split("/")[-1] if "/" in model_id else model_id
                model_metadata = ModelMetadata(
                    model_id=model_id,
                    model_name=model_name,
                    model_path=model_dir,
                    framework=model_info.get("framework"),
                    task=model_info.get("task")
                )
                
                # Versiyon ekle
                model_version = ModelVersion(
                    model_id=model_id,
                    version=revision,
                    commit_hash=model_info.get("commit_hash"),
                    file_size=self._get_directory_size(model_dir)
                )
                
                db.add(model_metadata)
                db.add(model_version)
                db.commit()
                
                logger.info(f"Model başarıyla indirildi: {model_id}, revision: {revision}")
                return True, "Model başarıyla indirildi", model_dir
                
        except Exception as e:
            logger.error(f"Model indirme hatası: {str(e)}")
            db.rollback()
            return False, f"Model indirme hatası: {str(e)}", None
        
        finally:
            db.close()
    
    def delete_model(self, model_id: str) -> Tuple[bool, str]:
        """
        Modeli siler
        
        Args:
            model_id: Model ID
            
        Returns:
            Tuple[bool, str]: (Başarı durumu, mesaj)
        """
        db = next(get_db_session())
        
        try:
            # Modeli veritabanından bul
            model = db.query(ModelMetadata).filter(ModelMetadata.model_id == model_id).first()
            
            if not model:
                logger.warning(f"Silinecek model bulunamadı: {model_id}")
                return False, "Model bulunamadı"
            
            # Model versiyonlarını sil
            db.query(ModelVersion).filter(ModelVersion.model_id == model_id).delete()
            
            # Model dosyalarını sil
            if os.path.exists(model.model_path):
                shutil.rmtree(model.model_path, ignore_errors=True)
            
            # Veritabanından sil
            db.delete(model)
            db.commit()
            
            logger.info(f"Model başarıyla silindi: {model_id}")
            return True, "Model başarıyla silindi"
            
        except Exception as e:
            logger.error(f"Model silme hatası: {str(e)}")
            db.rollback()
            return False, f"Model silme hatası: {str(e)}"
        
        finally:
            db.close()
    
    def update_model(self, model_id: str, revision: str = "main") -> Tuple[bool, str]:
        """
        Modeli günceller
        
        Args:
            model_id: Model ID
            revision: Branch/tag/commit (varsayılan: "main")
            
        Returns:
            Tuple[bool, str]: (Başarı durumu, mesaj)
        """
        # Mevcut model dosyalarını sil ve yeniden indir
        success, message, model_path = self.download_model(model_id, revision)
        
        if success:
            return True, "Model başarıyla güncellendi"
        else:
            return False, message
    
    def _get_model_info(self, model_id: str, revision: str = "main") -> Dict[str, Any]:
        """
        Hugging Face Hub API'sinden model bilgilerini alır
        
        Args:
            model_id: Model ID
            revision: Branch/tag/commit (varsayılan: "main")
            
        Returns:
            Dict[str, Any]: Model bilgileri
        """
        try:
            # Hugging Face API'den model bilgilerini al
            model_info = self.hf_api.model_info(model_id, revision=revision)
            
            # Framework ve görev bilgilerini çıkar
            if model_info.pipeline_tag:
                task = model_info.pipeline_tag
            else:
                task = None
            
            # Framework'ü belirle
            if model_info.library_name:
                framework = model_info.library_name
            else:
                # config.json'dan çıkarmaya çalış
                config_url = f"https://huggingface.co/{model_id}/raw/{revision}/config.json"
                try:
                    response = requests.get(config_url, timeout=10)
                    if response.status_code == 200:
                        config = response.json()
                        framework = config.get("library_name") or config.get("framework") or "transformers"
                    else:
                        framework = "transformers"  # Varsayılan
                except:
                    framework = "transformers"  # Varsayılan
            
            return {
                "task": task,
                "framework": framework,
                "commit_hash": model_info.sha
            }
        
        except Exception as e:
            logger.warning(f"Model bilgileri alınamadı: {str(e)}")
            return {
                "task": None,
                "framework": "transformers",  # Varsayılan
                "commit_hash": None
            }
    
    def _get_directory_size(self, path: str) -> int:
        """
        Dizinin boyutunu hesaplar
        
        Args:
            path: Dizin yolu
            
        Returns:
            int: Dosya boyutu (bayt)
        """
        total_size = 0
        
        for dirpath, dirnames, filenames in os.walk(path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if os.path.exists(fp):
                    total_size += os.path.getsize(fp)
        
        return total_size