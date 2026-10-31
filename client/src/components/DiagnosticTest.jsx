import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, RotateCcw, Lightbulb, Send, Sparkles } from 'lucide-react';
import { API_BASE } from '../apiConfig';

export default function DiagnosticTest({ onComplete, onAnswerSubmitted }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User input states
  const [selectedOption, setSelectedOption] = useState('');
  const [numericalValue, setNumericalValue] = useState('');
  const [explanationText, setExplanationText] = useState('');

  // Submission result
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [testFinished, setTestFinished] = useState(false);

  const startTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentIndex(0);
    setTestFinished(false);
    setSelectedOption('');
    setNumericalValue('');
    setExplanationText('');

    try {
      const res = await fetch(`${API_BASE}/api/assessment/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: 'std_current', studentName: 'You (Student)' })
      });
      if (!res.ok) throw new Error('Failed to initiate diagnostic assessment');
      const data = await res.json();
      setSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startTest();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session || submitting) return;

    const currentQ = session.questions[currentIndex];
    if (currentQ.type === 'numerical' && !numericalValue.trim()) return;
    if (currentQ.type !== 'numerical' && !selectedOption) return;

    setSubmitting(true);
    try {
      const payload = {
        sessionId: session.sessionId,
        studentId: 'std_current',
        questionId: currentQ.id,
        selectedOption: currentQ.type !== 'numerical' ? selectedOption : null,
        numericalValue: currentQ.type === 'numerical' ? numericalValue : null,
        explanationText
      };

      const res = await fetch(`${API_BASE}/api/answers/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Answer submission failed');
      const evalData = await res.json();
      setResult(evalData);
      if (onAnswerSubmitted) onAnswerSubmitted(evalData);
    } catch (err) {
      alert(`Error submitting answer: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setResult(null);
    setSelectedOption('');
    setNumericalValue('');
    setExplanationText('');

    if (currentIndex + 1 < (session?.questions?.length || 0)) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setTestFinished(true);
      if (onComplete) onComplete();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-bold text-slate-800">Preparing Diagnostic Assessment...</h3>
        <p className="text-sm text-slate-500 mt-1">Calibrating Class 10 Physics concept graph</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Connection Error</h3>
        <p className="text-sm text-slate-600 mt-1">{error}</p>
        <button
          onClick={startTest}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (testFinished) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-sm max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Diagnostic Evaluation Complete
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2">
          Your Knowledge Profile Is Ready!
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">
          The cognitive engine has analyzed your responses, mapped your prerequisite strengths, and flagged misconceptions to address.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={startTest}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Diagnostic</span>
          </button>
          <button
            onClick={() => onComplete && onComplete()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition flex items-center justify-center space-x-2"
          >
            <span>View Mastery Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const currentQ = session.questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / session.questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Test Header & Progress */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
            Diagnostic Test • Question {currentIndex + 1} of {session.questions.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Difficulty Level: {'⭐'.repeat(currentQ.difficulty || 1)}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
            Concept Code: {currentQ.conceptId}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-3 leading-relaxed">
            {currentQ.question}
          </h3>
        </div>

        {/* Options for MCQ / Conceptual */}
        {currentQ.type !== 'numerical' && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              let optStyle = 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 text-slate-800';

              if (result) {
                if (opt.id === result.correctAnswer) {
                  optStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-semibold';
                } else if (isSelected && !result.isCorrect) {
                  optStyle = 'border-rose-400 bg-rose-50/80 text-rose-950';
                } else {
                  optStyle = 'opacity-50 border-slate-200';
                }
              } else if (isSelected) {
                optStyle = 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-2 ring-indigo-500/20';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!!result || submitting}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-start space-x-3.5 ${optStyle}`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {opt.id}
                  </span>
                  <span className="pt-0.5 leading-snug">{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Numerical Input Question */}
        {currentQ.type === 'numerical' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Your Answer {currentQ.unit ? `(${currentQ.unit})` : ''}:
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                step="any"
                disabled={!!result || submitting}
                value={numericalValue}
                onChange={(e) => setNumericalValue(e.target.value)}
                placeholder="e.g. 48"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base font-semibold"
              />
              {currentQ.unit && (
                <span className="absolute right-4 top-3 text-slate-400 font-medium">
                  {currentQ.unit}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Explanation / Reasoning Input Prompt */}
        {(currentQ.type === 'conceptual_explanation' || currentQ.explanationPrompt) && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Cognitive Reasoning (Misconception Detection)
              </label>
            </div>
            <p className="text-xs text-slate-500">
              {currentQ.explanationPrompt || "Briefly state why you chose this answer so the AI engine can diagnose your reasoning:"}
            </p>
            <textarea
              rows={2}
              disabled={!!result || submitting}
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              placeholder="e.g. Current cannot decrease because electric charge is conserved in a closed loop..."
              className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>
        )}

        {/* Submit or Next Controls */}
        {!result ? (
          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              (currentQ.type === 'numerical' ? !numericalValue.trim() : !selectedOption)
            }
            className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-100 transition flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <span>Evaluating Reasoning...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Answer</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4 pt-2">
            
            {/* Feedback Banner */}
            <div className={`p-5 rounded-2xl border ${
              result.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-start space-x-3">
                {result.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-bold text-sm ${result.isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>
                      {result.isCorrect ? 'Outstanding! Correct Answer.' : 'Needs Review'}
                    </h4>
                    {result.updatedMastery && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        result.updatedMastery.delta >= 0 
                          ? 'bg-emerald-200/80 text-emerald-800' 
                          : 'bg-rose-200/80 text-rose-800'
                      }`}>
                        {result.updatedMastery.delta >= 0 ? `+${result.updatedMastery.delta}%` : `${result.updatedMastery.delta}%`} Mastery
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{result.feedback}</p>
                  {result.explanation && (
                    <p className="text-xs text-slate-600 pt-1 font-normal italic">
                      <span className="font-semibold text-slate-700 not-italic">Concept explanation: </span>
                      {result.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Misconception Diagnostic Card */}
            {result.detectedMisconception && (
              <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    Misconception Diagnosed: {result.detectedMisconception.name}
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {result.detectedMisconception.description}
                </p>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs text-slate-800">
                  <span className="font-bold text-indigo-700">How to think about this: </span>
                  {result.detectedMisconception.remediation}
                </div>
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
            >
              <span>{currentIndex + 1 < session.questions.length ? 'Next Question' : 'Complete Assessment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
