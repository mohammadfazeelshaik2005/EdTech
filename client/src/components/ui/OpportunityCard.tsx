import React from 'react';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Clock,
  DollarSign,
  Bookmark,
  ArrowRight,
  Building,
  ShieldCheck,
  Tag,
  Sparkles,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { calculateDeadlineIntelligence } from '@/services/notificationService';
import { getOpportunityActionConfig, recordApplicationLinkOpened } from '@/services/trackerService';

export interface OpportunityCardProps {
  id?: string;
  title: string;
  category: string;
  organization: string;
  description: string;
  location?: string;
  mode?: string;
  duration?: string;
  compensation?: string;
  matchScore?: number;
  whyReasons?: string[];
  matchedSkills?: string[];
  eligibilityStatus?: 'Eligible' | 'Not Currently Eligible' | string;
  verificationStatus?: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED' | 'EXPIRED' | string;
  verificationScore?: number;
  source?: string;
  source_url?: string;
  application_url?: string;
  official_opportunity_url?: string;
  stipend?: string;
  tags?: string[];
  image?: string;
  extracted_at?: string;
  isExpired?: boolean;
  country?: string;
  eligibility_country?: string;
  eligibility_text?: string;
  lastVerifiedDate?: string;
  officialDomain?: string;
  deadline?: string;
  eligibility?: string;
  requiredSkills?: string[];
  educationLevel?: string;
  isVerified?: boolean;
  is_india_opportunity?: boolean;
  type?: string;
  verificationAudit?: any;
  onApply?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  className?: string;
  [key: string]: any;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  id: _id,
  title,
  category,
  organization,
  description,
  location = 'Hybrid',
  mode,
  duration = '12 Weeks',
  compensation,
  matchScore = 95,
  whyReasons,
  matchedSkills,
  eligibilityStatus,
  verificationStatus = 'VERIFIED',
  source,
  source_url,
  application_url,
  official_opportunity_url,
  lastVerifiedDate,
  deadline,
  eligibility,
  requiredSkills = [],
  isVerified: _isVerified = true,
  is_india_opportunity = true,
  onApply,
  onSave,
  isSaved = false,
  isExpired = false,
  application_status,
  official_url,
  last_verified_at,
  verification_source,
  className,
}) => {
  const effectiveOfficialUrl = official_url || official_opportunity_url;
  const actionConfig = getOpportunityActionConfig({
    application_url,
    official_url: effectiveOfficialUrl,
    official_opportunity_url: effectiveOfficialUrl,
    source_url,
    deadline,
    application_status: isExpired ? 'EXPIRED' : (verificationStatus === 'EXPIRED' ? 'EXPIRED' : application_status),
    isExpired: isExpired || verificationStatus === 'EXPIRED',
    verificationStatus: verificationStatus as any,
  });

  const isClosedStatus = actionConfig.type === 'CLOSED' || actionConfig.type === 'EXPIRED' || application_status === 'CLOSED';
  const isUpcomingStatus = application_status === 'UPCOMING';
  const isBrokenStatus = actionConfig.type === 'UNAVAILABLE' || application_status === 'LINK_BROKEN';
  const isOpenStatus = !isClosedStatus && !isUpcomingStatus && !isBrokenStatus && (actionConfig.type === 'DIRECT_APPLY' || application_status === 'OPEN');
  const isUnverifiedStatus = !isOpenStatus && !isClosedStatus && !isUpcomingStatus && !isBrokenStatus;

  return (
    <article
      className={cn(
        'bg-surface border border-border-default rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-primary-border transition-all duration-200 flex flex-col justify-between gap-4 group',
        className
      )}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="brand" pill className="text-[11px] font-semibold">
            {category}
          </Badge>
          <div className="flex items-center gap-2">
            <Badge variant="mint" pill className="text-[11px] font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>{matchScore}% Match</span>
            </Badge>
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className={cn(
                  'p-1.5 rounded-full transition-colors cursor-pointer',
                  isSaved
                    ? 'text-primary bg-primary-subtle'
                    : 'text-slate-subtle hover:text-charcoal hover:bg-subtle'
                )}
                aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
              >
                <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </div>

        {/* Title & Organization */}
        <h3 className="text-base sm:text-lg font-bold text-charcoal group-hover:text-primary transition-colors line-clamp-1">
          {title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-subtle mt-1 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 shrink-0" />
            <span className="text-charcoal font-semibold">{organization}</span>
          </div>

          {/* Canonical Application Status Badge (Open, Closed, Upcoming, Unverified, Link Broken) */}
          {isOpenStatus ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Open</span>
            </span>
          ) : isClosedStatus ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full">
              <span>Closed</span>
            </span>
          ) : isUpcomingStatus ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              <span>Upcoming</span>
            </span>
          ) : isBrokenStatus ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-900 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
              <span>Link Broken</span>
            </span>
          ) : isUnverifiedStatus ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full">
              <span>Unverified</span>
            </span>
          ) : null}

          {/* India Eligibility Indicator */}
          {is_india_opportunity !== false && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              <span className="text-[10px]">🇮🇳</span>
              <span>India-Eligible</span>
            </span>
          )}
        </div>

        {/* Trust Metadata (Source, Organization, Last Verified Date) */}
        <div className="flex items-center justify-between text-[11px] text-slate-subtle bg-alternate px-3 py-1.5 rounded-lg border border-border-subtle mb-3">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">
              Source: <strong className="text-charcoal font-medium">{verification_source || source || `${organization} Official`}</strong>
            </span>
          </div>
          {(lastVerifiedDate || last_verified_at) && (
            <span className="text-[10px] text-slate-subtle shrink-0">
              Verified {lastVerifiedDate || (last_verified_at ? new Date(last_verified_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '')}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-muted line-clamp-2 leading-relaxed mb-3">
          {description}
        </p>

        {/* Why This Opportunity? Transparent Matching Reason Block */}
        {whyReasons && whyReasons.length > 0 && (
          <div className="bg-primary-subtle/40 border border-primary-border/30 rounded-lg p-2.5 mb-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wide">
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              <span>Why this opportunity?</span>
            </div>
            <div className="space-y-1">
              {whyReasons.slice(0, 2).map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-charcoal leading-snug">
                  <span className="text-primary font-bold shrink-0">✓</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eligibility Notice */}
        {eligibility && (
          <div className="flex items-center justify-between text-xs text-slate-muted bg-alternate px-3 py-1.5 rounded-lg border border-border-subtle mb-3.5">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-semibold text-charcoal shrink-0">Eligibility:</span>
              <span className="truncate">{eligibility}</span>
            </div>
            {eligibilityStatus && (
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                  eligibilityStatus === 'Eligible'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                )}
              >
                {eligibilityStatus === 'Eligible' ? '✓ Eligible' : 'Gap Identified'}
              </span>
            )}
          </div>
        )}

        {/* Required Skills Tags with Matched Indicator */}
        {requiredSkills && requiredSkills.length > 0 && (
          <div className="space-y-1.5 mb-3.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-subtle uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-subtle" />
                <span>Skills Alignment</span>
              </span>
              {matchedSkills && matchedSkills.length > 0 && (
                <span className="text-emerald-700 font-semibold lowercase tracking-normal">
                  {matchedSkills.length}/{requiredSkills.length} matched
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {requiredSkills.slice(0, 4).map((skill) => {
                const isMatched = matchedSkills?.some(
                  (m) => m.toLowerCase().trim() === skill.toLowerCase().trim()
                );
                return (
                  <span
                    key={skill}
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors',
                      isMatched
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold'
                        : 'bg-alternate text-charcoal border border-border-default'
                    )}
                  >
                    {isMatched && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                    <span>{skill}</span>
                  </span>
                );
              })}
              {requiredSkills.length > 4 && (
                <span className="text-[10px] text-slate-subtle px-1.5 py-0.5">
                  +{requiredSkills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Meta Pills */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-muted">
          {(location || mode) && (
            <span className="inline-flex items-center gap-1 bg-subtle px-2.5 py-1 rounded-full text-[11px]">
              <MapPin className="w-3 h-3 text-slate-subtle" />
              <span>{location ? (mode ? `${location} • ${mode}` : location) : mode}</span>
            </span>
          )}
          {duration && (
            <span className="inline-flex items-center gap-1 bg-subtle px-2.5 py-1 rounded-full text-[11px]">
              <Clock className="w-3 h-3 text-slate-subtle" />
              <span>{duration}</span>
            </span>
          )}
          {compensation && (
            <span className="inline-flex items-center gap-1 bg-subtle px-2.5 py-1 rounded-full text-[11px] font-semibold text-charcoal">
              <DollarSign className="w-3 h-3 text-primary" />
              <span>{compensation}</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-border-subtle mt-1">
        {deadline ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-subtle flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-subtle" />
              <span><strong className="text-charcoal font-semibold">{deadline}</strong></span>
            </span>
            {(() => {
              const effectiveStatus = actionConfig.type === 'EXPIRED'
                ? 'EXPIRED'
                : actionConfig.type === 'CLOSED'
                ? 'CLOSED'
                : actionConfig.type === 'UNAVAILABLE'
                ? 'LINK_UNAVAILABLE'
                : actionConfig.type === 'VIEW_OPPORTUNITY'
                ? 'NEEDS_REVIEW'
                : application_status || (actionConfig.isDirectApply ? 'OPEN' : 'NEEDS_REVIEW');
              const intel = calculateDeadlineIntelligence(deadline, effectiveStatus);
              return (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
                    intel.colorClasses.bg,
                    intel.colorClasses.text,
                    intel.colorClasses.border
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', intel.colorClasses.dot)} />
                  <span>{intel.badgeLabel}</span>
                </span>
              );
            })()}
          </div>
        ) : (
          <span className="text-xs text-slate-subtle">Rolling Admissions</span>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {/* Apply Now: active only when open and direct application destination is verified */}
          {isOpenStatus && (actionConfig.url || application_url || official_url) ? (
            <a
              href={actionConfig.url || application_url || official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                try {
                  recordApplicationLinkOpened({
                    id: _id || title,
                    title,
                    organization,
                    category,
                    deadline: deadline || 'Rolling',
                    application_url: actionConfig.url || application_url || official_url,
                  } as any);
                } catch {}
              }}
              title="Open verified direct official application portal in a new tab"
            >
              <span>Apply Now</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : isClosedStatus ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-not-allowed opacity-75"
              title="Applications for this opportunity are officially closed"
            >
              <span>Apply Now (Closed)</span>
            </button>
          ) : null}

          {/* View Official Details: links to the official announcement or program page */}
          {(actionConfig.officialDetailsUrl || effectiveOfficialUrl) && (
            <a
              href={actionConfig.officialDetailsUrl || effectiveOfficialUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline px-2.5 py-1.5 rounded-lg border border-primary/20 hover:border-primary/40 bg-primary-subtle/30 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="View official announcement and program details in a new tab"
            >
              <span>View Official Details</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <Button
            variant="outline"
            size="sm"
            pill
            onClick={onApply}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="font-medium text-xs text-charcoal hover:text-primary"
          >
            Details
          </Button>
        </div>
      </div>
    </article>
  );
};
