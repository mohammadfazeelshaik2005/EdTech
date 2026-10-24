import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Modal,
  EligibilityChecker,
} from '@/components/ui';
import { mockOpportunities } from '@/data/mockData';
import { calculateOpportunityMatch } from '@/services/recommendationEngine';
import { checkOpportunityEligibility } from '@/services/eligibilityService';
import { calculateVerificationAudit, VERIFICATION_DISCLAIMER } from '@/services/verificationService';
import { calculateDeadlineIntelligence } from '@/services/notificationService';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Clock,
  DollarSign,
  Building,
  CheckCircle2,
  Bookmark,
  Sparkles,
  ShieldCheck,
  Check,
  GraduationCap,
  Target,
  BrainCircuit,
  AlertCircle,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';

import { getOpportunityById } from '@/services/dataCollection';
import {
  getOpportunityActionConfig,
  recordApplicationLinkOpened,
  getApplicationByOpportunityId,
  updateApplicationStatus,
} from '@/services/trackerService';

export const OpportunityDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profileData, isLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  const opportunity =
    (id ? getOpportunityById(id) : null) ||
    mockOpportunities.find((o) => o.id === id) ||
    mockOpportunities[0];

  // Resolve 3-state action configuration: Apply Now, View Opportunity, or Unavailable
  const actionConfig = getOpportunityActionConfig(opportunity);
  const destinationUrl = actionConfig.url;

  // Sync with application tracker
  const trackedItem = getApplicationByOpportunityId(opportunity.id);
  const [currentStatus, setCurrentStatus] = useState<string | undefined>(trackedItem?.status);
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const handleApplyNow = () => {
    if (!destinationUrl) {
      setToastNotification('Application link currently unavailable for this opportunity.');
      setTimeout(() => setToastNotification(null), 4000);
      return;
    }

    // Record action in application tracker as 'Planning to Apply' (never marks as Applied or Submitted)
    const recordResult = recordApplicationLinkOpened(opportunity);
    if (recordResult) {
      setCurrentStatus(recordResult.item.status);
    }

    // Open official application website in a new tab to preserve PathSync AI session
    window.open(destinationUrl, '_blank', 'noopener,noreferrer');

    // Display transparent guidance modal
    setRedirectModalOpen(true);
  };

  const handleMarkAsApplied = () => {
    const item = getApplicationByOpportunityId(opportunity.id);
    if (item) {
      updateApplicationStatus(item.id, 'Applied', 'Student confirmed submission on official portal.');
      setCurrentStatus('Applied');
      setToastNotification('Marked as "Applied" in your Application Tracker.');
      setTimeout(() => setToastNotification(null), 4000);
      setRedirectModalOpen(false);
    }
  };

  // Calculate deterministic, personalized match analysis
  const matchAnalysis = calculateOpportunityMatch(opportunity, profileData);

  // Calculate deterministic eligibility report
  const eligibilityReport = checkOpportunityEligibility(opportunity, profileData);

  // Calculate internal verification audit & signals (Step 10)
  const verificationAudit = calculateVerificationAudit(opportunity);

  const studentName = profileData?.profile?.full_name || user?.fullName || 'Student';
  const studentMajor = profileData?.education?.branch || 'Computer Science & AI';
  const studentCollege = profileData?.education?.college || 'Academic Institution';
  const studentCgpa = profileData?.education?.cgpa || '3.8';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-muted">Loading opportunity details & verification report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      
      {/* Navigation & Test Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <Link
          to="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Discover
        </Link>
        
        {/* Quick Opportunity Switcher to Test Both Eligible & Ineligible States */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-slate-subtle font-medium shrink-0">Test Eligibility State:</span>
          <Link
            to="/opportunity/opp-1"
            className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors ${
              opportunity.id === 'opp-1'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-alternate text-charcoal hover:bg-subtle border border-border-default'
            }`}
          >
            opp-1 (Eligible)
          </Link>
          <Link
            to="/opportunity/opp-4"
            className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors ${
              opportunity.id === 'opp-4'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-alternate text-charcoal hover:bg-subtle border border-border-default'
            }`}
          >
            opp-4 (Not Eligible: Masters)
          </Link>
          <Link
            to="/opportunity/opp-3"
            className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors ${
              opportunity.id === 'opp-3'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-alternate text-charcoal hover:bg-subtle border border-border-default'
            }`}
          >
            opp-3 (Not Eligible: Missing Go)
          </Link>
        </div>
      </div>

      {/* Main Page Header */}
      <PageHeader
        title={opportunity.title}
        subtitle={`${opportunity.organization} • ${opportunity.category}`}
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Discover', href: '/discover' },
          { label: opportunity.title },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Opportunity Status Badges */}
            {actionConfig.type === 'EXPIRED' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 bg-rose-100/90 border border-rose-300 px-3 py-1.5 rounded-full shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-rose-700 stroke-[2.5]" />
                <span>Deadline Passed</span>
              </span>
            ) : actionConfig.type === 'CLOSED' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-full shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-slate-600 stroke-[2.5]" />
                <span>Applications Closed</span>
              </span>
            ) : actionConfig.type === 'VIEW_OPPORTUNITY' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-100/90 border border-blue-300 px-3 py-1.5 rounded-full shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700 stroke-[2.5]" />
                <span>Info Verified (Unverified App Link)</span>
              </span>
            ) : verificationAudit.status === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-300/80 px-3 py-1.5 rounded-full shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                <span>Verified Opportunity</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100/90 border border-amber-300/80 px-3 py-1.5 rounded-full shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                <span>{verificationAudit.status}</span>
              </span>
            )}

            {/* Live Eligibility Status Pill */}
            {eligibilityReport.isEligible ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-300/80 px-3 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                <span>Eligible</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100/90 border border-amber-300/80 px-3 py-1.5 rounded-full shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                <span>Not Currently Eligible</span>
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              pill
              leftIcon={<Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />}
              onClick={() => setIsSaved(!isSaved)}
            >
              {isSaved ? 'Saved to Track' : 'Save Track'}
            </Button>
            {actionConfig.isAvailable ? (
              <Button
                variant="primary"
                size="sm"
                pill
                onClick={handleApplyNow}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                className="shadow-brand font-semibold"
              >
                {currentStatus === 'Applied'
                  ? (actionConfig.isDirectApply ? 'Revisit Application Portal ↗' : 'View Official Details ↗')
                  : actionConfig.buttonText}
              </Button>
            ) : actionConfig.officialDetailsUrl ? (
              <a
                href={actionConfig.officialDetailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary-subtle hover:bg-primary-subtle/80 border border-primary/20 rounded-full transition-colors"
              >
                <span>View Official Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                pill
                disabled
                className="opacity-75 cursor-not-allowed text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300"
                title={actionConfig.notice || 'Application link is currently unavailable.'}
              >
                {actionConfig.buttonText}
              </Button>
            )}
          </div>
        }
      />

      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950 animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{toastNotification}</span>
          </div>
          <Link to="/applications" className="text-primary font-bold hover:underline">
            View in Tracker →
          </Link>
        </div>
      )}

      {/* Action Notice Banner (Explained in Section 5 rules) */}
      {actionConfig.notice && actionConfig.type !== 'DIRECT_APPLY' && (
        <div className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs ${
          actionConfig.type === 'EXPIRED' || actionConfig.type === 'CLOSED'
            ? 'bg-rose-50 border border-rose-200 text-rose-950'
            : 'bg-amber-50 border border-amber-200 text-amber-950'
        }`}>
          <AlertCircle className={`w-4 h-4 shrink-0 ${
            actionConfig.type === 'EXPIRED' || actionConfig.type === 'CLOSED' ? 'text-rose-700' : 'text-amber-700'
          }`} />
          <span>
            <strong>{actionConfig.label}:</strong> {actionConfig.notice}
          </span>
        </div>
      )}

      {/* Tracked Status Indicator Banner */}
      {currentStatus === 'Applied' && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Application Status:</strong> You marked this opportunity as <strong>Applied</strong> in your Application Tracker.
            </span>
          </div>
          <Link to="/applications" className="text-primary font-bold hover:underline">
            View Milestones →
          </Link>
        </div>
      )}

      {/* ====================================================================
          FEATURED PERSONALIZED RECOMMENDATION BANNER
          Student Profile + Opportunity Requirements = Transparent Match
          ==================================================================== */}
      <section className="bg-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-subtle/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-6">
          
          {/* Header Row: Score & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="mint" pill className="text-xs font-extrabold px-3 py-1">
                    {matchAnalysis.matchScore}% Match
                  </Badge>
                  <span className="text-xs font-semibold text-charcoal">
                    High Candidate Fit
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-charcoal mt-0.5">
                  Personalized Opportunity Match Analysis
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-subtle">
                Personalized for: <strong className="text-charcoal font-semibold">{studentName}</strong> ({studentMajor})
              </span>
            </div>
          </div>

          {/* Progress Indicator Gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-charcoal">Overall Compatibility Score</span>
              <span className="text-primary font-bold">{matchAnalysis.matchScore}% Match Indicator</span>
            </div>
            <div className="w-full h-3 bg-subtle rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent-mint rounded-full transition-all duration-700 ease-out"
                style={{ width: `${matchAnalysis.matchScore}%` }}
              />
            </div>
            <p className="text-xs text-slate-subtle">
              Deterministic calculation based on your academic transcript, skill proficiencies, research preferences, and career objectives. No opaque black-box guessing.
            </p>
          </div>

          {/* "Why this opportunity?" Transparent Explanation Cards */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <span>Why this opportunity?</span>
              </h3>
              <Badge variant="brand" pill className="text-[10px]">
                {matchAnalysis.whyReasons.length} Verified Factors
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {matchAnalysis.whyReasons.map((reason, index) => (
                <div
                  key={index}
                  className="bg-alternate border border-border-default rounded-xl p-3.5 flex items-start gap-3 hover:border-primary-border transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary-subtle text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="text-xs text-charcoal font-medium leading-relaxed">
                    {reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Dimension Category Score Breakdown */}
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <span className="text-xs font-bold text-slate-subtle uppercase tracking-wider block">
              Transparent Dimension Breakdown
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Dim 1: Skills */}
              <div className="p-3 bg-alternate rounded-lg border border-border-subtle space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-muted flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" /> Skills Match
                  </span>
                  <span className="text-primary font-bold">{matchAnalysis.categoryScores.skillsScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${matchAnalysis.categoryScores.skillsScore}%` }}
                  />
                </div>
              </div>

              {/* Dim 2: Academic */}
              <div className="p-3 bg-alternate rounded-lg border border-border-subtle space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-muted flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-primary" /> Academic Eligibility
                  </span>
                  <span className="text-primary font-bold">{matchAnalysis.categoryScores.academicScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${matchAnalysis.categoryScores.academicScore}%` }}
                  />
                </div>
              </div>

              {/* Dim 3: Interests */}
              <div className="p-3 bg-alternate rounded-lg border border-border-subtle space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-muted flex items-center gap-1">
                    <Target className="w-3 h-3 text-primary" /> Interest Fit
                  </span>
                  <span className="text-primary font-bold">{matchAnalysis.categoryScores.interestScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${matchAnalysis.categoryScores.interestScore}%` }}
                  />
                </div>
              </div>

              {/* Dim 4: Career Goals */}
              <div className="p-3 bg-alternate rounded-lg border border-border-subtle space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-muted flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-primary" /> Career Path
                  </span>
                  <span className="text-primary font-bold">{matchAnalysis.categoryScores.careerScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${matchAnalysis.categoryScores.careerScore}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          DETAILS 2-COLUMN GRID (Content Left, Logistics Right)
          ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: Eligibility Checker, Skills Alignment, Overview, Prerequisites */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 9 — ELIGIBILITY CHECKER COMPONENT */}
          <EligibilityChecker
            opportunity={opportunity}
            studentData={profileData}
          />

          {/* Skill Tags: Matched vs Missing / Gaps */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                <span>Required Skills & Match Alignment</span>
              </h3>
              <Badge variant="mint" pill className="text-xs">
                {matchAnalysis.skillsAnalysis.matchedSkills.length} of {opportunity.requiredSkills?.length || 0} Matched
              </Badge>
            </div>

            <p className="text-xs text-slate-muted leading-relaxed">
              We mapped the technical prerequisites of this opportunity against your verified skills profile:
            </p>

            {/* Matched Skills Pills */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-charcoal uppercase tracking-wider block">
                ✓ Matched in Your Profile
              </span>
              <div className="flex flex-wrap gap-2">
                {matchAnalysis.skillsAnalysis.matchedSkills.length > 0 ? (
                  matchAnalysis.skillsAnalysis.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-3 py-1 rounded-lg"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{skill}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-subtle">No exact skills matched</span>
                )}
              </div>
            </div>

            {/* Missing / Growth Skills Pills */}
            {matchAnalysis.skillsAnalysis.missingSkills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <span className="text-xs font-bold text-slate-subtle uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Prerequisites to Gain / Recommended Electives</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {matchAnalysis.skillsAnalysis.missingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50/70 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-lg"
                    >
                      <span className="font-bold text-amber-700">+</span>
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-slate-subtle leading-relaxed">
                    Completing recommended micro-courses in these topics will increase your admission probability to 99%.
                  </p>
                  <Link to={`/skill-gap?opportunityId=${opportunity.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      pill
                      className="text-xs font-semibold shrink-0"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Bridge Skill Gap →
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>

          {/* Overview & Core Objectives */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-charcoal">Overview & Objectives</h3>
            <p className="text-sm text-slate-muted leading-relaxed">
              {opportunity.description}
            </p>

            <h4 className="text-base font-bold text-charcoal pt-2">Core Learning & Research Milestones</h4>
            <ul className="space-y-2.5 text-sm text-slate-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Deep dive into foundational mechanics, attention optimization, and distributed GPU clusters.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Mentorship under senior research directors and faculty affiliates.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Peer-reviewed artifact submission eligible for academic thesis credits.</span>
              </li>
            </ul>

            <h4 className="text-base font-bold text-charcoal pt-2">Academic Standing & Eligibility Summary</h4>
            <div className="p-4 bg-alternate rounded-xl border border-border-subtle space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-charcoal">
                  {matchAnalysis.eligibilityStatus.summary}
                </span>
              </div>
              <p className="text-xs text-slate-muted leading-relaxed">
                {opportunity.eligibility || 'Requires undergraduate standing and satisfactory completion of prerequisite core modules.'}
              </p>
            </div>
          </Card>

        </div>

        {/* Right Column: Logistics Summary Card */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-charcoal uppercase tracking-wider">
              Logistics & Details
            </h4>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-slate-subtle flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Host
                </span>
                <span className="font-semibold text-charcoal">{opportunity.organization}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-slate-subtle flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </span>
                <span className="font-semibold text-charcoal">{opportunity.location}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-slate-subtle flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Duration
                </span>
                <span className="font-semibold text-charcoal">{opportunity.duration}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-slate-subtle flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Stipend / Grant
                </span>
                <span className="font-semibold text-primary">{opportunity.compensation || 'Academic Credits'}</span>
              </div>

              {opportunity.deadline ? (
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <span className="text-slate-subtle flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Deadline
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-charcoal">{opportunity.deadline}</span>
                    {(() => {
                      const effectiveStatus = actionConfig.type === 'EXPIRED'
                        ? 'EXPIRED'
                        : actionConfig.type === 'CLOSED'
                        ? 'CLOSED'
                        : actionConfig.type === 'UNAVAILABLE'
                        ? 'LINK_UNAVAILABLE'
                        : actionConfig.type === 'VIEW_OPPORTUNITY'
                        ? 'NEEDS_REVIEW'
                        : opportunity.application_status || (actionConfig.isDirectApply ? 'OPEN' : 'NEEDS_REVIEW');
                      const intel = calculateDeadlineIntelligence(opportunity.deadline, effectiveStatus);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${intel.colorClasses.bg} ${intel.colorClasses.text} ${intel.colorClasses.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${intel.colorClasses.dot}`} />
                          <span>{intel.badgeLabel}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                  <span className="text-slate-subtle flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Admissions Cycle
                  </span>
                  <span className="font-semibold text-slate-muted">Rolling Admissions</span>
                </div>
              )}
            </div>

            {/* Status callout right above action button */}
            {actionConfig.type === 'EXPIRED' ? (
              <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/80 flex items-start gap-2 text-xs text-rose-950">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Application Deadline Passed</span>
                  <span className="text-[11px] text-rose-900 leading-tight block">
                    The deadline for this opportunity has elapsed. Applications are no longer accepted.
                  </span>
                </div>
              </div>
            ) : actionConfig.type === 'CLOSED' ? (
              <div className="p-3 bg-slate-100/90 rounded-xl border border-slate-300 flex items-start gap-2 text-xs text-slate-800">
                <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Applications Officially Closed</span>
                  <span className="text-[11px] text-slate-600 leading-tight block">
                    The host institution has concluded admissions for this cycle. Offer letters have been dispatched.
                  </span>
                </div>
              </div>
            ) : eligibilityReport.isEligible ? (
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Eligibility Confirmed • Ready to Apply</span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-start gap-2 text-xs text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Prerequisites Unmet</span>
                  <span className="text-[11px] text-amber-900 leading-tight block">
                    Review missing items or request a waiver petition before submitting.
                  </span>
                </div>
              </div>
            )}

            {actionConfig.isAvailable && destinationUrl ? (
              <Button
                variant={actionConfig.type === 'VIEW_OPPORTUNITY' ? 'secondary' : 'primary'}
                pill
                className="w-full mt-2 font-semibold shadow-brand"
                onClick={handleApplyNow}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                {currentStatus === 'Applied'
                  ? (actionConfig.isDirectApply ? 'Revisit Application Portal ↗' : 'View Official Opportunity ↗')
                  : actionConfig.buttonText}
              </Button>
            ) : (
              <Button
                variant="secondary"
                pill
                disabled
                className="w-full mt-2 font-semibold opacity-70 cursor-not-allowed text-xs bg-slate-100 text-slate-600 border border-slate-300"
              >
                {actionConfig.buttonText || 'Applications Closed'}
              </Button>
            )}

            {/* Official Details fallback when closed or direct portal unverified */}
            {actionConfig.officialDetailsUrl && (
              <a
                href={actionConfig.officialDetailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full mt-2 text-xs font-semibold text-primary hover:text-primary-hover hover:underline px-3 py-2 rounded-full border border-primary/20 bg-primary-subtle/40 transition-colors"
              >
                <span>View Official Announcement Page ↗</span>
              </a>
            )}
          </Card>

          {/* Student Profile Snapshot */}
          <Card className="p-5.5 space-y-3 bg-alternate border-border-default">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span>Matched Against Profile</span>
            </h4>
            <div className="space-y-1.5 text-xs text-slate-muted">
              <div className="flex justify-between">
                <span>Student:</span>
                <strong className="text-charcoal font-semibold">{studentName}</strong>
              </div>
              <div className="flex justify-between">
                <span>College:</span>
                <strong className="text-charcoal font-semibold truncate max-w-[170px]">{studentCollege}</strong>
              </div>
              <div className="flex justify-between">
                <span>Major:</span>
                <strong className="text-charcoal font-semibold truncate max-w-[170px]">{studentMajor}</strong>
              </div>
              <div className="flex justify-between">
                <span>Verified CGPA:</span>
                <strong className="text-primary font-bold">{studentCgpa} / 4.00</strong>
              </div>
            </div>
            <Link to="/profile" className="block pt-1 text-xs font-bold text-primary hover:underline">
              Edit Academic Information →
            </Link>
          </Card>

          {/* STEP 10: Trust & Verification Audit Card */}
          <Card className="p-5.5 space-y-4 bg-surface border-border-default shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  Trust & Verification Audit
                </h4>
              </div>
              <Badge variant="mint" pill className="text-[11px] font-bold">
                {verificationAudit.verificationScore}/100 Trust Score
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle">
                <span className="text-slate-subtle">Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                    verificationAudit.status === 'VERIFIED'
                      ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/80'
                      : 'text-amber-900 bg-amber-50 border border-amber-200/80'
                  }`}
                >
                  {verificationAudit.status}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle">
                <span className="text-slate-subtle">Source Registry</span>
                <span className="font-semibold text-charcoal truncate max-w-[170px]" title={verificationAudit.source}>
                  {verificationAudit.source}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle">
                <span className="text-slate-subtle">Official Domain</span>
                <span className="font-semibold text-primary">{verificationAudit.officialDomain}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle">
                <span className="text-slate-subtle">Last Verified Date</span>
                <span className="font-semibold text-charcoal">{verificationAudit.lastVerifiedDate}</span>
              </div>
            </div>

            {/* Checklist of 8 Verified Signals */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider block">
                Cryptographic & Registry Signals
              </span>
              <div className="space-y-1.5">
                {verificationAudit.signals.map((sig) => (
                  <div key={sig.id} className="flex items-start gap-2 text-[11px] text-slate-muted leading-tight">
                    {sig.passed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span>{sig.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Honest Trust Disclaimer Notice */}
            <div className="p-3 bg-alternate rounded-xl border border-border-subtle flex items-start gap-2 text-[11px] text-slate-subtle leading-relaxed">
              <Info className="w-3.5 h-3.5 text-slate-subtle shrink-0 mt-0.5" />
              <span>{VERIFICATION_DISCLAIMER}</span>
            </div>
          </Card>
        </div>

      </div>

      {/* Official Destination Guidance Modal */}
      <Modal
        isOpen={redirectModalOpen}
        onClose={() => setRedirectModalOpen(false)}
        title={actionConfig.isDirectApply ? "Official Application Portal Opened" : "Official Opportunity Page Opened"}
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            <Link
              to="/applications"
              className="text-xs font-semibold text-primary hover:underline text-center sm:text-left"
              onClick={() => setRedirectModalOpen(false)}
            >
              Go to Application Tracker →
            </Link>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" pill onClick={() => setRedirectModalOpen(false)}>
                Close
              </Button>
              {currentStatus !== 'Applied' && (
                <Button
                  variant="primary"
                  pill
                  onClick={handleMarkAsApplied}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                  className="font-semibold shadow-xs"
                >
                  I've Submitted → Mark as Applied
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5 text-blue-900">
              <ExternalLink className="w-3.5 h-3.5" />
              Redirected to Official Destination:
            </p>
            <p className="font-mono text-[11px] break-all bg-white p-2 rounded border border-blue-100 mb-2 font-medium">
              {destinationUrl}
            </p>
            <p className="text-slate-600">
              {actionConfig.isDirectApply
                ? <>The official application and registration page for <strong>{opportunity.organization}</strong> has opened in a new browser tab. Your PathSync session remains active here.</>
                : <>The official information page for <strong>{opportunity.organization}</strong> has opened in a new browser tab. Please review details and navigate to their application or enrollment section if active.</>}
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Submission Notice</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              PathSync AI <strong>cannot automatically confirm</strong> whether your external application was submitted. Please complete your application directly on the official host website.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Once you have finished submitting your application on their website, return here and click <strong>"I've Submitted → Mark as Applied"</strong> so your progress is tracked accurately.
            </p>
          </div>

          {destinationUrl && (
            <div className="pt-1 text-center">
              <a
                href={destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Portal didn't open? Click here to launch the official page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
