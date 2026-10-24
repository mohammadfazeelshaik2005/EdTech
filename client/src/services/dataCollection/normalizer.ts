import {
  CleanedOpportunityPayload,
  NormalizedOpportunity,
  SourceTrustLevel,
} from '@/types/dataCollection';
import { checkIndiaEligibility } from './indiaChecker';

/**
 * Maps source type / priority to baseline trust tier
 */
export function getTrustLevelForSource(sourceId?: string, priority?: number): SourceTrustLevel {
  const sId = (sourceId || '').toLowerCase();
  if (
    sId.includes('nsp') ||
    sId.includes('ugc') ||
    sId.includes('aicte') ||
    sId.includes('isti') ||
    sId.includes('anrf') ||
    sId.includes('swayam')
  ) {
    return 'TIER_1_GOVERNMENT';
  }
  if (sId.includes('nptel') || priority === 1) {
    return 'TIER_1_ACCREDITED';
  }
  if (sId.includes('unstop') || priority === 2) {
    return 'TIER_2_VERIFIED_PARTNER';
  }
  if (sId.includes('devpost') || priority === 3) {
    return 'TIER_3_COMMUNITY_PLATFORM';
  }
  return 'TIER_4_MANUAL_SUBMISSION';
}

/**
 * Normalization Stage: Transforms CleanedOpportunityPayload into NormalizedOpportunity
 * satisfying the canonical schema with all 24 required fields.
 */
export function normalizeOpportunityPayload(
  cleaned: CleanedOpportunityPayload,
  idOverride?: string
): NormalizedOpportunity {
  const id =
    idOverride ||
    `opp-${cleaned.source_id.replace('src-', '')}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .substring(2, 6)}`;
  const now = new Date().toISOString();

  // Evaluate India Eligibility
  const indiaAssessment = checkIndiaEligibility({
    title: cleaned.clean_title,
    organization: cleaned.clean_organization,
    description: cleaned.clean_description,
    eligibility_text: cleaned.clean_eligibility,
    location: cleaned.clean_location,
    country: cleaned.clean_country,
    mode: cleaned.clean_mode,
  });

  const sourceTrustLevel = getTrustLevelForSource(cleaned.source_id, cleaned.source_priority);

  // Initial trust score baseline from source trust level
  const baselineTrustScore =
    sourceTrustLevel === 'TIER_1_GOVERNMENT'
      ? 96
      : sourceTrustLevel === 'TIER_1_ACCREDITED'
      ? 94
      : sourceTrustLevel === 'TIER_2_VERIFIED_PARTNER'
      ? 88
      : 75;

  return {
    id,
    title: cleaned.clean_title,
    description: cleaned.clean_description,
    opportunity_type: cleaned.clean_category,
    category: cleaned.clean_category,
    organization: cleaned.clean_organization,
    source_name: cleaned.source_name,
    source_url: cleaned.source_url,
    source_type: cleaned.source_type || 'DIRECT_SCRAPING',
    application_url: cleaned.clean_application_url || '',
    official_opportunity_url: cleaned.clean_official_url,
    location: cleaned.clean_location,
    country: cleaned.clean_country,
    eligibility_country: indiaAssessment.isIndiaOpportunity ? 'India' : 'International',
    eligibility_text: cleaned.clean_eligibility,
    eligibility: cleaned.clean_eligibility,
    is_india_opportunity: indiaAssessment.isIndiaOpportunity,
    india_eligibility_reason: indiaAssessment.reason,
    deadline: cleaned.clean_deadline,
    start_date: cleaned.clean_start_date,
    end_date: cleaned.clean_end_date,
    required_skills: cleaned.clean_skills,
    academic_requirements: cleaned.clean_education_level,
    education_level: cleaned.clean_education_level || 'Undergraduate',
    eligible_branch: cleaned.clean_eligible_branch,
    stipend: cleaned.clean_stipend,
    mode: cleaned.clean_mode,
    tags: cleaned.clean_tags,
    image: cleaned.clean_image,
    extracted_at: cleaned.fetched_at || now,
    collected_at: cleaned.fetched_at || now,
    updated_at: now,
    last_verified_at: now,
    source_trust_level: sourceTrustLevel,
    verification_status: 'PENDING_REVIEW', // To be evaluated by verification stage
    verification_score: baselineTrustScore,
  };
}
