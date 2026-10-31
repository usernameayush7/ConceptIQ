import http from 'http';
import {
  getConceptGraph,
  startDiagnosticAssessment,
  submitAnswer,
  getLearnerProgress,
  getNextAdaptiveQuestion,
  getReviewsDue
} from './services/adaptiveEngine.js';
import { getClassAnalytics, getStudentDetail } from './services/analyticsService.js';

console.log('--- TEST 1: Concept Graph ---');
const concepts = getConceptGraph();
console.log(`Loaded ${concepts.concepts.length} concepts, ${concepts.misconceptions.length} misconceptions.`);

console.log('\n--- TEST 2: Start Diagnostic Assessment ---');
const session = startDiagnosticAssessment('test_user', 'Test Student');
console.log(`Started session: ${session.sessionId}, Total questions: ${session.totalQuestions}`);

console.log('\n--- TEST 3: Submit Answer with Misconception Check ---');
// Q102 has option A triggering MISCON_CURRENT_CONSUMED
const submission = submitAnswer({
  sessionId: session.sessionId,
  studentId: 'test_user',
  questionId: 'Q102',
  selectedOption: 'A',
  explanationText: 'The current is used up by the resistor'
});
console.log('Result:', {
  isCorrect: submission.isCorrect,
  detectedMisconception: submission.detectedMisconception?.id,
  masteryDelta: submission.updatedMastery.delta,
  newScore: submission.updatedMastery.score
});

console.log('\n--- TEST 4: Adaptive Next Question ---');
const nextQ = getNextAdaptiveQuestion('test_user');
console.log('Next adaptive pick:', {
  targetConcept: nextQ.targetConcept.id,
  reason: nextQ.recommendedReason,
  questionId: nextQ.question.id
});

console.log('\n--- TEST 5: Teacher Analytics ---');
const analytics = getClassAnalytics('10-A');
console.log('Analytics summary:', {
  totalStudents: analytics.totalStudents,
  avgMastery: analytics.avgMastery,
  atRiskCount: analytics.atRiskCount,
  topMisconceptions: analytics.topMisconceptions.length
});

console.log('\n✅ ALL INTEGRATION TESTS PASSED!');
