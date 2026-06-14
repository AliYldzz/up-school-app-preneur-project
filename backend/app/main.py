from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import tasks, auth, error_vault, plan, admin
from app.core.database import Base, engine

# Veritabanı modellerinin yüklenmesi (tabloların otomatik oluşması için gerekli)
from app.models.user import User
from app.models.task import Task
from app.models.error_vault import ErrorVault
from app.models.task_template import TaskTemplate

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

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE error_vault ADD COLUMN solution_text TEXT"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN scheduled_date VARCHAR"))
except Exception:
    pass

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE task_templates ADD COLUMN exam_type VARCHAR"))
        conn.execute(text("ALTER TABLE task_templates ADD COLUMN allowed_fields VARCHAR"))
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

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# CRUD Rotalarını uygulamaya dahil et
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(error_vault.router, prefix="/api/errors", tags=["errors"])
app.include_router(plan.router, prefix="/api/plan", tags=["plan"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Frontend (Vite) static files serving
frontend_dist_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "dist"
)

if not os.path.exists(frontend_dist_dir):
    frontend_dist_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "web",
        "dist"
    )

if os.path.exists(frontend_dist_dir):
    assets_dir = os.path.join(frontend_dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{rest_of_path:path}")
    async def serve_frontend(rest_of_path: str):
        if rest_of_path.startswith("api"):
            return {"detail": "Not Found"}
            
        file_path = os.path.join(frontend_dist_dir, rest_of_path)
        if rest_of_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        return FileResponse(os.path.join(frontend_dist_dir, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {"message": "API çalışıyor. DARR motoru hazır! (Frontend build henüz derlenmemiş)"}
