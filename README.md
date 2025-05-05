# Modüler AI Yönetim Platformu

Hugging Face modellerinin yönetilebildiği, GPU kaynaklarının etkin bir şekilde optimize edildiği, kullanıcı dostu bir arayüzle desteklenen, güvenli ve yüksek performanslı bir Modüler AI Yönetim Platformu.

## Özellikler

- **Model Yönetimi**: Hugging Face Hub'dan model indirme, versiyon yönetimi ve model bilgilerini görüntüleme
- **GPU Optimizasyonu**: Modelleri GPU'ya yükleme, optimal GPU seçimi ve GPU izleme
- **Kullanıcı Yönetimi**: Çok kullanıcılı mimari, rol tabanlı erişim kontrolü
- **Ölçeklenebilirlik**: Kubernetes destekli mikroservis mimarisi
- **İzleme**: GPU, CPU, bellek ve API kullanımının gerçek zamanlı izlenmesi
- **Veritabanı**: PostgreSQL ilişkisel veritabanı, Qdrant vektör veritabanı
- **Önbellekleme**: Redis ile yüksek performanslı önbellekleme

## Sistem Mimarisi

Platform, aşağıdaki bileşenlerden oluşmaktadır:

- **Frontend**: React.js ve Chakra UI ile geliştirilmiş modern kullanıcı arayüzü
- **Backend**: FastAPI ile geliştirilmiş yüksek performanslı Python API
- **Veritabanı**: PostgreSQL (ilişkisel veri) ve Qdrant (vektör veri)
- **Önbellek**: Redis önbellekleme sistemi
- **İzleme**: Prometheus ve Grafana ile sistem izleme
- **Orkestrasyon**: Docker ve Kubernetes ile servis orkestrasyonu

## Kurulum

### Docker ile Kurulum

```bash
# Repoyu klonlayın
git clone https://github.com/kullanici/ai-model-platform.git
cd ai-model-platform

# .env dosyalarını yapılandırın
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Docker servislerini başlatın
docker-compose up -d

# İzleme araçlarını başlatın
docker-compose -f docker-compose.monitoring.yml up -d