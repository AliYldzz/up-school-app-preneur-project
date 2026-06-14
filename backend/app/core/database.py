from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os

# Kolay kurulum ve deneme için SQLite kullanıyoruz.
# Canlıya çıkarken Render/Supabase üzerinden PostgreSQL verilebilir.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lms_app.db")

# Render/Koyeb gibi platformlar url'i postgres:// ile başlatır, SQLAlchemy postgresql:// ister.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Veritabanı Session bağımlılığı (Dependency)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
