import React, { useState, useEffect } from 'react';
import DiagnosticTest from './DiagnosticTest';
import AdaptivePractice from './AdaptivePractice';
import MasteryDashboard from './MasteryDashboard';
import { Target, Compass, Sparkles, BookCheck } from 'lucide-react';
import { API_BASE } from '../apiConfig';

export default function StudentPortal({ onProgressUpdate }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'diagnostic' | 'practice'
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/learner/progress?studentId=std_current`);
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
        if (onProgressUpdate) onProgressUpdate(data);
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleAnswerSubmitted = () => {
    fetchProgress();
  };

  const handleSelectPracticeConcept = (conceptId) => {
    setActiveTab('practice');
  };

  return (
    <div className="space-y-6">
      
      {/* Student Navigation Mode Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Mastery Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'diagnostic'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Diagnostic Test</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'practice'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Adaptive Practice</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold text-slate-500 pr-2">
          <BookCheck className="w-4 h-4 text-indigo-600" />
          <span>CBSE Class 10 • Chapter: Electricity</span>
        </div>
      </div>

      {/* Main Mode View */}
      {activeTab === 'dashboard' && (
        <MasteryDashboard
          progress={progress}
          onSelectPracticeConcept={handleSelectPracticeConcept}
          onStartDiagnostic={() => setActiveTab('diagnostic')}
        />
      )}

      {activeTab === 'diagnostic' && (
        <DiagnosticTest
          onComplete={() => {
            fetchProgress();
            setActiveTab('dashboard');
          }}
          onAnswerSubmitted={handleAnswerSubmitted}
        />
      )}

      {activeTab === 'practice' && (
        <AdaptivePractice
          onAnswerSubmitted={handleAnswerSubmitted}
        />
      )}

    </div>
  );
}
