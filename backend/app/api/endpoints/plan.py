from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.plan import RescheduleRequest, RescheduledPlanResponse
from app.api.endpoints.auth import get_current_user
from app.darr_engine.engine import run_darr_algorithm, calculate_remaining_days, get_weekly_hours_limit

router = APIRouter()

@router.post("/reschedule", response_model=RescheduledPlanResponse)
def reschedule_plan(
    payload: RescheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcı görev planını aksattığında çalışır.
    Belirtilen tamamlanmamış görevleri 'skipped' olarak günceller ve
    kalan tüm görevleri DARR motoruna göndererek yeni 7 günlük programı hesaplar.
    """
    # 1. Eksik kalan görevlerin durumlarını güncelle
    if payload.incomplete_task_ids:
        db.query(Task).filter(
            Task.id.in_(payload.incomplete_task_ids),
            Task.user_id == current_user.id
        ).update(
            {"status": "skipped", "version": Task.version + 1},
            synchronize_session=False
        )
        db.commit()

    # 2. Yeniden planlanacak görevleri çek (completed ve deleted olmayan tüm görevler)
    tasks_to_reschedule = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status != "completed",
        Task.is_deleted == False
    ).all()

    if not tasks_to_reschedule:
        return {
            "message": "Yeniden planlanacak herhangi bir görev bulunamadı. Hepsi tamamlanmış görünüyor!",
            "scheduled_tasks": []
        }

    # 3. Parametreleri hazırla
    # Sınava kalan gün sayısı
    r_days = payload.remaining_days
    if r_days is None:
        r_days = calculate_remaining_days(current_user.exam_date)
        
    # Haftalık limit saat
    weekly_limit = get_weekly_hours_limit(current_user.weekly_hours)
    
    # Günlük hedef saat
    daily_goal = current_user.daily_goal_hours or 4.0

    # SQLAlchemy modellerini sözlük listesine dönüştür
    task_dicts = []
    for t in tasks_to_reschedule:
        task_dicts.append({
            "id": t.id,
            "title": t.title,
            "subject_name": t.subject_name,
            "status": t.status,
            "priority_score": t.priority_score
        })

    # 4. Yapay Zeka (Gemini) ile yeniden planlamayı dene
    from app.core.config import GEMINI_API_KEY
    from app.core.ai_service import reschedule_study_plan
    
    use_fallback = True
    optimized_tasks = []
    
    if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
        try:
            # Yapılamayan görevleri ve diğer görevleri listele
            incomplete_list = [t for t in task_dicts if t["id"] in (payload.incomplete_task_ids or [])]
            other_list = [t for t in task_dicts if t["id"] not in (payload.incomplete_task_ids or [])]
            
            ai_optimized = reschedule_study_plan(
                remaining_days=r_days,
                target_goal=current_user.target_goal or "İlk 5000",
                focus_area=current_user.focus_area or "Sayısal",
                energy_level=payload.current_energy_level or 3,
                incomplete_tasks=incomplete_list,
                other_tasks=other_list
            )
            
            optimized_tasks = ai_optimized
            use_fallback = False
            message_prefix = "AI (Gemini) DARR motoru"
        except Exception as e:
            print(f"[Gemini AI Reschedule Fallback] Hata: {e}")
            # Hata durumunda yerel DARR motoru çalışacak
            
    if use_fallback:
        # Fallback: Kural tabanlı matematiksel DARR motorunu çalıştır
        optimized_tasks = run_darr_algorithm(
            remaining_days=r_days,
            weekly_hours_limit=weekly_limit,
            daily_goal_hours=daily_goal,
            current_energy_level=payload.current_energy_level,
            tasks_to_schedule=task_dicts
        )
        message_prefix = "Kural tabanlı DARR motoru"

    # 5. Veritabanındaki öncelik puanlarını ve süreleri güncelle
    for opt_task in optimized_tasks:
        db.query(Task).filter(
            Task.id == opt_task["id"],
            Task.user_id == current_user.id
        ).update(
            {
                "priority_score": opt_task["priority_score"],
                "estimated_time": opt_task.get("estimated_time", 60),
                "version": Task.version + 1
            },
            synchronize_session=False
        )
    db.commit()

    # 6. Güncellenmiş görevleri veritabanından çekip geri dön
    db_updated_tasks = db.query(Task).filter(
        Task.id.in_([ot["id"] for ot in optimized_tasks]),
        Task.user_id == current_user.id
    ).all()

    # Öncelik sırasına göre sırala
    db_updated_tasks.sort(key=lambda x: x.priority_score, reverse=True)

    return {
        "message": f"{message_prefix} planınızı başarıyla optimize etti. Kalan gün: {r_days}",
        "scheduled_tasks": db_updated_tasks
    }
