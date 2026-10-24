import React, { useState } from 'react';
import {
  AIAssessmentResult,
} from '@/types/assessment';
import { AssessmentSectionId } from '@/types';
import { SECTION_METADATA } from '@/services/aiAssessmentService';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
} from 'lucide-react';

interface Props {
  result: AIAssessmentResult;
  onRetake: () => void;
  onStartTopicPractice?: (sectionId?: AssessmentSectionId) => void;
}

export const AssessmentResultView: React.FC<Props> = ({
  result,
  onRetake,
  onStartTopicPractice,
}) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [filterReviewType, setFilterReviewType] = useState<'all' | 'incorrect' | 'correct'>('all');

  const filteredQuestions = result.questionBreakdown ? result.questionBreakdown.filter((q) => {
    if (filterReviewType === 'incorrect') return !q.isCorrect;
    if (filterReviewType === 'correct') return q.isCorrect;
    return true;
  }) : [];

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      
      {/* ====================================================================
          BANNER 1: OVERALL SCORE & READINESS BENCHMARK TIER
          ==================================================================== */}
      <div className="p-6 bg-gradient-to-br from-[#06392F] via-[#085444] to-[#0A6C58] text-white rounded-2xl shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/20 text-white font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-mint" /> AI Placement Diagnostic Complete
              </span>
              <span className="text-[10px] text-slate-200">
                • {result.aiProviderUsed}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Readiness Score: {result.overallScore}%
            </h2>

            <p className="text-xs text-slate-200 max-w-xl leading-relaxed">
              Answered <strong>{result.correctAnswers} of {result.totalQuestions}</strong> questions correctly across {Object.keys(result.sectionScores).length} technical evaluation modules in {Math.round(result.timeTakenSeconds / 60)} minutes.
            </p>
          </div>

          {/* Readiness Tier Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center min-w-[200px] shadow-sm space-y-1">
            <div className="text-3xl font-black text-mint">{result.overallScore}%</div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              {result.readinessLevel?.tier || (result.overallScore >= 75 ? 'Tier-1 High Readiness' : 'Needs Targeted Practice')}
            </div>
            <p className="text-[10px] text-slate-200 max-w-[220px] mx-auto leading-normal pt-1">
              {result.readinessLevel?.description || 'Placement readiness benchmark estimate based on evaluation performance.'}
            </p>
          </div>

        </div>

        {/* Action Bar */}
        <div className="border-t border-white/15 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <Calendar className="w-3.5 h-3.5" />
            <span>Completed on {new Date(result.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetake}
              className="px-4 py-2 rounded-xl bg-white text-forest font-bold text-xs hover:bg-slate-100 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake with Fresh Questions</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECTION 2: SECTION-WISE SCORES & DIFFICULTY METRICS
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Section Score Cards */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border-default p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h4 className="text-sm font-bold text-charcoal">
                Section-Wise Performance Breakdown
              </h4>
              <p className="text-xs text-slate-muted">
                Accuracy rates across technical, mathematical, and reasoning competencies.
              </p>
            </div>
            <span className="text-xs font-bold text-primary">
              {Object.keys(result.sectionScores).length} Sections
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(result.sectionScores) as [AssessmentSectionId, any][]).map(([secId, scoreObj]) => {
              const meta = SECTION_METADATA[secId] || { title: secId };
              const isPassing = scoreObj.percentage >= 70;
              return (
                <div
                  key={secId}
                  className="p-3.5 bg-alternate rounded-xl border border-border-default space-y-2 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-charcoal truncate">{meta.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isPassing
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {scoreObj.percentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-muted">
                    <span>{scoreObj.score} of {scoreObj.total} correct</span>
                    <span>{scoreObj.total > 0 ? `${scoreObj.score}/${scoreObj.total}` : 'N/A'}</span>
                  </div>

                  <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden border border-border-subtle">
                    <div
                      className={`h-full transition-all duration-500 ${isPassing ? 'bg-emerald-600' : 'bg-amber-500'}`}
                      style={{ width: `${scoreObj.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Difficulty & Stats Summary */}
        <div className="bg-surface rounded-2xl border border-border-default p-5 space-y-4 shadow-xs">
          <div className="border-b border-border-subtle pb-3">
            <h4 className="text-sm font-bold text-charcoal">
              Difficulty Mastery
            </h4>
            <p className="text-xs text-slate-muted">
              Accuracy by question complexity.
            </p>
          </div>

          {result.difficultyScores ? (
            <div className="space-y-3">
              {(['easy', 'medium', 'hard'] as const).map((diff) => {
                const diffData = result.difficultyScores[diff];
                const label = diff.charAt(0).toUpperCase() + diff.slice(1);
                return (
                  <div key={diff} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-charcoal">{label} Level</span>
                      <span className="font-mono font-bold text-slate-muted">
                        {diffData.score}/{diffData.total} ({diffData.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-alternate rounded-full h-2 overflow-hidden border border-border-subtle">
                      <div
                        className={`h-full ${
                          diff === 'easy' ? 'bg-emerald-500' : diff === 'medium' ? 'bg-primary' : 'bg-purple-600'
                        }`}
                        style={{ width: `${diffData.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-muted">Mixed difficulty evaluation</div>
          )}

          {/* Quick Metrics */}
          <div className="border-t border-border-subtle pt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 bg-alternate rounded-xl border border-border-subtle">
              <span className="text-[10px] text-slate-muted uppercase font-bold block">Correct</span>
              <span className="text-base font-black text-emerald-700">{result.correctAnswers}</span>
            </div>
            <div className="p-2.5 bg-alternate rounded-xl border border-border-subtle">
              <span className="text-[10px] text-slate-muted uppercase font-bold block">Incorrect</span>
              <span className="text-base font-black text-rose-600">{result.incorrectAnswers ?? 0}</span>
            </div>
          </div>

        </div>

      </div>

      {/* ====================================================================
          SECTION 3: STRENGTHS, WEAK AREAS & ACTIONABLE ROADMAP
          ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Strengths Card */}
        <div className="bg-emerald-50/20 border border-emerald-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            <span>Identified Competencies & Strengths</span>
          </div>
          <ul className="space-y-2 text-xs text-charcoal">
            {result.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weak Areas Card */}
        <div className="bg-amber-50/20 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600" />
            <span>Target Areas Requiring Focus</span>
          </div>
          <ul className="space-y-2 text-xs text-charcoal">
            {result.weakAreas.map((weak, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ====================================================================
          SECTION 4: PERSONALIZED LEARNING ROADMAP & SUGGESTED RESOURCES
          ==================================================================== */}
      {result.aiAnalysis && (
        <div className="bg-surface rounded-2xl border border-border-default p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-charcoal">
                Personalized Placement Acceleration Plan
              </h4>
            </div>
            {result.aiAnalysis.nextRecommendedAssessment && onStartTopicPractice && (
              <button
                type="button"
                onClick={() => onStartTopicPractice(result.aiAnalysis?.nextRecommendedAssessment?.sectionId)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{result.aiAnalysis.nextRecommendedAssessment.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Actionable Steps */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-charcoal block">Recommended Action Items:</span>
              {result.aiAnalysis.actionableRoadmap.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-alternate rounded-xl border border-border-default text-xs text-charcoal flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-primary text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            {/* Suggested Learning Resources */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-charcoal block">Targeted Practice Resources:</span>
              {result.aiAnalysis.suggestedResources.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-alternate rounded-xl border border-border-default text-xs text-charcoal flex items-center justify-between gap-2.5 hover:border-primary-border transition-all block group"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <span className="font-bold block group-hover:text-primary transition-colors">{res.title}</span>
                      <span className="text-[10px] text-slate-muted">{res.topic} • {res.type}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    Explore ↗
                  </span>
                </a>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ====================================================================
          SECTION 5: QUESTION-BY-QUESTION REVIEW ACCORDION
          Shows Student Answer, Correct Answer, and Technical Explanation
          ==================================================================== */}
      {result.questionBreakdown && result.questionBreakdown.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border-default p-6 space-y-4 shadow-xs">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div>
              <h4 className="text-sm font-bold text-charcoal flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Question Review & Explanations</span>
              </h4>
              <p className="text-xs text-slate-muted">
                Inspect step-by-step solutions and scoring breakdowns for every problem.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterReviewType('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  filterReviewType === 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-slate-muted border-border-default hover:text-charcoal'
                }`}
              >
                All ({result.questionBreakdown.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterReviewType('incorrect')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  filterReviewType === 'incorrect'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-surface text-slate-muted border-border-default hover:text-charcoal'
                }`}
              >
                Incorrect ({result.questionBreakdown.filter((q) => !q.isCorrect).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterReviewType('correct')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  filterReviewType === 'correct'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-surface text-slate-muted border-border-default hover:text-charcoal'
                }`}
              >
                Correct ({result.questionBreakdown.filter((q) => q.isCorrect).length})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q.questionId;
              return (
                <div
                  key={q.questionId}
                  className={`rounded-xl border transition-all ${
                    q.isCorrect ? 'border-emerald-200 bg-emerald-50/10' : 'border-rose-200 bg-rose-50/10'
                  }`}
                >
                  {/* Header Row */}
                  <div
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.questionId)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center border ${
                        q.isCorrect ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-charcoal">{q.sectionTitle}</span>
                          <span className="text-[10px] text-slate-muted">• {q.topic}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm ${
                            q.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {q.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-muted line-clamp-1 mt-0.5">
                          {q.question}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs font-bold text-charcoal">
                        {q.marksAwarded > 0 ? `+${q.marksAwarded}` : q.marksAwarded} / {q.maxMarks}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-muted" /> : <ChevronDown className="w-4 h-4 text-slate-muted" />}
                    </div>
                  </div>

                  {/* Expanded Solution Details */}
                  {isExpanded && (
                    <div className="p-4 border-t border-border-subtle bg-surface space-y-3.5 text-xs animate-in fade-in-0 duration-150">
                      
                      {/* Full Question Text */}
                      <div className="font-semibold text-charcoal whitespace-pre-line leading-relaxed">
                        {q.question}
                      </div>

                      {/* Code Snippet if present */}
                      {q.codeSnippet && (
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-100">
                          <pre className="overflow-x-auto whitespace-pre leading-relaxed">
                            {q.codeSnippet}
                          </pre>
                        </div>
                      )}

                      {/* Options or Answer Comparison */}
                      <div className="p-3 bg-alternate rounded-xl border border-border-default space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-muted font-semibold">Your Answer:</span>
                          <span className={`font-mono font-bold ${q.isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {q.studentAnswer !== undefined && q.studentAnswer !== null && q.studentAnswer !== ''
                              ? (typeof q.studentAnswer === 'number' && q.options
                                  ? `${String.fromCharCode(65 + q.studentAnswer)}: ${q.options[q.studentAnswer]}`
                                  : String(q.studentAnswer))
                              : 'Unanswered'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-border-subtle pt-2">
                          <span className="text-slate-muted font-semibold">Verified Correct Answer:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {typeof q.correctAnswer === 'number' && q.options
                              ? `${String.fromCharCode(65 + q.correctAnswer)}: ${q.options[q.correctAnswer]}`
                              : Array.isArray(q.correctAnswer) && q.options
                              ? q.correctAnswer.map((idx: number) => `${String.fromCharCode(65 + idx)}: ${q.options?.[idx]}`).join(', ')
                              : String(q.correctAnswer)}
                          </span>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-200/50 space-y-1">
                        <span className="text-[11px] font-bold text-forest block">Technical Solution & Explanation:</span>
                        <p className="text-xs text-charcoal leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ====================================================================
          LEGAL & ACCURACY DISCLAIMER
          ==================================================================== */}
      <div className="p-4 bg-slate-50 border border-border-default rounded-xl flex items-start gap-3 text-slate-muted text-xs leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong>Evaluation Disclaimer:</strong> PathSync AI Placement Readiness Scores are algorithmic diagnostic estimates based on your assessment performance across standardized technical benchmarks. They do not constitute an explicit guarantee of placement, employment offers, or examination clearance.
        </p>
      </div>

    </div>
  );
};
