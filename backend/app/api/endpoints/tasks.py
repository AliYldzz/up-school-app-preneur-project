from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, SyncPayload
from app.api.endpoints.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

def generate_weekly_plan(current_user: User, db: Session, start_date):
    from app.core.ai_service import generate_initial_study_plan
    from app.core.config import GEMINI_API_KEY
    from app.models.task_template import TaskTemplate
    import random
    
    # 1. Programatik olarak her güne Paragraf ve Problem rutinlerini ekle
    # 5 gün (offset 0'dan 4'e kadar)
    for day_offset in range(5):
        target_date = (start_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        
        # Paragraf rutini
        paragraf_task = Task(
            title="30 Paragraf Sorusu [TYT]",
            status="pending",
            priority_score=5.0,
            subject_name="TÜRKÇE",
            estimated_time=35,
            actual_time=0,
            scheduled_date=target_date,
            user_id=current_user.id,
            version=1,
            is_deleted=False
        )
        db.add(paragraf_task)
        
        # Problem rutini
        problem_task = Task(
            title="20 Problem Sorusu [TYT]",
            status="pending",
            priority_score=5.0,
            subject_name="MATEMATİK",
            estimated_time=30,
            actual_time=0,
            scheduled_date=target_date,
            user_id=current_user.id,
            version=1,
            is_deleted=False
        )
        db.add(problem_task)
    db.commit()

    # 2. Ana ders görevlerini seç ve dağıt
    available_templates = db.query(TaskTemplate).all()
    user_focus = current_user.focus_area or "Sayısal"
    filtered_templates = [
        t for t in available_templates 
        if t.allowed_fields and user_focus in t.allowed_fields
    ]
    if not filtered_templates:
        filtered_templates = [t for t in available_templates if t.exam_type == "TYT"]

    # Try Gemini
    if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
        try:
            template_data = [
                {
                    "id": t.id,
                    "subject": t.subject_name,
                    "topic": t.topic,
                    "level": t.level,
                    "time": t.estimated_time
                } for t in filtered_templates
            ]

            ai_plan = generate_initial_study_plan(
                fullName=current_user.fullName or "Öğrenci",
                focus_area=user_focus,
                target_goal=current_user.target_goal or "İlk 5000",
                weekly_hours=current_user.weekly_hours or "10-20 Saat",
                focus_time=current_user.focus_time or "Sabah 🌅",
                available_tasks=template_data
            )
            
            for t in ai_plan:
                template_id = t.get("template_id")
                day_offset = t.get("day_offset", 0)
                day_offset = max(0, min(4, day_offset)) # clamp bounds
                
                if template_id:
                    template = db.query(TaskTemplate).filter(TaskTemplate.id == template_id).first()
                    if template:
                        target_date = (start_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
                        db_task = Task(
                            title=f"{template.topic} ({template.level}) [{template.exam_type}]",
                            status="pending",
                            priority_score=t.get("priority_score", 1.0),
                            subject_name=template.subject_name,
                            estimated_time=template.estimated_time,
                            actual_time=0,
                            scheduled_date=target_date,
                            user_id=current_user.id,
                            version=1,
                            is_deleted=False
                        )
                        db.add(db_task)
            db.commit()
            return
        except Exception as e:
            print(f"[Gemini AI Plan Fallback] Hata: {e}")
            # Fallback to local scheduler

    # Fallback: Local engine
    import re
    target_goal_str = current_user.target_goal or ""
    weak_subjects_found = []
    all_possible_subjects = ["MATEMATİK", "FİZİK", "KİMYA", "BİYOLOJİ", "TÜRKÇE", "EDEBİYAT", "TARİH", "COĞRAFYA", "FELSEFE", "DİN", "DİL"]
    for s in all_possible_subjects:
        if re.search(r'\b' + re.escape(s) + r'\b', target_goal_str.upper()):
            weak_subjects_found.append(s)
            
    strong_neutral_templates = [t for t in filtered_templates if t.subject_name not in weak_subjects_found]
    weak_templates = [t for t in filtered_templates if t.subject_name in weak_subjects_found]
    
    if len(strong_neutral_templates) < 3:
        strong_neutral_templates = filtered_templates
        
    strong_neutral_templates.sort(key=lambda x: 0 if x.level == "Kolay" else 1)
    selected_strong = random.sample(strong_neutral_templates, min(3, len(strong_neutral_templates))) if strong_neutral_templates else []
    
    weak_templates.sort(key=lambda x: 0 if x.level == "Kolay" else 1)
    selected_weak = random.sample(weak_templates, min(2, len(weak_templates))) if weak_templates else []
    
    fallback_tasks_with_offset = []
    for idx, t in enumerate(selected_strong):
        day_offset = 0 if idx < 2 else 1
        fallback_tasks_with_offset.append((t, day_offset))
        
    for idx, t in enumerate(selected_weak):
        day_offset = 2 if idx == 0 else 3
        fallback_tasks_with_offset.append((t, day_offset))
        
    for t, day_offset in fallback_tasks_with_offset:
        target_date = (start_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        db_task = Task(
            title=f"{t.topic} ({t.level}) [{t.exam_type}]",
            status="pending",
            priority_score=1.0,
            subject_name=t.subject_name,
            estimated_time=t.estimated_time,
            actual_time=0,
            scheduled_date=target_date,
            user_id=current_user.id,
            version=1,
            is_deleted=False
        )
        db.add(db_task)
    db.commit()

def check_and_generate_next_week(current_user: User, db: Session):
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.is_deleted == False
    ).all()
    
    # 0 görev varsa (yeni kayıt), bugünden başlayan ilk haftayı oluştur
    if not tasks:
        generate_weekly_plan(current_user, db, start_date=datetime.utcnow().date())
        return

    # Haftanın bitip bitmediğini kontrol et
    # Koşul 1: Tüm mevcut görevlerin tamamlanmış/atlanmış/başarısız olması (pending veya in_progress kalmaması)
    # Koşul 2: VEYA tüm görevlerin planlanan tarihlerinin bugünden eski olması
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    all_finished = all(t.status in ["completed", "skipped", "failed"] for t in tasks)
    
    max_date_str = max(t.scheduled_date for t in tasks if t.scheduled_date) if tasks else None
    
    if all_finished or (max_date_str and max_date_str < today_str):
        # Yeni hafta başlama tarihi belirle
        # Eğer son görevin tarihi gelecek/bugün ise, o tarihten 1 gün sonrasından başlat.
        # Geçmişte kalmışsa doğrudan bugünden başlat.
        if max_date_str and max_date_str >= today_str:
            start_date = datetime.strptime(max_date_str, "%Y-%m-%d").date() + timedelta(days=1)
        else:
            start_date = datetime.utcnow().date()
            
        generate_weekly_plan(current_user, db, start_date=start_date)

@router.get("/", response_model=list[TaskResponse])
def get_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aktif kullanıcının silinmemiş görevlerini listeler (READ). Boşsa veya hafta bittiyse otomatik olarak yeni plan üretir."""
    check_and_generate_next_week(current_user, db)
    
    return db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.is_deleted == False
    ).all()

@router.post("/", response_model=TaskResponse)
def create_task(task: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aktif kullanıcıya ait yeni bir görev oluşturur (CREATE)"""
    db_task = Task(
        title=task.title,
        status=task.status or "pending",
        priority_score=task.priority_score or 1.0,
        subject_name=task.subject_name,
        estimated_time=task.estimated_time or 30,
        actual_time=task.actual_time or 0,
        scheduled_date=task.scheduled_date or datetime.utcnow().strftime("%Y-%m-%d"),
        user_id=current_user.id,
        version=1,
        is_deleted=False,
        questions_solved=task.questions_solved or 0,
        questions_correct=task.questions_correct or 0,
        questions_wrong=task.questions_wrong or 0
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task: TaskUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aktif kullanıcının bir görevini günceller (UPDATE)"""
    db_task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Görev bulunamadı veya bu görevi güncellemeye yetkiniz yok."
        )
    
    # Değerleri güncelle
    if task.title is not None:
        db_task.title = task.title
    if task.status is not None:
        db_task.status = task.status
    if task.priority_score is not None:
        db_task.priority_score = task.priority_score
    if task.subject_name is not None:
        db_task.subject_name = task.subject_name
    if task.estimated_time is not None:
        db_task.estimated_time = task.estimated_time
    if task.actual_time is not None:
        db_task.actual_time = task.actual_time
    if task.scheduled_date is not None:
        db_task.scheduled_date = task.scheduled_date
    if task.is_deleted is not None:
        db_task.is_deleted = task.is_deleted
    if task.questions_solved is not None:
        db_task.questions_solved = task.questions_solved
    if task.questions_correct is not None:
        db_task.questions_correct = task.questions_correct
    if task.questions_wrong is not None:
        db_task.questions_wrong = task.questions_wrong
        
    # Versiyonu artır
    db_task.version = (db_task.version or 1) + 1

    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{task_id}")
def delete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Görevi kalıcı olarak silmek yerine yumuşak silme (soft delete) yapar (DELETE)"""
    db_task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Görev bulunamadı veya bu görevi silmeye yetkiniz yok."
        )
    
    # Çevrimdışı senkronizasyon uyumluluğu için Soft Delete yapıyoruz
    db_task.is_deleted = True
    db_task.version = (db_task.version or 1) + 1
    db.commit()
    
    return {"message": "Görev başarıyla silindi (soft-deleted)."}

@router.post("/sync", response_model=list[TaskResponse])
def sync_tasks(payload: SyncPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mobil cihazdan gelen görev listesini senkronize eder (Offline-First Sync)"""
    synchronized_tasks = []
    
    for client_task in payload.tasks:
        # Client tarafındaki verileri veritabanındakilerle karşılaştır
        # Burada title, subject_name gibi benzersiz alanları kullanarak eşleme yapabiliriz
        # veya mobil uygulama yeni eklediklerini de gönderebilir.
        db_task = db.query(Task).filter(
            Task.title == client_task.title,
            Task.user_id == current_user.id
        ).first()
        
        if db_task:
            # Çakışma Çözümü (Conflict Resolution):
            # Eğer cihazdaki versiyon sunucudakinden büyükse sunucuyu güncelle
            if client_task.version > db_task.version:
                db_task.status = client_task.status
                db_task.priority_score = client_task.priority_score
                db_task.estimated_time = client_task.estimated_time
                db_task.actual_time = client_task.actual_time
                db_task.scheduled_date = client_task.scheduled_date
                db_task.version = client_task.version
                db_task.is_deleted = client_task.is_deleted
                db_task.questions_solved = client_task.questions_solved or 0
                db_task.questions_correct = client_task.questions_correct or 0
                db_task.questions_wrong = client_task.questions_wrong or 0
                db.commit()
            synchronized_tasks.append(db_task)
        else:
            # Yeni görev ise veritabanına ekle
            new_task = Task(
                title=client_task.title,
                status=client_task.status or "pending",
                priority_score=client_task.priority_score or 1.0,
                subject_name=client_task.subject_name,
                estimated_time=client_task.estimated_time or 30,
                actual_time=client_task.actual_time or 0,
                scheduled_date=client_task.scheduled_date or datetime.utcnow().strftime("%Y-%m-%d"),
                user_id=current_user.id,
                version=client_task.version or 1,
                is_deleted=client_task.is_deleted or False,
                questions_solved=client_task.questions_solved or 0,
                questions_correct=client_task.questions_correct or 0,
                questions_wrong=client_task.questions_wrong or 0
            )
            db.add(new_task)
            db.commit()
            db.refresh(new_task)
            synchronized_tasks.append(new_task)
            
    return [t for t in synchronized_tasks if not t.is_deleted]

