from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM, verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.models.task import Task
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, UserUpdate
from app.schemas.stats import UserStatsResponse

router = APIRouter()

# Yetkilendirme şeması (Token header'ından ayıklamak için)
# auto_error=False yapıyoruz ki token yoksa hatayı kendimiz fırlatalım
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Aktif giriş yapan kullanıcıyı token'dan çözerek veritabanından çeker"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz yetkilendirme kimliği. Lütfen tekrar giriş yapın.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Yeni kullanıcı oluşturur ve onboarding verilerini kaydeder"""
    # E-posta kontrolü
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var."
        )
    
    # Kullanıcı kaydı
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        fullName=user_in.fullName,
        hashed_password=hashed_password,
        focus_area=user_in.focus_area,
        target_goal=user_in.target_goal,
        weekly_hours=user_in.weekly_hours,
        focus_time=user_in.focus_time,
        profile_pic=user_in.profile_pic
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Otomatik giriş için token üret
    access_token = create_access_token(subject=new_user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """E-posta ve şifre ile giriş yapar, JWT Token döndürür"""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hatalı e-posta veya şifre."
        )
    
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Giriş yapmış aktif kullanıcının bilgilerini döner"""
    return current_user

@router.get("/stats", response_model=UserStatsResponse)
def get_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aktif kullanıcının tamamlanan görevlerinden istatistiklerini hesaplar"""
    completed_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "completed",
        Task.is_deleted == False
    ).all()
    
    total_solved = sum(t.questions_solved or 0 for t in completed_tasks)
    total_correct = sum(t.questions_correct or 0 for t in completed_tasks)
    total_wrong = sum(t.questions_wrong or 0 for t in completed_tasks)
    total_minutes = sum(t.actual_time or 0 for t in completed_tasks)
    
    accuracy_rate = (total_correct / total_solved * 100.0) if total_solved > 0 else 0.0
    total_hours = round(total_minutes / 60.0, 1)

    # --- Son 7 günün günlük soru istatistiği ve Seri (Streak) Hesaplama ---
    today = datetime.utcnow().date()
    daily_buckets = {today - timedelta(days=i): 0 for i in range(6, -1, -1)}  # 6 gün önce → bugün

    # Günleri set olarak tutalım (seri hesaplamak için)
    active_days = set()
    
    # Ders bazlı istatistikler için
    subject_stats = {}

    for t in completed_tasks:
        # Tarih işlemleri
        task_date = None
        if hasattr(t, 'updated_at') and t.updated_at:
            try:
                task_date = t.updated_at.date()
            except Exception:
                task_date = today
        else:
            task_date = today
            
        if task_date in daily_buckets:
            daily_buckets[task_date] += (t.questions_solved or 0)
            
        active_days.add(task_date)
        
        # Ders bazlı metrikler
        subj = t.subject_name or "Diğer"
        if subj not in subject_stats:
            subject_stats[subj] = {"solved": 0, "correct": 0}
        subject_stats[subj]["solved"] += (t.questions_solved or 0)
        subject_stats[subj]["correct"] += (t.questions_correct or 0)

    raw_values = list(daily_buckets.values())
    max_val = max(raw_values) if any(v > 0 for v in raw_values) else 1
    daily_chart = [round(v / max_val * 100) for v in raw_values]
    
    # Seri (Streak) hesaplama: Bugünden veya dünden geriye doğru kaç ardışık gün var?
    streak_days = 0
    check_date = today
    if check_date not in active_days:
        check_date = today - timedelta(days=1)
        
    while check_date in active_days:
        streak_days += 1
        check_date -= timedelta(days=1)
        
    # Ders bazlı başarı oranını formatlama
    subject_accuracy_list = []
    for subj, data in subject_stats.items():
        if data["solved"] > 0:
            pct = round((data["correct"] / data["solved"]) * 100)
        else:
            pct = 0
        subject_accuracy_list.append({
            "name": subj,
            "percent": pct
        })
    
    # Eğer hiç ders verisi yoksa boş dönmesin, varsayılan bir ders dönsün (sıfır oranlı)
    if not subject_accuracy_list:
        subject_accuracy_list = [{"name": "Matematik", "percent": 0}]
        
    return {
        "total_solved": total_solved,
        "total_correct": total_correct,
        "total_wrong": total_wrong,
        "accuracy_rate": round(accuracy_rate, 1),
        "total_hours": total_hours,
        "daily_chart": daily_chart,
        "streak_days": streak_days,
        "subject_accuracy": subject_accuracy_list
    }

@router.put("/me", response_model=UserResponse)
def update_me(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aktif kullanıcının profil detaylarını günceller"""
    if user_update.fullName is not None:
        current_user.fullName = user_update.fullName
    if user_update.focus_area is not None:
        current_user.focus_area = user_update.focus_area
    if user_update.target_goal is not None:
        current_user.target_goal = user_update.target_goal
    if user_update.weekly_hours is not None:
        current_user.weekly_hours = user_update.weekly_hours
    if user_update.focus_time is not None:
        current_user.focus_time = user_update.focus_time
    if user_update.profile_pic is not None:
        current_user.profile_pic = user_update.profile_pic
    if user_update.password is not None:
        current_user.hashed_password = get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aktif kullanıcının hesabını ve tüm verilerini kalıcı olarak siler"""
    db.delete(current_user)
    db.commit()
    return None
