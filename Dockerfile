# Stage 1: React (Frontend) Derleme
FROM node:18-alpine AS frontend-builder
WORKDIR /web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# Stage 2: FastAPI (Backend) ve Servis
FROM python:3.10-slim
WORKDIR /app

# PostgreSQL için gerekli sistem bağımlılıklarını kurma
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Backend bağımlılıklarını kurma
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Backend kodlarını kopyalama
COPY backend/ ./

# Stage 1'de derlenen frontend dosyalarını FastAPI'nin okuduğu dizine kopyalama
COPY --from=frontend-builder /web/dist /web/dist

# Portu açma ve çalıştırma
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
