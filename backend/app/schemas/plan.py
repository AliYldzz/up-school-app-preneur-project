from pydantic import BaseModel
from typing import Optional, List
from app.schemas.task import TaskResponse

class RescheduleRequest(BaseModel):
    reason: str # 'skipped_by_user', 'midnight_reset', 'incomplete_tasks'
    incomplete_task_ids: Optional[List[int]] = []
    current_energy_level: Optional[int] = 3 # 1 ile 5 arası
    remaining_days: Optional[int] = None

class RescheduledPlanResponse(BaseModel):
    message: str
    scheduled_tasks: List[TaskResponse]
