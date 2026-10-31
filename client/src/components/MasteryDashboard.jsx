import React from 'react';
import { Award, AlertTriangle, Clock, ArrowRight, CheckCircle2, ChevronRight, BookOpen, Layers } from 'lucide-react';

export default function MasteryDashboard({ progress, onSelectPracticeConcept, onStartDiagnostic }) {
  if (!progress) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Loading concept mastery profile...</p>
      </div>
    );
  }

  const { overallMastery, streakDays, totalAttempts, concepts = [], flaggedMisconceptions = [], reviewsDue = [] } = progress;

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Overall Mastery Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-950/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Cognitive Mastery Score
              </span>
              <span className="bg-white/10 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur">
                Class 10 Physics: Electricity
              </span>
            </div>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-5xl font-black tracking-tight">{overallMastery}%</span>
              <span className="text-sm text-indigo-200 font-medium">
                {overallMastery >= 80 ? 'Proficient' : overallMastery >= 60 ? 'Competent' : 'Developing'}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden backdrop-blur">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${overallMastery}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-indigo-200 font-medium">
              <span>Foundation</span>
              <span>80% Mastery Threshold</span>
              <span>Advanced</span>
            </div>
          </div>
        </div>

        {/* Streak & Activity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Learning Streak
            </span>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-4xl font-black text-slate-900">{streakDays}</span>
              <span className="text-2xl">🔥</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Days of continuous physics revision</p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Total Questions</span>
            <span className="font-bold text-slate-900">{totalAttempts} answered</span>
          </div>
        </div>

        {/* Reviews Due */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Spaced Repetition
            </span>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-4xl font-black text-indigo-600">{reviewsDue.length}</span>
              <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Concepts scheduled for retention review today</p>
          </div>
          <button
            onClick={() => onSelectPracticeConcept && onSelectPracticeConcept(reviewsDue[0]?.conceptId)}
            disabled={reviewsDue.length === 0}
            className="w-full mt-4 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 font-bold text-xs transition flex items-center justify-center space-x-1"
          >
            <span>Review Due Concepts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Flagged Misconceptions Section (if any) */}
      {flaggedMisconceptions.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-950">Active Misconceptions Detected</h3>
              <p className="text-xs text-amber-800">The cognitive engine identified conceptual reasoning errors:</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flaggedMisconceptions.map((m) => (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-2">
                <span className="text-xs font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded">
                  {m.name}
                </span>
                <p className="text-xs text-slate-600">{m.description}</p>
                <div className="text-xs text-indigo-900 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                  <span className="font-bold">Key Insight: </span>{m.remediation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Syllabus & Concept Mastery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Syllabus Concept Graph & Mastery</h3>
            <p className="text-xs text-slate-500">Prerequisite dependencies and real-time knowledge estimates</p>
          </div>
          <button
            onClick={onStartDiagnostic}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 transition"
          >
            Retake Diagnostic Test
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {concepts.map((concept) => {
            const mastery = concept.mastery || 50;
            let barColor = 'bg-rose-500';
            let badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
            if (mastery >= 80) {
              barColor = 'bg-emerald-500';
              badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            } else if (mastery >= 60) {
              barColor = 'bg-indigo-600';
              badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
            }

            return (
              <div
                key={concept.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-600 font-mono">
                      {concept.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {concept.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                    {concept.shortName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {concept.name}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-500 font-medium">Concept Mastery</span>
                      <span className="font-bold text-slate-800">{mastery}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${mastery}%` }}
                      ></div>
                    </div>
                  </div>

                  {concept.prerequisites && concept.prerequisites.length > 0 && (
                    <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>Prereqs: {concept.prerequisites.join(', ')}</span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectPracticeConcept && onSelectPracticeConcept(concept.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 hover:border-indigo-200 transition flex items-center justify-center space-x-1"
                  >
                    <span>Practice Concept</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
