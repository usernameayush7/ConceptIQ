import networkx as nx
from typing import List, Dict, Set
from app.models.concept import Concept, ConceptGraphResponse

class ConceptGraphEngine:
    def __init__(self, concepts_data: List[dict]):
        self.concepts_data = concepts_data
        self.concepts_by_id = {c["id"]: c for c in concepts_data}
        self.graph = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        # Add nodes
        for c in self.concepts_data:
            self.graph.add_node(
                c["id"],
                name=c["name"],
                description=c["description"],
                bloom_level=c.get("bloom_level", "Understand"),
                ncert_section=c.get("ncert_section", ""),
                key_formulas=c.get("key_formulas", []),
                si_unit=c.get("si_unit", "")
            )

        # Add directed edges: prerequisite -> target concept
        for c in self.concepts_data:
            target_id = c["id"]
            for prereq_id in c.get("prerequisites", []):
                if prereq_id in self.concepts_by_id:
                    self.graph.add_edge(prereq_id, target_id)

        # Verify DAG properties
        if not nx.is_directed_acyclic_graph(self.graph):
            cycles = list(nx.simple_cycles(self.graph))
            raise ValueError(f"Concept graph contains prerequisite cycles: {cycles}")

    def get_topological_order(self) -> List[str]:
        """Returns pedagogically sound learning sequence starting from roots."""
        return list(nx.topological_sort(self.graph))

    def get_prerequisites(self, concept_id: str, recursive: bool = False) -> List[str]:
        """Returns direct or all ancestral prerequisites for a concept."""
        if concept_id not in self.graph:
            return []
        if not recursive:
            return list(self.graph.predecessors(concept_id))
        return list(nx.ancestors(self.graph, concept_id))

    def get_dependents(self, concept_id: str, recursive: bool = False) -> List[str]:
        """Returns concepts that directly or indirectly depend on this concept."""
        if concept_id not in self.graph:
            return []
        if not recursive:
            return list(self.graph.successors(concept_id))
        return list(nx.descendants(self.graph, concept_id))

    def are_prerequisites_met(self, concept_id: str, mastery_dict: Dict[str, float], threshold: float = 0.60) -> bool:
        """Checks if all direct prerequisites meet the required mastery threshold."""
        prereqs = self.get_prerequisites(concept_id, recursive=False)
        for p in prereqs:
            if mastery_dict.get(p, 0.0) < threshold:
                return False
        return True

    def get_unmet_prerequisites(self, concept_id: str, mastery_dict: Dict[str, float], threshold: float = 0.60) -> List[str]:
        """Returns list of prerequisites not yet mastered."""
        prereqs = self.get_prerequisites(concept_id, recursive=False)
        return [p for p in prereqs if mastery_dict.get(p, 0.0) < threshold]

    def to_graph_response(self) -> ConceptGraphResponse:
        """Converts graph into JSON-friendly response format."""
        concepts = [Concept(**c) for c in self.concepts_data]
        edges = [{"from": u, "to": v} for u, v in self.graph.edges()]
        return ConceptGraphResponse(
            total_concepts=len(concepts),
            concepts=concepts,
            prerequisite_edges=edges,
            topological_learning_order=self.get_topological_order()
        )
