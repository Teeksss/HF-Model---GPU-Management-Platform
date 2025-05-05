# HF Model & GPU Management Platform

## Proje Amacı
Hugging Face modellerinin yönetimi ve GPU kaynaklarının optimize kullanımı için eksiksiz, profesyonel bir platform sağlar.

## Özellikler
- Hugging Face model indirme/güncelleme
- GPU kullanım izleme ve dinamik GPU atama
- JWT tabanlı kullanıcı yönetimi (Login/Register/Refresh Token)
- Docker, Kubernetes (Helm Chart) dağıtım desteği
- CI/CD Pipeline (Backend + Frontend Test)
- Grafana ve Prometheus ile canlı sistem izleme
- Redis ile hızlı caching
- Tam OpenAPI (Swagger) desteği
- Sağlam dökümantasyon (Kurulum, API Kullanımı, Admin Rehberi)

## Kullanılan Teknolojiler
FastAPI, ReactJS, PostgreSQL, Qdrant, Redis, Docker, Kubernetes, Prometheus, Grafana, Helm, GitHub Actions

## Kurulum
```bash
bash repo_setup.sh
```

## Katkıda Bulunma
- Branch açın (`feature/`, `bugfix/`)
- Testler geçmeden PR merge edilmez
- Kodlama standartlarına uyun (Black, Prettier)
