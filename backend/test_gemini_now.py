import os
import sys

# Add the project root to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.task_template import TaskTemplate
from app.core.ai_service import generate_initial_study_plan

db = SessionLocal()
available_templates = db.query(TaskTemplate).all()

filtered_templates = [
    t for t in available_templates 
    if t.allowed_fields and "Sözel" in t.allowed_fields
]

template_data = [
    {
        "id": t.id,
        "subject": t.subject_name,
        "topic": t.topic,
        "level": t.level,
        "time": t.estimated_time
    } for t in filtered_templates
]

print(f"Filtered templates count: {len(template_data)}")

try:
    ai_plan = generate_initial_study_plan(
        fullName="Test User",
        focus_area="Sözel",
        target_goal="Matematik",
        weekly_hours="20 Saat",
        focus_time="Sabah",
        available_tasks=template_data
    )
    print("AI Plan:", ai_plan)
except Exception as e:
    print("Error:", e)
