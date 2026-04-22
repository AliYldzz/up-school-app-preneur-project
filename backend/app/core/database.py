from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Kolay kurulum ve deneme için SQLite kullanıyoruz.
# Canlıya çıkarken "postgresql://postgres:password@localhost:5432/lms_db" yapılacak.
SQLALCHEMY_DATABASE_URL = "sqlite:///./lms_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
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
