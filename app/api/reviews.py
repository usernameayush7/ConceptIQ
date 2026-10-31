from fastapi import APIRouter, Query
from app.models.spaced_repetition import DueReviewsResponse, ReviewCard
from app.storage.state_store import store
from app.engine.spaced_repetition import SpacedRepetitionEngine

router = APIRouter(prefix="/api/reviews", tags=["Spaced Repetition"])

sr_engine = SpacedRepetitionEngine()

@router.get("/due", response_model=DueReviewsResponse, summary="Return concepts due for revision")
def get_due_reviews(learner_id: str = Query(default="learner_default", description="Learner ID")):
    """
    Returns all concepts currently due for spaced review based on
    the SuperMemo SM-2 interval scheduling algorithm.
    Concepts are sorted by urgency score.
    """
    learner = store.get_or_create_learner(learner_id)
    
    evaluated_cards = []
    for card in learner.review_cards.values():
        evaluated = sr_engine.evaluate_due_status(card)
        learner.review_cards[card.concept_id] = evaluated
        if evaluated.is_due:
            evaluated_cards.append(evaluated)

    # Sort by descending urgency (most overdue first)
    evaluated_cards.sort(key=lambda c: c.urgency_score, reverse=True)

    return DueReviewsResponse(
        learner_id=learner_id,
        due_count=len(evaluated_cards),
        total_cards=len(learner.review_cards),
        due_concepts=evaluated_cards
    )
