import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader,
  Card,
  StatCard,
  Badge,
  Button,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  getPlacementReadinessReport,
  saveActionToggle,
} from '@/services/readinessService';
import {
  savePlacementAssessment,
  getPlacementAssessments,
} from '@/services/supabaseService';
import { AssessmentResult } from '@/types';
import {
  AssessmentConfig,
  AIAssessmentResult,
  ActiveAssessmentSession,
} from '@/types/assessment';
import {
  AssessmentConfigModal,
  ActiveAssessmentView,
  AssessmentResultView,
} from '@/components/assessment';
import {
  generateAssessmentPaper,
  evaluateStudentAttempt,
  enhanceResultWithGeminiAnalysis,
  getActiveSession,
  clearActiveSession,
} from '@/services/aiAssessmentService';
import {
  Award,
  CheckCircle2,
  Code,
  Brain,
  MessageSquare,
  FileText,
  FolderGit2,
  Users,
  Compass,
  Check,
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  ClipboardCheck,
  BarChart3,
  Calendar,
} from 'lucide-react';

const AREA_ICONS: Record<string, React.ReactNode> = {
  'area-tech': <Zap className="w-4 h-4 text-primary" />,
  'area-dsa': <Brain className="w-4 h-4 text-amber-600" />,
  'area-prog': <Code className="w-4 h-4 text-emerald-600" />,
  'area-comm': <MessageSquare className="w-4 h-4 text-blue-600" />,
  'area-resume': <FileText className="w-4 h-4 text-purple-600" />,
  'area-projects': <FolderGit2 className="w-4 h-4 text-teal-600" />,
  'area-interview': <Users className="w-4 h-4 text-indigo-600" />,
};

export const ReadinessPage: React.FC = () => {
  const { user } = useAuth();

  // Top-Level Mode: 'SCORE' (Readiness Diagnostic) vs 'ASSESSMENT' (Live Assessment & Attempts)
  const [activeTab, setActiveTab] = useState<'SCORE' | 'ASSESSMENT'>('SCORE');

  // Refresh key to recompute readiness report upon action toggle
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected area filter for Readiness Score tab
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Technical' | 'Practical' | 'Communication'>('All');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // AI PLACEMENT ASSESSMENT STATE (Requirements 1-10)
  // --------------------------------------------------------------------------
  const [assessmentMode, setAssessmentMode] = useState<'TAKE' | 'RESULT'>('RESULT');
  const [currentResult, setCurrentResult] = useState<AIAssessmentResult | AssessmentResult | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<(AIAssessmentResult | AssessmentResult)[]>([]);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveAssessmentSession | null>(null);

  // Fetch live readiness report
  const report = useMemo(() => {
    return getPlacementReadinessReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Load this student's previous assessment attempts & active session on mount
  useEffect(() => {
    if (user?.id) {
      const existingSession = getActiveSession();
      if (existingSession && existingSession.userId === user.id) {
        setActiveSession(existingSession);
        setAssessmentMode('TAKE');
      }

      getPlacementAssessments(user.id).then((attempts) => {
        setPreviousAttempts(attempts);
        if (attempts.length > 0 && !existingSession) {
          setCurrentResult(attempts[0]);
          setAssessmentMode('RESULT');
        }
      });
    }
  }, [user?.id]);

  // Handle action toggle in Readiness Score
  const handleToggleAction = (actionId: string, currentStatus: boolean, title: string) => {
    saveActionToggle(actionId, !currentStatus);
    setRefreshKey((prev) => prev + 1);
    setToastMessage(!currentStatus ? `Completed: "${title}". Readiness score updated!` : `Marked incomplete: "${title}".`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered areas in Readiness Score
  const filteredAreas = useMemo(() => {
    if (categoryFilter === 'All') return report.areas;
    return report.areas.filter((a) => a.category === categoryFilter);
  }, [report.areas, categoryFilter]);

  const completedActionsCount = report.recommendedActions.filter((a) => a.completed).length;

  // --------------------------------------------------------------------------
  // AI ASSESSMENT HANDLERS
  // --------------------------------------------------------------------------
  const handleStartConfiguredAssessment = async (config: AssessmentConfig) => {
    if (!user) return;
    setIsGeneratingAssessment(true);
    try {
      const generated = await generateAssessmentPaper(config, user.id);
      const session: ActiveAssessmentSession = {
        attemptId: generated.attemptId,
        userId: user.id,
        config,
        questions: generated.questions,
        responses: {},
        reviewFlags: {},
        currentQuestionIndex: 0,
        remainingSeconds: config.durationMinutes * 60,
        startedAt: new Date().toISOString(),
        aiProviderUsed: generated.aiProviderUsed,
        isLiveAiGenerated: generated.isLiveAi,
        answerKeyStorageKey: `pathsync_secret_key_${generated.attemptId}`,
      };
      setActiveSession(session);
      setAssessmentMode('TAKE');
      setIsConfigModalOpen(false);
      setToastMessage(`AI synthesized ${generated.questions.length} fresh questions (${generated.aiProviderUsed}). Timer started!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error generating assessment paper:', err);
      setToastMessage('Error generating assessment questions. Please try again.');
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  const handleSubmitAssessmentAttempt = async (responses: Record<string, any>, timeTakenSeconds: number) => {
    if (!user || !activeSession) return;
    setIsSubmittingAssessment(true);
    try {
      let evaluation = evaluateStudentAttempt(
        activeSession.attemptId,
        user.id,
        activeSession.config,
        responses,
        timeTakenSeconds,
        activeSession.aiProviderUsed,
        activeSession.isLiveAiGenerated
      );

      // Enhance with server-side Gemini mentor diagnostics (without altering objective marks)
      try {
        evaluation = await enhanceResultWithGeminiAnalysis(evaluation);
      } catch {}

      const saved = await savePlacementAssessment(user.id, evaluation);
      clearActiveSession(activeSession.attemptId);
      setActiveSession(null);
      setCurrentResult(saved as any);
      setPreviousAttempts((prev) => [saved, ...prev]);
      setAssessmentMode('RESULT');
      setToastMessage('Assessment submitted! AI diagnostic report and readiness index generated.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setToastMessage('Error saving assessment results.');
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const handleRetakeAssessment = () => {
    setIsConfigModalOpen(true);
  };

  const handleStartTopicPractice = () => {
    setIsConfigModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300 pb-12">
      
      {/* ====================================================================
          PAGE HEADER
          ==================================================================== */}
      <PageHeader
        title="Career & Placement Readiness"
        subtitle="Comprehensive readiness benchmark combining automated credential evaluation and interactive placement assessment diagnostics."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Intelligence', href: '/dashboard' },
          { label: 'Placement Readiness' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/discover">
              <Button
                variant="outline"
                size="sm"
                pill
                leftIcon={<Compass className="w-3.5 h-3.5" />}
              >
                Browse Opportunities
              </Button>
            </Link>
            <Link to="/skill-gap">
              <Button
                variant="outline"
                size="sm"
                pill
                leftIcon={<Zap className="w-3.5 h-3.5" />}
              >
                Skill Gap Roadmap
              </Button>
            </Link>
          </div>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ====================================================================
          TOP LEVEL DUAL-FEATURE NAVIGATION TABS
          Distinguishes: A. Readiness Score vs B. Placement Assessment
          ==================================================================== */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('SCORE')}
          className={`text-xs px-4 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-2 border ${
            activeTab === 'SCORE'
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-surface text-slate-muted border-border-default hover:text-charcoal hover:border-primary-border'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>A. Placement Readiness Score</span>
          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold ml-1">
            {report.overallScore}/100
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ASSESSMENT')}
          className={`text-xs px-4 py-2.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-2 border ${
            activeTab === 'ASSESSMENT'
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-surface text-slate-muted border-border-default hover:text-charcoal hover:border-primary-border'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>B. Placement Assessment</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold ml-1">
            {previousAttempts.length > 0 ? `${currentResult?.overallScore || 0}% Score` : 'Take Test'}
          </span>
        </button>
      </div>


      {/* ====================================================================
          SECTION A: PLACEMENT READINESS SCORE
          ==================================================================== */}
      {activeTab === 'SCORE' && (
        <div className="space-y-8">
          
          {/* Supporting Diagnostic Banner */}
          <div className="p-4 bg-primary-subtle/50 border border-primary/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Part A • Candidate Profile Diagnostic
                  </span>
                  <span className="text-[10px] bg-white border border-primary/20 px-2 py-0.5 rounded-full font-medium text-primary">
                    Verified Standing
                  </span>
                </div>
                <p className="text-xs text-slate-muted leading-relaxed max-w-2xl">
                  Evaluates your academic profile, resume keywords, and skills against benchmark qualification standards of leading institutions (IISc, IITs, Microsoft, TATA, Infosys).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('ASSESSMENT')}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Take Live Assessment →</span>
            </button>
          </div>

          {/* 4 Stat Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Overall Readiness"
              value={`${report.overallScore}/100`}
              subtext={report.tierLabel}
              icon={<Award className="w-5 h-5 text-primary" />}
              variant="dark"
            />
            <StatCard
              label="National Percentile"
              value={report.percentile}
              subtext="Collegiate computing candidates"
              icon={<TrendingUp className="w-5 h-5 text-primary" />}
            />
            <StatCard
              label="Action Items"
              value={`${completedActionsCount} / ${report.recommendedActions.length}`}
              subtext="Score-boosting actions completed"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              label="Evaluated Areas"
              value={`${report.areas.length} Dimensions`}
              subtext="Technical, Practical & Soft skills"
              icon={<Target className="w-5 h-5 text-primary" />}
            />
          </div>

          {/* Detailed 7 Dimension Cards */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal">Readiness Dimensions</h3>
                <p className="text-xs text-slate-muted">7 competency pillars weighted into your profile readiness score.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {(['All', 'Technical', 'Practical', 'Communication'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                      categoryFilter === cat
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-slate-muted border-border-default hover:text-charcoal'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAreas.map((area) => (
                <Card key={area.id} className="p-5 space-y-3 border-border-default">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-alternate border border-border-subtle flex items-center justify-center">
                        {AREA_ICONS[area.id] || <Code className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-charcoal">{area.name}</h4>
                        <span className="text-[11px] text-slate-subtle">{area.category} Pillar • Weight {Math.round(area.weight * 100)}%</span>
                      </div>
                    </div>
                    <span className="text-base font-black text-primary">{area.score}%</span>
                  </div>

                  <p className="text-xs text-slate-muted leading-relaxed">{area.summary}</p>

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                    <Badge variant={area.score >= 85 ? 'mint' : 'brand'} pill className="text-[10px]">
                      {area.tier}
                    </Badge>
                    <span className="text-[11px] text-slate-subtle">
                      {area.subCompetencies.filter((s) => s.status === 'Mastered').length} of {area.subCompetencies.length} Competencies Mastered
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Checklist */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal">Recommended Milestone Actions</h3>
                <p className="text-xs text-slate-muted">Complete items to advance your composite readiness index.</p>
              </div>
              <Badge variant="brand" pill>
                {completedActionsCount} of {report.recommendedActions.length} Completed
              </Badge>
            </div>

            <div className="space-y-2.5">
              {report.recommendedActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => handleToggleAction(action.id, action.completed, action.title)}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    action.completed
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-muted'
                      : 'bg-surface border-border-default hover:border-primary-border text-charcoal'
                  }`}
                >
                  <button
                    type="button"
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      action.completed ? 'bg-emerald-600 text-white' : 'border border-border-default bg-white'
                    }`}
                  >
                    {action.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${action.completed ? 'line-through text-slate-subtle' : 'text-charcoal'}`}>
                        {action.title}
                      </span>
                      <span className="text-[10px] font-bold text-primary bg-primary-subtle px-2 py-0.5 rounded-full">
                        +{action.impactScorePts} Pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-muted">{action.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      )}

      {/* ====================================================================
          SECTION B: AI-POWERED PLACEMENT ASSESSMENT (Requirements 1-10)
          AI-generated question papers, multi-type items, timer, and deep analytics
          ==================================================================== */}
      {activeTab === 'ASSESSMENT' && (
        <div className="space-y-8">
          
          {/* Section B Header Card */}
          <div className="p-6 bg-surface rounded-2xl border border-border-default shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="mint" pill>
                    Part B • AI-Powered Examination Engine
                  </Badge>
                  <span className="text-xs text-slate-subtle font-medium">
                    Fresh Unique Papers • Multi-format Items • Deterministic Scoring
                  </span>
                </div>
                <h3 className="text-xl font-black text-charcoal mt-1">
                  National Placement Drive Assessment
                </h3>
                <p className="text-xs text-slate-muted leading-relaxed max-w-2xl mt-1">
                  Synthesizes dynamic, placement-oriented assessments covering Quantitative, Logical, Verbal, Core CS, Programming, DSA, and Interview Fundamentals with anti-repetition guarantees.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  pill
                  onClick={() => setIsConfigModalOpen(true)}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  className="shadow-brand font-bold"
                >
                  Configure New Assessment
                </Button>
                {activeSession && (
                  <Button
                    variant="outline"
                    size="sm"
                    pill
                    onClick={() => setAssessmentMode('TAKE')}
                    className="font-bold border-primary text-primary"
                  >
                    Resume Active Test
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-subtle">
                <span>Active Engine: <strong className="text-charcoal font-bold">{activeSession?.aiProviderUsed || 'PathSync High-Entropy Engine (Dynamic)'}</strong></span>
                <span>•</span>
                <span>Attempts Recorded: <strong className="text-charcoal font-bold">{previousAttempts.length}</strong></span>
              </div>
              <div className="text-xs text-slate-muted">
                Each attempt generates a unique question set with zero repetition.
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
              VIEW 1: ACTIVE TIMED ASSESSMENT EXPERIENCE
              ------------------------------------------------------------------ */}
          {assessmentMode === 'TAKE' && activeSession && (
            <ActiveAssessmentView
              attemptId={activeSession.attemptId}
              userId={activeSession.userId}
              config={activeSession.config}
              questions={activeSession.questions}
              initialResponses={activeSession.responses}
              initialReviewFlags={activeSession.reviewFlags}
              initialRemainingSeconds={activeSession.remainingSeconds}
              initialQuestionIndex={activeSession.currentQuestionIndex}
              aiProviderUsed={activeSession.aiProviderUsed}
              isLiveAi={activeSession.isLiveAiGenerated}
              onSubmit={handleSubmitAssessmentAttempt}
              isSubmitting={isSubmittingAssessment}
            />
          )}

          {/* ------------------------------------------------------------------
              VIEW 2: ASSESSMENT RESULTS & DIAGNOSTIC REPORT
              ------------------------------------------------------------------ */}
          {assessmentMode === 'RESULT' && currentResult && (
            <AssessmentResultView
              result={currentResult as AIAssessmentResult}
              onRetake={handleRetakeAssessment}
              onStartTopicPractice={handleStartTopicPractice}
            />
          )}

          {/* ------------------------------------------------------------------
              VIEW 3: ASSESSMENT LAUNCHPAD (when no active test and no result)
              ------------------------------------------------------------------ */}
          {assessmentMode === 'TAKE' && !activeSession && (
            <Card className="p-8 text-center space-y-4 max-w-xl mx-auto border-dashed border-2">
              <div className="w-14 h-14 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-charcoal">
                  Start an AI Placement Assessment
                </h3>
                <p className="text-xs text-slate-muted leading-relaxed">
                  Generate a freshly synthesized, balanced examination paper tailored to your engineering specialization and placement benchmarks.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  pill
                  onClick={() =>
                    handleStartConfiguredAssessment({
                      type: 'full_placement',
                      sections: ['aptitude', 'logical', 'quantitative', 'verbal', 'programming', 'dsa', 'core_cs', 'communication'],
                      difficulty: 'mixed',
                      questionCount: 20,
                      durationMinutes: 30,
                      preferredLanguage: 'python',
                      negativeMarking: true,
                    })
                  }
                  isLoading={isGeneratingAssessment}
                  className="font-bold shadow-brand w-full sm:w-auto"
                >
                  Start Full Placement Test (20 Qs, 30 Mins)
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  pill
                  onClick={() => setIsConfigModalOpen(true)}
                  className="font-bold w-full sm:w-auto"
                >
                  Custom Configuration
                </Button>
              </div>
            </Card>
          )}

          {/* ------------------------------------------------------------------
              HISTORICAL ATTEMPTS ARCHIVE
              Securely stored per student • Shows score progression
              ------------------------------------------------------------------ */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h4 className="text-sm font-bold text-charcoal flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Previous Assessment Attempts</span>
                </h4>
                <p className="text-xs text-slate-muted mt-0.5">
                  Secure record of your past examination performances. Isolated strictly to your student account.
                </p>
              </div>
              <Badge variant="neutral" pill>
                {previousAttempts.length} Total Attempts
              </Badge>
            </div>

            {previousAttempts.length > 0 ? (
              <div className="divide-y divide-border-subtle">
                {previousAttempts.map((att, i) => (
                  <div
                    key={att.id}
                    onClick={() => {
                      setCurrentResult(att);
                      setAssessmentMode('RESULT');
                    }}
                    className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 p-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-alternate border border-border-subtle text-primary font-bold flex items-center justify-center text-xs">
                        #{previousAttempts.length - i}
                      </span>
                      <div>
                        <div className="font-bold text-charcoal flex items-center gap-2">
                          <span>{new Date(att.completedAt).toLocaleString()}</span>
                          {(att as any).aiProviderUsed && (
                            <span className="text-[10px] text-slate-muted bg-alternate px-2 py-0.5 rounded-full border border-border-subtle">
                              {(att as any).aiProviderUsed}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-muted">
                          {att.correctAnswers} of {att.totalQuestions} questions correct
                          {(att as any).timeTakenSeconds ? ` • ${Math.round((att as any).timeTakenSeconds / 60)} mins` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-primary">
                        {att.overallScore}%
                      </span>
                      <Button variant="outline" size="sm" pill className="text-[11px]">
                        Inspect Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-muted">
                No previous attempts recorded. Click "Configure New Assessment" above to take your first placement test and generate diagnostic benchmarks.
              </div>
            )}
          </Card>

          {/* Assessment Configuration Modal */}
          <AssessmentConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            onStartAssessment={handleStartConfiguredAssessment}
            isLoading={isGeneratingAssessment}
          />

        </div>
      )}

    </div>
  );
};
