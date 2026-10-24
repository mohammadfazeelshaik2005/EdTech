import { NormalizedOpportunity, DuplicateDetectionResult } from '@/types/dataCollection';

/**
 * Normalizes a URL for comparison: removes protocol, www, trailing slashes, and query params
 */
export function normalizeUrlForComparison(rawUrl?: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '').toLowerCase();
    return `${host}${pathname}`;
  } catch {
    return rawUrl
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '')
      .split('?')[0];
  }
}

/**
 * Normalizes text for comparison: lowercases, removes punctuation, trims extra whitespace
 */
export function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Jaccard token similarity between two text strings (0.0 to 1.0)
 */
export function calculateTokenSimilarity(strA: string, strB: string): number {
  const normA = normalizeText(strA);
  const normB = normalizeText(strB);

  const tokensA = new Set(normA.split(' ').filter((t) => t.length > 2));
  const tokensB = new Set(normB.split(' ').filter((t) => t.length > 2));

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersectionCount = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  });

  const unionCount = new Set([...tokensA, ...tokensB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Duplicate Detection Stage: Checks an incoming opportunity against existing database records.
 *
 * Checks:
 * 1. Normalized application URL / official URL collision
 * 2. Exact Title + Organization match
 * 3. High Title similarity (>=80%) under same organization
 * 4. Cross-source syndication (same event cross-listed under secondary portal)
 */
export function checkOpportunityDuplicate(
  candidate: NormalizedOpportunity,
  existingDatabase: NormalizedOpportunity[]
): DuplicateDetectionResult {
  const candidateNormAppUrl = normalizeUrlForComparison(candidate.application_url);
  const candidateNormOffUrl = normalizeUrlForComparison(candidate.official_opportunity_url);
  const candidateNormTitle = normalizeText(candidate.title);
  const candidateNormOrg = normalizeText(candidate.organization);

  for (const existing of existingDatabase) {
    if (candidate.id === existing.id) continue;

    // Check 1: Normalized Application URL or Official URL Collision
    const existingNormAppUrl = normalizeUrlForComparison(existing.application_url);
    const existingNormOffUrl = normalizeUrlForComparison(existing.official_opportunity_url);

    if (
      candidateNormAppUrl &&
      existingNormAppUrl &&
      (candidateNormAppUrl === existingNormAppUrl || candidateNormAppUrl === existingNormOffUrl)
    ) {
      return {
        isDuplicate: true,
        existingId: existing.id,
        similarityScore: 1.0,
        matchReason: `Exact normalized application URL collision with existing opportunity [${existing.id}].`,
      };
    }

    if (
      candidateNormOffUrl &&
      existingNormOffUrl &&
      candidateNormOffUrl.length > 10 &&
      candidateNormOffUrl === existingNormOffUrl
    ) {
      return {
        isDuplicate: true,
        existingId: existing.id,
        similarityScore: 1.0,
        matchReason: `Official opportunity URL collision with existing opportunity [${existing.id}].`,
      };
    }

    // Check 2: Same or highly similar organization
    const existingNormOrg = normalizeText(existing.organization);
    const sameOrg =
      candidateNormOrg === existingNormOrg ||
      (candidateNormOrg.length > 4 && existingNormOrg.includes(candidateNormOrg)) ||
      (existingNormOrg.length > 4 && candidateNormOrg.includes(existingNormOrg));

    const existingNormTitle = normalizeText(existing.title);

    // Exact title match under same organization
    if (candidateNormTitle === existingNormTitle) {
      return {
        isDuplicate: true,
        existingId: existing.id,
        similarityScore: 1.0,
        matchReason: `Exact identical title under organization "${existing.organization}".`,
      };
    }

    // High fuzzy token similarity under same organization
    if (sameOrg) {
      const titleSim = calculateTokenSimilarity(candidate.title, existing.title);
      if (titleSim >= 0.80) {
        return {
          isDuplicate: true,
          existingId: existing.id,
          similarityScore: Math.round(titleSim * 100) / 100,
          matchReason: `High title similarity (${Math.round(titleSim * 100)}%) from same organization "${existing.organization}".`,
        };
      }
    }

    // Check 3: Very high overall title similarity across sources (>0.92)
    const crossTitleSim = calculateTokenSimilarity(candidate.title, existing.title);
    if (crossTitleSim >= 0.92) {
      return {
        isDuplicate: true,
        existingId: existing.id,
        similarityScore: Math.round(crossTitleSim * 100) / 100,
        matchReason: `Cross-source duplicate with title similarity ${Math.round(crossTitleSim * 100)}%.`,
      };
    }
  }

  return {
    isDuplicate: false,
    similarityScore: 0.0,
  };
}
