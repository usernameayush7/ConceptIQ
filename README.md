# ConceptIQ — Class 10 Physics: Electricity Adaptive Learning Platform

> **Class 10 Physics (Electricity — NCERT / CBSE)**  
> An intelligent, full-stack cognitive learning platform that reasons about student mastery, diagnoses cognitive misconceptions, adapts question selection via Bayesian Knowledge Tracing (ZPD), and optimizes retention with spaced repetition.

---

## 👥 Project Division & Ownership

| Member | Focus Area | Technology |
| :--- | :--- | :--- |
| **Member 1** | **AI/ML & Adaptive Learning Engine** | Python, FastAPI, NetworkX DAG, Bayesian Knowledge Tracing (BKT), SuperMemo SM-2, Pytest |
| **Member 2** | **Full-Stack Product, Student UI & Teacher Analytics** | React (Vite), Tailwind CSS, Recharts, Lucide, Node.js + Express, Analytics Aggregator |

---

## 🏗️ System Architecture

```
conceptiq/
├── app/                       # [Member 1] FastAPI Engine
│   ├── engine/                # BKT, Misconception NLP, Adaptive ZPD, Spaced Repetition
│   ├── models/                # Pydantic schemas
│   └── api/                   # REST API routes (:8000)
├── data/                      # [Member 1] Concept DAG, Misconception Catalog & Question Bank
├── tests/                     # [Member 1] Automated Test Suite (18 tests)
│
├── client/                    # [Member 2] React + Vite Frontend (:5173)
│   └── src/components/        # Student Portal, Diagnostic Assessment, Practice & Teacher Dashboard
├── server/                    # [Member 2] Application Server & Adaptive API Bridge (:5000)
│   ├── services/              # Analytics aggregator, Teacher metrics, API Bridge
│   └── data/                  # Class 10-A Mock Student Records & Physics Data
└── API_CONTRACTS.md           # API Contract Specifications between Member 1 & 2
```

---

## ⚡ Member 2 Deliverables (Full-Stack Product & Analytics)

### 1. Student Experience (`client/src/components/`)
- **Diagnostic Assessment (`DiagnosticTest.jsx`):** Multi-format testing (MCQ and Numerical with units), cognitive reasoning textarea, real-time score updates ($\pm\Delta\%$), and instant targeted misconception remediation.
- **Adaptive Practice (`AdaptivePractice.jsx`):** Dynamic question delivery displaying AI recommendation rationale.
- **Mastery Dashboard (`MasteryDashboard.jsx`):** Visual syllabus concept graph (C1–C8) with prerequisite badges, active misconception alerts, and spaced repetition review countdowns.

### 2. Teacher Analytics Dashboard (`TeacherDashboard.jsx`)
- **Classroom Mastery Bar Chart (Recharts):** Interactive concept-wise mastery bars color-coded by mastery thresholds.
- **Prevalent Misconceptions Matrix:** Frequency of misconceptions across Class 10-A with clickable student avatars.
- **Intervention Queue ("Students Needing Support"):** High-priority students, growth areas, diagnosed misconceptions, and recommended instructor actions.
- **Student Drilldown Drawer (`StudentDetailModal.jsx`):** Deep-dive into individual student mastery and attempt history.

---

## 🧠 Member 1 Deliverables (AI/ML & Adaptive Engine)

### A. Concept Graph (DAG)
- 10-concept NCERT syllabus DAG built with NetworkX ensuring acyclicity and prerequisite verification.

### B. Learner Model (Bayesian Knowledge Tracing)
- Continuous mastery tracking $P(L) \in [0.0, 1.0]$ accounting for observation correctness, hint penalties, and attempt numbers with evidence logs.

### C. Misconception Engine
- Rule-based distractor matching and semantic NLP text analysis returning structured diagnosis, confidence, and remediation.

### D. Adaptive Question Selector (ZPD)
- Zone of Proximal Development item selection with automatic prerequisite backtracking.

### E. Spaced Repetition (SuperMemo SM-2)
- Calculates review intervals ($EF$, interval days, next review timestamp).

---

## 🚀 How to Run the Full Platform

### 1. Member 1: AI/ML Engine (Python FastAPI)
```powershell
# In a terminal:
pip install -r requirements.txt
pytest -v                                     # Run tests
uvicorn app.main:app --reload --port 8000     # Runs on http://localhost:8000
```
*API Docs: `http://localhost:8000/docs`*

### 2. Member 2: Full-Stack Product & UI
```powershell
# In a second terminal (starts both backend and frontend):
npm run dev
```
*Frontend UI: `http://localhost:5173` (or direct backend server at `http://localhost:5000`)*
