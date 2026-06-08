from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ErrorVaultBase(BaseModel):
    subject_name: Optional[str] = None
    topic_name: Optional[str] = None
    difficulty: Optional[str] = "Orta"
    ocr_text: Optional[str] = None

class ErrorVaultCreate(ErrorVaultBase):
    image_data: Optional[str] = None # Base64 kodlanmış görsel verisi (local için)
    image_url: Optional[str] = None  # AWS S3 / Firebase Storage URL'i (varsa)

class ErrorVaultUpdate(BaseModel):
    subject_name: Optional[str] = None
    topic_name: Optional[str] = None
    difficulty: Optional[str] = None
    ocr_text: Optional[str] = None

class ErrorVaultResponse(ErrorVaultBase):
    id: int
    user_id: int
    image_url: Optional[str] = None
    image_data: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
