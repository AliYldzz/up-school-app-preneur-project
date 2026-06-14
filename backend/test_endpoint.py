import sys
import os
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.task import Task
from app.models.task_template import TaskTemplate
from app.models.error_vault import ErrorVault
from app.api.endpoints.tasks import get_tasks

db = SessionLocal()
try:
    # Get the first user
    user = db.query(User).first()
    if not user:
        print("No user found.")
        sys.exit(0)
    
    print(f"Testing for user: {user.fullName}, Focus: {user.focus_area}")
    
    # Clear existing tasks to trigger a fresh generation
    db.query(Task).filter(Task.user_id == user.id).delete()
    db.commit()
    print("Deleted all existing tasks to trigger fresh generation.")
    
    # Try calling get_tasks
    tasks = get_tasks(current_user=user, db=db)
    print(f"\nSuccess! Generated {len(tasks)} tasks.")
    for t in tasks:
        print(f"- Title: '{t.title}' | Subject: '{t.subject_name}' | Date: {t.scheduled_date}")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()

