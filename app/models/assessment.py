from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.learner import ConceptMastery
from app.models.misconception import MisconceptionDetectionResult

class QuestionOption(BaseModel):
    key: str
    text: str

class QuestionSchema(BaseModel):
    id: str
    concept_id: str
    difficulty: float = Field(..., ge=0.0, le=1.0)
    text: str
    options: Dict[str, str]
    hints: List[str] = Field(default_factory=list)

class StartAssessmentRequest(BaseModel):
    learner_id: str = Field(default="learner_default", description="Unique learner session identifier")
    num_questions: int = Field(default=5, ge=1, le=15, description="Number of questions in assessment")
    concept_id: Optional[str] = Field(None, description="Optional specific concept to test")

class StartAssessmentResponse(BaseModel):
    assessment_id: str
    learner_id: str
    mode: str
    total_questions: int
    questions: List[QuestionSchema]

class SubmitAnswerRequest(BaseModel):
    learner_id: str = Field(default="learner_default")
    question_id: str
    selected_option: str = Field(..., description="Chosen option key: 'A', 'B', 'C', or 'D'")
    open_ended_reasoning: Optional[str] = Field(None, description="Optional explanation written by student")
    hints_used: int = Field(default=0, ge=0)
    attempt_number: int = Field(default=1, ge=1)
    response_time_seconds: Optional[float] = Field(None, ge=0)

class SubmitAnswerResponse(BaseModel):
    learner_id: str
    question_id: str
    is_correct: bool
    correct_option: str
    explanation: str
    misconception_analysis: MisconceptionDetectionResult
    updated_mastery: ConceptMastery
    spaced_repetition_summary: dict
    next_recommended_action: str
