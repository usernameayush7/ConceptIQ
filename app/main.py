from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    concepts_router,
    assessment_router,
    learner_router,
    practice_router,
    reviews_router
)

app = FastAPI(
    title="ConceptIQ — AI/ML Adaptive Learning Engine",
    description="""
# ConceptIQ AI/ML Adaptive Engine API
### Domain: Class 10 Physics — Electricity

Core responsibilities implemented for Member 1:
1. **Concept Graph (DAG)**: Prerequisite mapping, NCERT syllabus alignment, and topological learning paths.
2. **Bayesian Knowledge Tracing (BKT)**: Probabilistic mastery estimates updated per interaction, accounting for difficulty, hints, and attempts.
3. **Misconception Detection**: Rule-based distractor detection and LLM-assisted semantic reasoning for student explanations.
4. **Adaptive Question Selection**: Zone of Proximal Development (ZPD) targeting and automated fallback to prerequisite remediation.
5. **Spaced Repetition (SM-2)**: Interval scheduling to reinforce long-term retention.
    """,
    version="1.0.0"
)

# Enable CORS for Member 2 frontend or client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(concepts_router)
app.include_router(assessment_router)
app.include_router(learner_router)
app.include_router(practice_router)
app.include_router(reviews_router)

@app.get("/", tags=["Health"])
def root():
    return {
        "project": "ConceptIQ",
        "service": "AI/ML Adaptive Learning Engine",
        "subject": "Class 10 Physics: Electricity",
        "status": "online",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
