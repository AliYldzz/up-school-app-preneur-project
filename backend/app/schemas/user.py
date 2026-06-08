from pydantic import BaseModel, EmailStr
from typing import Optional

# Ortak Kullanıcı Alanları
class UserBase(BaseModel):
    email: EmailStr
    fullName: str
    focus_area: Optional[str] = "Sayısal"
    target_goal: Optional[str] = "İlk 5000"
    weekly_hours: Optional[str] = "10-20 Saat"
    focus_time: Optional[str] = "Sabah 🌅"
    profile_pic: Optional[str] = None
    exam_date: Optional[str] = None
    daily_goal_hours: Optional[float] = 4.0

# Kayıt Olurken Gelecek Şema
class UserCreate(UserBase):
    password: str

# Profil Güncelleme Şeması
class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    focus_area: Optional[str] = None
    target_goal: Optional[str] = None
    weekly_hours: Optional[str] = None
    focus_time: Optional[str] = None
    profile_pic: Optional[str] = None
    password: Optional[str] = None
    exam_date: Optional[str] = None
    daily_goal_hours: Optional[float] = None


# Giriş Yaparken Gelecek Şema
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# API Yanıtlarında Dönecek Güvenli Şema
class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# Token Yapısı
class Token(BaseModel):
    access_token: str
    token_type: str

# Token İçindeki Data Yapısı
class TokenData(BaseModel):
    email: Optional[str] = None
