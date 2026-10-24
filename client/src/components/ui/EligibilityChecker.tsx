import React, { useState } from 'react';
import { Opportunity } from '@/types';
import { CompleteStudentData } from '@/services/supabaseService';
import {
  checkOpportunityEligibility,
  EligibilityReport,
} from '@/services/eligibilityService';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  FileText,
  Sliders,
  Check,
  X,
} from 'lucide-react';

export interface EligibilityCheckerProps {
  opportunity: Opportunity;
  studentData?: CompleteStudentData | null;
  className?: string;
}

export const EligibilityChecker: React.FC<EligibilityCheckerProps> = ({
  opportunity,
  studentData,
  className = '',
}) => {
  // Simulator state: allow student to experiment with acquiring missing skills or testing hypothetical standing
  const [simulatedSkills, setSimulatedSkills] = useState<string[] | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  // Compute live eligibility report
  const report: EligibilityReport = checkOpportunityEligibility(
    opportunity,
    studentData || null,
    simulatedSkills || undefined
  );

  const isEligible = report.isEligible;

  const toggleSimulateSkill = (skill: string) => {
    setSimulatedSkills((prev) => {
      const base = prev || [
        ...(studentData?.skills?.programming || []),
        ...(studentData?.skills?.frameworks || []),
        ...(studentData?.skills?.tools || []),
        ...(studentData?.skills?.technical || []),
      ];
      if (base.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        return base.filter((s) => s.toLowerCase() !== skill.toLowerCase());
      } else {
        return [...base, skill];
      }
    });
  };

  const resetSimulator = () => {
    setSimulatedSkills(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* ====================================================================
          MAIN ELIGIBILITY STATUS CARD
          Clean, trustworthy design using refined colors (no harsh bright neons)
          ==================================================================== */}
      <Card
        className={`p-6 sm:p-7 border transition-all duration-300 relative overflow-hidden ${
          isEligible
            ? 'bg-gradient-to-br from-emerald-50/50 via-surface to-surface border-emerald-200/80 shadow-xs'
            : 'bg-gradient-to-br from-amber-50/40 via-surface to-surface border-amber-200/70 shadow-xs'
        }`}
      >
        {/* Subtle decorative accent */}
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16 ${
            isEligible ? 'bg-emerald-100/40' : 'bg-amber-100/40'
          }`}
        />

        <div className="relative z-10 space-y-6">
          
          {/* Header Row: Big Status Pill & Verification Note */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider">
                  Verified Candidate Standing
                </span>
                {simulatedSkills && (
                  <span className="text-[10px] font-semibold bg-primary-subtle text-primary px-2 py-0.5 rounded-full">
                    Simulation Active
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-charcoal tracking-tight flex items-center gap-2">
                <span>Eligibility Status:</span>
                <span
                  className={
                    isEligible ? 'text-emerald-800 font-black' : 'text-amber-900 font-black'
                  }
                >
                  {report.status}
                </span>
              </h3>
            </div>

            {/* Visual Status Indicator Pill */}
            <div className="self-start sm:self-auto">
              {isEligible ? (
                <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-900 border border-emerald-300/70 px-4 py-2 rounded-full font-bold text-sm shadow-xs">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 shrink-0 stroke-[2.5]" />
                  <span>Eligible to Apply</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-amber-100/80 text-amber-950 border border-amber-300/80 px-4 py-2 rounded-full font-bold text-sm shadow-xs">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-700 shrink-0 stroke-[2.5]" />
                  <span>Not Currently Eligible</span>
                </div>
              )}
            </div>
          </div>

          {/* Overall Summary Sentence */}
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed flex items-start gap-3 ${
              isEligible
                ? 'bg-emerald-50/60 border-emerald-200/70 text-emerald-950'
                : 'bg-amber-50/50 border-amber-200/60 text-amber-950'
            }`}
          >
            {isEligible ? (
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="font-bold block mb-0.5">
                {isEligible ? 'Full Eligibility Cleared' : 'Prerequisite Gaps Identified'}
              </strong>
              <span>{report.overallSummary}</span>
            </div>
          </div>


          {/* ==================================================================
              IF NOT ELIGIBLE: EXPLAIN EXACTLY WHY (MISSING REQUIREMENTS)
              ================================================================== */}
          {!isEligible && report.missingRequirements.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Missing Requirements ({report.missingRequirements.length})</span>
                </h4>
                <span className="text-xs text-slate-subtle">
                  Must be satisfied prior to host submission
                </span>
              </div>

              <div className="space-y-2.5">
                {report.missingRequirements.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-surface border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-charcoal flex items-center gap-2">
                          <span>{item.title}</span>
                          <span className="text-[10px] font-semibold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            Missing
                          </span>
                        </div>
                        <p className="text-xs text-slate-muted leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-9 sm:pl-0">
                      <span className="text-[11px] font-semibold text-charcoal block">
                        Requires: <strong className="text-amber-900">{item.requiredValue}</strong>
                      </span>
                      <span className="text-[10px] text-slate-subtle block">
                        Your status: {item.studentValue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ==================================================================
              REQUIREMENTS THE STUDENT SATISFIES
              ================================================================== */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Requirements You Satisfy ({report.satisfiedRequirements.length})</span>
              </h4>
              <span className="text-xs text-emerald-800 font-semibold">
                {report.scorePercentage}% criteria matched
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.satisfiedRequirements.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-surface border border-border-default hover:border-emerald-200 rounded-xl flex items-start gap-3 transition-colors shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold text-charcoal truncate">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-slate-muted line-clamp-2 leading-relaxed">
                      {item.detail}
                    </p>
                    <div className="pt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-800">
                      <span>✓ {item.studentValue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* ==================================================================
              IF NOT ELIGIBLE: "HOW CAN YOU BECOME ELIGIBLE?"
              Relevant skill & bridge learning recommendation placeholders
              ================================================================== */}
          {!isEligible && (
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="brand" pill className="text-[10px]">
                    BRIDGING ROADMAP
                  </Badge>
                  <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                    How can you become eligible?
                  </span>
                </div>
                <p className="text-xs text-slate-muted leading-relaxed">
                  PathSync generated curated curriculum modules and institutional waiver paths to bridge your unmet prerequisites:
                </p>
              </div>

              {/* Learning Recommendations Cards */}
              {report.howToBecomeEligible.recommendations.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {report.howToBecomeEligible.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-alternate border border-border-default hover:border-primary-border rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 shadow-2xs group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                            {rec.skillBadge}
                          </span>
                          <span className="text-[10px] font-medium text-slate-subtle flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{rec.estimatedTime}</span>
                          </span>
                        </div>

                        <h5 className="text-xs sm:text-sm font-bold text-charcoal group-hover:text-primary transition-colors leading-snug">
                          {rec.title}
                        </h5>

                        <p className="text-[11px] text-slate-muted leading-relaxed line-clamp-2">
                          {rec.description}
                        </p>

                        <div className="text-[10px] text-slate-subtle flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-primary" />
                          <span>Offered by: <strong className="text-charcoal font-semibold">{rec.provider}</strong></span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        pill
                        className="w-full justify-between text-xs font-semibold group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        onClick={() => alert(`Starting pathway: ${rec.title}`)}
                      >
                        {rec.actionLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Advising & Waiver Guidance */}
              {report.howToBecomeEligible.advisingNotes.length > 0 && (
                <div className="p-3.5 bg-subtle/80 rounded-xl border border-border-subtle space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Academic Advising & Waiver Alternative</span>
                  </div>
                  {report.howToBecomeEligible.advisingNotes.map((note, idx) => (
                    <p key={idx} className="text-xs text-slate-muted leading-relaxed pl-5">
                      • {note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* ==================================================================
              INTERACTIVE SIMULATOR (WHAT-IF ANALYSIS TOOL)
              Allows evaluators and students to test adding skills or changing state
              ================================================================== */}
          <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              className="text-primary font-bold hover:underline flex items-center gap-1.5 cursor-pointer self-start"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showSimulator ? 'Hide Eligibility Simulator' : 'Test What-If Scenarios (Simulator)'}</span>
            </button>

            {simulatedSkills && (
              <button
                type="button"
                onClick={resetSimulator}
                className="text-slate-subtle hover:text-danger cursor-pointer underline text-[11px]"
              >
                Reset to Verified Profile
              </button>
            )}
          </div>

          {/* Simulator Panel */}
          {showSimulator && (
            <div className="p-4 bg-alternate rounded-xl border border-border-default space-y-3 animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal">
                  Simulate Completing Required Skills:
                </span>
                <span className="text-[11px] text-slate-subtle">
                  Toggle skills to see status update dynamically
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {opportunity.requiredSkills?.map((skill) => {
                  const currentSkills = simulatedSkills || [
                    ...(studentData?.skills?.programming || []),
                    ...(studentData?.skills?.frameworks || []),
                    ...(studentData?.skills?.tools || []),
                    ...(studentData?.skills?.technical || []),
                  ];
                  const has = currentSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSimulateSkill(skill)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        has
                          ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300 font-bold'
                          : 'bg-surface text-slate-muted border-border-default hover:border-primary-border'
                      }`}
                    >
                      <span>{has ? '✓' : '+'}</span>
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </Card>

    </div>
  );
};
