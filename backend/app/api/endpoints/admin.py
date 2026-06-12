from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.task import Task
from app.api.endpoints.auth import get_current_user

router = APIRouter()

# Güvenlik için basit bir admin kontrolü (Gerçek projede is_admin kolonu eklenebilir)
def verify_admin(current_user: User = Depends(get_current_user)):
    # Şimdilik herkes veya belirli bir e-posta admin sayılabilir
    # Örneğin: if current_user.email != "06.alyildiz.06@gmail.com": raise HTTPException(...)
    return current_user

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    """Admin paneli için genel istatistikleri döner"""
    total_users = db.query(User).count()
    total_tasks = db.query(Task).count()
    completed_tasks = db.query(Task).filter(Task.status == "completed").count()
    
    return {
        "total_users": total_users,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks
    }

@router.get("/users")
def get_all_users(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    """Tüm kullanıcıları listeler"""
    users = db.query(User).all()
    return [{
        "id": u.id,
        "fullName": u.fullName,
        "email": u.email,
        "focus_area": u.focus_area,
        "target_goal": u.target_goal,
        "weekly_hours": u.weekly_hours
    } for u in users]

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    """Belirli bir kullanıcıyı sistemden kalıcı olarak siler"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    db.delete(user)
    db.commit()
    return None
