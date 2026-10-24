import { NormalizedOpportunity } from '@/types/dataCollection';
import {
  evaluateOpportunityStatus,
  getKolkataISOString,
} from '@/lib/deadlineUtils';

export interface VerificationEvaluationResult {
  opportunity: NormalizedOpportunity;
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED' | 'EXPIRED' | 'CLOSED' | 'NEEDS_REVIEW';
  score: number;
  notes: string;
  flagReason?: string;
  rejectionReason?: string;
}

/**
 * Checks if a deadline has already elapsed dynamically against current system clock in Asia/Kolkata.
 * Strictly no hardcoded dates.
 */
export function isDeadlineExpired(deadlineStr?: string): boolean {
  if (!deadlineStr) return false;
  const statusEval = evaluateOpportunityStatus({ deadline: deadlineStr });
  return statusEval.status === 'EXPIRED';
}

/**
 * Evaluates an opportunity against the comprehensive Trust & Verification rules (A - H).
 */
export function verifyOpportunity(opportunity: NormalizedOpportunity): VerificationEvaluationResult {
  const title = opportunity.title.toLowerCase();
  const org = opportunity.organization.toLowerCase();
  const desc = opportunity.description.toLowerCase();
  const elig = (opportunity.eligibility_text || opportunity.eligibility || '').toLowerCase();
  const appUrl = (opportunity.application_url || '').toLowerCase();
  const sourceUrl = (opportunity.source_url || '').toLowerCase();

  let score = 0;
  const notes: string[] = [];
  let flagReason: string | undefined = undefined;

  // A. SOURCE VALIDITY (Max 15 pts)
  const isApprovedSource = Boolean(opportunity.source_name && opportunity.source_url);
  const isValidSourceUrl = sourceUrl.startsWith('https://') || sourceUrl.startsWith('http://');
  if (isApprovedSource && isValidSourceUrl) {
    score += 15;
    notes.push('Approved public source with valid endpoint.');
  }

  // B. ORGANIZATION VALIDITY (Max 20 pts)
  const isOrgIdentifiable =
    opportunity.organization.length >= 3 &&
    !org.includes('unknown') &&
    !org.includes('anonymous') &&
    !org.includes('unspecified');
  if (isOrgIdentifiable) {
    score += 20;
    notes.push(`Identifiable institution/organization: "${opportunity.organization}".`);
  } else {
    notes.push('Host organization name is missing or ambiguous.');
  }

  // C. OPPORTUNITY PAGE / URL VALIDITY (Max 15 pts)
  const isAppUrlValid = appUrl.startsWith('https://');
  if (isAppUrlValid) {
    score += 15;
    notes.push('Secure direct HTTPS application gateway verified.');
  } else {
    score += 5;
    notes.push('Non-HTTPS or relative application URL.');
  }

  // D. DEADLINE & APPLICATION STATUS VALIDITY (Max 15 pts)
  const statusEval = evaluateOpportunityStatus({
    deadline: opportunity.deadline,
    applicationUrl: opportunity.application_url,
    officialOpportunityUrl: opportunity.official_opportunity_url,
  });

  if (statusEval.status === 'EXPIRED') {
    return {
      opportunity: {
        ...opportunity,
        verification_status: 'EXPIRED',
        application_status: 'EXPIRED',
        verification_score: Math.min(score, 40),
        verification_notes: statusEval.reason,
        flag_reason: statusEval.reason,
        deadline_verified: false,
        last_verified_at: statusEval.verifiedAt,
      },
      status: 'EXPIRED',
      score: Math.min(score, 40),
      notes: statusEval.reason,
      flagReason: statusEval.reason,
    };
  }

  if (statusEval.status === 'CLOSED') {
    return {
      opportunity: {
        ...opportunity,
        verification_status: 'CLOSED',
        application_status: 'CLOSED',
        verification_score: Math.min(score, 40),
        verification_notes: statusEval.reason,
        flag_reason: statusEval.reason,
        deadline_verified: false,
        last_verified_at: statusEval.verifiedAt,
      },
      status: 'CLOSED',
      score: Math.min(score, 40),
      notes: statusEval.reason,
      flagReason: statusEval.reason,
    };
  }

  if (statusEval.status === 'NEEDS_REVIEW' || statusEval.status === 'STATUS_UNKNOWN') {
    return {
      opportunity: {
        ...opportunity,
        verification_status: 'NEEDS_REVIEW',
        application_status: statusEval.status,
        verification_score: Math.min(score, 60),
        verification_notes: statusEval.reason,
        flag_reason: statusEval.reason,
        last_verified_at: statusEval.verifiedAt,
      },
      status: 'NEEDS_REVIEW',
      score: Math.min(score, 60),
      notes: statusEval.reason,
      flagReason: statusEval.reason,
    };
  }

  score += 15;
  notes.push(statusEval.reason);

  // E. INFORMATION COMPLETENESS (Max 15 pts)
  const isComplete =
    opportunity.title.length > 5 &&
    opportunity.description.length > 20 &&
    Boolean(opportunity.eligibility_text) &&
    opportunity.required_skills.length > 0;
  if (isComplete) {
    score += 15;
    notes.push('Full specification with title, description, skills, and eligibility.');
  } else {
    score += 8;
    notes.push('Partial metadata available.');
  }

  // F. INDIA ELIGIBILITY (Max 10 pts)
  if (opportunity.is_india_opportunity) {
    score += 10;
    notes.push(`India relevance verified: ${opportunity.india_eligibility_reason}`);
  } else {
    notes.push('Opportunity is international-only or irrelevant to students in India.');
  }

  // H. SUSPICIOUS CONTENT & ANTI-FRAUD FILTER
  const fullText = `${title} ${desc} ${elig} ${appUrl}`.toLowerCase();

  const hasPredatoryFee =
    fullText.includes('$150') ||
    fullText.includes('processing fee') ||
    fullText.includes('training fee') ||
    fullText.includes('upfront fee') ||
    fullText.includes('mandatory fee') ||
    fullText.includes('registration fee of') ||
    fullText.includes('registration fee') ||
    fullText.includes('deposit registration fee') ||
    fullText.includes('payment of ₹') ||
    fullText.includes('payment of inr') ||
    fullText.includes('application fee of ₹') ||
    fullText.includes('application fee of inr');

  const hasScamClaims =
    fullText.includes('guaranteed 100% placement') ||
    fullText.includes('100% job guarantee') ||
    fullText.includes('guaranteed multi-national placement') ||
    fullText.includes('guaranteed placement');

  const isDubiousDomain =
    appUrl.includes('tempmail') ||
    appUrl.includes('freemail') ||
    appUrl.includes('.biz/') ||
    appUrl.includes('fasttrack-guaranteed');

  if (hasPredatoryFee || hasScamClaims || isDubiousDomain) {
    const reason = hasPredatoryFee
      ? 'Predatory fee: Flagged for mandatory processing/application/training fee.'
      : hasScamClaims
      ? 'Suspicious claim: Flagged for fraudulent 100% job placement guarantee claim.'
      : 'Suspicious domain: Flagged for dubious domain structure.';

    return {
      opportunity: {
        ...opportunity,
        verification_status: 'REJECTED',
        verification_score: Math.min(30, score),
        verification_notes: reason,
        flag_reason: reason,
      },
      status: 'REJECTED',
      score: Math.min(30, score),
      notes: reason,
      flagReason: reason,
      rejectionReason: reason,
    };
  }

  // Non-India opportunities cannot be marked VERIFIED for Indian recommendation pool
  if (!opportunity.is_india_opportunity) {
    const reason = 'Excluded from student pool: International-only (not eligible for students in India).';
    return {
      opportunity: {
        ...opportunity,
        verification_status: 'REJECTED',
        verification_score: score,
        verification_notes: reason,
        flag_reason: reason,
      },
      status: 'REJECTED',
      score,
      notes: reason,
      flagReason: reason,
    };
  }

  // Final status threshold
  let finalStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED' | 'EXPIRED' | 'CLOSED' | 'NEEDS_REVIEW' = 'PENDING_REVIEW';
  let appStatus: 'OPEN' | 'EXPIRED' | 'CLOSED' | 'NEEDS_REVIEW' | 'STATUS_UNKNOWN' | 'LINK_UNAVAILABLE' = 'OPEN';

  if (score >= 80 && isOrgIdentifiable && isApprovedSource) {
    finalStatus = 'VERIFIED';
    appStatus = 'OPEN';
    notes.push('All trust criteria met. Admitted to verified database.');
  } else {
    finalStatus = 'PENDING_REVIEW';
    appStatus = 'NEEDS_REVIEW';
    notes.push('Awaiting manual registrar confirmation.');
  }

  const verifiedAt = getKolkataISOString();

  return {
    opportunity: {
      ...opportunity,
      verification_status: finalStatus,
      application_status: appStatus,
      verification_score: score,
      verification_notes: notes.join(' '),
      flag_reason: flagReason,
      organization_verified: isOrgIdentifiable,
      domain_verified: isAppUrlValid,
      application_link_verified: isAppUrlValid,
      deadline_verified: true,
      last_verified_at: verifiedAt,
    },
    status: finalStatus,
    score,
    notes: notes.join(' '),
    flagReason,
  };
}
