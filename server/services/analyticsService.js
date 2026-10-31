import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const conceptGraphPath = path.join(__dirname, '../data/conceptGraph.json');
const mockStudentsPath = path.join(__dirname, '../data/mockStudents.json');

const conceptData = JSON.parse(fs.readFileSync(conceptGraphPath, 'utf8'));
let studentsData = JSON.parse(fs.readFileSync(mockStudentsPath, 'utf8'));

export const getClassAnalytics = (section = '10-A') => {
  const students = studentsData.filter(s => !section || s.classSection === section);

  // 1. Overall stats
  const totalStudents = students.length;
  const avgMastery = Math.round(students.reduce((acc, s) => acc + s.overallMastery, 0) / (totalStudents || 1));
  const avgAccuracy = Math.round(students.reduce((acc, s) => acc + s.accuracy, 0) / (totalStudents || 1));
  
  // 2. Concept-wise average mastery
  const conceptPerformance = conceptData.concepts.map(concept => {
    const scores = students.map(s => s.conceptMastery[concept.id] || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
    const struggleCount = students.filter(s => (s.conceptMastery[concept.id] || 0) < 60).length;

    return {
      conceptId: concept.id,
      name: concept.name,
      shortName: concept.shortName,
      averageMastery: avgScore,
      struggleCount,
      difficultyRating: avgScore < 60 ? 'High Struggle' : avgScore < 75 ? 'Moderate' : 'Solid'
    };
  });

  // 3. Common Misconceptions summary
  const misconceptionCounts = {};
  conceptData.misconceptions.forEach(m => {
    misconceptionCounts[m.id] = {
      ...m,
      count: 0,
      affectedStudents: []
    };
  });

  students.forEach(s => {
    (s.flaggedMisconceptions || []).forEach(mId => {
      if (misconceptionCounts[mId]) {
        misconceptionCounts[mId].count += 1;
        misconceptionCounts[mId].affectedStudents.push({
          id: s.id,
          name: s.name,
          avatar: s.avatar
        });
      }
    });
  });

  const topMisconceptions = Object.values(misconceptionCounts)
    .filter(m => m.count > 0)
    .sort((a, b) => b.count - a.count);

  // 4. Students Needing Support (Mastery < 60 or 2+ flagged misconceptions)
  const studentsNeedingSupport = students
    .filter(s => s.overallMastery < 65 || (s.flaggedMisconceptions && s.flaggedMisconceptions.length >= 2))
    .sort((a, b) => a.overallMastery - b.overallMastery)
    .map(s => {
      const weakestConcept = conceptData.concepts
        .map(c => ({ id: c.id, name: c.shortName, score: s.conceptMastery[c.id] || 0 }))
        .sort((a, b) => a.score - b.score)[0];

      return {
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        overallMastery: s.overallMastery,
        weakestConcept: weakestConcept ? `${weakestConcept.name} (${weakestConcept.score}%)` : 'None',
        activeMisconceptionsCount: (s.flaggedMisconceptions || []).length,
        recommendedAction: s.overallMastery < 50
          ? 'Schedule small-group diagnostic intervention on basic charge & Ohm\'s Law'
          : 'Assign targeted parallel circuit concept remediation tasks'
      };
    });

  // 5. Revision overview
  const revisionTimeline = [
    { day: 'Today', topic: 'Parallel Circuit Equivalent Resistance (C6)', count: 4, priority: 'High' },
    { day: 'Tomorrow', topic: 'Factors Affecting Wire Resistance (C4)', count: 3, priority: 'Medium' },
    { day: 'In 3 Days', topic: 'Joule\'s Heating Effect (C7)', count: 2, priority: 'Low' }
  ];

  return {
    section,
    totalStudents,
    avgMastery,
    avgAccuracy,
    atRiskCount: studentsNeedingSupport.length,
    conceptPerformance,
    topMisconceptions,
    studentsNeedingSupport,
    revisionTimeline,
    allStudents: students
  };
};

export const getStudentDetail = (studentId) => {
  const student = studentsData.find(s => s.id === studentId);
  if (!student) return null;

  const conceptDetails = conceptData.concepts.map(c => ({
    ...c,
    score: student.conceptMastery[c.id] || 0
  }));

  const misconceptions = (student.flaggedMisconceptions || []).map(mId => 
    conceptData.misconceptions.find(m => m.id === mId)
  ).filter(Boolean);

  return {
    ...student,
    conceptDetails,
    misconceptions
  };
};
