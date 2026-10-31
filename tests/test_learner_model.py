import pytest
from app.models.learner import ConceptMastery
from app.engine.learner_model import LearnerModelEngine

def test_learner_model_correct_answer_increases_mastery():
    engine = LearnerModelEngine()
    initial = ConceptMastery(
        concept_id="c5_ohms_law",
        concept_name="Ohm's Law",
        mastery_score=0.20,
        state="unmastered",
        confidence=0.5,
        attempts=0,
        successes=0,
        last_updated=""
    )

    updated, evidence = engine.update_mastery(
        current_mastery=initial,
        question_id="q_ohms_01",
        is_correct=True,
        difficulty=0.5,
        hints_used=0,
        attempt_number=1
    )

    assert updated.mastery_score > initial.mastery_score
    assert updated.attempts == 1
    assert updated.successes == 1
    assert evidence.delta_mastery > 0
    assert evidence.is_correct is True

def test_learner_model_incorrect_answer_decreases_mastery():
    engine = LearnerModelEngine()
    initial = ConceptMastery(
        concept_id="c5_ohms_law",
        concept_name="Ohm's Law",
        mastery_score=0.70,
        state="learning",
        confidence=0.7,
        attempts=3,
        successes=2,
        last_updated=""
    )

    updated, evidence = engine.update_mastery(
        current_mastery=initial,
        question_id="q_ohms_01",
        is_correct=False,
        difficulty=0.4,
        hints_used=0,
        attempt_number=1
    )

    assert updated.mastery_score < initial.mastery_score
    assert updated.attempts == 4
    assert updated.successes == 2
    assert evidence.delta_mastery < 0

def test_learner_model_hints_penalty():
    engine = LearnerModelEngine()
    initial = ConceptMastery(
        concept_id="c2_current",
        concept_name="Electric Current",
        mastery_score=0.30,
        state="unmastered",
        confidence=0.5,
        attempts=0,
        successes=0,
        last_updated=""
    )

    # Correct with 0 hints
    up_no_hints, _ = engine.update_mastery(
        current_mastery=initial,
        question_id="q1",
        is_correct=True,
        difficulty=0.5,
        hints_used=0
    )

    # Correct with 2 hints
    up_with_hints, _ = engine.update_mastery(
        current_mastery=initial,
        question_id="q1",
        is_correct=True,
        difficulty=0.5,
        hints_used=2
    )

    assert up_no_hints.mastery_score > up_with_hints.mastery_score
