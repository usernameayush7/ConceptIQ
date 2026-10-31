import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getConceptGraph,
  startDiagnosticAssessment,
  submitAnswer,
  getLearnerProgress,
  getNextAdaptiveQuestion,
  getReviewsDue
} from './services/adaptiveEngine.js';
import { getClassAnalytics, getStudentDetail } from './services/analyticsService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;
const MEMBER1_AI_ENGINE_URL = process.env.MEMBER1_AI_ENGINE_URL || null;

app.use(cors());
app.use(express.json());

// Log request helper
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl}`);
  next();
});

// Serve static frontend build from client/dist if available
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// System Health and Engine Bridge Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiEngineMode: MEMBER1_AI_ENGINE_URL ? 'External FastAPI Bridge' : 'Integrated High-Fidelity Mock Engine',
    externalEngineUrl: MEMBER1_AI_ENGINE_URL
  });
});

// --- MEMBER 1 CONTRACT ENDPOINTS (Integrated Engine / Bridge) ---

// 1. Concept Graph & Syllabus
app.get('/api/concepts', (req, res) => {
  try {
    const concepts = getConceptGraph();
    res.json(concepts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Start Assessment (Diagnostic or targeted)
app.post('/api/assessment/start', (req, res) => {
  try {
    const { studentId, studentName } = req.body || {};
    const session = startDiagnosticAssessment(studentId, studentName);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Submit Answer & Misconception Evaluation
app.post('/api/answers/submit', (req, res) => {
  try {
    const { sessionId, studentId, questionId, selectedOption, numericalValue, explanationText } = req.body;
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }
    const result = submitAnswer({
      sessionId,
      studentId: studentId || 'std_current',
      questionId,
      selectedOption,
      numericalValue,
      explanationText
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Learner Progress & Concept Mastery
app.get('/api/learner/progress', (req, res) => {
  try {
    const studentId = req.query.studentId || 'std_current';
    const progress = getLearnerProgress(studentId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Adaptive Next Question
app.get('/api/practice/next', (req, res) => {
  try {
    const studentId = req.query.studentId || 'std_current';
    const conceptId = req.query.conceptId || null;
    const nextQ = getNextAdaptiveQuestion(studentId, conceptId);
    res.json(nextQ);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Spaced Repetition Due Reviews
app.get('/api/reviews/due', (req, res) => {
  try {
    const studentId = req.query.studentId || 'std_current';
    const reviews = getReviewsDue(studentId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TEACHER & FULL-STACK PRODUCT ENDPOINTS ---

// Teacher Dashboard Overview Analytics
app.get('/api/teacher/analytics', (req, res) => {
  try {
    const section = req.query.section || '10-A';
    const analytics = getClassAnalytics(section);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Teacher: Specific Student Detail
app.get('/api/teacher/students/:id', (req, res) => {
  try {
    const student = getStudentDetail(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback to client SPA index.html for all non-API web routes
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 [Member 2 Backend] ConceptIQ Server running on http://localhost:${PORT}`);
  console.log(`⚡ Class 10 Physics: Electricity adaptive service ready`);
  if (fs.existsSync(clientDistPath)) {
    console.log(`🌐 Full-Stack UI linked & served directly at http://localhost:${PORT}`);
  }
});
