from pydantic import BaseModel
from typing import Optional

# Ortak Görev Alanları
class TaskBase(BaseModel):
    title: str
    status: Optional[str] = "pending"
    priority_score: Optional[float] = 1.0
    subject_name: Optional[str] = None
    estimated_time: Optional[int] = 30
    actual_time: Optional[int] = 0
    version: Optional[int] = 1
    is_deleted: Optional[bool] = False
    
    # Soru takip alanları
    questions_solved: Optional[int] = 0
    questions_correct: Optional[int] = 0
    questions_wrong: Optional[int] = 0

# Görev Oluştururken Gerekli Şema
class TaskCreate(TaskBase):
    pass

# Görev Güncellerken Kullanılacak Şema
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    priority_score: Optional[float] = None
    subject_name: Optional[str] = None
    estimated_time: Optional[int] = None
    actual_time: Optional[int] = None
    version: Optional[int] = None
    is_deleted: Optional[bool] = None
    
    # Soru takip alanları güncelleme
    questions_solved: Optional[int] = None
    questions_correct: Optional[int] = None
    questions_wrong: Optional[int] = None

# API Yanıtlarında Döndürülecek Güvenli Şema
class TaskResponse(TaskBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Offline Senkronizasyon (Bulk Sync) için Şemalar
class SyncPayload(BaseModel):
    tasks: list[TaskCreate] # Yerelde oluşturulan/güncellenen görevler

