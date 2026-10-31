from typing import Optional, List
from pydantic import BaseModel, Field

class Misconception(BaseModel):
    id: str = Field(..., description="Unique misconception identifier")
    concept_id: str = Field(..., description="Concept to which misconception belongs")
    name: str = Field(..., description="Misconception label")
    description: str = Field(..., description="What the student erroneously believes")
    trigger_keywords: List[str] = Field(default_factory=list, description="Keywords indicating this misconception")
    remediation: str = Field(..., description="Targeted conceptual feedback to resolve the misunderstanding")

class MisconceptionDetectionResult(BaseModel):
    detected: bool
    misconception_id: Optional[str] = None
    misconception_name: Optional[str] = None
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    evidence: str = Field("", description="Reasoning or chosen distractor that triggered the detection")
    remediation: Optional[str] = None

class AnalyzeExplanationRequest(BaseModel):
    text: str = Field(..., description="Student's natural language explanation")
    concept_id: Optional[str] = Field(None, description="Optional target concept ID")
    question_id: Optional[str] = Field(None, description="Optional question ID for contextual analysis")
