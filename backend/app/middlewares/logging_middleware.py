"""
API isteklerini loglayan middleware
"""
import logging
import time
from typing import Callable
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    API isteklerini loglar
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        İsteği loglar ve sonraki middleware'e iletir
        
        Args:
            request: HTTP isteği
            call_next: Sonraki middleware
            
        Returns:
            Response: HTTP yanıtı
        """
        # Her istek için benzersiz ID oluştur
        request_id = str(uuid.uuid4())
        
        # İstek bilgilerini logla
        start_time = time.time()
        logger.info(
            f"Request started: {request.method} {request.url.path} "
            f"(ID: {request_id})"
        )
        
        # Kullanıcı kimliğine erişmeye çalış
        client_host = request.client.host if request.client else "unknown"
        
        # İsteği işle
        try:
            response = await call_next(request)
            
            # İstek süresini hesapla
            process_time = time.time() - start_time
            
            # Yanıt bilgilerini logla
            logger.info(
                f"Request completed: {request.method} {request.url.path} "
                f"- Status: {response.status_code} - Time: {process_time:.3f}s "
                f"(ID: {request_id}, Client: {client_host})"
            )
            
            # Yanıta istek ID ekle
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Hata durumunda logla
            logger.error(
                f"Request failed: {request.method} {request.url.path} "
                f"- Error: {str(e)} (ID: {request_id}, Client: {client_host})"
            )
            raise