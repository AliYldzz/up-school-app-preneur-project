from pydantic import BaseModel
from typing import Optional

# Frontend'den gelecek POST Verisi
class TaskCreate(BaseModel):
    title: str

# Frontend'den gelecek PUT Verisi
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    priority_score: Optional[float] = None

# Frontend'e Döndürülecek Veri Modeli
class TaskResponse(BaseModel):
    id: int
    title: str
    status: str
    priority_score: float

    class Config:
        from_attributes = True
