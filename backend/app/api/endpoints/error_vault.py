from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.error_vault import ErrorVault
from app.models.user import User
from app.schemas.error_vault import ErrorVaultCreate, ErrorVaultResponse, ErrorVaultUpdate
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=list[ErrorVaultResponse])
def get_errors(
    subject: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aktif kullanıcının Hata Kumbarasındaki tüm yanlış sorularını listeler"""
    query = db.query(ErrorVault).filter(ErrorVault.user_id == current_user.id)
    if subject:
        query = query.filter(ErrorVault.subject_name.ilike(f"%{subject}%"))
    return query.all()

@router.post("/", response_model=ErrorVaultResponse, status_code=status.HTTP_201_CREATED)
def create_error(
    error_in: ErrorVaultCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Kullanıcı için yeni bir hatalı soru kaydı oluşturur"""
    db_error = ErrorVault(
        user_id=current_user.id,
        image_url=error_in.image_url,
        image_data=error_in.image_data,
        subject_name=error_in.subject_name,
        topic_name=error_in.topic_name,
        difficulty=error_in.difficulty,
        ocr_text=error_in.ocr_text
    )
    db.add(db_error)
    db.commit()
    db.refresh(db_error)
    return db_error

@router.get("/{error_id}", response_model=ErrorVaultResponse)
def get_error_detail(
    error_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Belirli bir hatalı sorunun detaylarını getirir"""
    db_error = db.query(ErrorVault).filter(
        ErrorVault.id == error_id,
        ErrorVault.user_id == current_user.id
    ).first()
    if not db_error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hatalı soru kaydı bulunamadı."
        )
    return db_error

@router.put("/{error_id}", response_model=ErrorVaultResponse)
def update_error(
    error_id: int,
    error_update: ErrorVaultUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hatalı soru etiketlerini (ders, konu, zorluk, ocr) günceller"""
    db_error = db.query(ErrorVault).filter(
        ErrorVault.id == error_id,
        ErrorVault.user_id == current_user.id
    ).first()
    
    if not db_error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hatalı soru kaydı bulunamadı."
        )
        
    if error_update.subject_name is not None:
        db_error.subject_name = error_update.subject_name
    if error_update.topic_name is not None:
        db_error.topic_name = error_update.topic_name
    if error_update.difficulty is not None:
        db_error.difficulty = error_update.difficulty
    if error_update.ocr_text is not None:
        db_error.ocr_text = error_update.ocr_text
        
    db.commit()
    db.refresh(db_error)
    return db_error

@router.delete("/{error_id}")
def delete_error(
    error_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hatalı soru kaydını kalıcı olarak siler"""
    db_error = db.query(ErrorVault).filter(
        ErrorVault.id == error_id,
        ErrorVault.user_id == current_user.id
    ).first()
    
    if not db_error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hatalı soru kaydı bulunamadı."
        )
        
    db.delete(db_error)
    db.commit()
    return {"message": "Hatalı soru kumbaradan başarıyla kaldırıldı."}
