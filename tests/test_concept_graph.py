import pytest
from app.engine.concept_graph import ConceptGraphEngine
from app.storage.state_store import store

def test_concept_graph_dag_and_topological_sort():
    engine = ConceptGraphEngine(store.concepts_cache)
    order = engine.get_topological_order()
    
    assert len(order) == 10
    assert order[0] == "c1_charge"
    
    # Electric current and potential must come before Ohm's law
    assert order.index("c2_current") < order.index("c5_ohms_law")
    assert order.index("c3_potential") < order.index("c5_ohms_law")
    assert order.index("c5_ohms_law") < order.index("c7_series_circuits")
    assert order.index("c5_ohms_law") < order.index("c8_parallel_circuits")
    assert order.index("c7_series_circuits") < order.index("c9_joules_heating")
    assert order.index("c9_joules_heating") < order.index("c10_electric_power")

def test_prerequisites_check():
    engine = ConceptGraphEngine(store.concepts_cache)
    prereqs = engine.get_prerequisites("c5_ohms_law")
    assert "c2_current" in prereqs
    assert "c3_potential" in prereqs
    assert "c4_circuit_diagrams" in prereqs

    # If prerequisites are not mastered
    mastery = {"c2_current": 0.40, "c3_potential": 0.80, "c4_circuit_diagrams": 0.80}
    assert engine.are_prerequisites_met("c5_ohms_law", mastery, threshold=0.55) is False
    assert engine.get_unmet_prerequisites("c5_ohms_law", mastery, threshold=0.55) == ["c2_current"]

    # When all met
    mastery["c2_current"] = 0.70
    assert engine.are_prerequisites_met("c5_ohms_law", mastery, threshold=0.55) is True
