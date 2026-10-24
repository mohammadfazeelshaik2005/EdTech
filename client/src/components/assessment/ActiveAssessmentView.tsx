import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClientAssessmentQuestion,
  AssessmentConfig,
} from '@/types/assessment';
import { SECTION_METADATA, saveActiveSession } from '@/services/aiAssessmentService';
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  Code,
  Sparkles,
  Save,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface Props {
  attemptId: string;
  userId: string;
  config: AssessmentConfig;
  questions: ClientAssessmentQuestion[];
  initialResponses?: Record<string, any>;
  initialReviewFlags?: Record<string, boolean>;
  initialRemainingSeconds?: number;
  initialQuestionIndex?: number;
  aiProviderUsed: string;
  isLiveAi: boolean;
  onSubmit: (responses: Record<string, any>, timeTakenSeconds: number) => void;
  isSubmitting?: boolean;
}

export const ActiveAssessmentView: React.FC<Props> = ({
  attemptId,
  userId,
  config,
  questions,
  initialResponses = {},
  initialReviewFlags = {},
  initialRemainingSeconds,
  initialQuestionIndex = 0,
  aiProviderUsed,
  isLiveAi,
  onSubmit,
  isSubmitting = false,
}) => {
  const totalQuestions = questions.length;
  const initialDurationSeconds = (config.durationMinutes || 30) * 60;

  // Active state
  const [currentIndex, setCurrentIndex] = useState<number>(initialQuestionIndex);
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses);
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>(initialReviewFlags);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    initialRemainingSeconds !== undefined ? initialRemainingSeconds : initialDurationSeconds
  );
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState<boolean>(false);

  // Time taken tracking
  const timeTakenSeconds = useMemo(() => {
    return Math.max(1, initialDurationSeconds - remainingSeconds);
  }, [initialDurationSeconds, remainingSeconds]);

  // Current question
  const currentQuestion = questions[currentIndex] || questions[0];

  // Autosave callback
  const triggerAutosave = useCallback(() => {
    saveActiveSession({
      attemptId,
      userId,
      config,
      questions,
      responses,
      reviewFlags,
      currentQuestionIndex: currentIndex,
      remainingSeconds,
      startedAt: new Date().toISOString(),
      aiProviderUsed,
      isLiveAiGenerated: isLiveAi,
    });
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [attemptId, userId, config, questions, responses, reviewFlags, currentIndex, remainingSeconds, aiProviderUsed, isLiveAi]);

  // Autosave on changes
  useEffect(() => {
    triggerAutosave();
  }, [responses, reviewFlags, currentIndex, triggerAutosave]);

  // Countdown Timer
  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (!hasAutoSubmitted && !isSubmitting) {
        setHasAutoSubmitted(true);
        onSubmit(responses, initialDurationSeconds);
      }
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, hasAutoSubmitted, isSubmitting, responses, initialDurationSeconds, onSubmit]);

  // Format timer MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = remainingSeconds < 300; // < 5 mins
  const isTimeUrgent = remainingSeconds < 60;   // < 1 min

  // Answers stats
  const answeredCount = Object.keys(responses).filter((k) => {
    const val = responses[k];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;

  const reviewedCount = Object.values(reviewFlags).filter(Boolean).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Answer handlers
  const handleSelectOption = (qId: string, optIdx: number) => {
    setResponses((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  const handleToggleMultiSelect = (qId: string, optIdx: number) => {
    setResponses((prev) => {
      const currentList: number[] = Array.isArray(prev[qId]) ? [...prev[qId]] : [];
      if (currentList.includes(optIdx)) {
        return { ...prev, [qId]: currentList.filter((x) => x !== optIdx) };
      } else {
        return { ...prev, [qId]: [...currentList, optIdx].sort() };
      }
    });
  };

  const handleTextAnswerChange = (qId: string, text: string) => {
    setResponses((prev) => ({
      ...prev,
      [qId]: text,
    }));
  };

  const handleClearCurrentAnswer = () => {
    setResponses((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  const handleToggleReviewFlag = () => {
    setReviewFlags((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    onSubmit(responses, timeTakenSeconds);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      
      {/* ====================================================================
          STICKY TOP ASSESSMENT BAR
          Shows Timer, Progress, Engine indicator, and Submit
          ==================================================================== */}
      <div className="sticky top-2 z-30 p-4 bg-surface/95 backdrop-blur-md rounded-2xl border border-border-default shadow-md flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Mode & AI Origin */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-charcoal">
                {config.type === 'full_placement' ? 'Full Placement Test' : 'Topic Practice'}
              </span>
              <span className="text-[10px] bg-primary-subtle text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                {config.difficulty.toUpperCase()}
              </span>
              {config.negativeMarking && (
                <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                  -0.25x Negative
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-muted flex items-center gap-1.5 mt-0.5">
              <span>{aiProviderUsed}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-subtle">
                <Save className="w-3 h-3 text-emerald-600" /> Autosaved {lastSavedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Timer Gauge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono font-bold text-sm transition-all ${
              isTimeUrgent
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse shadow-xs'
                : isTimeCritical
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-alternate border-border-default text-charcoal'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeUrgent ? 'text-rose-600' : isTimeCritical ? 'text-amber-600' : 'text-primary'}`} />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <div className="hidden sm:block text-right">
            <div className="text-[11px] font-bold text-charcoal">
              {answeredCount} of {totalQuestions} Answered
            </div>
            <div className="w-32 bg-alternate rounded-full h-1.5 overflow-hidden border border-border-subtle mt-1">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Submit Button */}
        <div>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-brand flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test ({answeredCount}/{totalQuestions})</span>
          </button>
        </div>

      </div>

      {/* ====================================================================
          MAIN DUAL-PANE TEST WORKSPACE
          Left: Question & Options Canvas
          Right: Question Palette & Navigation
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT 3 COLS: Current Question Display */}
        <div className="lg:col-span-3 space-y-5">
          
          <div className="bg-surface rounded-2xl border border-border-default p-6 space-y-5 shadow-xs">
            
            {/* Question Header Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-alternate border border-border-subtle text-primary font-mono font-bold text-sm flex items-center justify-center">
                  Q{currentIndex + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-charcoal">
                      {currentQuestion.sectionTitle}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {currentQuestion.difficulty}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-subtle text-primary border border-primary/20">
                      {currentQuestion.questionType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-muted font-medium mt-0.5">
                    {currentQuestion.topic} {currentQuestion.subtopic ? `• ${currentQuestion.subtopic}` : ''}
                  </div>
                </div>
              </div>

              {/* Marks & Flag */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-muted bg-alternate px-2.5 py-1 rounded-lg border border-border-subtle">
                  +{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? 's' : ''}
                  {config.negativeMarking ? ` (-${currentQuestion.negativeMarks || 0.5})` : ''}
                </span>

                <button
                  type="button"
                  onClick={handleToggleReviewFlag}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    reviewFlags[currentQuestion.id]
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-surface text-slate-muted border-border-default hover:text-charcoal'
                  }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${reviewFlags[currentQuestion.id] ? 'fill-purple-700 text-purple-700' : ''}`} />
                  <span>{reviewFlags[currentQuestion.id] ? 'Marked for Review' : 'Mark Review'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-charcoal leading-relaxed whitespace-pre-line">
                {currentQuestion.question}
              </h3>

              {/* Code Snippet (if applicable) */}
              {currentQuestion.codeSnippet && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-100 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1 font-semibold">
                      <Code className="w-3.5 h-3.5 text-mint" /> Code Environment
                    </span>
                    <span className="text-slate-400">{config.preferredLanguage || 'Snippet'}</span>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre font-mono leading-relaxed pt-1">
                    {currentQuestion.codeSnippet}
                  </pre>
                </div>
              )}
            </div>

            {/* Answer Input Controls based on Question Type */}
            <div className="space-y-3 pt-2">
              
              {/* Type 1: MCQ & Debugging (Single Choice Radio) */}
              {(currentQuestion.questionType === 'mcq' || currentQuestion.questionType === 'debugging') && currentQuestion.options && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-semibold text-slate-muted block">Select one correct option:</span>
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = responses[currentQuestion.id] === optIdx;
                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                        className={`p-3.5 rounded-xl border flex items-center gap-3.5 text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-subtle border-primary text-charcoal font-semibold shadow-xs'
                            : 'bg-surface border-border-default hover:border-primary-border text-slate-muted hover:text-charcoal'
                        }`}
                      >
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          checked={isSelected}
                          onChange={() => handleSelectOption(currentQuestion.id, optIdx)}
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <span className="w-6 h-6 rounded-md bg-alternate font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-border-subtle">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Type 2: Multiple Select (Check all that apply) */}
              {currentQuestion.questionType === 'multiple_select' && currentQuestion.options && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-semibold text-primary block">
                    Multiple Choice: Select ALL statements that apply (one or more):
                  </span>
                  {currentQuestion.options.map((opt, optIdx) => {
                    const selectedList: number[] = Array.isArray(responses[currentQuestion.id])
                      ? responses[currentQuestion.id]
                      : [];
                    const isSelected = selectedList.includes(optIdx);
                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleToggleMultiSelect(currentQuestion.id, optIdx)}
                        className={`p-3.5 rounded-xl border flex items-center gap-3.5 text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-subtle border-primary text-charcoal font-semibold shadow-xs'
                            : 'bg-surface border-border-default hover:border-primary-border text-slate-muted hover:text-charcoal'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleMultiSelect(currentQuestion.id, optIdx)}
                          className="w-4 h-4 text-primary accent-primary rounded-sm"
                        />
                        <span className="w-6 h-6 rounded-md bg-alternate font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-border-subtle">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Type 3: Numerical Value Input */}
              {currentQuestion.questionType === 'numerical' && (
                <div className="space-y-2 p-4 bg-alternate rounded-xl border border-border-default">
                  <label className="block text-xs font-bold text-charcoal">
                    Enter your exact numerical answer:
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 180 or 42.5"
                    value={responses[currentQuestion.id] !== undefined ? responses[currentQuestion.id] : ''}
                    onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-border-default font-mono text-sm bg-surface text-charcoal focus:border-primary outline-hidden"
                  />
                  <p className="text-[11px] text-slate-muted">
                    No negative signs or units unless explicitly specified in the problem statement.
                  </p>
                </div>
              )}

              {/* Type 4: Code Output Prediction & Short Technical Answer */}
              {(currentQuestion.questionType === 'code_output' || currentQuestion.questionType === 'short_answer') && (
                <div className="space-y-2 p-4 bg-alternate rounded-xl border border-border-default">
                  <label className="block text-xs font-bold text-charcoal">
                    {currentQuestion.questionType === 'code_output'
                      ? 'Enter exact standard console output:'
                      : 'Enter concise technical term or acronym:'}
                  </label>
                  <input
                    type="text"
                    placeholder={currentQuestion.questionType === 'code_output' ? 'e.g. 3,3,3' : 'e.g. STAR'}
                    value={responses[currentQuestion.id] !== undefined ? responses[currentQuestion.id] : ''}
                    onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-border-default font-mono text-sm bg-surface text-charcoal focus:border-primary outline-hidden"
                  />
                </div>
              )}

            </div>

            {/* Bottom Question Navigation Footer */}
            <div className="border-t border-border-subtle pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClearCurrentAnswer}
                disabled={responses[currentQuestion.id] === undefined}
                className="text-xs text-slate-muted hover:text-rose-600 font-semibold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Selection</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl border border-border-default text-xs font-bold text-charcoal hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Finish Assessment</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT 1 COL: Question Navigation Palette */}
        <div className="lg:col-span-1 space-y-4">
          
          <div className="bg-surface rounded-2xl border border-border-default p-5 space-y-4 shadow-xs sticky top-24">
            
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                Question Palette
              </h4>
              <span className="text-[11px] font-bold text-primary">
                {currentIndex + 1} / {totalQuestions}
              </span>
            </div>

            {/* Quick Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Review ({reviewedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-primary" />
                <span>Current</span>
              </div>
            </div>

            {/* Grid of Question Number Buttons */}
            <div className="grid grid-cols-5 gap-2 pt-1 max-h-[360px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = responses[q.id] !== undefined && responses[q.id] !== null && responses[q.id] !== '';
                const isReviewed = Boolean(reviewFlags[q.id]);

                let btnStyles = 'bg-slate-100 text-slate-600 border-border-default hover:border-slate-400';

                if (isReviewed && isAnswered) {
                  btnStyles = 'bg-purple-600 text-white border-purple-700 shadow-xs';
                } else if (isReviewed) {
                  btnStyles = 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
                } else if (isAnswered) {
                  btnStyles = 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-bold';
                }

                if (isCurrent) {
                  btnStyles += ' ring-2 ring-primary ring-offset-1 font-black';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg border text-xs font-mono transition-all flex items-center justify-center relative cursor-pointer ${btnStyles}`}
                    title={`Question ${idx + 1}: ${q.sectionTitle}`}
                  >
                    <span>{idx + 1}</span>
                    {isReviewed && isAnswered && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Section Breakdown */}
            <div className="border-t border-border-subtle pt-3 text-[11px] text-slate-muted space-y-1.5">
              <span className="font-bold text-charcoal block">Section Jump:</span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {Array.from(new Set(questions.map((q) => q.sectionId))).map((secId) => {
                  const meta = SECTION_METADATA[secId];
                  const firstIdx = questions.findIndex((q) => q.sectionId === secId);
                  const isCurrentSection = questions[currentIndex]?.sectionId === secId;
                  return (
                    <button
                      key={secId}
                      type="button"
                      onClick={() => setCurrentIndex(firstIdx)}
                      className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between text-[11px] transition-colors cursor-pointer ${
                        isCurrentSection
                          ? 'bg-primary-subtle text-primary font-bold'
                          : 'hover:bg-slate-50 text-slate-muted'
                      }`}
                    >
                      <span className="truncate">{meta?.title || secId}</span>
                      <ChevronRight className="w-3 h-3 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ====================================================================
          SUBMIT CONFIRMATION MODAL
          ==================================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
          <div className="bg-surface rounded-2xl border border-border-default shadow-2xl w-full max-w-md p-6 space-y-5">
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                unansweredCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {unansweredCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal">
                  Confirm Assessment Submission
                </h3>
                <p className="text-xs text-slate-muted">
                  Are you ready to submit your answers for AI diagnostic grading?
                </p>
              </div>
            </div>

            {/* Test Summary Breakdown */}
            <div className="p-4 bg-alternate rounded-xl border border-border-default space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-muted">Total Questions:</span>
                <span className="font-bold text-charcoal">{totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700">
                <span>Answered:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex items-center justify-between text-amber-700 font-semibold">
                  <span>Unanswered:</span>
                  <span>{unansweredCount} questions</span>
                </div>
              )}
              {reviewedCount > 0 && (
                <div className="flex items-center justify-between text-purple-700">
                  <span>Marked for Review:</span>
                  <span className="font-bold">{reviewedCount}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border-subtle pt-2">
                <span className="text-slate-muted">Time Remaining:</span>
                <span className="font-mono font-bold text-charcoal">{formatTime(remainingSeconds)}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                Notice: You have <strong>{unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}</strong>. Unanswered questions receive 0 marks without penalty.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-border-default text-xs font-bold text-slate-muted hover:text-charcoal hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back to Test
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-brand flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Grading Assessment...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
