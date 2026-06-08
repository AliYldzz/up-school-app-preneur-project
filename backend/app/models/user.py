from sqlalchemy import Column, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    fullName = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Onboarding Verileri
    focus_area = Column(String, default="Sayısal") # Sayısal, Eşit Ağırlık, Sözel
    target_goal = Column(String, default="İlk 5000") # Tıp, Hukuk vb.
    weekly_hours = Column(String, default="10-20 Saat")
    focus_time = Column(String, default="Sabah 🌅")
    exam_date = Column(String, nullable=True) # Sınav tarihi (örn: YYYY-MM-DD)
    daily_goal_hours = Column(Float, default=4.0) # Günlük hedef çalışma saati
    
    # Profil Fotoğrafı (Base64 kodlanmış veri olarak saklayacağız)
    profile_pic = Column(Text, nullable=True)

    # İlişkiler
    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    errors = relationship("ErrorVault", back_populates="owner", cascade="all, delete-orphan")

