from fastapi import APIRouter, Query
from typing import Optional, Dict
from pydantic import BaseModel, Field
from app.models.assessment import QuestionSchema
from app.storage.state_store import store
from app.engine.concept_graph import ConceptGraphEngine
from app.engine.adaptive_selector import AdaptiveSelectorEngine

router = APIRouter(prefix="/api/practice", tags=["Adaptive Practice"])

graph_engine = ConceptGraphEngine(store.concepts_cache)
adaptive_engine = AdaptiveSelectorEngine(graph_engine, store.questions_cache)

class NextPracticeResponse(BaseModel):
    learner_id: str
    concept_id: str
    concept_name: str
    current_concept_mastery: float
    difficulty_tier: str
    target_difficulty: float
    selection_reason: str
    is_generated_supplementary: bool
    question: QuestionSchema

@router.get("/next", response_model=NextPracticeResponse, summary="Select the next appropriate question adaptively")
def get_next_practice_question(
    learner_id: str = Query(default="learner_default", description="Learner ID"),
    concept_id: Optional[str] = Query(default=None, description="Optional target concept ID")
):
    """
    Selects or generates the next optimal question based on:
    - Learner's Zone of Proximal Development (ZPD)
    - Prerequisite dependencies (backtracks if foundational concept is weak)
    - Spaced repetition urgency
    - Difficulty matching
    - Dynamic verified question generation if pool is depleted
    """
    learner = store.get_or_create_learner(learner_id)
    
    question_dict, meta = adaptive_engine.select_next_question(
        learner_state=learner,
        preferred_concept_id=concept_id
    )

    # Format question without exposing correct answer
    question_schema = QuestionSchema(
        id=question_dict["id"],
        concept_id=question_dict["concept_id"],
        difficulty=question_dict["difficulty"],
        text=question_dict["text"],
        options=question_dict["options"],
        hints=question_dict.get("hints", [])
    )

    return NextPracticeResponse(
        learner_id=learner_id,
        concept_id=meta["concept_id"],
        concept_name=meta["concept_name"],
        current_concept_mastery=meta["current_concept_mastery"],
        difficulty_tier=meta["difficulty_tier"],
        target_difficulty=meta["target_difficulty"],
        selection_reason=meta["selection_reason"],
        is_generated_supplementary=meta["is_generated_supplementary"],
        question=question_schema
    )
