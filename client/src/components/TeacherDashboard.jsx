import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Users, TrendingUp, AlertCircle, Calendar, Sparkles, ChevronRight, 
  HelpCircle, ShieldAlert, Award, Search 
} from 'lucide-react';
import StudentDetailModal from './StudentDetailModal';
import { API_BASE } from '../apiConfig';

export default function TeacherDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/analytics?section=10-A`);
      if (!res.ok) throw new Error('Failed to load class analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-bold text-slate-800">Aggregating Classroom Analytics...</h3>
        <p className="text-xs text-slate-500 mt-1">Analyzing mastery across Class 10-A</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Analytics Service Offline</h3>
        <p className="text-xs text-slate-600 mt-1">{error || 'Unknown error'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    section,
    totalStudents,
    avgMastery,
    avgAccuracy,
    atRiskCount,
    conceptPerformance = [],
    topMisconceptions = [],
    studentsNeedingSupport = [],
    revisionTimeline = [],
    allStudents = []
  } = analytics;

  const filteredStudents = allStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      
      {/* Top Welcome & Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Instructor Portal • Class {section}
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Class 10 Physics: Electricity Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cognitive progress, misconception patterns, and targeted intervention alerts
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Class Mastery</span>
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{avgMastery}%</p>
          <p className="text-[11px] text-slate-500 mt-1">Average across all 8 Electricity concepts</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Enrolled Students</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{totalStudents}</p>
          <p className="text-[11px] text-slate-500 mt-1">Section 10-A active learners</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Accuracy</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{avgAccuracy}%</p>
          <p className="text-[11px] text-slate-500 mt-1">Correct answer rate in diagnostic & practice</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Need Intervention</span>
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-3xl font-black text-rose-700">{atRiskCount}</p>
          <p className="text-[11px] text-rose-800 mt-1">Students below 65% mastery or holding misconceptions</p>
        </div>

      </div>

      {/* Class Mastery Chart & Common Misconceptions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Class-wide Concept Mastery Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Concept-wise Average Mastery</h3>
              <p className="text-xs text-slate-500">Benchmark comparison across the 8 curriculum units</p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>≥ 80% (Mastered)</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600 ml-2"></span>
              <span>60-79%</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ml-2"></span>
              <span>&lt; 60%</span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conceptPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis 
                  dataKey="shortName" 
                  angle={-20} 
                  textAnchor="end" 
                  interval={0} 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val, name, item) => [`${val}% Mastery (${item.payload.struggleCount} students struggling)`, 'Avg Score']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="averageMastery" radius={[6, 6, 0, 0]}>
                  {conceptPerformance.map((entry, index) => {
                    const color = entry.averageMastery >= 80 ? '#10b981' : entry.averageMastery >= 60 ? '#6366f1' : '#f43f5e';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Common Misconceptions Summary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Prevalent Misconceptions</h3>
            <p className="text-xs text-slate-500">Cognitive errors detected across students</p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
            {topMisconceptions.map((m) => (
              <div key={m.id} className="p-3.5 rounded-2xl border border-amber-200/90 bg-amber-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-950">{m.name}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    {m.count} Students ({Math.round((m.count / totalStudents) * 100)}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {m.description}
                </p>
                <div className="flex items-center space-x-1 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Affected:</span>
                  <div className="flex items-center -space-x-1">
                    {m.affectedStudents.map(st => (
                      <span 
                        key={st.id} 
                        title={st.name} 
                        onClick={() => setSelectedStudentId(st.id)}
                        className="cursor-pointer text-xs p-0.5 bg-white rounded-full border border-slate-200 hover:scale-110 transition"
                      >
                        {st.avatar}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Students Needing Support (Intervention Queue) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-extrabold text-base text-slate-900">Students Needing Support</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Actionable intervention recommendations flagged by the adaptive engine
            </p>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            {studentsNeedingSupport.length} Priority Interventions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">Student</th>
                <th className="pb-3 px-3">Mastery</th>
                <th className="pb-3 px-3">Growth Area</th>
                <th className="pb-3 px-3">Misconceptions</th>
                <th className="pb-3 px-3">Recommended Intervention</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsNeedingSupport.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-lg p-1 bg-slate-100 rounded-lg">{student.avatar}</span>
                      <span className="font-bold text-slate-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      {student.overallMastery}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {student.weakestConcept}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {student.activeMisconceptionsCount} Flagged
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs">
                    {student.recommendedAction}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedStudentId(student.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classroom Roster & Revision Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Roster */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Complete Class 10-A Roster</h3>
              <p className="text-xs text-slate-500">Click any student to view detailed mastery metrics</p>
            </div>
            <div className="relative max-w-xs">
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredStudents.map((st) => (
              <div
                key={st.id}
                onClick={() => setSelectedStudentId(st.id)}
                className="p-3.5 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl p-1 bg-slate-100 rounded-xl group-hover:scale-105 transition">{st.avatar}</span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition">{st.name}</h4>
                    <p className="text-[10px] text-slate-500">{st.recentAttempts} Questions • {st.streakDays}d Streak</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-black text-xs ${
                    st.overallMastery >= 80 ? 'text-emerald-600' : st.overallMastery >= 60 ? 'text-indigo-600' : 'text-rose-600'
                  }`}>
                    {st.overallMastery}%
                  </span>
                  <p className="text-[10px] text-slate-400">Mastery</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spaced Repetition Revision Overview */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-base text-slate-900">Upcoming Revision Overview</h3>
          </div>
          <p className="text-xs text-slate-500">Spaced repetition schedule calculated for class retention</p>

          <div className="space-y-3 pt-2">
            {revisionTimeline.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {item.day}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.priority} Priority
                  </span>
                </div>
                <p className="font-bold text-xs text-slate-900 pt-1">{item.topic}</p>
                <p className="text-[10px] text-slate-500">{item.count} students scheduled for refresher practice</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal Drilldown */}
      <StudentDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />

    </div>
  );
}
