import uuid
import random
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.assessment import (
    StartAssessmentRequest,
    StartAssessmentResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    QuestionSchema
)
from app.models.misconception import AnalyzeExplanationRequest, MisconceptionDetectionResult
from app.storage.state_store import store
from app.engine.learner_model import LearnerModelEngine
from app.engine.misconception_engine import MisconceptionEngine
from app.engine.spaced_repetition import SpacedRepetitionEngine

router = APIRouter(prefix="/api", tags=["Assessment & Evaluation"])

learner_engine = LearnerModelEngine()
misconception_engine = MisconceptionEngine(store.misconceptions_cache)
sr_engine = SpacedRepetitionEngine()

@router.post("/assessment/start", response_model=StartAssessmentResponse, summary="Start a diagnostic test")
def start_assessment(payload: StartAssessmentRequest):
    """
    Initializes a diagnostic test.
    Selects representative questions across foundational and advanced concepts.
    """
    learner = store.get_or_create_learner(payload.learner_id)
    assessment_id = f"diag_{uuid.uuid4().hex[:8]}"
    
    questions = store.questions_cache
    if payload.concept_id:
        questions = [q for q in questions if q.get("concept_id") == payload.concept_id]
        if not questions:
            raise HTTPException(status_code=404, detail=f"No questions found for concept {payload.concept_id}")

    # Sample balanced set of questions
    selected = random.sample(questions, min(payload.num_questions, len(questions)))
    
    question_schemas = [
        QuestionSchema(
            id=q["id"],
            concept_id=q["concept_id"],
            difficulty=q["difficulty"],
            text=q["text"],
            options=q["options"],
            hints=q.get("hints", [])
        )
        for q in selected
    ]

    return StartAssessmentResponse(
        assessment_id=assessment_id,
        learner_id=payload.learner_id,
        mode="diagnostic" if not payload.concept_id else "targeted",
        total_questions=len(question_schemas),
        questions=question_schemas
    )

@router.post("/answers/submit", response_model=SubmitAnswerResponse, summary="Evaluate an answer and update mastery")
def submit_answer(payload: SubmitAnswerRequest):
    """
    Evaluates student's answer submission:
    1. Checks correctness and distractor misconception
    2. Analyzes open-ended reasoning if provided
    3. Updates Bayesian Knowledge Tracing (BKT) concept mastery
    4. Records empirical evidence log
    5. Updates Spaced Repetition (SM-2) review card
    """
    learner = store.get_or_create_learner(payload.learner_id)
    question = store.get_question_by_id(payload.question_id)
    
    if not question:
        raise HTTPException(status_code=404, detail=f"Question '{payload.question_id}' not found.")

    concept_id = question["concept_id"]
    is_correct = (payload.selected_option.strip().upper() == question["correct_option"].strip().upper())
    
    # 1. Misconception Detection
    misc_result = None
    if not is_correct:
        # Check distractor rule
        misc_result = misconception_engine.check_option_distractor(question, payload.selected_option.upper())

    # Check natural language explanation if provided
    if payload.open_ended_reasoning:
        text_misc = misconception_engine.analyze_explanation_text(payload.open_ended_reasoning, concept_id)
        if text_misc.detected and (not misc_result or text_misc.confidence > misc_result.confidence):
            misc_result = text_misc

    if not misc_result:
        misc_result = MisconceptionDetectionResult(
            detected=False,
            confidence=0.0,
            evidence="No misconception triggered."
        )

    # 2. Update Bayesian Learner Model
    current_mastery = learner.mastery[concept_id]
    updated_mastery, evidence = learner_engine.update_mastery(
        current_mastery=current_mastery,
        question_id=payload.question_id,
        is_correct=is_correct,
        difficulty=question.get("difficulty", 0.5),
        hints_used=payload.hints_used,
        attempt_number=payload.attempt_number,
        misconception_flagged=misc_result.detected
    )
    
    # Save learner state
    learner.mastery[concept_id] = updated_mastery
    learner.evidence_history.append(evidence)
    learner.attempted_questions.add(payload.question_id)

    # 3. Update Spaced Repetition Schedule
    current_card = learner.review_cards[concept_id]
    updated_card, sr_summary = sr_engine.update_card(
        card=current_card,
        is_correct=is_correct,
        hints_used=payload.hints_used,
        attempts=payload.attempt_number,
        misconception_detected=misc_result.detected
    )
    learner.review_cards[concept_id] = updated_card

    # 4. Determine Next Recommended Action
    if misc_result.detected:
        action = f"Review remediation for '{misc_result.misconception_name}' and retry concept."
    elif not is_correct:
        action = "Examine step-by-step solution and try an easier practice question."
    elif updated_mastery.mastery_score >= 0.75:
        action = "Concept mastered! Advance to the next topic in the learning graph."
    else:
        action = "Great job! Continue adaptive practice to solidify mastery."

    return SubmitAnswerResponse(
        learner_id=payload.learner_id,
        question_id=payload.question_id,
        is_correct=is_correct,
        correct_option=question["correct_option"],
        explanation=question.get("explanation", ""),
        misconception_analysis=misc_result,
        updated_mastery=updated_mastery,
        spaced_repetition_summary=sr_summary,
        next_recommended_action=action
    )

@router.post("/misconceptions/analyze", response_model=MisconceptionDetectionResult, summary="Analyze freeform student explanation")
def analyze_misconception_explanation(payload: AnalyzeExplanationRequest):
    """
    Direct endpoint to analyze free-form student explanations using
    pattern rules and semantic reasoning.
    """
    return misconception_engine.analyze_explanation_text(
        explanation_text=payload.text,
        concept_id=payload.concept_id
    )
