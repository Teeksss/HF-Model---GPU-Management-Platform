/**
 * Türkçe dil desteği için çeviriler
 */
const tr = {
  // Genel 
  "app.title": "AI Model Yönetim Platformu",
  "app.loading": "Yükleniyor...",
  "app.error": "Bir hata oluştu",
  "app.retry": "Tekrar Dene",
  "app.save": "Kaydet",
  "app.cancel": "İptal",
  "app.delete": "Sil",
  "app.edit": "Düzenle",
  "app.yes": "Evet",
  "app.no": "Hayır",
  
  // Navigasyon
  "nav.dashboard": "Dashboard",
  "nav.models": "Model Yönetimi",
  "nav.gpuMonitor": "GPU İzleme",
  "nav.users": "Kullanıcı Yönetimi",
  "nav.stats": "İstatistikler",
  "nav.profile": "Profil",
  "nav.logout": "Çıkış Yap",
  
  // Kimlik doğrulama
  "auth.login": "Giriş Yap",
  "auth.register": "Kayıt Ol",
  "auth.username": "Kullanıcı Adı",
  "auth.email": "E-posta",
  "auth.password": "Şifre",
  "auth.confirmPassword": "Şifre Onayı",
  "auth.fullName": "Ad Soyad",
  "auth.forgotPassword": "Şifremi Unuttum",
  "auth.noAccount": "Hesabınız yok mu?",
  "auth.haveAccount": "Zaten hesabınız var mı?",
  
  // Dashboard
  "dashboard.welcome": "Hoş Geldiniz",
  "dashboard.totalModels": "Toplam Model",
  "dashboard.gpuCount": "GPU Sayısı",
  "dashboard.cpuUsage": "CPU Kullanımı",
  "dashboard.memoryUsage": "Bellek Kullanımı",
  "dashboard.recentActivity": "Son Aktiviteler",
  
  // Model Yönetimi
  "models.title": "Model Yönetimi",
  "models.add": "Yeni Model Ekle",
  "models.search": "Model ara...",
  "models.filter": "Filtrele",
  "models.noModels": "Hiç model bulunamadı",
  "models.delete.confirm": "Bu modeli silmek istediğinizden emin misiniz?",
  "models.delete.warning": "Bu işlem geri alınamaz ve modelle ilgili tüm veriler silinecektir.",
  "models.modelId": "Model ID",
  "models.description": "Açıklama",
  "models.task": "Görev",
  "models.framework": "Framework",
  "models.publicAccess": "Diğer kullanıcılar görebilir",
  "models.lastUpdated": "Son Güncelleme",
  "models.versions": "Versiyonlar",
  "models.optimize": "Optimize Et",
  
  // GPU İzleme
  "gpu.title": "GPU İzleme",
  "gpu.utilization": "GPU Kullanımı",
  "gpu.memory": "Bellek",
  "gpu.temperature": "Sıcaklık",
  "gpu.noGPU": "GPU bulunamadı",
  "gpu.selectOptimal": "Optimal GPU Seç",
  "gpu.refreshInterval": "Yenileme Aralığı",
  
  // Kullanıcı Yönetimi
  "users.title": "Kullanıcı Yönetimi",
  "users.search": "Kullanıcı ara...",
  "users.status": "Durum",
  "users.role": "Yetki",
  "users.actions": "İşlemler",
  "users.activate": "Aktifleştir",
  "users.deactivate": "Devre Dışı Bırak",
  "users.makeAdmin": "Admin Yetkisi Ver",
  "users.removeAdmin": "Admin Yetkisini Kaldır",
  "users.active": "Aktif",
  "users.inactive": "Devre dışı",
  "users.admin": "Admin",
  "users.user": "Kullanıcı",
  
  // Profil
  "profile.title": "Kullanıcı Profili",
  "profile.updateProfile": "Profili Güncelle",
  "profile.changePassword": "Şifre Değiştir",
  "profile.newPassword": "Yeni Şifre",
  "profile.activities": "Aktiviteler",
  "profile.recentModels": "Son Modeller",
  "profile.recentGPUUsage": "Son GPU Kullanımları",
  
  // Optimizasyon
  "optimize.title": "Model Optimizasyonu",
  "optimize.settings": "Optimizasyon Ayarları",
  "optimize.quantize": "Quantization Uygula (INT8)",
  "optimize.fp16": "FP16 (Half Precision) Kullan",
  "optimize.