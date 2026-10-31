import pytest
from app.engine.concept_graph import ConceptGraphEngine
from app.engine.adaptive_selector import AdaptiveSelectorEngine
from app.storage.state_store import store

def test_adaptive_selector_prerequisite_backtracking():
    graph_engine = ConceptGraphEngine(store.concepts_cache)
    selector = AdaptiveSelectorEngine(graph_engine, store.questions_cache)
    
    learner = store.get_or_create_learner("test_student_prereq")
    # Set target c5_ohms_law: c3 and c4 are mastered (0.80), but foundational prerequisite c2_current is weak (0.20)
    learner.mastery["c2_current"].mastery_score = 0.20
    learner.mastery["c3_potential"].mastery_score = 0.80
    learner.mastery["c4_circuit_diagrams"].mastery_score = 0.80
    learner.mastery["c5_ohms_law"].mastery_score = 0.50

    q, meta = selector.select_next_question(learner, preferred_concept_id="c5_ohms_law")
    
    # Should backtrack to c2_current because prerequisite is weak
    assert meta["concept_id"] == "c2_current"
    assert "Prerequisite remediation" in meta["selection_reason"]

def test_adaptive_selector_zpd_selection():
    graph_engine = ConceptGraphEngine(store.concepts_cache)
    selector = AdaptiveSelectorEngine(graph_engine, store.questions_cache)
    
    learner = store.get_or_create_learner("test_student_zpd")
    # Master root concept c1_charge
    learner.mastery["c1_charge"].mastery_score = 0.85
    # Next concept in topo order is c2_current or c3_potential (both have prereq c1_charge satisfied)
    
    q, meta = selector.select_next_question(learner)
    assert meta["concept_id"] in ["c2_current", "c3_potential", "c1_charge"]
    assert "difficulty_tier" in meta

def test_question_generator_mathematical_verification():
    from app.engine.question_generator import QuestionGeneratorEngine
    gen = QuestionGeneratorEngine()
    
    # Generate and verify 5 Ohm's law questions
    for _ in range(5):
        q = gen.generate_ohms_law_question()
        assert len(q["options"]) == 4
        assert q["correct_option"] in q["options"]
        assert "A" in q["options"][q["correct_option"]]

    # Generate and verify 5 parallel resistor questions
    for _ in range(5):
        q = gen.generate_parallel_resistor_question()
        assert len(q["options"]) == 4
        assert q["correct_option"] in q["options"]
        assert "Ω" in q["options"][q["correct_option"]]
