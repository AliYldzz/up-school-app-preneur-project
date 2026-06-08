from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, SyncPayload
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=list[TaskResponse])
def get_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aktif kullanıcının silinmemiş görevlerini listeler (READ)"""
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

