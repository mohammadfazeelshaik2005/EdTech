import {
  RawOpportunityPayload,
  CleanedOpportunityPayload,
  NormalizedOpportunity,
  PipelineExecutionReport,
  PipelineStageLog,
  SourceExecutionStats,
} from '@/types/dataCollection';
import { INGESTION_SOURCES } from './sourceRegistry';
import { cleanOpportunityPayload } from './cleaner';
import { normalizeOpportunityPayload } from './normalizer';
import { checkOpportunityDuplicate } from './duplicateDetector';
import { verifyOpportunity } from './verifier';
import {
  saveVerifiedOpportunities,
  getAllOpportunitiesForAdmin,
  updateOrInsertOpportunity,
  auditOpportunityRecord,
} from './activeOpportunityStore';
import { runScrapersForAllSources, runScraperForSource, ScraperExecutionResult } from './scrapers';
import { getKolkataISOString } from '@/lib/deadlineUtils';
import { validateDestinationUrl } from './destinationValidator';

/**
 * Runs a single scraper with automatic retry on temporary failures (up to maxRetries with backoff).
 * Supports passing either a registered sourceId string or a custom scraper adapter.
 */
export async function runScraperWithRetry(
  sourceOrAdapter: string | { scrape: () => Promise<any>; sourceId?: string },
  maxRetries = 2,
  backoffMs = 300
) {
  let attempt = 0;
  let lastResult: any = null;

  while (attempt <= maxRetries) {
    try {
      const result =
        typeof sourceOrAdapter === 'string'
          ? await runScraperForSource(sourceOrAdapter)
          : await sourceOrAdapter.scrape();

      if (result.status !== 'ERROR' || attempt >= maxRetries) {
        return result;
      }
      lastResult = result;
    } catch (err: any) {
      if (attempt >= maxRetries) {
        throw err;
      }
    }
    attempt++;
    await new Promise((resolve) => setTimeout(resolve, attempt * backoffMs));
  }

  return lastResult;
}

/**
 * Executes the complete Automatic Opportunity Collection + Verification Pipeline:
 *
 * APPROVED SOURCES (NSP, UGC, AICTE, ISTI, ANRF, Unstop, NPTEL, SWAYAM)
 *       ↓
 * DIRECT PUBLIC WEB DATA COLLECTION (Source-Specific Scrapers)
 *       ↓
 * DATA NORMALIZATION & CLEANING
 *       ↓
 * INDIA ELIGIBILITY CHECK
 *       ↓
 * DUPLICATE CHECK
 *       ↓
 * OPPORTUNITY VALIDATION & VERIFICATION (Dynamic System Clock in Asia/Kolkata)
 *       ↓
 * ACTIVE VERIFIED OPPORTUNITY DATABASE
 *       ↓
 * PERSONALIZED RECOMMENDATION GATEKEEPER
 */
export async function executeDataCollectionPipeline(options: {
  sourceId?: string;
  isScheduled?: boolean;
} = {}): Promise<PipelineExecutionReport> {
  const startedAt = getKolkataISOString();
  const logs: PipelineStageLog[] = [];
  const sourceStats: Record<string, SourceExecutionStats> = {};

  const targetSources = options.sourceId
    ? INGESTION_SOURCES.filter((s) => s.id === options.sourceId)
    : INGESTION_SOURCES.filter((s) => s.enabled);

  logs.push({
    stage: '1. Approved Sources Initialized',
    timestamp: getKolkataISOString(),
    status: 'INFO',
    message: `Initialized ${targetSources.length} approved opportunity sources (${
      options.sourceId ? `Target Source: ${options.sourceId}` : 'All 9 Approved Sources'
    }).`,
  });

  // Stage 2: Direct Public Web Data Collection via Source-Specific Scrapers
  logs.push({
    stage: '2. Public Web Collection',
    timestamp: getKolkataISOString(),
    status: 'INFO',
    message: 'Executing source-specific extraction adapters. Rate limits and robots.txt respected.',
  });

  const rawPayloads: RawOpportunityPayload[] = [];

  if (options.sourceId) {
    const singleResult = await runScraperWithRetry(options.sourceId);
    rawPayloads.push(...singleResult.rawPayloads);

    singleResult.logs.forEach((log: string) => {
      logs.push({
        stage: '2. Public Web Collection',
        timestamp: getKolkataISOString(),
        status: singleResult.status === 'BLOCKED' ? 'BLOCKED' : singleResult.status === 'ERROR' ? 'ERROR' : 'INFO',
        message: log,
      });
    });

    sourceStats[options.sourceId] = {
      sourceId: options.sourceId,
      sourceName: singleResult.sourceName,
      endpointUrl: singleResult.sourceUrl,
      lastRunAt: getKolkataISOString(),
      lastSuccessfulRefresh: singleResult.status === 'SUCCESS' ? getKolkataISOString() : undefined,
      status: singleResult.status,
      discoveredCount: singleResult.discoveredCount,
      verifiedCount: 0,
      rejectedCount: 0,
      expiredCount: 0,
      closedCount: 0,
      brokenLinksCount: 0,
      needsReviewCount: 0,
      duplicateCount: 0,
      errorCount: singleResult.status === 'ERROR' ? 1 : 0,
      errorDetails: singleResult.errorDetails,
    };
  } else {
    const allResults: Record<string, ScraperExecutionResult> = await runScrapersForAllSources();

    for (const [sId, sResult] of Object.entries(allResults)) {
      rawPayloads.push(...sResult.rawPayloads);

      sResult.logs.forEach((log: string) => {
        logs.push({
          stage: '2. Public Web Collection',
          timestamp: getKolkataISOString(),
          status: sResult.status === 'BLOCKED' ? 'BLOCKED' : sResult.status === 'ERROR' ? 'ERROR' : 'INFO',
          message: `[${sResult.sourceName}] ${log}`,
        });
      });

      sourceStats[sId] = {
        sourceId: sId,
        sourceName: sResult.sourceName,
        endpointUrl: sResult.sourceUrl,
        lastRunAt: getKolkataISOString(),
        lastSuccessfulRefresh: sResult.status === 'SUCCESS' ? getKolkataISOString() : undefined,
        status: sResult.status,
        discoveredCount: sResult.discoveredCount,
        verifiedCount: 0,
        rejectedCount: 0,
        expiredCount: 0,
        closedCount: 0,
        brokenLinksCount: 0,
        needsReviewCount: 0,
        duplicateCount: 0,
        errorCount: sResult.status === 'ERROR' ? 1 : 0,
        errorDetails: sResult.errorDetails,
      };
    }
  }

  const totalCollected = rawPayloads.length;
  logs.push({
    stage: '2. Public Web Collection',
    timestamp: getKolkataISOString(),
    status: 'SUCCESS',
    message: `Extracted ${totalCollected} raw opportunities from approved source adapters.`,
  });

  // Stage 3: Data Cleaning
  const cleanedPayloads: CleanedOpportunityPayload[] = rawPayloads.map((raw) =>
    cleanOpportunityPayload(raw)
  );
  const totalCleaned = cleanedPayloads.length;

  logs.push({
    stage: '3. Data Cleaning',
    timestamp: getKolkataISOString(),
    status: 'SUCCESS',
    message: `Sanitized ${totalCleaned} payloads: stripped HTML tags, sanitized tracking parameters, and normalized skill sets.`,
  });

  // Stage 4: Normalization (Transforms to canonical schema with dynamic Asia/Kolkata timestamps)
  const normalizedList: NormalizedOpportunity[] = cleanedPayloads.map((clean, idx) =>
    normalizeOpportunityPayload(clean, `opp-norm-${idx + 1}-${Date.now().toString(36)}`)
  );
  const totalNormalized = normalizedList.length;

  logs.push({
    stage: '4. Normalization',
    timestamp: getKolkataISOString(),
    status: 'SUCCESS',
    message: `Normalized ${totalNormalized} opportunities into canonical PathSync AI structure with separate URL and deadline fields.`,
  });

  // Stage 5: India Eligibility Check
  let indiaEligibleCount = 0;
  let internationalOnlyCount = 0;

  normalizedList.forEach((opp) => {
    if (opp.is_india_opportunity) {
      indiaEligibleCount++;
    } else {
      internationalOnlyCount++;
      logs.push({
        stage: '5. India Eligibility Check',
        timestamp: getKolkataISOString(),
        status: 'WARN',
        message: `Flagged non-India opportunity "${opp.title}": ${opp.india_eligibility_reason}`,
      });
    }
  });

  logs.push({
    stage: '5. India Eligibility Check',
    timestamp: getKolkataISOString(),
    status: 'SUCCESS',
    message: `India eligibility evaluated: ${indiaEligibleCount} India-eligible, ${internationalOnlyCount} international-only.`,
  });

  // Stage 6: Duplicate Detection
  const acceptedDeduped: NormalizedOpportunity[] = [];
  let totalDuplicatesDetected = 0;

  normalizedList.forEach((candidate) => {
    const dupResult = checkOpportunityDuplicate(candidate, acceptedDeduped);
    if (dupResult.isDuplicate) {
      totalDuplicatesDetected++;
      candidate.is_duplicate = true;
      candidate.duplicate_of_id = dupResult.existingId;
      candidate.verification_status = 'REJECTED';
      candidate.verification_notes = `Dropped duplicate: ${dupResult.matchReason}`;

      // Update source stats
      const matchKey = Object.keys(sourceStats).find(
        (k) => sourceStats[k].sourceName === candidate.source_name
      );
      if (matchKey) sourceStats[matchKey].duplicateCount++;

      logs.push({
        stage: '6. Duplicate Detection',
        timestamp: getKolkataISOString(),
        status: 'WARN',
        message: `Dropped duplicate "${candidate.title}": ${dupResult.matchReason}`,
      });
    } else {
      acceptedDeduped.push(candidate);
    }
  });

  logs.push({
    stage: '6. Duplicate Detection',
    timestamp: getKolkataISOString(),
    status: 'SUCCESS',
    message: `Deduplication complete: ${acceptedDeduped.length} unique opportunities retained (${totalDuplicatesDetected} duplicates dropped).`,
  });

  // Stage 7: Opportunity Validation & Verification against dynamic Asia/Kolkata clock
  const verifiedOpportunities: NormalizedOpportunity[] = acceptedDeduped.map((opp) => {
    const evalResult = verifyOpportunity(opp);

    // Update per-source counts
    const srcKey = Object.keys(sourceStats).find(
      (k) => sourceStats[k].sourceName === opp.source_name || sourceStats[k].sourceId === opp.source_url
    );
    if (srcKey) {
      if (evalResult.status === 'VERIFIED') sourceStats[srcKey].verifiedCount++;
      else if (evalResult.status === 'REJECTED') sourceStats[srcKey].rejectedCount++;
      else if (evalResult.status === 'EXPIRED') sourceStats[srcKey].expiredCount++;
      else if (evalResult.status === 'CLOSED') {
        sourceStats[srcKey].closedCount = (sourceStats[srcKey].closedCount || 0) + 1;
      } else if (evalResult.status === 'NEEDS_REVIEW') {
        sourceStats[srcKey].needsReviewCount = (sourceStats[srcKey].needsReviewCount || 0) + 1;
      }
    }

    return evalResult.opportunity;
  });

  const totalVerified = verifiedOpportunities.filter((o) => o.verification_status === 'VERIFIED').length;
  const totalPendingReview = verifiedOpportunities.filter(
    (o) => o.verification_status === 'PENDING_REVIEW'
  ).length;
  const totalRejected = verifiedOpportunities.filter((o) => o.verification_status === 'REJECTED').length;
  const totalExpired = verifiedOpportunities.filter((o) => o.verification_status === 'EXPIRED').length;
  const totalClosed = verifiedOpportunities.filter((o) => o.verification_status === 'CLOSED').length;
  const totalNeedsReview = verifiedOpportunities.filter((o) => o.verification_status === 'NEEDS_REVIEW').length;
  const totalBrokenLinks = verifiedOpportunities.filter((o) => o.application_status === 'LINK_UNAVAILABLE').length;

  logs.push({
    stage: '7. Trust & Verification',
    timestamp: getKolkataISOString(),
    status: 'SUCCESS',
    message: `Trust audit complete (Asia/Kolkata): ${totalVerified} VERIFIED, ${totalExpired} EXPIRED, ${totalClosed} CLOSED, ${totalNeedsReview} NEEDS_REVIEW, ${totalRejected} REJECTED.`,
  });

  // Stage 8: Store Verified Opportunities into Active Database
  // CRITICAL RULE: Unverified/rejected/expired opportunities NEVER enter active student-facing database
  const newlyAdmittedCount = saveVerifiedOpportunities(
    verifiedOpportunities.filter((o) => o.verification_status === 'VERIFIED')
  );

  logs.push({
    stage: '8. Active Opportunity Database',
    timestamp: getKolkataISOString(),
    status: 'SUCCESS',
    message: `Updated Active Database: admitted verified India-eligible opportunities into the store.`,
  });

  // Stage 9: Personalized Recommendation Gatekeeper
  const admittedToRecommendations = verifiedOpportunities.filter(
    (o) => o.verification_status === 'VERIFIED' && o.is_india_opportunity === true && o.application_status === 'OPEN'
  ).length;

  const blockedFromRecommendations = verifiedOpportunities.filter(
    (o) => o.verification_status !== 'VERIFIED' || o.is_india_opportunity !== true || o.application_status !== 'OPEN'
  ).length;

  logs.push({
    stage: '9. Recommendation Gatekeeper',
    timestamp: getKolkataISOString(),
    status: 'BLOCKED',
    message: `Enforced Strict Rule: Blocked ${blockedFromRecommendations} non-verified, closed, expired, or international-only opportunities from student feeds.`,
  });

  logs.push({
    stage: '10. Personalized Feeds Ready',
    timestamp: getKolkataISOString(),
    status: 'SUCCESS',
    message: `Admitted ${admittedToRecommendations} verified open opportunities to the PathSync AI recommendation engine.`,
  });

  const completedAt = getKolkataISOString();

  return {
    executionId: `exec-${Date.now().toString(36)}`,
    startedAt,
    completedAt,
    lastSuccessfulRefresh: completedAt,
    totalCollected,
    totalCleaned,
    totalNormalized,
    totalDuplicatesDetected,
    totalVerified,
    totalPendingReview,
    totalRejected,
    totalExpired,
    totalClosed,
    totalNeedsReview,
    totalBrokenLinks,
    storedInDatabase: newlyAdmittedCount,
    admittedToRecommendations,
    blockedFromRecommendations,
    sourceStats,
    stageLogs: logs,
    opportunities: verifiedOpportunities,
  };
}

/**
 * Revalidates all application and official links for existing opportunities in the database.
 * If a link fails or destination is unavailable, updates status to LINK_UNAVAILABLE.
 */
export async function revalidateAllApplicationLinks(): Promise<{
  checked: number;
  valid: number;
  broken: number;
  updated: number;
  details: { id: string; title: string; url: string; status: string; reason?: string }[];
}> {
  const all = getAllOpportunitiesForAdmin();
  let checked = 0;
  let valid = 0;
  let broken = 0;
  let updated = 0;
  const details: { id: string; title: string; url: string; status: string; reason?: string }[] = [];

  for (const opp of all) {
    checked++;
    const targetUrl = opp.application_url || opp.official_opportunity_url;

    if (!targetUrl || targetUrl.trim().length === 0) {
      broken++;
      opp.application_status = 'LINK_UNAVAILABLE';
      updateOrInsertOpportunity(opp);
      updated++;
      details.push({
        id: opp.id,
        title: opp.title,
        url: 'None',
        status: 'LINK_UNAVAILABLE',
        reason: 'No destination URL configured.',
      });
      continue;
    }

    // Perform live destination validation
    const valResult = await validateDestinationUrl(targetUrl, [opp.title, opp.organization]);

    if (!valResult.isValid) {
      broken++;
      // If direct application_url was broken (e.g. 404), remove it so students aren't redirected to dead link
      if (opp.application_url && opp.application_url === targetUrl) {
        opp.application_url = undefined;
      }
      opp.application_status = 'LINK_UNAVAILABLE';
      if (opp.verificationStatus === 'VERIFIED') {
        opp.verificationStatus = 'NEEDS_REVIEW';
      }
      updateOrInsertOpportunity(opp);
      updated++;
      details.push({
        id: opp.id,
        title: opp.title,
        url: targetUrl,
        status: 'BROKEN',
        reason: valResult.validationNotes,
      });
    } else if (valResult.isClosedOrEnded) {
      broken++;
      opp.application_status = 'CLOSED';
      opp.verificationStatus = 'CLOSED';
      updateOrInsertOpportunity(opp);
      updated++;
      details.push({
        id: opp.id,
        title: opp.title,
        url: targetUrl,
        status: 'CLOSED',
        reason: valResult.closureReason || 'Page indicates applications have closed.',
      });
    } else {
      valid++;
      details.push({
        id: opp.id,
        title: opp.title,
        url: targetUrl,
        status: 'VALID',
        reason: valResult.validationNotes,
      });
    }
  }

  return { checked, valid, broken, updated, details };
}

/**
 * Audits all existing records in storage dynamically against current system clock in Asia/Kolkata.
 */
export function auditAllStoredOpportunities(): {
  checked: number;
  open: number;
  expired: number;
  closed: number;
  needsReview: number;
  linkUnavailable: number;
} {
  const all = getAllOpportunitiesForAdmin();
  let open = 0;
  let expired = 0;
  let closed = 0;
  let needsReview = 0;
  let linkUnavailable = 0;

  for (const opp of all) {
    const audited = auditOpportunityRecord(opp);
    updateOrInsertOpportunity(audited);

    if (audited.application_status === 'OPEN') open++;
    else if (audited.application_status === 'EXPIRED') expired++;
    else if (audited.application_status === 'CLOSED') closed++;
    else if (audited.application_status === 'NEEDS_REVIEW' || audited.application_status === 'STATUS_UNKNOWN') {
      needsReview++;
    } else if (audited.application_status === 'LINK_UNAVAILABLE') {
      linkUnavailable++;
    }
  }

  return {
    checked: all.length,
    open,
    expired,
    closed,
    needsReview,
    linkUnavailable,
  };
}
