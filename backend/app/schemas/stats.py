from pydantic import BaseModel
from typing import List

class UserStatsResponse(BaseModel):
    total_solved: int
    total_correct: int
    total_wrong: int
    accuracy_rate: float
    total_hours: float
    daily_chart: List[int]  # Son 7 günün günlük çözülen soru adedi
