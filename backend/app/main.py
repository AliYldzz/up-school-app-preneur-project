from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import tasks
from app.core.database import Base, engine

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sınav Yol Arkadaşım API",
    description="LMS ve DARR algoritması backend servisi",
    version="1.0.0"
)

# Frontend'in (React) backend'e erişebilmesi için CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Geliştirme ortamı için tüm originlere açık
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CRUD Rotalarını uygulamaya dahil et
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])

@app.get("/")
def read_root():
    return {"message": "API çalışıyor. DARR motoru hazır!"}
