from fastapi import APIRouter, HTTPException
from typing import Optional
from app.models.concept import Concept, ConceptGraphResponse
from app.storage.state_store import store
from app.engine.concept_graph import ConceptGraphEngine

router = APIRouter(prefix="/api/concepts", tags=["Concepts & Graph"])

# Instantiate graph engine with cached concepts
graph_engine = ConceptGraphEngine(store.concepts_cache)

@router.get("", response_model=ConceptGraphResponse, summary="Get full concept graph and syllabus")
def get_concepts():
    """
    Returns the complete Class 10 Physics: Electricity concept graph,
    including prerequisite relationships, NCERT syllabus mappings, and
    topological learning sequence.
    """
    return graph_engine.to_graph_response()

@router.get("/{concept_id}", response_model=Concept, summary="Get individual concept details")
def get_concept_by_id(concept_id: str):
    """
    Returns metadata, formulas, SI unit, and prerequisites for a single concept.
    """
    c = store.get_concept_by_id(concept_id)
    if not c:
        raise HTTPException(status_code=404, detail=f"Concept '{concept_id}' not found.")
    return Concept(**c)
