import jwt
from datetime import datetime, timedelta
from typing import Any, Union
from passlib.context import CryptContext

# Şifre güvenliği için bcrypt bağlamı
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Ayarları (Geliştirme için sabit, canlıya geçerken .env'den alınacak)
SECRET_KEY = "SUPER_SECRET_KEY_FOR_SINAV_YOL_ARKADASIM_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 gün geçerli token

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Girilen düz şifre ile veritabanındaki hash'i karşılaştırır"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Düz şifreyi hash'ler"""
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """Kullanıcı için JWT Access Token üretir"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
