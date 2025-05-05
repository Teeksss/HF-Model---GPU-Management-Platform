# Modüler AI Yönetim Platformu Makefile
.PHONY: help setup dev-backend dev-frontend build start stop clean test lint

# Değişkenler
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_FILE = docker-compose.yml
DOCKER_COMPOSE_MONITORING = docker-compose.monitoring.yml
DOCKER_COMPOSE_STORAGE = docker-compose.storage.yml
K8S_DIR = kubernetes

help:
	@echo "Modüler AI Yönetim Platformu için komutlar:"
	@echo "  setup           - Geliştirme için gerekli bağımlılıkları kurar"
	@echo "  dev-backend     - Backend geliştirme sunucusunu başlatır"
	@echo "  dev-frontend    - Frontend geliştirme sunucusunu başlatır"
	@echo "  build           - Docker imajlarını oluşturur"
	@echo "  start           - Docker Compose ile tüm servisleri başlatır"
	@echo "  start-monitoring - İzleme araçlarını başlat