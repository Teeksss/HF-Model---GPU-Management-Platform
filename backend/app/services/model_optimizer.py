"""
GPU üzerinde model optimizasyonu ve yükleme işlemlerini yapan servis
"""
import logging
import os
import time
import gc
from typing import Dict, List, Optional, Any, Union
import json
import threading
import tempfile

import torch
import transformers
from transformers import AutoModel, AutoTokenizer
import numpy as np

try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    logging.warning("ONNX Runtime yüklenemedi. ONNX optimizasyonları kullanılamaz.")

from app.config import get_settings
from app.services.gpu_manager import GPUManager
from app.monitoring.prometheus import record_model_load

settings = get_settings()
logger = logging.getLogger(__name__)

class ModelOptimizer:
    """
    GPU modelleri optimize eden ve yükleyen sınıf
    """
    
    def __init__(self):
        """
        Model optimizer'ı başlat
        """
        self.models = {}  # model_id -> model örneği
        self.tokenizers = {}  # model_id -> tokenizer örneği
        self.model_configs = {}  # model_id -> model yapılandırması
        self.models_lock = threading.RLock()
        
        # GPU yöneticisi
        self.gpu_manager = GPUManager()
    
    def load_model(
        self, 
        model_path: str, 
        model_id: str, 
        gpu_index: int,
        quantize: bool = True, 
        use_fp16: bool = True
    ) -> Dict[str, Any]:
        """
        Modeli yükler ve optimize eder
        
        Args:
            model_path: Model dizini
            model_id: Model ID
            gpu_index: GPU indeksi
            quantize: Quantization uygulanacak mı
            use_fp16: FP16 kullanılacak mı
            
        Returns:
            Dict[str, Any]: Sonuç
        """
        start_time = time.time()
        
        with self.models_lock:
            try:
                # Gerekli dizinleri kontrol et
                if not os.path.exists(model_path):
                    return {
                        "success": False,
                        "message": f"Model dizini bulunamadı: {model_path}"
                    }
                
                # GPU kontrolü
                gpus = self.gpu_manager.detect_gpus()
                if not gpus:
                    return {
                        "success": False,
                        "message": "Sistemde GPU bulunamadı"
                    }
                
                gpu_indices = [gpu["index"] for gpu in gpus]
                if gpu_index not in gpu_indices:
                    return {
                        "success": False,
                        "message": f"GPU indeksi geçersiz: {gpu_index}. Mevcut GPU'lar: {gpu_indices}"
                    }
                
                # Device ayarla
                device = f"cuda:{gpu_index}"
                
                # Önce tokenizer'ı yükle
                try:
                    tokenizer = AutoTokenizer.from_pretrained(model_path)
                    
                    # Tokenizer'ı kaydet
                    self.tokenizers[model_id] = tokenizer
                    
                    model_config = {
                        "model_id": model_id,
                        "gpu_index": gpu_index,
                        "device": device,
                        "quantized": quantize,
                        "fp16": use_fp16
                    }
                    
                    # Model konfigürasyonunu kaydet
                    self.model_configs[model_id] = model_config
                    
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"Tokenizer yüklenemedi: {str(e)}"
                    }
                
                # Modeli yükle
                try:
                    # CUDA belleğini temizle
                    torch.cuda.empty_cache()
                    
                    # Model parametreleri
                    model_kwargs = {
                        "torch_dtype": torch.float16 if use_fp16 else torch.float32,
                        "device_map": device
                    }
                    
                    # Modeli yükle
                    model = AutoModel.from_pretrained(
                        model_path,
                        **model_kwargs
                    )
                    
                    # Quantization işlemi (eğer isteniyorsa)
                    if quantize and hasattr(model, "quantize"):
                        model = model.quantize(8)  # 8-bit quantization
                    
                    # Modeli değerlendir (eval) moduna al
                    model.eval()
                    
                    # Modeli kaydet
                    self.models[model_id] = model
                    
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"Model yüklenemedi: {str(e)}"
                    }
                
                # Model yükleme süresini ölç
                duration = time.time() - start_time
                
                # Prometheus metriğini kaydet
                record_model_load(model_id, gpu_index, quantize, use_fp16, duration)
                
                return {
                    "success": True,
                    "message": "Model başarıyla yüklendi ve optimize edildi",
                    "loading_time": duration,
                    "gpu_index": gpu_index,
                    "model_id": model_id,
                    "quantized": quantize,
                    "fp16": use_fp16,
                    "device": device
                }
                
            except Exception as e:
                return {
                    "success": False,
                    "message": f"Model yükleme hatası: {str(e)}"
                }
    
    def optimize_with_onnx(
        self, 
        model_path: str, 
        model_id: str, 
        gpu_index: int
    ) -> Dict[str, Any]:
        """
        Modeli ONNX formatına dönüştürür ve optimize eder
        
        Args:
            model_path: Model dizini
            model_id: Model ID
            gpu_index: GPU indeksi
            
        Returns:
            Dict[str, Any]: Sonuç
        """
        if not ONNX_AVAILABLE:
            return {
                "success": False,
                "message": "ONNX Runtime yüklü değil"
            }
        
        start_time = time.time()
        
        with self.models_lock:
            try:
                # Gerekli dizinleri kontrol et
                if not os.path.exists(model_path):
                    return {
                        "success": False,
                        "message": f"Model dizini bulunamadı: {model_path}"
                    }
                
                # GPU kontrolü
                gpus = self.gpu_manager.detect_gpus()
                if not gpus:
                    return {
                        "success": False,
                        "message": "Sistemde GPU bulunamadı"
                    }
                
                gpu_indices = [gpu["index"] for gpu in gpus]
                if gpu_index not in gpu_indices:
                    return {
                        "success": False,
                        "message": f"GPU indeksi geçersiz: {gpu_index}. Mevcut GPU'lar: {gpu_indices}"
                    }
                
                # ONNX dizini oluştur
                onnx_dir = os.path.join(tempfile.gettempdir(), f"onnx_{model_id.replace('/', '_')}")
                os.makedirs(onnx_dir, exist_ok=True)
                
                onnx_path = os.path.join(onnx_dir, "model.onnx")
                
                # Önce PyTorch modelini yükle
                model = AutoModel.from_pretrained(model_path)
                tokenizer = AutoTokenizer.from_pretrained(model_path)
                
                # PyTorch modelini ONNX'e dönüştür
                dummy_input = tokenizer("Hello, world!", return_tensors="pt")
                
                with torch.no_grad():
                    torch.onnx.export(
                        model,
                        (dummy_input.input_ids,),
                        onnx_path,
                        input_names=["input_ids"],
                        output_names=["last_hidden_state", "pooler_output"],
                        dynamic_axes={
                            "input_ids": {0: "batch_size", 1: "sequence_length"},
                            "last_hidden_state": {0: "batch_size", 1: "sequence_length"},
                            "pooler_output": {0: "batch_size"}
                        },
                        opset_version=12
                    )
                
                # PyTorch modelini temizle
                del model
                gc.collect()
                torch.cuda.empty_cache()
                
                # ONNX modelini yükle
                onnx_session_options = ort.SessionOptions()
                onnx_session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                
                # GPU sağlayıcısını belirle
                providers = [
                    ("CUDAExecutionProvider", {"device_id": gpu_index}),
                    "CPUExecutionProvider"
                ]
                
                onnx_session = ort.InferenceSession(
                    onnx_path,
                    sess_options=onnx_session_options,
                    providers=providers
                )
                
                # Modelleri kaydet
                self.models[model_id] = onnx_session
                self.tokenizers[model_id] = tokenizer
                
                model_config = {
                    "model_id": model_id,
                    "gpu_index": gpu_index,
                    "device": f"cuda:{gpu_index}",
                    "onnx": True,
                    "onnx_path": onnx_path
                }
                
                self.model_configs[model_id] = model_config
                
                # Model dönüşüm süresini ölç
                duration = time.time() - start_time
                
                # Prometheus metriğini kaydet
                record_model_load(model_id, gpu_index, True, True, duration)
                
                return {
                    "success": True,
                    "message": "Model başarıyla ONNX'e dönüştürüldü ve optimize edildi",
                    "loading_time": duration,
                    "gpu_index": gpu_index,
                    "model_id": model_id,
                    "onnx": True,
                    "onnx_path": onnx_path
                }
                
            except Exception as e:
                return {
                    "success": False,
                    "message": f"ONNX optimizasyonu hatası: {str(e)}"
                }
    
    def unload_model(self, model_id: str) -> Dict[str, Any]:
        """
        Modeli bellekten boşaltır
        
        Args:
            model_id: Model ID
            
        Returns:
            Dict[str, Any]: Sonuç
        """
        with self.models_lock:
            try:
                if model_id in self.models:
                    # Modeli kaldır
                    if hasattr(self.models[model_id], "to"):
                        self.models[model_id].to("cpu")
                    
                    del self.models[model_id]
                    
                    # Tokenizer'ı kaldır
                    if model_id in self.tokenizers:
                        del self.tokenizers[model_id]
                    
                    # Config'i kaldır
                    if model_id in self.model_configs:
                        del self.model_configs[model_id]
                    
                    # Belleği temizle
                    gc.collect()
                    torch.cuda.empty_cache()
                    
                    return {
                        "success": True,
                        "message": f"Model bellekten kaldırıldı: {model_id}"
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Model bellekte bulunamadı: {model_id}"
                    }
                
            except Exception as e:
                return {
                    "success": False,
                    "message": f"Model kaldırma hatası: {str(e)}"
                }