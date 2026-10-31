from typing import List, Dict
from pydantic import BaseModel, Field

class Concept(BaseModel):
    id: str = Field(..., description="Unique concept identifier (e.g. c1_charge)")
    name: str = Field(..., description="Concept title")
    description: str = Field(..., description="Concise syllabus explanation")
    key_formulas: List[str] = Field(default_factory=list, description="Mathematical formulas")
    si_unit: str = Field(..., description="SI unit associated with concept")
    prerequisites: List[str] = Field(default_factory=list, description="List of prerequisite concept IDs")
    ncert_section: str = Field(..., description="NCERT textbook chapter section")
    bloom_level: str = Field(..., description="Bloom's taxonomy cognitive level")

class ConceptGraphResponse(BaseModel):
    subject: str = "Physics"
    grade: int = 10
    chapter: str = "Electricity"
    total_concepts: int
    concepts: List[Concept]
    prerequisite_edges: List[Dict[str, str]]
    topological_learning_order: List[str]
