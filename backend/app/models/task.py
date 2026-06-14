from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(String, default="pending") # pending, in_progress, completed, skipped, failed
    priority_score = Column(Float, default=1.0)
    
    # Yeni Alanlar
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_name = Column(String, index=True, nullable=True) # Matematik, Fizik vb.
    estimated_time = Column(Integer, default=30) # Tahmini süre (dakika)
    actual_time = Column(Integer, default=0) # Harcanan gerçek süre (dakika)
    scheduled_date = Column(String, index=True, nullable=True) # Planlanan gün

    
    # Offline-first & Sync Alanları
    version = Column(Integer, default=1) # Senkronizasyon çakışma çözümü için
    is_deleted = Column(Boolean, default=False) # Soft delete (silindi işareti)
    
    # Soru Takip Verileri
    questions_solved = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    questions_wrong = Column(Integer, default=0)

    # İlişki
    owner = relationship("User", back_populates="tasks")

