import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentPortal from './components/StudentPortal';
import TeacherDashboard from './components/TeacherDashboard';
import { Sparkles, Terminal, Info, ExternalLink } from 'lucide-react';
import { API_BASE } from './apiConfig';

export default function App() {
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'teacher'
  const [studentProgress, setStudentProgress] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(data => setSystemHealth(data))
      .catch(err => console.error('Health check error:', err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Navigation */}
      <Navbar
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        studentProgress={studentProgress}
        isOnline={!!systemHealth}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeRole === 'student' ? (
          <StudentPortal onProgressUpdate={(p) => setStudentProgress(p)} />
        ) : (
          <TeacherDashboard />
        )}
      </main>

      {/* Bottom Integration Status Bar */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">ConceptIQ Engine</span>
            <span>•</span>
            <span className="font-medium">Role: Member 2 (Full-Stack Product & Teacher Analytics)</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bridge Mode: {systemHealth?.aiEngineMode || 'Active'}</span>
            </span>
            <span className="text-slate-400">Class 10 Physics: Electricity</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
