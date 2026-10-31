# ConceptIQ — AI/ML and Adaptive Learning Engine

> **Role: Member 1 — AI/ML and Adaptive Learning Engine**  
> **Domain:** Class 10 Physics — Electricity (NCERT Syllabus)  
> **Framework:** FastAPI (Python 3.10+)

ConceptIQ is an intelligent, adaptive educational engine that reasons about learner progress, diagnoses student misconceptions, adaptively selects questions based on the Zone of Proximal Development (ZPD), and optimizes retention using spaced repetition.

---

## Architecture & Core Modules

```
conceptiq/
├── data/
│   ├── concepts.json          # Class 10 Physics Electricity concept DAG & syllabus
│   ├── misconceptions.json    # Misconception catalog with trigger keywords & remediation
│   └── questions.json         # Difficulty-calibrated question bank with misconception distractors
│
├── app/
│   ├── main.py                # FastAPI entry point & CORS configuration
│   ├── models/                # Pydantic schemas (requests & responses)
│   ├── engine/                # Core AI/ML algorithms:
│   │   ├── concept_graph.py       # Directed Acyclic Graph (DAG) with NetworkX
│   │   ├── learner_model.py       # Bayesian Knowledge Tracing (BKT) engine
│   │   ├── misconception_engine.py# Distractor analysis & NLP reasoning
│   │   ├── adaptive_selector.py   # ZPD question selection & prerequisite backtrack
│   │   ├── question_generator.py  # Procedural question generator with mathematical verification
│   │   └── spaced_repetition.py   # SuperMemo SM-2 interval scheduler
│   ├── storage/
│   │   └── state_store.py     # In-memory session & learner state manager
│   └── api/                   # REST API routes for Member 2 integration
│
└── tests/                     # 18 automated unit and integration tests
```

---

## Implemented Responsibilities (Member 1)

### A. Concept Graph (DAG)
- Stored in `data/concepts.json` covering the complete NCERT Class 10 Electricity syllabus:
  1. `c1_charge` (Charge & Quantization)
  2. `c2_current` (Electric Current & Drift)
  3. `c3_potential` (Potential & Potential Difference)
  4. `c4_circuit_diagrams` (Circuits & Symbols)
  5. `c5_ohms_law` (Ohm's Law & Resistance)
  6. `c6_resistance_factors` (Factors Affecting Resistance & Resistivity)
  7. `c7_series_circuits` (Resistors in Series)
  8. `c8_parallel_circuits` (Resistors in Parallel)
  9. `c9_joules_heating` (Joule's Heating Effect)
  10. `c10_electric_power` (Electric Power & Commercial Energy)
- NetworkX DAG ensures acyclicity, prerequisite validation, and topological learning sequences.

### B. Learner Model (Bayesian Knowledge Tracing)
- Computes continuous mastery probability $P(L) \in [0.0, 1.0]$ for each concept.
- Evaluates:
  - Observation correctness
  - Hint penalty ($25\%$ penalty per hint used)
  - Attempt penalty (diminishing returns on repeated tries)
  - Question difficulty weighting
- Stores timestamped **Evidence Logs** explaining every mastery change.

### C. Misconception Detection Engine
- Rule-based distractor matching: Maps incorrect MCQ options to specific misconceptions (e.g. "Current is used up by the first bulb", "Battery supplies constant current regardless of resistance", "Parallel resistors add up").
- Semantic text analyzer: Inspects student free-form reasoning for trigger phrases and false logic.
- Returns structured JSON with `misconception_id`, `confidence`, `evidence`, and `remediation`.

### D. Adaptive Question Selection
- Selects items within the student's **Zone of Proximal Development (ZPD)**.
- **Prerequisite Backtracking**: If a learner struggles with an advanced concept, the engine detects low prerequisite mastery and routes back to foundational concepts.
- **Procedural Generator**: Generates parameterized questions and verifies mathematical accuracy before presenting.

### E. Spaced Repetition (SuperMemo SM-2)
- Calculates optimal review intervals based on answer performance quality $q \in [0, 5]$.
- Tracks repetition count $n$, Ease Factor $EF$, and timestamps next review dates.

---

## API Documentation for Member 2 Integration

Base URL: `http://localhost:8000`

### 1. `GET /api/concepts`
Returns full syllabus, prerequisite edges, and topological order.
* **Response:**
  ```json
  {
    "subject": "Physics",
    "grade": 10,
    "chapter": "Electricity",
    "total_concepts": 10,
    "concepts": [...],
    "prerequisite_edges": [{"from": "c1_charge", "to": "c2_current"}],
    "topological_learning_order": ["c1_charge", "c2_current", "c3_potential", ...]
  }
  ```

### 2. `POST /api/assessment/start`
Starts a diagnostic or targeted test.
* **Request:**
  ```json
  {
    "learner_id": "student_01",
    "num_questions": 5,
    "concept_id": null
  }
  ```
* **Response:** Returns list of questions with `hints` and `options` (correct answer is withheld).

### 3. `POST /api/answers/submit`
Evaluates submission, checks misconceptions, updates BKT mastery & SM-2 schedule.
* **Request:**
  ```json
  {
    "learner_id": "student_01",
    "question_id": "q_current_02",
    "selected_option": "A",
    "open_ended_reasoning": "The first bulb uses up the current first",
    "hints_used": 0,
    "attempt_number": 1
  }
  ```
* **Response:**
  ```json
  {
    "learner_id": "student_01",
    "question_id": "q_current_02",
    "is_correct": false,
    "correct_option": "B",
    "explanation": "Current is identical at every point in a series circuit...",
    "misconception_analysis": {
      "detected": true,
      "misconception_id": "MISC_CURRENT_CONSUMED",
      "misconception_name": "Current Attenuation (Current is 'used up')",
      "confidence": 0.92,
      "evidence": "Selected distractor option 'A'...",
      "remediation": "Current is the rate of flow of charge, and charge is strictly conserved..."
    },
    "updated_mastery": {
      "concept_id": "c2_current",
      "concept_name": "Electric Current & Drift",
      "mastery_score": 0.12,
      "state": "unmastered"
    },
    "spaced_repetition_summary": {
      "performance_quality": 1,
      "new_interval_days": 1,
      "next_review_date": "2026-11-01 15:00 UTC"
    },
    "next_recommended_action": "Review remediation for 'Current Attenuation' and retry concept."
  }
  ```

### 4. `GET /api/learner/progress?learner_id={id}`
Returns concept-wise mastery, weak concepts, ready-to-learn concepts, and recent evidence logs.

### 5. `GET /api/practice/next?learner_id={id}`
Returns next optimal question selected via ZPD with difficulty tier and selection reason.

### 6. `GET /api/reviews/due?learner_id={id}`
Returns list of concepts due for spaced repetition revision sorted by urgency.

---

## Local Setup & Running

```powershell
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run unit & integration tests (18 tests)
pytest -v

# 3. Start development server
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
