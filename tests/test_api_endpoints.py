import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_concepts():
    response = client.get("/api/concepts")
    assert response.status_code == 200
    data = response.json()
    assert data["subject"] == "Physics"
    assert data["grade"] == 10
    assert data["chapter"] == "Electricity"
    assert len(data["concepts"]) == 10
    assert len(data["prerequisite_edges"]) > 0
    assert "c1_charge" in data["topological_learning_order"]

def test_api_assessment_start():
    payload = {"learner_id": "test_learner_api", "num_questions": 3}
    response = client.post("/api/assessment/start", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["learner_id"] == "test_learner_api"
    assert len(data["questions"]) == 3
    # Verify correct_option is NOT leaked in the assessment payload
    for q in data["questions"]:
        assert "correct_option" not in q
        assert "id" in q
        assert "text" in q

def test_api_submit_answer_and_learner_progress():
    submit_payload = {
        "learner_id": "test_learner_api",
        "question_id": "q_current_02",
        "selected_option": "B",  # Correct option for q_current_02
        "hints_used": 0,
        "attempt_number": 1
    }
    submit_resp = client.post("/api/answers/submit", json=submit_payload)
    assert submit_resp.status_code == 200
    s_data = submit_resp.json()
    assert s_data["is_correct"] is True
    assert s_data["correct_option"] == "B"
    assert s_data["updated_mastery"]["concept_id"] == "c2_current"
    assert s_data["updated_mastery"]["mastery_score"] > 0.15

    # Check progress endpoint
    prog_resp = client.get("/api/learner/progress?learner_id=test_learner_api")
    assert prog_resp.status_code == 200
    p_data = prog_resp.json()
    assert p_data["learner_id"] == "test_learner_api"
    assert "c2_current" in p_data["concept_mastery"]
    assert len(p_data["recent_evidence"]) >= 1

def test_api_misconception_detection_on_distractor():
    # Submit incorrect option A on q_current_02 (which triggers MISC_CURRENT_CONSUMED)
    submit_payload = {
        "learner_id": "test_learner_misc",
        "question_id": "q_current_02",
        "selected_option": "A",
        "hints_used": 0,
        "attempt_number": 1
    }
    submit_resp = client.post("/api/answers/submit", json=submit_payload)
    assert submit_resp.status_code == 200
    s_data = submit_resp.json()
    assert s_data["is_correct"] is False
    assert s_data["misconception_analysis"]["detected"] is True
    assert s_data["misconception_analysis"]["misconception_id"] == "MISC_CURRENT_CONSUMED"
    assert s_data["misconception_analysis"]["remediation"] is not None

def test_api_practice_next():
    response = client.get("/api/practice/next?learner_id=test_learner_practice")
    assert response.status_code == 200
    data = response.json()
    assert "concept_id" in data
    assert "selection_reason" in data
    assert "question" in data
    assert "id" in data["question"]
    assert "correct_option" not in data["question"]

def test_api_reviews_due():
    response = client.get("/api/reviews/due?learner_id=test_learner_reviews")
    assert response.status_code == 200
    data = response.json()
    assert "due_count" in data
    assert "due_concepts" in data
    assert data["due_count"] >= 0
