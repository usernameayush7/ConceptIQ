from app.api.concepts import router as concepts_router
from app.api.assessment import router as assessment_router
from app.api.learner import router as learner_router
from app.api.practice import router as practice_router
from app.api.reviews import router as reviews_router

__all__ = [
    "concepts_router",
    "assessment_router",
    "learner_router",
    "practice_router",
    "reviews_router"
]
