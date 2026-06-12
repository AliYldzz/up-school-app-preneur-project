from sqlalchemy import Column, Integer, String
from app.core.database import Base

class TaskTemplate(Base):
    __tablename__ = "task_templates"

    id = Column(Integer, primary_key=True, index=True)
    subject_name = Column(String, index=True, nullable=False) # MATEMATİK, FİZİK, vb.
    topic = Column(String, nullable=False) # Örn: Türev Alma Kuralları
    level = Column(String, default="Orta") # Kolay, Orta, Zor
    estimated_time = Column(Integer, default=45) # dk
    description = Column(String, nullable=True) # Öğrenciye gösterilecek ek bilgi
    exam_type = Column(String, nullable=True) # TYT, AYT, YDT
    allowed_fields = Column(String, nullable=True) # Sayısal,Eşit Ağırlık,Sözel,Dil
