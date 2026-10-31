from typing import List
from pydantic import BaseModel, Field

class ReviewCard(BaseModel):
    concept_id: str
    concept_name: str
    interval_days: int
    repetitions: int
    ease_factor: float
    last_reviewed_at: str
    next_review_at: str
    is_due: bool
    urgency_score: float = Field(default=0.0, description="Higher urgency means more overdue")

class DueReviewsResponse(BaseModel):
    learner_id: str
    due_count: int
    total_cards: int
    due_concepts: List[ReviewCard]
