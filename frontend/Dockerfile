# Node.js tabanlı imaj kullan
FROM node:18-alpine

# Çalışma dizinini oluştur
WORKDIR /app

# Bağımlılık dosyalarını kopyala
COPY package.json package-lock.json ./

# Bağımlılıkları yükle
RUN npm ci

# Kaynak kodları kopyala
COPY . .

# Geliştirme için bağlantı noktası
EXPOSE 3000

# Geliştirme sunucusunu başlat
CMD ["npm", "start"]