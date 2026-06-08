from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ErrorVault(Base):
    __tablename__ = "error_vault"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Görsel verisi (S3 url'i veya local denemeler için Base64 data)
    image_url = Column(String, nullable=True)
    image_data = Column(Text, nullable=True) # Base64 kodlanmış görsel verisi
    
    # Metadata etiketleri
    subject_name = Column(String, index=True, nullable=True) # Matematik, Fizik vb.
    topic_name = Column(String, index=True, nullable=True) # Trigonometri, Optik vb.
    difficulty = Column(String, default="Orta") # Kolay, Orta, Zor
    
    # Soru görselinden çözümlenen metin
    ocr_text = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # İlişki
    owner = relationship("User", back_populates="errors")
