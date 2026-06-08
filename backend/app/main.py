from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import tasks, auth, error_vault, plan
from app.core.database import Base, engine

# Veritabanı modellerinin yüklenmesi (tabloların otomatik oluşması için gerekli)
from app.models.user import User
from app.models.task import Task
from app.models.error_vault import ErrorVault

# Veritabanı tablolarını oluştur ve otomatik göçleri (migration) çalıştır
from sqlalchemy import text
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN questions_solved INTEGER DEFAULT 0"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN questions_correct INTEGER DEFAULT 0"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN questions_wrong INTEGER DEFAULT 0"))
except Exception:
    pass

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
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(error_vault.router, prefix="/api/errors", tags=["errors"])
app.include_router(plan.router, prefix="/api/plan", tags=["plan"])

@app.get("/")
def read_root():
    return {"message": "API çalışıyor. DARR motoru hazır!"}
