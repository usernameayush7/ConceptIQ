from fastapi import APIRouter, Query
from typing import List, Dict
from app.models.learner import LearnerProgressResponse, ConceptMastery
from app.storage.state_store import store
from app.engine.concept_graph import ConceptGraphEngine

router = APIRouter(prefix="/api/learner", tags=["Learner Progress"])

graph_engine = ConceptGraphEngine(store.concepts_cache)

@router.get("/progress", response_model=LearnerProgressResponse, summary="Return concept-wise mastery and diagnostic progress")
def get_learner_progress(learner_id: str = Query(default="learner_default", description="Learner ID")):
    """
    Returns full learner model state:
    - Concept-wise mastery probabilities P(L)
    - Classification into weak, ready-to-learn, and mastered concepts
    - Empirical evidence logs of recent updates
    - Overall syllabus completion percentage
    """
    learner = store.get_or_create_learner(learner_id)
    
    mastery_dict: Dict[str, ConceptMastery] = learner.mastery
    scores = {cid: m.mastery_score for cid, m in mastery_dict.items()}

    weak_concepts = [
        m.concept_name for cid, m in mastery_dict.items()
        if m.mastery_score < 0.40
    ]
    mastered_concepts = [
        m.concept_name for cid, m in mastery_dict.items()
        if m.mastery_score >= 0.75
    ]

    # Ready to learn: unmastered concepts whose prerequisites are satisfied
    ready_to_learn = []
    for cid in graph_engine.get_topological_order():
        if scores.get(cid, 0.0) < 0.75 and graph_engine.are_prerequisites_met(cid, scores, threshold=0.55):
            ready_to_learn.append(mastery_dict[cid].concept_name)

    overall_score = sum(scores.values()) / max(1, len(scores))
    recent_evidence = learner.evidence_history[-10:]  # last 10 evidence logs

    return LearnerProgressResponse(
        learner_id=learner_id,
        overall_mastery=round(overall_score, 3),
        concepts_mastered_count=len(mastered_concepts),
        total_concepts=len(mastery_dict),
        concept_mastery=mastery_dict,
        weak_concepts=weak_concepts,
        ready_to_learn=ready_to_learn,
        mastered_concepts=mastered_concepts,
        recent_evidence=recent_evidence
    )
