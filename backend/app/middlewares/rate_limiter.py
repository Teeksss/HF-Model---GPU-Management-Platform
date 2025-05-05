"""
API istek limitleyici middleware
"""
import logging
import time
from typing import Callable, Dict, Tuple

from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    API isteklerini limitleyen middleware
    """
    
    def __init__(
        self, 
        app,
        rate_limit: int = 100,  # İstek sayısı (istekler/zaman_penceresi)
        time_window: int = 60,  # Zaman penceresi (saniye)
    ):
        """
        Rate limiter middleware'i başlatır
        
        Args:
            app: FastAPI uygulaması
            rate_limit: İzin verilen maksimum istek sayısı
            time_window: Zaman penceresi (saniye)
        """
        super().__init__(app)
        self.rate_limit = rate_limit
        self.time_window = time_window
        self.clients: Dict[str, Tuple[int, float]] = {}  # IP -> (istek sayısı, timestamp)
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        İstek sayısını kontrol eder ve limiti aşarsa reddeder
        
        Args:
            request: HTTP isteği
            call_next: Sonraki middleware
            
        Returns:
            Response: HTTP yanıtı
        """
        # Docs ve Redoc sayfalarını kontrolden muaf tut
        if request.url.path in ("/docs", "/redoc", "/openapi.json"):
            return await call_next(request)
        
        # Client IP adresini al
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # IP adresine göre istek sayısını kontrol et
        if client_ip in self.clients:
            requests, timestamp = self.clients[client_ip]
            
            # Zaman penceresi dışına çıktıysa sıfırla
            if current_time - timestamp > self.time_window:
                self.clients[client_ip] = (1, current_time)
            else:
                # Limit aşıldıysa reddet
                if requests >= self.rate