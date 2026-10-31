import pytest
from app.engine.misconception_engine import MisconceptionEngine
from app.storage.state_store import store

def test_distractor_misconception_detection():
    engine = MisconceptionEngine(store.misconceptions_cache)
    question = store.get_question_by_id("q_current_02")
    assert question is not None

    # Option A represents "Current is consumed"
    res = engine.check_option_distractor(question, "A")
    assert res is not None
    assert res.detected is True
    assert res.misconception_id == "MISC_CURRENT_CONSUMED"
    assert "Current Attenuation" in res.misconception_name
    assert res.confidence > 0.8

def test_explanation_text_misconception_detection():
    engine = MisconceptionEngine(store.misconceptions_cache)
    
    # Text stating current is consumed
    res = engine.analyze_explanation_text("The first bulb is brighter because current gets used up as it flows.")
    assert res.detected is True
    assert res.misconception_id == "MISC_CURRENT_CONSUMED"
    assert res.remediation is not None

    # Text stating parallel resistors add up
    res2 = engine.analyze_explanation_text("When you put more resistors in parallel, resistance increases in parallel.")
    assert res2.detected is True
    assert res2.misconception_id == "MISC_PARALLEL_ADDITION"

    # Text with correct physics
    res3 = engine.analyze_explanation_text("Current is constant throughout the series branch due to charge conservation.")
    assert res3.detected is False
