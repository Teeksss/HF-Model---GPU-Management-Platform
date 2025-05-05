"""
GPU kaynaklarını yöneten ve izleyen servis
"""
import logging
import subprocess
import json
from typing import Dict, List, Optional, Union, Any
import time
import threading

import numpy as np
try:
    import nvidia_smi
    NVIDIA_SMI_AVAILABLE = True
except ImportError:
    NVIDIA_SMI_AVAILABLE = False
    logging.warning("nvidia-smi Python bağlantısı yüklenemedi. GPU izleme kısıtlı olabilir.")

from app.config import get_settings
from app.monitoring.prometheus import update_gpu_metrics

settings = get_settings()
logger = logging.getLogger(__name__)

class GPUManager:
    """
    GPU kaynaklarını yöneten ve izleyen sınıf
    """
    
    def __init__(self):
        """
        GPU yöneticisini başlat
        """
        self.last_update = 0
        self.gpu_cache = []
        self.update_interval = 5  # saniye
        
        # GPU izleme için lock mekanizması
        self._lock = threading.RLock()
        
        # NVIDIA-SMI başlat (eğer varsa)
        if NVIDIA_SMI_AVAILABLE:
            try:
                nvidia_smi.nvmlInit()
                logger.info("NVIDIA Management Library başarıyla başlatıldı")
            except Exception as e:
                logger.error(f"NVIDIA Management Library başlatılamadı: {e}")
    
    def __del__(self):
        """
        Kaynak temizliği
        """
        if NVIDIA_SMI_AVAILABLE:
            try:
                nvidia_smi.nvmlShutdown()
            except:
                pass
    
    def detect_gpus(self) -> List[Dict[str, Any]]:
        """
        Sistemdeki GPU'ları tespit eder ve bilgilerini döndürür
        
        Returns:
            List[Dict[str, Any]]: GPU bilgileri listesi
        """
        # Cache kontrolü
        current_time = time.time()
        if current_time - self.last_update < self.update_interval and self.gpu_cache:
            return self.gpu_cache
        
        with self._lock:
            try:
                gpus = []
                
                if NVIDIA_SMI_AVAILABLE:
                    device_count = nvidia_smi.nvmlDeviceGetCount()
                    
                    for i in range(device_count):
                        handle = nvidia_smi.nvmlDeviceGetHandleByIndex(i)
                        
                        # GPU bilgilerini al
                        name = nvidia_smi.nvmlDeviceGetName(handle).decode('utf-8')
                        
                        # Bellek bilgilerini al
                        memory_info = nvidia_smi.nvmlDeviceGetMemoryInfo(handle)
                        total_memory_mb = memory_info.total / (1024 * 1024)
                        used_memory_mb = memory_info.used / (1024 * 1024)
                        free_memory_mb = memory_info.free / (1024 * 1024)
                        
                        # Kullanım bilgilerini al
                        utilization = nvidia_smi.nvmlDeviceGetUtilizationRates(handle)
                        gpu_util = utilization.gpu
                        
                        # Sıcaklık bilgisini al
                        temperature = nvidia_smi.nvmlDeviceGetTemperature(handle, nvidia_smi.NVML_TEMPERATURE_GPU)
                        
                        gpus.append({
                            'index': i,
                            'name': name,
                            'total_memory_mb': total_memory_mb,
                            'used_memory_mb': used_memory_mb,
                            'free_memory_mb': free_memory_mb,
                            'utilization_percent': float(gpu_util),
                            'temperature_c': float(temperature),
                        })
                
                # GPU yoksa veya hata oluştuysa komut satırı aracılığıyla dene
                if not gpus:
                    gpus = self._detect_gpus_cli()
                
                # Cache güncelle
                self.gpu_cache = gpus
                self.last_update = current_time
                
                # Prometheus metriklerini güncelle
                self._update_metrics(gpus)
                
                return gpus
                
            except Exception as e:
                logger.error(f"GPU tespiti sırasında hata: {e}")
                
                # Boş liste yerine en azından bir simüle GPU döndür (geliştirme/test için)
                if not self.gpu_cache and settings.ENVIRONMENT == 'development':
                    return [{
                        'index': 0,
                        'name': 'Simulated GPU',
                        'total_memory_mb': 8192.0,
                        'used_memory_mb': 512.0,
                        'free_memory_mb': 7680.0,
                        'utilization_percent': 10.0,
                        'temperature_c': 50.0,
                    }]
                
                # Cache'de bir şey varsa onu döndür, yoksa boş liste
                return self.gpu_cache if self.gpu_cache else []
    
    def _detect_gpus_cli(self) -> List[Dict[str, Any]]:
        """
        Komut satırı aracılığıyla GPU'ları tespit eder
        
        Returns:
            List[Dict[str, Any]]: GPU bilgileri
        """
        try:
            # nvidia-smi komutunu JSON formatında çalıştır
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=index,name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu', '--format=csv,noheader,nounits'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                encoding='utf-8',
                check=True
            )
            
            gpus = []
            
            # Çıktıyı satır satır işle
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = [part.strip() for part in line.split(',')]
                    
                    if len(parts) >= 7:
                        gpu_index, name, total_mem, used_mem, free_mem, util, temp = parts[:7]
                        
                        gpus.append({
                            'index': int(gpu_index),
                            'name': name,
                            'total_memory_mb': float(total_mem),
                            'used_memory_mb': float(used_mem),
                            'free_memory_mb': float(free_mem),
                            'utilization_percent': float(util),
                            'temperature_c': float(temp),
                        })
            
            return gpus
            
        except (subprocess.SubprocessError, ValueError, IndexError) as e:
            logger.error(f"CLI ile GPU tespiti sırasında hata: {e}")
            return []
    
    def _update_metrics(self, gpus: List[Dict[str, Any]]) -> None:
        """
        GPU metriklerini Prometheus'a gönderir
        
        Args:
            gpus: GPU bilgileri listesi
        """
        # GPU metriklerini güncelle
        try:
            # GPU verilerini GPU indekslerine göre eşleştir
            metrics = {}
            for gpu in gpus:
                metrics[gpu['index']] = {
                    'used_memory_mb': gpu['used_memory_mb'],
                    'utilization_percent': gpu['utilization_percent']
                }
            
            # Prometheus metriklerini güncelle
            update_gpu_metrics(metrics)
        except Exception as e:
            logger.error(f"GPU metrikleri güncellenirken hata: {e}")
    
    def get_gpu_memory_info(self, gpu_index: int) -> Optional[Dict[str, Any]]:
        """
        Belirli bir GPU'nun bellek bilgilerini döndürür
        
        Args:
            gpu_index: GPU indeksi
            
        Returns:
            Optional[Dict[str, Any]]: GPU bellek bilgileri
        """
        gpus = self.detect_gpus()
        
        for gpu in gpus:
            if gpu['index'] == gpu_index:
                return {
                    'total_mb': gpu['total_memory_mb'],
                    'used_mb': gpu['used_memory_mb'],
                    'free_mb': gpu['free_memory_mb'],
                    'utilization_percent': gpu['utilization_percent']
                }
        
        return None
    
    def select_optimal_gpu(self, min_memory_mb: int = 2000) -> Optional[int]:
        """
        En uygun GPU'yu seçer
        
        Args:
            min_memory_mb: Gereken minimum bellek miktarı (MB)
            
        Returns:
            Optional[int]: GPU indeksi veya hiçbiri
        """
        gpus = self.detect_gpus()
        
        # GPU yoksa None döndür
        if not gpus:
            return None
        
        # Yeterli belleğe sahip GPU'ları filtrele
        available_gpus = [
            gpu for gpu in gpus 
            if gpu['free_memory_mb'] >= min_memory_mb
        ]
        
        if not available_gpus:
            return None
        
        # Skor hesapla: bellek ve kullanım durumuna göre
        scored_gpus = []
        
        for gpu in available_gpus:
            # Bellek skoru: boş bellek miktarıyla doğru orantılı
            memory_score = gpu['free_memory_mb'] / gpu['total_memory_mb'] * 100
            
            # Kullanım skoru: düşük kullanım daha iyi
            usage_score = 100 - gpu['utilization_percent']
            
            # Sıcaklık skoru: düşük sıcaklık daha iyi
            temp_score = 100 - min(max(0, gpu['temperature_c'] - 30), 70) * (100 / 70)
            
            # Toplam skor (ağırlıklı ortalama)
            total_score = (0.6 * memory_score) + (0.3 * usage_score) + (0.1 * temp_score)
            
            scored_gpus.append((gpu['index'], total_score))
        
        # En yüksek skorlu GPU'yu döndür
        return max(scored_gpus, key=lambda x: x[1])[0] if scored_gpus else None