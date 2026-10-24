import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Select,
} from '@/components/ui';
import { mockOpportunities } from '@/data/mockData';
import {
  analyzeOpportunitySkillGap,
  getEligibleTargetOpportunities,
  saveMilestoneToggle,
  SkillGapAnalysisResult,
  RoadmapMilestone,
} from '@/services/skillGapService';
import { addApplicationFromOpportunity } from '@/services/trackerService';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Award,
  FileCode,
  Clock,
  Compass,
  Check,
  ExternalLink,
  BookmarkPlus,
  Send,
  Building,
  Target,
  Sparkles,
} from 'lucide-react';

export const SkillGapPage: React.FC = () => {
  const { profileData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Target opportunity selection
  const eligibleOpportunities = useMemo(() => getEligibleTargetOpportunities(), []);

  // Determine current target opportunity ID from URL query or fallback to flagship 'opp-ai-internship'
  const queryOppId = searchParams.get('opportunityId');
  const selectedOppId = useMemo(() => {
    if (queryOppId && eligibleOpportunities.some((o) => o.id === queryOppId)) {
      return queryOppId;
    }
    const defaultOpp = eligibleOpportunities.find((o) => o.id === 'opp-ai-internship') || eligibleOpportunities[0];
    return defaultOpp ? defaultOpp.id : '';
  }, [queryOppId, eligibleOpportunities]);

  const targetOpportunity = useMemo(() => {
    return eligibleOpportunities.find((o) => o.id === selectedOppId) || eligibleOpportunities[0];
  }, [eligibleOpportunities, selectedOppId]);

  // Tab state for learning recommendations: 'courses' | 'certifications' | 'resources'
  const [recTab, setRecTab] = useState<'courses' | 'certifications' | 'resources'>('courses');

  // Milestone completion refresh trigger
  const [milestoneRefreshKey, setMilestoneRefreshKey] = useState(0);

  // Analyze skill gap based on selected opportunity and student profile
  const analysis: SkillGapAnalysisResult = useMemo(() => {
    if (!targetOpportunity) {
      return analyzeOpportunitySkillGap(mockOpportunities[0], profileData);
    }
    return analyzeOpportunitySkillGap(targetOpportunity, profileData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetOpportunity, profileData, milestoneRefreshKey]);

  // Handle switching target opportunity
  const handleSelectOpportunity = (oppId: string) => {
    setSearchParams({ opportunityId: oppId });
  };

  // Handle toggling milestone completion
  const handleToggleMilestone = (milestone: RoadmapMilestone) => {
    if (!targetOpportunity) return;
    saveMilestoneToggle(targetOpportunity.id, milestone.id, !milestone.completed);
    setMilestoneRefreshKey((prev) => prev + 1);
  };

  // Calculate overall roadmap progress percentage
  const totalMilestones = useMemo(() => {
    return analysis.phases.reduce((acc, p) => acc + p.milestones.length, 0);
  }, [analysis]);

  const completedMilestones = useMemo(() => {
    return analysis.phases.reduce(
      (acc, p) => acc + p.milestones.filter((m) => m.completed).length,
      0
    );
  }, [analysis]);

  const roadmapProgressPercent = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  // Track in applications toast / handler
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const handleTrackOpportunity = () => {
    if (!targetOpportunity) return;
    addApplicationFromOpportunity(
      targetOpportunity,
      'Planning to Apply',
      `Targeting via Skill Gap Roadmap. Bridge time: ${analysis.estimatedWeeksToBridge} weeks.`
    );
    setToastMessage(`"${targetOpportunity.title}" added to your Application Tracker.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300 pb-12">
      
      {/* ====================================================================
          PAGE HEADER WITH SUPPORTING FEATURE CONTEXT
          ==================================================================== */}
      <PageHeader
        title="Skill Gap & Learning Roadmap"
        subtitle="Translate target opportunity prerequisites into an actionable preparation roadmap to bridge qualification gaps."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Opportunities', href: '/discover' },
          { label: 'Skill Gap' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/discover">
              <Button
                variant="outline"
                size="sm"
                pill
                leftIcon={<Compass className="w-3.5 h-3.5" />}
              >
                Back to Discovery
              </Button>
            </Link>
            <Link to="/applications">
              <Button
                variant="outline"
                size="sm"
                pill
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Application Tracker
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
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ====================================================================
          IMPORTANT SUPPORTING FEATURE CALLOUT BANNER
          Opportunity discovery remains the primary purpose of PathSync AI
          ==================================================================== */}
      <div className="p-4 bg-primary-subtle/50 border border-primary/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Supporting Development Feature
              </span>
              <span className="text-[10px] bg-white border border-primary/20 px-2 py-0.5 rounded-full font-medium text-primary">
                Opportunity Discovery Driven
              </span>
            </div>
            <p className="text-xs text-slate-muted leading-relaxed max-w-2xl">
              Opportunity discovery is the core purpose of <strong>PathSync AI</strong>. This module analyzes specific requirements from your chosen target opportunity and generates a curated learning roadmap to ensure you qualify for top admissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/discover">
            <Button variant="ghost" size="sm" pill className="text-xs font-semibold">
              Explore 340+ Opportunities →
            </Button>
          </Link>
        </div>
      </div>


      {/* ====================================================================
          TARGET OPPORTUNITY SELECTION BAR & PREVIEW CARD
          Works directly from Opportunity Requirements
          ==================================================================== */}
      <Card className="p-6 border-border-default space-y-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="brand" pill className="text-[10px] font-bold">
                ACTIVE BENCHMARK
              </Badge>
              <span className="text-xs font-bold text-slate-subtle uppercase tracking-wider">
                Select Target Opportunity
              </span>
            </div>
            <p className="text-xs text-slate-muted">
              Choose an opportunity to evaluate your standing against its verified prerequisites:
            </p>
          </div>

          {/* Opportunity Dropdown Selector */}
          <div className="w-full md:w-96">
            <Select
              value={selectedOppId}
              onChange={(e) => handleSelectOpportunity(e.target.value)}
              className="text-xs py-2 font-semibold"
            >
              {eligibleOpportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} — {opp.organization}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Selected Target Opportunity Card Summary */}
        {targetOpportunity && (
          <div className="p-5 bg-alternate rounded-xl border border-border-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral" pill className="text-[10px]">
                  {targetOpportunity.category}
                </Badge>
                <Badge variant="mint" pill className="text-[10px] font-bold">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>{targetOpportunity.matchScore}% Current Match</span>
                </Badge>
                <span className="text-[10px] text-slate-subtle bg-white px-2.5 py-0.5 rounded-full border border-border-subtle">
                  Deadline: <strong className="text-charcoal">{targetOpportunity.deadline}</strong>
                </span>
              </div>

              <h3 className="text-lg font-bold text-charcoal">
                {targetOpportunity.title}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-muted">
                <span className="flex items-center gap-1.5 font-semibold text-charcoal">
                  <Building className="w-3.5 h-3.5 text-primary" />
                  <span>{targetOpportunity.organization}</span>
                </span>
                <span>•</span>
                <span>Mode: <strong>{targetOpportunity.mode}</strong></span>
                <span>•</span>
                <span>Stipend: <strong className="text-emerald-700">{targetOpportunity.compensation}</strong></span>
              </div>
            </div>

            {/* Quick Actions for this target opportunity */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                pill
                leftIcon={<BookmarkPlus className="w-3.5 h-3.5" />}
                onClick={handleTrackOpportunity}
                className="text-xs font-semibold"
              >
                Track in Applications
              </Button>
              <Link to={`/opportunity/${targetOpportunity.id}`}>
                <Button
                  variant="primary"
                  size="sm"
                  pill
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold shadow-xs"
                >
                  Opportunity Details
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>


      {/* ====================================================================
          SKILL REQUIREMENTS VS STUDENT PROFILE COMPARISON
          (Required -> Student Has -> Missing)
          ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. Required by Opportunity */}
        <Card className="p-5 space-y-3.5 border-border-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-primary" />
              <span>Target Opportunity Required</span>
            </span>
            <Badge variant="neutral" pill className="text-[10px] font-bold">
              {analysis.requiredSkills.length} Prerequisites
            </Badge>
          </div>
          <p className="text-[11px] text-slate-muted leading-relaxed">
            Essential technical competencies specified in {targetOpportunity.title} review rubric:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {analysis.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="text-xs font-semibold bg-alternate text-charcoal px-3 py-1.5 rounded-lg border border-border-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>

        {/* 2. Student Has (Verified in Profile) */}
        <Card className="p-5 space-y-3.5 border-emerald-200/80 bg-gradient-to-br from-emerald-50/30 to-surface">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Student Has (Verified)</span>
            </span>
            <Badge variant="mint" pill className="text-[10px] font-bold">
              {analysis.matchedSkills.length} Matched
            </Badge>
          </div>
          <p className="text-[11px] text-slate-muted leading-relaxed">
            Skills already verified in your student profile that satisfy opportunity criteria:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {analysis.matchedSkills.length > 0 ? (
              analysis.matchedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-lg"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                  <span>{skill}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-subtle italic">No direct skills matched yet</span>
            )}
          </div>
        </Card>

        {/* 3. Missing Skills */}
        <Card className="p-5 space-y-3.5 border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-surface">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Missing Prerequisites</span>
            </span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
              {analysis.missingSkills.length} Gaps
            </span>
          </div>
          <p className="text-[11px] text-slate-muted leading-relaxed">
            Prerequisites to bridge to achieve full candidate qualification and 98%+ match:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {analysis.missingSkills.length > 0 ? (
              analysis.missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100/80 text-amber-950 border border-amber-300 px-3 py-1.5 rounded-lg"
                >
                  <span className="font-black text-amber-700">+</span>
                  <span>{skill}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                All prerequisites met!
              </span>
            )}
          </div>
        </Card>

      </div>


      {/* ====================================================================
          "YOUR SKILL GAP" SECTION (HIGHLIGHTED CORE SECTION)
          Shows diagnosis, coverage metric & projected match score increase
          ==================================================================== */}
      <Card className="p-6 sm:p-8 border-border-default space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="brand" pill className="text-[10px]">
                DIAGNOSTIC BENCHMARK
              </Badge>
              <h2 className="text-xl sm:text-2xl font-black text-charcoal">
                Your Skill Gap
              </h2>
            </div>
            <p className="text-xs text-slate-muted mt-1 max-w-xl">
              Targeted analysis of unmet criteria for <strong>{targetOpportunity.title}</strong> with estimated time to complete bridging coursework.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 bg-alternate p-3 rounded-xl border border-border-subtle shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-subtle uppercase block">Coverage</span>
              <span className="text-lg font-black text-charcoal">{analysis.coveragePercentage}%</span>
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-subtle uppercase block">Bridge Time</span>
              <span className="text-lg font-black text-primary">{analysis.estimatedWeeksToBridge} wks</span>
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-subtle uppercase block">Projected Fit</span>
              <span className="text-lg font-black text-emerald-700">{analysis.projectedMatchScore}%</span>
            </div>
          </div>
        </div>

        {/* Detailed Gap Cards */}
        {analysis.missingSkills.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.missingSkills.map((skill) => (
                <div
                  key={skill}
                  className="p-4 bg-surface rounded-xl border border-border-default hover:border-primary-border transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <h4 className="text-sm font-bold text-charcoal">{skill}</h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      High Priority Prerequisite
                    </span>
                  </div>

                  <p className="text-xs text-slate-muted leading-relaxed">
                    Required for statistical data significance, experimentation rigor, and research methodologies within <strong>{targetOpportunity.organization}</strong>.
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-subtle border-t border-border-subtle">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>Estimated effort: <strong>2–3 weeks</strong></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setRecTab('courses')}
                      className="text-primary hover:underline font-bold cursor-pointer"
                    >
                      View Curated Modules →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Match Improvement Banner */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
                <div>
                  <strong className="font-bold text-emerald-950">Projected Outcome: Match Score Increases to {analysis.projectedMatchScore}%</strong>
                  <p className="text-[11px] text-emerald-900 mt-0.5">
                    Completing the recommended modules below closes all prerequisite flags and places you in the top 5% candidate tier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-emerald-950">No Prerequisite Gaps Detected!</h4>
            <p className="text-xs text-emerald-900 max-w-md mx-auto">
              Your profile satisfies 100% of the required technical criteria for {targetOpportunity.title}. You are fully eligible to apply immediately.
            </p>
            <div className="pt-2">
              <Link to={`/opportunity/${targetOpportunity.id}`}>
                <Button variant="primary" size="sm" pill className="font-semibold shadow-xs">
                  Apply to Opportunity Now →
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>


      {/* ====================================================================
          CURATED RECOMMENDATIONS: COURSES, CERTIFICATIONS, LEARNING RESOURCES
          ==================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-lg font-bold text-charcoal">
              Targeted Learning Recommendations
            </h3>
            <p className="text-xs text-slate-muted">
              Curated by PathSync AI to bridge the exact prerequisites for {targetOpportunity.title}.
            </p>
          </div>

          {/* Tabs: Courses | Certifications | Learning Resources */}
          <div className="flex items-center gap-1.5 bg-alternate p-1 rounded-xl border border-border-subtle shrink-0">
            <button
              type="button"
              onClick={() => setRecTab('courses')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                recTab === 'courses'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-muted hover:text-charcoal'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Courses ({analysis.courses.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRecTab('certifications')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                recTab === 'certifications'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-muted hover:text-charcoal'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certifications ({analysis.certifications.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRecTab('resources')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                recTab === 'resources'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-muted hover:text-charcoal'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Resources ({analysis.resources.length})</span>
            </button>
          </div>
        </div>

        {/* 1. COURSES TAB CONTENT */}
        {recTab === 'courses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.courses.map((course) => (
              <Card
                key={course.id}
                className="p-5 border-border-default hover:border-primary-border transition-all flex flex-col justify-between gap-4 shadow-xs group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20 px-2.5 py-0.5 rounded-md">
                      Target Skill: {course.skill}
                    </span>
                    <span className="text-[10px] text-slate-subtle font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{course.duration}</span>
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-charcoal group-hover:text-primary transition-colors leading-snug">
                    {course.title}
                  </h4>

                  <p className="text-xs text-slate-muted leading-relaxed">
                    {course.description}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-charcoal block">Key Curriculum Modules:</span>
                    <ul className="space-y-1 text-xs text-slate-muted">
                      {course.syllabus.map((syl, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                          <span className="text-primary font-bold">•</span>
                          <span>{syl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-subtle">
                    Offered by: <strong className="text-charcoal">{course.provider}</strong>
                  </div>
                  <a
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="primary"
                      size="sm"
                      pill
                      rightIcon={<ExternalLink className="w-3 h-3" />}
                      className="text-xs font-semibold shadow-xs"
                    >
                      Start Course
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 2. CERTIFICATIONS TAB CONTENT */}
        {recTab === 'certifications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.certifications.map((cert) => (
              <Card
                key={cert.id}
                className="p-5 border-border-default hover:border-primary-border transition-all flex flex-col justify-between gap-4 shadow-xs group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-md">
                      Verified Credential • {cert.skill}
                    </span>
                    <Badge variant="mint" pill className="text-[10px] font-bold">
                      {cert.validity}
                    </Badge>
                  </div>

                  <h4 className="text-base font-bold text-charcoal group-hover:text-primary transition-colors leading-snug">
                    {cert.title}
                  </h4>

                  <p className="text-xs text-slate-muted leading-relaxed">
                    {cert.description}
                  </p>

                  <div className="p-3 bg-alternate rounded-lg border border-border-subtle space-y-1 text-xs">
                    <div className="font-bold text-charcoal text-[11px]">Exam / Capstone Format:</div>
                    <div className="text-slate-muted text-[11px]">{cert.examFormat}</div>
                    <div className="text-[10px] text-slate-subtle pt-1">
                      Recognized by: <strong className="text-charcoal">{cert.recognizedBy}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-subtle">
                    Issuer: <strong className="text-charcoal">{cert.issuer}</strong>
                  </div>
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      pill
                      rightIcon={<ExternalLink className="w-3 h-3" />}
                      className="text-xs font-semibold"
                    >
                      View Credential Details
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 3. LEARNING RESOURCES TAB CONTENT */}
        {recTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.resources.map((res) => (
              <Card
                key={res.id}
                className="p-5 border-border-default hover:border-primary-border transition-all flex flex-col justify-between gap-3 shadow-xs group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-subtle px-2 py-0.5 rounded-md border border-primary/20">
                      {res.type}
                    </span>
                    <span className="text-[10px] text-slate-subtle font-medium">
                      {res.difficulty}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-charcoal group-hover:text-primary transition-colors leading-snug">
                    {res.title}
                  </h4>

                  <p className="text-xs text-slate-muted leading-relaxed">
                    {res.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] text-slate-subtle truncate max-w-[150px]">
                    {res.source}
                  </span>
                  <a
                    href={res.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-bold text-xs flex items-center gap-1 shrink-0"
                  >
                    <span>Access Resource</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>


      {/* ====================================================================
          PERSONALIZED LEARNING ROADMAP
          Multi-phase structured pathway with interactive completion checkboxes
          ==================================================================== */}
      <Card className="p-6 sm:p-8 border-border-default space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="brand" pill className="text-[10px]">
                PERSONALIZED ROADMAP
              </Badge>
              <h3 className="text-xl font-bold text-charcoal">
                Preparation Roadmap for {targetOpportunity.title}
              </h3>
            </div>
            <p className="text-xs text-slate-muted mt-1">
              Phased milestone checklist to achieve 100% eligibility prior to the {targetOpportunity.deadline} application deadline.
            </p>
          </div>

          {/* Progress Bar & Counter */}
          <div className="space-y-1.5 w-full sm:w-56 shrink-0">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-charcoal">Roadmap Progress</span>
              <span className="text-primary font-bold">{roadmapProgressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-subtle rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${roadmapProgressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-subtle text-right">
              {completedMilestones} of {totalMilestones} milestones checked
            </div>
          </div>
        </div>

        {/* Roadmap Phases Stepper */}
        <div className="space-y-6">
          {analysis.phases.map((phase) => (
            <div
              key={phase.phaseNumber}
              className="p-5 bg-alternate rounded-2xl border border-border-subtle space-y-4"
            >
              {/* Phase Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {phase.phaseNumber}
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-charcoal">
                      {phase.title}
                    </h4>
                    <p className="text-xs text-slate-muted">
                      {phase.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20">
                    {phase.durationWeeks}
                  </span>
                </div>
              </div>

              {/* Milestones in this phase */}
              <div className="space-y-3">
                {phase.milestones.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMilestone(m)}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                      m.completed
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-muted'
                        : 'bg-surface border-border-default hover:border-primary-border text-charcoal'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      aria-label={m.completed ? 'Mark milestone incomplete' : 'Mark milestone complete'}
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        m.completed
                          ? 'bg-emerald-600 text-white'
                          : 'border border-border-default bg-white hover:border-primary'
                      }`}
                    >
                      {m.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold ${
                            m.completed ? 'line-through text-slate-subtle' : 'text-charcoal'
                          }`}
                        >
                          {m.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold bg-alternate px-2 py-0.5 rounded text-slate-subtle border border-border-subtle">
                            {m.type}
                          </span>
                          <span className="text-[10px] text-slate-subtle">
                            ~{m.estimatedDays} days
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-muted leading-relaxed">
                        {m.description}
                      </p>

                      <div className="text-[10px] text-primary font-medium pt-0.5">
                        Deliverable: <strong className="text-charcoal">{m.deliverable}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Roadmap Footer Action Bar */}
        <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-muted">
            Progress is automatically saved to your student profile across sessions.
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/opportunity/${targetOpportunity.id}`}>
              <Button variant="outline" size="sm" pill className="text-xs font-semibold">
                View Opportunity Rubric
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              pill
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={handleTrackOpportunity}
              className="text-xs font-semibold shadow-brand"
            >
              Track in Applications
            </Button>
          </div>
        </div>
      </Card>


      {/* ====================================================================
          RETURN TO DISCOVERY REMINDER BANNER
          (Ensures opportunity discovery remains front & center)
          ==================================================================== */}
      <Card variant="alternate" className="p-6 sm:p-8 text-center space-y-3 border-border-subtle">
        <Compass className="w-8 h-8 text-primary mx-auto" />
        <h4 className="text-base font-bold text-charcoal">
          Explore Other Opportunities Matching Your Current Skills
        </h4>
        <p className="text-xs text-slate-muted max-w-lg mx-auto">
          While you work through this learning roadmap, discover over 340+ verified grants, scholarships, and hackathons where your profile already meets 100% of the prerequisites today.
        </p>
        <div className="pt-2">
          <Link to="/discover">
            <Button
              variant="primary"
              pill
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="font-semibold shadow-xs"
            >
              Browse 100% Matched Opportunities →
            </Button>
          </Link>
        </div>
      </Card>

    </div>
  );
};
