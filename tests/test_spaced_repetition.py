import pytest
from datetime import datetime, timezone, timedelta
from app.models.spaced_repetition import ReviewCard
from app.engine.spaced_repetition import SpacedRepetitionEngine

def test_spaced_repetition_progression():
    sr = SpacedRepetitionEngine()
    now_str = datetime.now(timezone.utc).isoformat()
    card = ReviewCard(
        concept_id="c5_ohms_law",
        concept_name="Ohm's Law",
        interval_days=1,
        repetitions=0,
        ease_factor=2.5,
        last_reviewed_at=now_str,
        next_review_at=now_str,
        is_due=True
    )

    # First successful review (q=5) -> interval becomes 1 day, reps=1
    up1, sum1 = sr.update_card(card, is_correct=True, hints_used=0, attempts=1)
    assert up1.repetitions == 1
    assert up1.interval_days == 1
    assert sum1["performance_quality"] == 5

    # Second successful review (q=5) -> interval becomes 3 days, reps=2
    up2, sum2 = sr.update_card(up1, is_correct=True, hints_used=0, attempts=1)
    assert up2.repetitions == 2
    assert up2.interval_days == 3

    # Third successful review -> interval becomes 3 * 2.6 = 8 days
    up3, sum3 = sr.update_card(up2, is_correct=True, hints_used=0, attempts=1)
    assert up3.repetitions == 3
    assert up3.interval_days >= 7

def test_spaced_repetition_failure_resets():
    sr = SpacedRepetitionEngine()
    now_str = datetime.now(timezone.utc).isoformat()
    card = ReviewCard(
        concept_id="c5_ohms_law",
        concept_name="Ohm's Law",
        interval_days=8,
        repetitions=3,
        ease_factor=2.5,
        last_reviewed_at=now_str,
        next_review_at=now_str,
        is_due=True
    )

    # Failure with misconception -> resets reps to 0 and interval to 1
    up_failed, sum_failed = sr.update_card(card, is_correct=False, misconception_detected=True)
    assert up_failed.repetitions == 0
    assert up_failed.interval_days == 1
    assert sum_failed["performance_quality"] == 1
