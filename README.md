# ConceptIQ — Class 10 Physics: Electricity Adaptive Learning Platform
**Member 2 Scope:** Full-Stack Product, Student Experience & Teacher Analytics  
**Subject:** Class 10 Physics (CBSE / State Boards) • Chapter: Electricity

---

## ⚡ What Has Been Built (Member 2 Deliverables)

### 1. Student Experience (`client/src/components/`)
- **Landing & Student Entry:** Header status indicators, streak tracker, role toggle.
- **Diagnostic Assessment (`DiagnosticTest.jsx`):** 
  - MCQ and Numerical questions with units.
  - Cognitive reasoning input textarea for Misconception analysis.
  - Instant post-answer feedback with score changes ($\pm\Delta\%$).
  - Targeted misconception diagnostic alert with remediation tips.
- **Adaptive Practice (`AdaptivePractice.jsx`):** 
  - Real-time recommendation pill showing AI reason for selecting each question.
  - Dynamic difficulty scaling.
- **Mastery Dashboard (`MasteryDashboard.jsx`):** 
  - Concept graph visualization (C1 through C8) with prerequisite tags and progress meters.
  - Active misconception warning cards.
  - Spaced repetition review counter.

### 2. Teacher Analytics Dashboard (`TeacherDashboard.jsx`)
- **KPI Metrics:** Class Average Mastery, Total Enrolled, Class Accuracy, Students Needing Intervention.
- **Class Mastery Bar Chart (Recharts):** Interactive concept-wise mastery bars color-coded by mastery thresholds.
- **Misconceptions Frequency Matrix:** Prevalent misconceptions across Class 10-A, percentage of affected students, and clickable student avatars.
- **Intervention Queue ("Students Needing Support"):** High-priority students, their weakest concept, diagnosed misconceptions, and recommended instructor actions.
- **Spaced Repetition Retention Schedule:** Class-wide revision planner.
- **Student Drilldown Drawer (`StudentDetailModal.jsx`):** Deep-dive into individual student mastery and history.

### 3. Application Backend & Adaptive API Bridge (`server/`)
- Express REST API hosting student/teacher services and analytics aggregation.
- **Integrated High-Fidelity Mock Adaptive Engine (`services/adaptiveEngine.js`):**
  - Implements all 6 proposed API contracts for Member 1 (`/api/concepts`, `/api/assessment/start`, `/api/answers/submit`, `/api/learner/progress`, `/api/practice/next`, `/api/reviews/due`).
  - Supports live switching to Member 1's FastAPI server when ready via `MEMBER1_AI_ENGINE_URL`.
- Realistic Class 10 Electricity physics syllabus (`conceptGraph.json`), question bank (`questionBank.json`), and demo class records (`mockStudents.json`).

---

## 🚀 How to Run the Project

### Prerequisites
- Node.js (v18+)
- npm

### 1. Start Application Backend
```bash
cd server
npm install   # (already completed)
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 2. Start Frontend Client
In a second terminal:
```bash
cd client
npm install   # (already completed)
npm run dev
```
*Frontend runs on `http://localhost:5173`*

### 3. Verify Endpoints
To run the automated verification test suite:
```bash
node server/testEndpoints.js
```
