import React from 'react';
import { Zap, BookOpen, BarChart3, GraduationCap, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeRole, setActiveRole, studentProgress, isOnline }) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Subject Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 bg-clip-text text-transparent">
                  ConceptIQ
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Class 10 Physics
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Electricity • Adaptive Cognitive Engine</p>
            </div>
          </div>

          {/* Role Toggle Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveRole('student')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeRole === 'student'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
            <button
              onClick={() => setActiveRole('teacher')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeRole === 'teacher'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Teacher Analytics</span>
            </button>
          </div>

          {/* Status & Profile Pill */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">Adaptive Engine Ready</span>
            </div>

            {activeRole === 'student' && studentProgress && (
              <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                <span className="text-sm font-bold text-indigo-700">⚡ {studentProgress.streakDays || 1}d Streak</span>
                <span className="text-xs text-indigo-900/60 font-semibold">• {studentProgress.overallMastery || 50}% Mastery</span>
              </div>
            )}

            {activeRole === 'teacher' && (
              <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Class 10-A (8 Students)</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
