export type SourceType =
  | 'DIRECT_SCRAPING'
  | 'PUBLIC_FEED'
  | 'OFFICIAL_PORTAL'
  | 'OFFICIAL_API'
  | 'OFFICIAL_FEED'
  | 'PERMITTED_EXTRACTION'
  | 'MANUAL_UPLOAD';

export type SourceTrustLevel =
  | 'TIER_1_GOVERNMENT'
  | 'TIER_1_ACCREDITED'
  | 'TIER_2_VERIFIED_PARTNER'
  | 'TIER_3_COMMUNITY_PLATFORM'
  | 'TIER_3_COMMUNITY_FEED'
  | 'TIER_4_MANUAL_SUBMISSION';

export type OpportunityCategory =
  | 'Scholarships'
  | 'Internships'
  | 'Hackathons'
  | 'Research Programs'
  | 'Research Opportunities'
  | 'Competitions'
  | 'Certifications'
  | 'Courses / Learning Opportunities';

export type ScraperStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'BLOCKED' | 'ERROR' | 'ACTIVE';

export interface IngestionSourceConfig {
  id: string;
  name: string;
  source_type: SourceType;
  priority: number;
  endpoint_url: string;
  organization: string;
  trust_level: SourceTrustLevel;
  rate_limit_rpm: number;
  crawl_delay_ms: number;
  enabled: boolean;
  last_run_at: string;
  status: ScraperStatus;
  auth_type?: string;
  robots_status?: string;
  terms_of_service_url?: string;
  source_permissions?: string;
  notes?: string;
}

/**
 * Raw Opportunity Payload as extracted by a source-specific scraper
 */
export interface RawOpportunityPayload {
  source_id: string;
  source_name?: string;
  source_url?: string;
  source_type?: SourceType;
  source_priority?: number;
  title: string;
  org_name?: string;
  raw_description?: string;
  raw_deadline?: string;
  raw_start_date?: string;
  raw_end_date?: string;
  raw_eligibility?: string;
  raw_skills?: string | string[];
  raw_url?: string;
  raw_official_url?: string;
  raw_application_url?: string;
  raw_category?: string;
  raw_location?: string;
  raw_country?: string;
  raw_mode?: string;
  raw_stipend?: string;
  raw_education_level?: string;
  raw_eligible_branch?: string;
  raw_tags?: string[];
  raw_image?: string;
  fetched_at: string;
  metadata?: Record<string, unknown>;
}

export interface CleanedOpportunityPayload {
  source_id: string;
  source_name: string;
  source_url: string;
  source_type?: SourceType;
  source_priority?: number;
  clean_title: string;
  clean_organization: string;
  clean_description: string;
  clean_category: OpportunityCategory;
  clean_eligibility: string;
  clean_skills: string[];
  clean_deadline: string;
  clean_start_date?: string;
  clean_end_date?: string;
  clean_location: string;
  clean_country: string;
  clean_mode: 'Remote' | 'Hybrid' | 'In-Person';
  clean_application_url?: string;
  clean_official_url: string;
  clean_source_url?: string;
  clean_stipend?: string;
  clean_education_level?: string;
  clean_eligible_branch?: string;
  clean_tags: string[];
  clean_image?: string;
  fetched_at: string;
}

/**
 * Normalized Opportunity Schema containing all required fields:
 * - title, description, opportunity_type, organization
 * - source_name, source_url, application_url, official_opportunity_url
 * - location, country, eligibility_country, eligibility_text, is_india_opportunity
 * - deadline, start_date, end_date, required_skills, academic_requirements
 * - education_level, eligible_branch, stipend, mode, tags, image, extracted_at
 * - verification_status, verification_score, verification_notes
 */
export interface NormalizedOpportunity {
  id: string;
  title: string;
  description: string;
  opportunity_type: OpportunityCategory;
  category: OpportunityCategory;
  organization: string;
  source_name: string;
  source_url: string;
  source_type?: SourceType;
  application_url: string;
  official_opportunity_url: string;
  location: string;
  country: string;
  eligibility_country: string;
  eligibility_text: string;
  eligibility?: string;
  is_india_opportunity: boolean;
  india_eligibility_reason: string;
  deadline: string;
  start_date?: string;
  end_date?: string;
  required_skills: string[];
  academic_requirements?: string;
  education_level?: string;
  eligible_branch?: string;
  stipend?: string;
  mode: 'Remote' | 'Hybrid' | 'In-Person';
  tags: string[];
  image?: string;
  extracted_at: string;
  collected_at?: string;
  updated_at?: string;
  expires_at?: string;
  last_verified_at: string;
  application_status?: 'OPEN' | 'EXPIRED' | 'CLOSED' | 'NEEDS_REVIEW' | 'STATUS_UNKNOWN' | 'LINK_UNAVAILABLE';
  source_trust_level: SourceTrustLevel;
  verification_status: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED' | 'EXPIRED' | 'CLOSED' | 'NEEDS_REVIEW';
  verification_score: number;
  verification_notes?: string;
  flag_reason?: string;
  is_duplicate?: boolean;
  duplicate_of_id?: string;
  organization_verified?: boolean;
  domain_verified?: boolean;
  application_link_verified?: boolean;
  deadline_verified?: boolean;
  cross_source_verified?: boolean;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  existingId?: string;
  similarityScore: number;
  matchReason?: string;
}

export interface PipelineStageLog {
  stage: string;
  timestamp: string;
  status: 'INFO' | 'WARN' | 'SUCCESS' | 'BLOCKED' | 'ERROR';
  message: string;
}

export interface SourceExecutionStats {
  sourceId: string;
  sourceName: string;
  endpointUrl: string;
  lastRunAt: string;
  lastSuccessfulRefresh?: string;
  status: ScraperStatus;
  discoveredCount: number;
  verifiedCount: number;
  rejectedCount: number;
  expiredCount: number;
  closedCount?: number;
  brokenLinksCount?: number;
  needsReviewCount?: number;
  duplicateCount: number;
  errorCount: number;
  errorDetails?: string;
}

export interface PipelineExecutionReport {
  executionId: string;
  startedAt: string;
  completedAt: string;
  lastSuccessfulRefresh?: string;
  totalCollected: number;
  totalCleaned: number;
  totalNormalized: number;
  totalDuplicatesDetected: number;
  totalVerified: number;
  totalPendingReview: number;
  totalRejected: number;
  totalExpired: number;
  totalClosed?: number;
  totalNeedsReview?: number;
  totalBrokenLinks?: number;
  storedInDatabase: number;
  admittedToRecommendations: number;
  blockedFromRecommendations: number;
  sourceStats: Record<string, SourceExecutionStats>;
  stageLogs: PipelineStageLog[];
  opportunities: NormalizedOpportunity[];
}
