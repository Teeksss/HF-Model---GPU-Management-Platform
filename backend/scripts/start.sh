#!/bin/bash

# AI Model Platformu Backend Başlatma Betiği

echo "AI Model Platformu Backend başlatılıyor..."

# Veritabanı migrasyonlarını çalıştır
echo "Veritabanı migrasyonları çalıştırılıyor..."
python -m alembic upgrade head

# Ortam değişkenlerini kontrol et
if [ -z "$DATABASE_URL" ]; then
    echo "UYARI: DATABASE_URL ortam değişkeni tanımlanmamış!"
    echo "Varsayılan PostgreSQL bağlantısı kullanılacak: postgresql://aiuser:aipassword@postgres:5432/aiplatform"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "UYARI: JWT_SECRET ortam değişkeni tanımlanmamış!"
    echo "Güvenlik açısından üretim ortamında güçlü bir JWT_SECRET değeri ayarlamanız önerilir."
fi

# Dizinleri oluştur
mkdir -p /app/models /app/cache

# GPU durumunu kontrol et
echo "GPU durumu kontrol ediliyor..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi
    echo "GPU erişimi BAŞARILI!"
else
    echo "UYARI: NVIDIA GPU bulunamadı veya nvidia-smi çalıştırılamadı."
    echo "GPU desteği olmadan çalışmaya devam edilecek."
fi

# Uygulamayı başlat
echo "Uygulama başlatılıyor..."
if [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ] || [ "$DEBUG" = "1" ]; then
    echo "Geliştirme modunda başlatılıyor (--reload aktif)"
    exec uvicorn main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000} --reload
else
    echo "Üretim modunda başlatılıyor"
    exec uvicorn main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000} --workers ${WORKERS:-4}
fi