"""
Konfigürasyon için test dosyası
"""
import unittest
import os
from unittest.mock import patch

from app.config import Settings, get_settings

class TestConfig(unittest.TestCase):
    """Settings sınıfı testleri"""
    
    def test_default_settings(self):
        """Varsayılan ayarları test eder"""
        settings = Settings()
        
        # Temel ayarlar
        self.assertEqual(settings.APP_NAME, "AI Model Management Platform")
        self.assertFalse(settings.DEBUG)
        self.assertEqual(settings.ENVIRONMENT, "development")
        self.assertEqual(settings.HOST, "0.0.0.0")
        self.assertEqual(settings.PORT, 8000)
        
        # Veritabanı ayarları
        self.assertEqual(settings.DATABASE_URL, "postgresql://aiuser:aipassword@postgres:5432/aiplatform")
        
        # JWT ayarları
        self.assertEqual(settings.JWT_ALGORITHM, "HS256")
        self.assertEqual(settings.JWT_EXPIRATION_MINUTES, 60)
        
        # CORS ayarları
        self.assertIn("http://localhost:3000", settings.CORS_ORIGINS)
        
        # Rate limiting
        self.assertEqual(settings.RATE_LIMIT, 100)
        self.assertEqual(settings.RATE_LIMIT_WINDOW, 60)
    
    @patch.dict(os.environ, {
        "DEBUG": "True",
        "ENVIRONMENT": "production",
        "PORT": "9000",
        "DATABASE_URL": "postgresql://user:pass@testdb:5432/testdb",
        "JWT_SECRET": "test_secret",
        "RATE_LIMIT": "50"
    })
    def test_environment_settings(self):
        """Ortam değişkenlerinden ayarları test eder"""
        settings = Settings()
        
        # Temel ayarlar
        self.assertTrue(settings.DEBUG)
        self.assertEqual(settings.ENVIRONMENT, "production")
        self.assertEqual(settings.PORT, 9000)
        
        # Veritabanı ayarları
        self.assertEqual(settings.DATABASE_URL, "postgresql://user:pass@testdb:5432/testdb")
        
        # JWT ayarları
        self.assertEqual(settings.JWT_SECRET, "test_secret")
        
        # Rate limiting
        self.assertEqual(settings.RATE_LIMIT, 50)
    
    def test_get_settings_caching(self):
        """get_settings fonksiyonu önbelleğe alıyor mu test eder"""
        settings1 = get_settings()
        settings2 = get_settings()
        
        # Aynı nesne örneği olmalı (LRU cache sayesinde)
        self.assertIs(settings1, settings2)


if __name__ == '__main__':
    unittest.main()