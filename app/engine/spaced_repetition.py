from datetime import datetime, timezone, timedelta
from typing import Tuple, Dict, List
from app.models.spaced_repetition import ReviewCard

class SpacedRepetitionEngine:
    """
    SuperMemo SM-2 Spaced Repetition engine adapted for
    concept mastery schedules.
    """
    def __init__(self, min_ease: float = 1.3):
        self.min_ease = min_ease

    def calculate_quality(
        self,
        is_correct: bool,
        hints_used: int = 0,
        attempts: int = 1,
        misconception_detected: bool = False
    ) -> int:
        """
        Maps answer evidence to standard SM-2 quality rating (0 to 5).
        5: Perfect response (correct, 0 hints, 1st attempt)
        4: Correct response after small hesitation / 1 hint
        3: Correct response after serious difficulty / 2+ hints
        2: Incorrect response; but close
        1: Incorrect response with active misconception
        0: Complete blackout
        """
        if is_correct:
            if hints_used == 0 and attempts <= 1:
                return 5
            elif hints_used <= 1 and attempts <= 2:
                return 4
            else:
                return 3
        else:
            if misconception_detected:
                return 1
            elif hints_used > 0:
                return 2
            else:
                return 2

    def update_card(
        self,
        card: ReviewCard,
        is_correct: bool,
        hints_used: int = 0,
        attempts: int = 1,
        misconception_detected: bool = False
    ) -> Tuple[ReviewCard, dict]:
        """
        Calculates new interval, ease factor, repetition count, and next review date.
        """
        q = self.calculate_quality(is_correct, hints_used, attempts, misconception_detected)
        
        reps = card.repetitions
        interval = card.interval_days
        ef = card.ease_factor

        # SM-2 update rules
        if q >= 3:
            if reps == 0:
                interval = 1
            elif reps == 1:
                interval = 3
            else:
                interval = max(1, round(interval * ef))
            reps += 1
        else:
            reps = 0
            interval = 1

        # Ease factor update
        # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        ef_delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
        ef = max(self.min_ease, round(ef + ef_delta, 2))

        now = datetime.now(timezone.utc)
        next_review = now + timedelta(days=interval)

        updated_card = ReviewCard(
            concept_id=card.concept_id,
            concept_name=card.concept_name,
            interval_days=interval,
            repetitions=reps,
            ease_factor=ef,
            last_reviewed_at=now.isoformat(),
            next_review_at=next_review.isoformat(),
            is_due=False,
            urgency_score=0.0
        )

        summary = {
            "performance_quality": q,
            "previous_interval": card.interval_days,
            "new_interval_days": interval,
            "repetitions": reps,
            "ease_factor": ef,
            "next_review_date": next_review.strftime("%Y-%m-%d %H:%M UTC")
        }

        return updated_card, summary

    def evaluate_due_status(self, card: ReviewCard) -> ReviewCard:
        """Determines if card is currently due and calculates urgency."""
        now = datetime.now(timezone.utc)
        next_dt = datetime.fromisoformat(card.next_review_at)
        
        if next_dt.tzinfo is None:
            next_dt = next_dt.replace(tzinfo=timezone.utc)

        if now >= next_dt:
            overdue_seconds = (now - next_dt).total_seconds()
            overdue_days = max(0.0, overdue_seconds / 86400.0)
            urgency = round(1.0 + (overdue_days / max(1, card.interval_days)), 2)
            card.is_due = True
            card.urgency_score = urgency
        else:
            card.is_due = False
            card.urgency_score = 0.0
        return card
