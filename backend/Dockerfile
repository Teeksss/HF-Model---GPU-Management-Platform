# Python tabanlı imaj kullan
FROM python:3.9-slim

# Çalışma dizinini oluştur
WORKDIR /app

# NVIDIA CUDA kütüphaneleri için gerekli bağımlılıklar
RUN apt-get update && apt-get install -y --no-install-recommends \
    gnupg2 \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# NVIDIA CUDA GPG anahtarı
RUN curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/debian11/x86_64/cuda-keyring_1.0-1_all.deb \
    -o cuda-keyring.deb \
    && dpkg -i cuda-keyring.deb \
    && rm cuda-keyring.deb

# NVIDIA CUDA kütüphanelerini yükle
RUN apt-get update && apt-get install -y --no-install-recommends \
    cuda-nvml-dev-11-8 \
    cuda-command-line-tools-11-8 \
    cuda-minimal-build-11-8 \
    cuda-libraries-dev-11-8 \
    libnccl-dev=2.15.5-1+cuda11.8 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Bağımlılık dosyasını kopyala
COPY requirements.txt .

# Bağımlılıkları yükle
RUN pip install --no-cache-dir -r requirements.txt

# Kaynak kodları kopyala
COPY . .

# Model ve önbellek dizinlerini oluştur
RUN mkdir -p /app/models /app/cache

# Uygulama bağlantı noktası
EXPOSE 8000

# Uygulamayı başlat
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]