import { Opportunity } from '@/types';
import { NormalizedOpportunity } from '@/types/dataCollection';
import { mockOpportunities } from '@/data/mockData';
import {
  evaluateOpportunityStatus,
  getCurrentSystemTime,
  formatKolkataReadable,
} from '@/lib/deadlineUtils';

const STORAGE_KEY = 'pathsync_active_verified_opportunities_v4';

/**
 * Converts a NormalizedOpportunity into the canonical student-facing Opportunity interface
 */
export function normalizedToOpportunity(norm: NormalizedOpportunity): Opportunity {
  let mappedType: Opportunity['type'] = 'internship';
  if (norm.category === 'Scholarships') mappedType = 'scholarship';
  else if (norm.category === 'Hackathons') mappedType = 'hackathon';
  else if (norm.category === 'Competitions') mappedType = 'competition';
  else if (norm.category === 'Certifications') mappedType = 'certification';
  else if (norm.category === 'Research Programs') mappedType = 'residency';
  else if (norm.category === 'Research Opportunities') mappedType = 'fellowship';
  else if (norm.category === 'Courses / Learning Opportunities') mappedType = 'academic';

  // Evaluate status dynamically against current system clock in Asia/Kolkata
  const statusEval = evaluateOpportunityStatus({
    deadline: norm.deadline,
    applicationUrl: norm.application_url,
    officialOpportunityUrl: norm.official_opportunity_url,
    sourceStatus: norm.application_status === 'CLOSED' ? 'CLOSED' : undefined,
  });

  const verifiedDateFormatted = formatKolkataReadable(new Date(norm.last_verified_at || getCurrentSystemTime()));

  return {
    id: norm.id,
    title: norm.title,
    category: norm.category,
    organization: norm.organization,
    description: norm.description,
    location: norm.location,
    mode: norm.mode,
    duration: 'Active 2026 Cohort',
    compensation: norm.stipend,
    matchScore: norm.verification_score,
    deadline: norm.deadline,
    eligibility: norm.eligibility_text,
    requiredSkills: norm.required_skills,
    educationLevel: norm.education_level || 'Undergraduate',
    isVerified: norm.verification_status === 'VERIFIED' && statusEval.status === 'OPEN',
    type: mappedType,
    isSaved: false,
    verificationStatus:
      statusEval.status === 'EXPIRED'
        ? 'EXPIRED'
        : statusEval.status === 'CLOSED'
        ? 'CLOSED'
        : norm.verification_status,
    application_status: statusEval.status,
    verificationScore: norm.verification_score,
    source: norm.source_name,
    officialDomain: norm.official_opportunity_url
      ? new URL(norm.official_opportunity_url).hostname
      : 'accredited.gov.in',
    lastVerifiedDate: verifiedDateFormatted,
    last_verified_at: norm.last_verified_at || statusEval.verifiedAt,
    country: norm.country,
    eligibility_country: norm.eligibility_country,
    eligibility_text: norm.eligibility_text,
    is_india_opportunity: norm.is_india_opportunity,
    application_url: norm.application_url,
    source_url: norm.source_url,
    official_opportunity_url: norm.official_opportunity_url,
    stipend: norm.stipend,
    tags: norm.tags,
    image: norm.image,
    extracted_at: norm.extracted_at,
  };
}

/**
 * Audits a single Opportunity record against the dynamic system clock in Asia/Kolkata:
 * - Recomputes application_status (OPEN, EXPIRED, CLOSED, NEEDS_REVIEW, LINK_UNAVAILABLE)
 * - Sets isExpired and verificationStatus accordingly
 * - Stores last_verified_at
 */
export function auditOpportunityRecord(opp: Opportunity): Opportunity {
  const isOppClosed = opp.verificationStatus === 'CLOSED' || opp.application_status === 'CLOSED';
  const statusEval = evaluateOpportunityStatus({
    deadline: opp.deadline,
    applicationUrl: isOppClosed ? undefined : opp.application_url,
    officialOpportunityUrl: opp.official_url || opp.official_opportunity_url,
    sourceStatus: isOppClosed ? 'CLOSED' : opp.application_status,
  });

  const isExpired = statusEval.status === 'EXPIRED' || opp.isExpired === true;
  const isClosed = statusEval.status === 'CLOSED' || isOppClosed;
  const isNeedsReview = statusEval.status === 'NEEDS_REVIEW' || statusEval.status === 'STATUS_UNKNOWN';

  let updatedVerifStatus = opp.verificationStatus;
  if (isClosed) {
    updatedVerifStatus = 'CLOSED';
  } else if (isExpired) {
    updatedVerifStatus = 'EXPIRED';
  } else if (isNeedsReview && opp.verificationStatus === 'VERIFIED') {
    updatedVerifStatus = 'NEEDS_REVIEW';
  }

  return {
    ...opp,
    official_url: opp.official_url || opp.official_opportunity_url,
    application_status: isClosed ? 'CLOSED' : (statusEval.status || opp.application_status),
    verificationStatus: updatedVerifStatus,
    isExpired: isExpired || isClosed,
    isVerified: updatedVerifStatus === 'VERIFIED' && statusEval.status === 'OPEN' && !isClosed,
    application_url: isClosed ? undefined : opp.application_url,
    last_verified_at: opp.last_verified_at || statusEval.verifiedAt,
    lastVerifiedDate: opp.lastVerifiedDate || formatKolkataReadable(),
  };
}

/**
 * In-memory fallback and cache initialized from mock data
 */
let memoryOpportunities: Opportunity[] = mockOpportunities.map(auditOpportunityRecord);

/**
 * Loads stored opportunities from localStorage or fallback, auditing deadlines dynamically.
 */
function loadStore(): Opportunity[] {
  if (typeof window === 'undefined') {
    memoryOpportunities = memoryOpportunities.map(auditOpportunityRecord);
    return memoryOpportunities;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with mockOpportunities ensuring no duplicate IDs
        const mockMap = new Map(mockOpportunities.map((m) => [m.id, m]));
        const merged = parsed.map((item: Opportunity) => {
          const mock = mockMap.get(item.id);
          if (mock) {
            const isClosed = mock.verificationStatus === 'CLOSED' || mock.application_status === 'CLOSED';
            return {
              ...item,
              source_url: mock.source_url || item.source_url,
              official_url: mock.official_url || item.official_url || mock.official_opportunity_url,
              official_opportunity_url: mock.official_opportunity_url || item.official_opportunity_url,
              application_url: isClosed ? undefined : (mock.application_url !== undefined ? mock.application_url : item.application_url),
              verificationStatus: isClosed ? 'CLOSED' : (mock.verificationStatus || item.verificationStatus),
              application_status: isClosed ? 'CLOSED' : (mock.application_status || item.application_status),
              isExpired: isClosed ? true : (mock.isExpired !== undefined ? mock.isExpired : item.isExpired),
              deadline: mock.deadline || item.deadline,
              application_deadline: mock.application_deadline !== undefined ? mock.application_deadline : item.application_deadline,
              verification_source: mock.verification_source || item.verification_source,
              verification_notes: mock.verification_notes || item.verification_notes,
              link_health: mock.link_health || item.link_health,
              http_status_code: mock.http_status_code !== undefined ? mock.http_status_code : item.http_status_code,
              last_verified_at: mock.last_verified_at || item.last_verified_at,
              lastVerifiedDate: mock.lastVerifiedDate || item.lastVerifiedDate,
            };
          }
          return item;
        });

        const existingIds = new Set(merged.map((o: Opportunity) => o.id));
        for (const mock of mockOpportunities) {
          if (!existingIds.has(mock.id)) {
            merged.push(mock);
          }
        }

        // Dynamically audit every loaded record against the live system clock
        const audited = merged.map(auditOpportunityRecord);
        memoryOpportunities = audited;
        return audited;
      }
    }
  } catch (e) {
    console.error('Error loading opportunity store from localStorage:', e);
  }

  const auditedDefaults = mockOpportunities.map(auditOpportunityRecord);
  memoryOpportunities = auditedDefaults;
  return memoryOpportunities;
}

/**
 * Saves opportunities to storage
 */
function persistStore(opps: Opportunity[]): void {
  const audited = opps.map(auditOpportunityRecord);
  memoryOpportunities = audited;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(audited));
    } catch (e) {
      console.error('Error persisting opportunity store to localStorage:', e);
    }
  }
}

/**
 * Returns ONLY verified, India-eligible, CURRENTLY OPEN opportunities
 * for student discovery and personalized recommendation feeds.
 *
 * CRITICAL DIRECTIVE:
 * - Expired, closed, cancelled, unverified, and ambiguous opportunities
 *   MUST NOT appear in the default Currently Open Opportunities feed.
 * - Current date dynamically obtained from system clock in Asia/Kolkata timezone.
 */
export function getActiveVerifiedOpportunities(): Opportunity[] {
  const all = loadStore();

  return all.filter((opp) => {
    // 1. Must be strictly India-eligible
    if (opp.is_india_opportunity === false) return false;

    // 2. Must be VERIFIED
    if (opp.verificationStatus !== 'VERIFIED') return false;

    // 3. Must be actively OPEN for applications
    if (opp.application_status !== 'OPEN') return false;

    // 4. Must NOT be expired
    if (opp.isExpired) return false;

    return true;
  });
}

/**
 * Returns all opportunities for Admin management (includes OPEN, EXPIRED, CLOSED, NEEDS_REVIEW, REJECTED)
 */
export function getAllOpportunitiesForAdmin(): Opportunity[] {
  return loadStore();
}

/**
 * Gets a single opportunity by ID, auditing it against system clock
 */
export function getOpportunityById(id: string): Opportunity | undefined {
  const all = loadStore();
  const found = all.find((o) => o.id === id);
  return found ? auditOpportunityRecord(found) : undefined;
}

/**
 * Updates an existing opportunity record without duplicating it,
 * or inserts it if it is a new unique opportunity.
 */
export function updateOrInsertOpportunity(opportunity: Opportunity | NormalizedOpportunity): boolean {
  const current = loadStore();
  const oppToSave: Opportunity =
    'opportunity_type' in opportunity
      ? normalizedToOpportunity(opportunity as NormalizedOpportunity)
      : (opportunity as Opportunity);

  const audited = auditOpportunityRecord(oppToSave);
  const existingIdx = current.findIndex(
    (o) => o.id === audited.id || (o.title.toLowerCase().trim() === audited.title.toLowerCase().trim() && o.organization.toLowerCase().trim() === audited.organization.toLowerCase().trim())
  );

  let updatedList: Opportunity[];
  if (existingIdx >= 0) {
    // Update existing record in-place
    updatedList = [...current];
    updatedList[existingIdx] = {
      ...current[existingIdx],
      ...audited,
      id: current[existingIdx].id, // preserve original stable ID
    };
  } else {
    // Insert new
    updatedList = [audited, ...current];
  }

  persistStore(updatedList);
  return existingIdx >= 0;
}

/**
 * Atomically merges newly verified opportunities into the active dataset without duplicates.
 * Updates existing records in-place if already present.
 */
export function saveVerifiedOpportunities(newVerified: NormalizedOpportunity[]): number {
  const current = loadStore();
  const currentMap = new Map<string, Opportunity>();
  current.forEach((o) => currentMap.set(o.id, o));
  const titleMap = new Map<string, string>();
  current.forEach((o) => titleMap.set(o.title.toLowerCase().trim(), o.id));

  let newlyAddedCount = 0;
  let updatedCount = 0;

  for (const norm of newVerified) {
    // Only admit VERIFIED + India-eligible opportunities into student active pool
    if (norm.verification_status !== 'VERIFIED' || norm.is_india_opportunity !== true) {
      continue;
    }

    const converted = normalizedToOpportunity(norm);
    const existingById = currentMap.get(norm.id);
    const existingIdByTitle = titleMap.get(norm.title.toLowerCase().trim());
    const existing = existingById || (existingIdByTitle ? currentMap.get(existingIdByTitle) : null);

    if (existing) {
      // Update existing record in-place with refreshed information
      const merged: Opportunity = {
        ...existing,
        ...converted,
        id: existing.id, // Keep stable original ID
        isSaved: existing.isSaved, // Preserve student's saved state
      };
      currentMap.set(existing.id, merged);
      updatedCount++;
    } else {
      // Add new record
      currentMap.set(converted.id, converted);
      titleMap.set(converted.title.toLowerCase().trim(), converted.id);
      newlyAddedCount++;
    }
  }

  const updatedList = Array.from(currentMap.values());
  persistStore(updatedList);

  return newlyAddedCount;
}

/**
 * Resets opportunity store back to initial mock dataset, auditing deadlines
 */
export function resetOpportunityStore(): void {
  const audited = mockOpportunities.map(auditOpportunityRecord);
  persistStore(audited);
}
