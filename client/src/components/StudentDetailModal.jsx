import React, { useEffect, useState } from 'react';
import { X, Award, AlertTriangle, CheckCircle2, TrendingUp, Calendar, BookOpen } from 'lucide-react';
import { API_BASE } from '../apiConfig';

export default function StudentDetailModal({ studentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/teacher/students/${studentId}`)
      .then(res => res.json())
      .then(st => setData(st))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <span className="text-3xl p-2 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-2xs">
              {data?.avatar || '🎓'}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-xl text-slate-900">{data?.name || 'Loading Student...'}</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {data?.classSection || '10-A'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Student ID: {studentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Fetching student records...</p>
          </div>
        ) : data ? (
          <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-[11px] font-bold uppercase text-indigo-700">Mastery Score</span>
                <p className="text-2xl font-black text-indigo-900 mt-1">{data.overallMastery}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] font-bold uppercase text-emerald-700">Test Accuracy</span>
                <p className="text-2xl font-black text-emerald-900 mt-1">{data.accuracy}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-[11px] font-bold uppercase text-amber-700">Practice Streak</span>
                <p className="text-2xl font-black text-amber-900 mt-1">{data.streakDays} Days</p>
              </div>
            </div>

            {/* Flagged Misconceptions */}
            {data.misconceptions && data.misconceptions.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center space-x-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Identified Cognitive Misconceptions ({data.misconceptions.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {data.misconceptions.map((m) => (
                    <div key={m.id} className="bg-white p-3 rounded-xl border border-amber-200 text-xs">
                      <p className="font-bold text-amber-900">{m.name}</p>
                      <p className="text-slate-600 mt-0.5">{m.description}</p>
                      <div className="mt-2 text-indigo-900 bg-indigo-50/80 p-2 rounded-lg font-medium">
                        <span className="font-bold">Recommended Remediation: </span>{m.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concept-by-Concept Mastery Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Class 10 Physics: Electricity Concept Scores
              </h4>
              <div className="space-y-2">
                {data.conceptDetails?.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{c.shortName}</span>
                      <span className="text-slate-500 ml-2 font-mono">({c.id})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            c.score >= 80 ? 'bg-emerald-500' : c.score >= 60 ? 'bg-indigo-600' : 'bg-rose-500'
                          }`}
                          style={{ width: `${c.score}%` }}
                        ></div>
                      </div>
                      <span className="font-black w-8 text-right text-slate-700">{c.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : null}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
