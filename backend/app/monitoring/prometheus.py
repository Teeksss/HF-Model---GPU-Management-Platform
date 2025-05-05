"""
Prometheus metrik toplama modülü
"""
import time
from typing import Callable, Dict
from fastapi import FastAPI, Request, Response
from prometheus_client import Counter, Histogram, Gauge, Summary, REGISTRY, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware

# Metrikler
REQUEST_COUNT = Counter(
    'http_requests_total', 
    'Total HTTP request count',
    ['method', 'endpoint', 'status_code']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds', 
    'HTTP request latency in seconds',
    ['method', 'endpoint', 'status_code']
)

REQUESTS_IN_PROGRESS = Gauge(
    'http_requests_in_progress',
    'Number of HTTP requests in progress',
    ['method', 'endpoint']
)

MODEL_LOAD_COUNT = Counter(
    'model_load_total',
    'Total number of model loads',
    ['model_id', 'gpu_index', 'quantized', 'fp16']
)

MODEL_LOAD_LATENCY = Summary(
    'model_load_duration_seconds',
    'Time taken to load a model',
    ['model_id', 'gpu_index']
)

GPU_MEMORY_USED = Gauge(
    'gpu_memory_used_bytes',
    'GPU memory used in bytes',
    ['gpu_index']
)

GPU_UTILIZATION = Gauge(
    'gpu_utilization_percent',
    'GPU utilization percentage',
    ['gpu_index']
)

DATABASE_QUERY_COUNT = Counter(
    'database_query_total',
    'Total number of database queries',
    ['operation', 'table']
)

DATABASE_QUERY_LATENCY = Histogram(
    'database_query_duration_seconds',
    'Database query latency in seconds',
    ['operation', 'table']
)

class PrometheusMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that collects Prometheus metrics
    """
    
    def __init__(self, app: FastAPI) -> None:
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        method = request.method
        path = request.url.path
        
        # Metrics endpoint için bypass
        if path == "/metrics":
            return await call_next(request)
        
        # Request başladı
        REQUESTS_IN_PROGRESS.labels(method=method, endpoint=path).inc()
        
        # Request latency ölçümü
        start_time = time.time()
        
        try:
            response = await call_next(request)
            status_code = response.status_code
            
            # Metrik kaydet
            REQUEST_COUNT.labels(
                method=method, 
                endpoint=path, 
                status_code=status_code
            ).inc()
            
            REQUEST_LATENCY.labels(
                method=method, 
                endpoint=path,
                status_code=status_code
            ).observe(time.time() - start_time)
            
            return response
        
        except Exception as e:
            # Hata durumunda metrik
            REQUEST_COUNT.labels(
                method=method, 
                endpoint=path, 
                status_code=500
            ).inc()
            
            REQUEST_LATENCY.labels(
                method=method, 
                endpoint=path,
                status_code=500
            ).observe(time.time() - start_time)
            
            raise e
        
        finally:
            # Request tamamlandı
            REQUESTS_IN_PROGRESS.labels(method=method, endpoint=path).dec()

def setup_prometheus(app: FastAPI) -> None:
    """
    Prometheus metriks endpoint'i ekle
    
    Args:
        app: FastAPI uygulaması
    """
    @app.get("/metrics", include_in_schema=False)
    async def metrics():
        return Response(
            content=generate_latest(REGISTRY),
            media_type=CONTENT_TYPE_LATEST
        )
    
    # Middleware ekle
    app.add_middleware(PrometheusMiddleware)

def record_model_load(model_id: str, gpu_index: int, quantized: bool, fp16: bool, duration: float) -> None:
    """
    Model yükleme metriği kaydet
    
    Args:
        model_id: Model ID
        gpu_index: GPU indeksi
        quantized: Quantize edilmiş mi
        fp16: FP16 kullanılmış mı
        duration: Yükleme süresi (saniye)
    """
    MODEL_LOAD_COUNT.labels(
        model_id=model_id,
        gpu_index=gpu_index,
        quantized=str(quantized),
        fp16=str(fp16)
    ).inc()
    
    MODEL_LOAD_LATENCY.labels(
        model_id=model_id,
        gpu_index=gpu_index
    ).observe(duration)

def update_gpu_metrics(gpu_metrics: Dict[int, Dict]) -> None:
    """
    GPU metriklerini güncelle
    
    Args:
        gpu_metrics: GPU metrikleri
    """
    for gpu_index, metrics in gpu_metrics.items():
        # Bellek kullanımı (byte)
        GPU_MEMORY_USED.labels(gpu_index=gpu_index).set(
            metrics.get('used_memory_mb', 0) * 1024 * 1024
        )
        
        # Kullanım yüzdesi
        GPU_UTILIZATION.labels(gpu_index=gpu_index).set(
            metrics.get('utilization_percent', 0)
        )

def record_db_query(operation: str, table: str, duration: float) -> None:
    """
    Veritabanı sorgu metriği kaydet
    
    Args:
        operation: Operasyon tipi (SELECT, INSERT, vb.)
        table: Tablo adı
        duration: Sorgu süresi (saniye)
    """
    DATABASE_QUERY_COUNT.labels(
        operation=operation,
        table=table
    ).inc()
    
    DATABASE_QUERY_LATENCY.labels(
        operation=operation,
        table=table
    ).observe(duration)