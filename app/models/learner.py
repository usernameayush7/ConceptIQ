from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class ConceptMastery(BaseModel):
    concept_id: str
    concept_name: str
    mastery_score: float = Field(..., ge=0.0, le=1.0, description="Estimated mastery probability P(L)")
    state: str = Field(..., description="Mastery state: 'unmastered' (<0.4), 'learning' (0.4-0.75), 'mastered' (>0.75)")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    attempts: int = 0
    successes: int = 0
    last_updated: str

class EvidenceLog(BaseModel):
    timestamp: str
    question_id: str
    concept_id: str
    is_correct: bool
    hints_used: int
    attempts_count: int
    prior_mastery: float
    posterior_mastery: float
    delta_mastery: float
    reason: str

class LearnerProgressResponse(BaseModel):
    learner_id: str
    overall_mastery: float = Field(..., ge=0.0, le=1.0)
    concepts_mastered_count: int
    total_concepts: int
    concept_mastery: Dict[str, ConceptMastery]
    weak_concepts: List[str]
    ready_to_learn: List[str]
    mastered_concepts: List[str]
    recent_evidence: List[EvidenceLog]
