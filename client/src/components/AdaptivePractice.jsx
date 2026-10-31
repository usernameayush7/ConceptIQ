import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Lightbulb, Send, RefreshCw } from 'lucide-react';

export default function AdaptivePractice({ onAnswerSubmitted }) {
  const [loading, setLoading] = useState(true);
  const [adaptiveItem, setAdaptiveItem] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [numericalValue, setNumericalValue] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchNextQuestion = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedOption('');
    setNumericalValue('');
    setExplanationText('');

    try {
      const res = await fetch('/api/practice/next?studentId=std_current');
      if (!res.ok) throw new Error('Failed to fetch adaptive question');
      const data = await res.json();
      setAdaptiveItem(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adaptiveItem || submitting) return;

    const q = adaptiveItem.question;
    if (q.type === 'numerical' && !numericalValue.trim()) return;
    if (q.type !== 'numerical' && !selectedOption) return;

    setSubmitting(true);
    try {
      const payload = {
        studentId: 'std_current',
        questionId: q.id,
        selectedOption: q.type !== 'numerical' ? selectedOption : null,
        numericalValue: q.type === 'numerical' ? numericalValue : null,
        explanationText
      };

      const res = await fetch('/api/answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to evaluate practice answer');
      const evalData = await res.json();
      setResult(evalData);
      if (onAnswerSubmitted) onAnswerSubmitted(evalData);
    } catch (err) {
      alert(`Error submitting answer: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-2xl mx-auto">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Adaptive Engine Selecting Target Question...</h3>
        <p className="text-sm text-slate-500 mt-1">Analyzing mastery gaps and prerequisite readiness</p>
      </div>
    );
  }

  if (error || !adaptiveItem) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center shadow-sm max-w-2xl mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Could Not Load Adaptive Question</h3>
        <p className="text-sm text-slate-600 mt-1">{error || 'Unknown error'}</p>
        <button
          onClick={fetchNextQuestion}
          className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { question: q, targetConcept, learnerMastery, recommendedReason } = adaptiveItem;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* AI Reasoning Pill */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Adaptive Engine Recommendation
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800">
              {recommendedReason}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-800 shadow-sm">
            {targetConcept.shortName}
          </span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
              {q.conceptId} • {targetConcept.name}
            </span>
            <span className="font-medium">
              Difficulty: {'⭐'.repeat(q.difficulty || 1)}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 leading-relaxed">
            {q.question}
          </h3>
        </div>

        {/* Options for MCQ */}
        {q.type !== 'numerical' && q.options && (
          <div className="space-y-3">
            {q.options.map((opt) => {
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

        {/* Numerical Question */}
        {q.type === 'numerical' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Enter calculation result {q.unit ? `(${q.unit})` : ''}:
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                step="any"
                disabled={!!result || submitting}
                value={numericalValue}
                onChange={(e) => setNumericalValue(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base font-semibold"
              />
              {q.unit && (
                <span className="absolute right-4 top-3 text-slate-400 font-medium">
                  {q.unit}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Conceptual Reasoning */}
        {(q.type === 'conceptual_explanation' || q.explanationPrompt) && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Reasoning Check
              </label>
            </div>
            <textarea
              rows={2}
              disabled={!!result || submitting}
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              placeholder="State your physical reasoning or formula used..."
              className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>
        )}

        {/* Action button */}
        {!result ? (
          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              (q.type === 'numerical' ? !numericalValue.trim() : !selectedOption)
            }
            className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <span>Updating Mastery Model...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit & Update Mastery</span>
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
                      {result.isCorrect ? 'Correct!' : 'Incorrect'}
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
                  <p className="text-xs text-slate-700">{result.feedback}</p>
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
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    Misconception: {result.detectedMisconception.name}
                  </span>
                </div>
                <p className="text-xs text-amber-900">
                  {result.detectedMisconception.description}
                </p>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs text-slate-800">
                  <span className="font-bold text-indigo-700">Remediation: </span>
                  {result.detectedMisconception.remediation}
                </div>
              </div>
            )}

            <button
              onClick={fetchNextQuestion}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
            >
              <span>Next Adaptive Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
