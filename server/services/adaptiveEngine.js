import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const conceptGraphPath = path.join(__dirname, '../data/conceptGraph.json');
const questionBankPath = path.join(__dirname, '../data/questionBank.json');
const mockStudentsPath = path.join(__dirname, '../data/mockStudents.json');

const conceptData = JSON.parse(fs.readFileSync(conceptGraphPath, 'utf8'));
const questionBank = JSON.parse(fs.readFileSync(questionBankPath, 'utf8'));
let studentsData = JSON.parse(fs.readFileSync(mockStudentsPath, 'utf8'));

// In-memory session store for active student assessments
const activeSessions = new Map();

// Student progress state store
const studentProgressStore = new Map();

// Initialize student store with mock students
studentsData.forEach(st => {
  studentProgressStore.set(st.id, {
    ...st,
    history: [],
    reviews: [
      { conceptId: 'C6', dueInDays: 0, priority: 'High', lastTested: '2026-10-25' },
      { conceptId: 'C4', dueInDays: 1, priority: 'Medium', lastTested: '2026-10-27' },
      { conceptId: 'C7', dueInDays: 3, priority: 'Low', lastTested: '2026-10-29' }
    ]
  });
});

export const getConceptGraph = () => {
  return conceptData;
};

export const startDiagnosticAssessment = (studentId = 'std_current', studentName = 'You (Student)') => {
  // Ensure student exists
  if (!studentProgressStore.has(studentId)) {
    studentProgressStore.set(studentId, {
      id: studentId,
      name: studentName,
      avatar: '🎓',
      classSection: '10-A',
      overallMastery: 50,
      streakDays: 1,
      lastActive: new Date().toISOString(),
      conceptMastery: {
        C1: 50, C2: 50, C3: 50, C4: 50, C5: 50, C6: 50, C7: 50, C8: 50
      },
      flaggedMisconceptions: [],
      recentAttempts: 0,
      accuracy: 0,
      status: 'progressing',
      history: [],
      reviews: []
    });
  }

  // Diagnostic test: Pick 5 diverse questions spanning key concepts
  const diagnosticQuestionIds = ['Q101', 'Q102', 'Q103', 'Q106', 'Q107', 'Q109'];
  const questions = questionBank
    .filter(q => diagnosticQuestionIds.includes(q.id))
    .map(({ correctAnswer, explanation, ...clientQ }) => clientQ);

  const sessionId = 'diag_' + Date.now();
  activeSessions.set(sessionId, {
    sessionId,
    studentId,
    type: 'diagnostic',
    questionIds: diagnosticQuestionIds,
    currentIndex: 0,
    answers: []
  });

  return {
    sessionId,
    totalQuestions: questions.length,
    questions
  };
};

export const submitAnswer = ({ sessionId, studentId = 'std_current', questionId, selectedOption, numericalValue, explanationText }) => {
  const q = questionBank.find(item => item.id === questionId);
  if (!q) {
    throw new Error('Question not found');
  }

  let student = studentProgressStore.get(studentId);
  if (!student) {
    startDiagnosticAssessment(studentId);
    student = studentProgressStore.get(studentId);
  }

  let isCorrect = false;
  let detectedMisconception = null;
  let feedbackMessage = '';
  let confidence = 0.95;

  if (q.type === 'numerical') {
    const numericAns = parseFloat(numericalValue);
    const expected = parseFloat(q.correctAnswer);
    const tolerance = q.tolerance || 0.01;
    isCorrect = !isNaN(numericAns) && Math.abs(numericAns - expected) <= tolerance;
    feedbackMessage = isCorrect
      ? `Correct! Answer is ${q.correctAnswer} ${q.unit || ''}.`
      : `Incorrect. You answered ${numericalValue} ${q.unit || ''}, but expected answer is ${q.correctAnswer} ${q.unit || ''}.`;
  } else {
    // MCQ or conceptual
    isCorrect = selectedOption === q.correctAnswer;
    const chosenOpt = q.options?.find(opt => opt.id === selectedOption);
    if (chosenOpt) {
      feedbackMessage = chosenOpt.feedback || (isCorrect ? 'Correct!' : 'Incorrect answer.');
      if (chosenOpt.misconceptionId) {
        const mInfo = conceptData.misconceptions.find(m => m.id === chosenOpt.misconceptionId);
        detectedMisconception = mInfo || { id: chosenOpt.misconceptionId, name: chosenOpt.misconceptionId };
      }
    }
  }

  // Check explanation for misconception or conceptual reasoning
  if (explanationText && explanationText.trim().length > 3) {
    const textLower = explanationText.toLowerCase();
    if (q.misconceptionKeywords?.some(k => textLower.includes(k.toLowerCase()))) {
      if (!detectedMisconception) {
        const mInfo = conceptData.misconceptions.find(m => m.conceptId === q.conceptId);
        if (mInfo) detectedMisconception = mInfo;
      }
    }
  }

  // Adaptive Learner Model: Update mastery
  const conceptId = q.conceptId;
  const currentMastery = student.conceptMastery[conceptId] || 50;
  
  // Bayesian / Elo-inspired mastery adjustment:
  // Difficult questions offer more gain on success; easy questions drop mastery more on failure
  const difficultyWeight = q.difficulty * 4; 
  let delta = 0;
  if (isCorrect) {
    delta = Math.max(5, 15 - (currentMastery * 0.08) + difficultyWeight);
  } else {
    delta = -Math.max(6, (currentMastery * 0.12) + (4 - q.difficulty) * 2);
  }

  const updatedConceptMastery = Math.min(100, Math.max(10, Math.round(currentMastery + delta)));
  student.conceptMastery[conceptId] = updatedConceptMastery;

  // Track misconception flags
  if (detectedMisconception) {
    if (!student.flaggedMisconceptions.includes(detectedMisconception.id)) {
      student.flaggedMisconceptions.push(detectedMisconception.id);
    }
  } else if (isCorrect && updatedConceptMastery > 75) {
    // Resolved misconception
    student.flaggedMisconceptions = student.flaggedMisconceptions.filter(m => {
      const def = conceptData.misconceptions.find(x => x.id === m);
      return def && def.conceptId !== conceptId;
    });
  }

  // Update overall mastery
  const masteryValues = Object.values(student.conceptMastery);
  student.overallMastery = Math.round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length);
  student.recentAttempts += 1;
  student.lastActive = new Date().toISOString();

  // Spaced repetition update: schedule review based on mastery
  const dueDays = updatedConceptMastery > 80 ? 5 : updatedConceptMastery > 60 ? 2 : 0;
  const existingReviewIndex = student.reviews.findIndex(r => r.conceptId === conceptId);
  const reviewEntry = {
    conceptId,
    dueInDays: dueDays,
    priority: dueDays === 0 ? 'High' : dueDays <= 2 ? 'Medium' : 'Low',
    lastTested: new Date().toISOString().split('T')[0]
  };
  if (existingReviewIndex >= 0) {
    student.reviews[existingReviewIndex] = reviewEntry;
  } else {
    student.reviews.push(reviewEntry);
  }

  // Record history item
  const submissionRecord = {
    questionId,
    conceptId,
    isCorrect,
    selectedOption,
    numericalValue,
    explanationText,
    detectedMisconception: detectedMisconception ? detectedMisconception.id : null,
    timestamp: new Date().toISOString()
  };
  student.history.push(submissionRecord);

  return {
    isCorrect,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    feedback: feedbackMessage,
    detectedMisconception: detectedMisconception ? {
      id: detectedMisconception.id,
      name: detectedMisconception.name,
      description: detectedMisconception.description,
      remediation: detectedMisconception.remediation,
      confidence
    } : null,
    updatedMastery: {
      conceptId,
      score: updatedConceptMastery,
      delta: Math.round(delta),
      overallMastery: student.overallMastery
    }
  };
};

export const getLearnerProgress = (studentId = 'std_current') => {
  let student = studentProgressStore.get(studentId);
  if (!student) {
    startDiagnosticAssessment(studentId);
    student = studentProgressStore.get(studentId);
  }

  // Format detailed concept breakdown
  const conceptsBreakdown = conceptData.concepts.map(c => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    order: c.order,
    prerequisites: c.prerequisites,
    mastery: student.conceptMastery[c.id] || 50,
    status: (student.conceptMastery[c.id] || 50) >= 80 ? 'Mastered' : (student.conceptMastery[c.id] || 50) >= 60 ? 'Progressing' : 'Needs Practice',
    activeMisconceptions: student.flaggedMisconceptions
      .map(mId => conceptData.misconceptions.find(m => m.id === mId))
      .filter(m => m && m.conceptId === c.id)
  }));

  return {
    studentId: student.id,
    name: student.name,
    classSection: student.classSection,
    overallMastery: student.overallMastery,
    streakDays: student.streakDays,
    lastActive: student.lastActive,
    totalAttempts: student.recentAttempts,
    concepts: conceptsBreakdown,
    flaggedMisconceptions: student.flaggedMisconceptions.map(mId => 
      conceptData.misconceptions.find(m => m.id === mId)
    ).filter(Boolean),
    reviewsDue: student.reviews.filter(r => r.dueInDays === 0)
  };
};

export const getNextAdaptiveQuestion = (studentId = 'std_current', targetConceptId = null) => {
  let student = studentProgressStore.get(studentId);
  if (!student) {
    startDiagnosticAssessment(studentId);
    student = studentProgressStore.get(studentId);
  }

  let selectedConceptId = targetConceptId;

  if (!selectedConceptId) {
    // Step 1: Identify weak concepts (< 70)
    const sortedConcepts = conceptData.concepts
      .map(c => ({ id: c.id, mastery: student.conceptMastery[c.id] || 50, prerequisites: c.prerequisites }))
      .sort((a, b) => a.mastery - b.mastery);

    // Step 2: Check prerequisite mastery (do not give advanced question if prerequisite is < 40)
    for (const c of sortedConcepts) {
      const prereqsOk = c.prerequisites.every(pId => (student.conceptMastery[pId] || 50) >= 45);
      if (prereqsOk) {
        selectedConceptId = c.id;
        break;
      }
    }
    if (!selectedConceptId) {
      selectedConceptId = sortedConcepts[0].id;
    }
  }

  const currentMastery = student.conceptMastery[selectedConceptId] || 50;
  // Difficulty adaptation:
  // Mastery < 50 -> Difficulty 1
  // Mastery 50-75 -> Difficulty 2
  // Mastery > 75 -> Difficulty 3
  const targetDifficulty = currentMastery < 50 ? 1 : currentMastery < 75 ? 2 : 3;

  // Find candidate questions
  let candidates = questionBank.filter(q => q.conceptId === selectedConceptId);
  if (candidates.length === 0) {
    candidates = questionBank;
  }

  // Filter by difficulty or closest
  let bestQuestion = candidates.find(q => q.difficulty === targetDifficulty);
  if (!bestQuestion) {
    bestQuestion = candidates[0];
  }

  const conceptInfo = conceptData.concepts.find(c => c.id === selectedConceptId);

  // Strip sensitive answer fields
  const { correctAnswer, explanation, ...sanitizedQuestion } = bestQuestion;

  return {
    question: sanitizedQuestion,
    targetConcept: conceptInfo,
    learnerMastery: currentMastery,
    recommendedReason: currentMastery < 60 
      ? `Targeting your growth area in ${conceptInfo.shortName} (Mastery: ${currentMastery}%)`
      : `Reinforcing high-level mastery in ${conceptInfo.shortName} (Mastery: ${currentMastery}%)`
  };
};

export const getReviewsDue = (studentId = 'std_current') => {
  let student = studentProgressStore.get(studentId);
  if (!student) {
    startDiagnosticAssessment(studentId);
    student = studentProgressStore.get(studentId);
  }

  const dueList = student.reviews.map(r => {
    const concept = conceptData.concepts.find(c => c.id === r.conceptId);
    return {
      ...r,
      conceptName: concept ? concept.name : r.conceptId,
      shortName: concept ? concept.shortName : r.conceptId,
      currentMastery: student.conceptMastery[r.conceptId] || 50
    };
  });

  return {
    studentId: student.id,
    reviews: dueList
  };
};
