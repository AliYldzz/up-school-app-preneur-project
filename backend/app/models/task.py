from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(String, default="pending") # pending, completed, skipped
    priority_score = Column(Float, default=1.0)
