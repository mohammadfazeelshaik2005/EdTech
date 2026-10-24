export interface IndiaEligibilityAssessment {
  isIndiaOpportunity: boolean;
  reason: string;
}

/**
 * Keywords indicating strict exclusion / foreign-only restriction
 */
const FOREIGN_RESTRICTION_PATTERNS = [
  /\bu\.?s\.?\s+citizens?\s+only\b/i,
  /\bu\.?s\.?\s+permanent\s+residents?\s+only\b/i,
  /\bamerican\s+citizens?\s+only\b/i,
  /\bcanadian\s+citizens?\s+only\b/i,
  /\buk\s+citizens?\s+only\b/i,
  /\beu\s+citizens?\s+only\b/i,
  /\beuropean\s+union\s+residents?\b/i,
  /\b(?:eu|european\s+union)\s+(?:passport\s+holders?|residents?|citizens?)\b/i,
  /\brestricted\s+to\s+(?:european\s+union|eu|foreign|us|uk|canadian)\b/i,
  /\bgreen\s+card\s+holders?\s+only\b/i,
  /\bmust\s+reside\s+in\s+the\s+united\s+states\b/i,
  /\bmust\s+be\s+located\s+in\s+(?:the\s+)?(?:us|usa|uk|germany|canada|australia|singapore)\b/i,
  /\bonly\s+open\s+to\s+domestic\s+(?:us|uk|australian)\s+students\b/i,
  /\bforeign\s+students\s+only\b/i,
  /\bnot\s+eligible\s+for\s+international\s+students\b/i,
  /\bineligible\s+for\s+indian\s+applicants\b/i,
];

/**
 * Indicators of verified India relevance
 */
const INDIA_AFFINITY_PATTERNS = [
  /\bindia\b/i,
  /\bindian\b/i,
  /\bbharat\b/i,
  /\bbengaluru|bangalore\b/i,
  /\bmumbai\b/i,
  /\bdelhi|new\s+delhi\b/i,
  /\bhyderabad\b/i,
  /\bpune\b/i,
  /\bchennai\b/i,
  /\bkolkata\b/i,
  /\bahmedabad\b/i,
  /\bcoimbatore|sathyamangalam\b/i,
  /\biit\s+(?:bombay|delhi|madras|kharagpur|kanpur|roorkee|guwahati|patna|hyderabad)\b/i,
  /\biit[sb]?\b/i,
  /\biisc\b/i,
  /\bnit[sb]?\b/i,
  /\biiser\b/i,
  /\baicte\b/i,
  /\bugc\b/i,
  /\bdst\b/i,
  /\bdbt\b/i,
  /\banrf\b/i,
  /\bserb\b/i,
  /\bnptel\b/i,
  /\bswayam\b/i,
  /\bpan-?india\b/i,
  /\b(?:b\.?tech|m\.?tech|b\.?e\.|bca|mca)\b/i,
  /\bgovt\.?\s+of\s+india\b/i,
  /\bministry\s+of\s+education\b/i,
  /\bdepartment\s+of\s+science\b/i,
  /\bnational\s+scholarship\s+portal\b/i,
];

/**
 * Evaluates whether an opportunity genuinely qualifies as an India opportunity.
 *
 * CRITICAL RULE: DO NOT determine eligibility merely because the SOURCE is an Indian website.
 * Evaluates the actual opportunity location, eligibility text, title, and organization.
 */
export function checkIndiaEligibility(opportunity: {
  title?: string;
  organization?: string;
  description?: string;
  eligibility_text?: string;
  eligibility?: string;
  location?: string;
  country?: string;
  mode?: string;
}): IndiaEligibilityAssessment {
  const title = (opportunity.title || '').toLowerCase();
  const org = (opportunity.organization || '').toLowerCase();
  const desc = (opportunity.description || '').toLowerCase();
  const elig = `${opportunity.eligibility_text || ''} ${opportunity.eligibility || ''}`.toLowerCase();
  const loc = (opportunity.location || '').toLowerCase();
  const country = (opportunity.country || '').toLowerCase();
  const mode = (opportunity.mode || '').toLowerCase();

  const combinedFullText = `${title} ${org} ${desc} ${elig} ${loc} ${country}`.toLowerCase();

  // 1. REJECT: Hard foreign restrictions take immediate precedence
  for (const pattern of FOREIGN_RESTRICTION_PATTERNS) {
    if (pattern.test(combinedFullText)) {
      return {
        isIndiaOpportunity: false,
        reason: 'Restricted to foreign jurisdictions or explicitly excludes Indian applicants.',
      };
    }
  }

  // 2. REJECT: Physically located outside India without Indian applicant eligibility or remote option
  const isPhysicalForeign =
    ((country && country !== 'india' && country !== 'global' && country !== 'remote') ||
      loc.includes('united states') ||
      loc.includes('san francisco') ||
      loc.includes('oak ridge') ||
      loc.includes('stanford, ca') ||
      loc.includes('berkeley, ca') ||
      loc.includes('london, uk') ||
      loc.includes('germany') ||
      loc.includes('munich') ||
      loc.includes('toronto, canada')) &&
    !loc.includes('india') &&
    mode !== 'remote';

  if (isPhysicalForeign && !elig.includes('open to international') && !elig.includes('all university students') && !elig.includes('open to indian')) {
    return {
      isIndiaOpportunity: false,
      reason: 'Physically hosted outside India without explicit remote participation or Indian eligibility.',
    };
  }

  // 3. ACCEPT: Explicitly available in India / Indian location
  if (country === 'india' || loc.includes('india') || loc.includes('pan-india')) {
    return {
      isIndiaOpportunity: true,
      reason: 'Specifically located and hosted within India.',
    };
  }

  // 4. ACCEPT: Provided by recognized Indian institution / government agency / corporate
  const isIndianOrg =
    org.includes('iit') ||
    org.includes('iisc') ||
    org.includes('nit') ||
    org.includes('aicte') ||
    org.includes('ugc') ||
    org.includes('anrf') ||
    org.includes('serb') ||
    org.includes('dst') ||
    org.includes('dbt') ||
    org.includes('tata') ||
    org.includes('infosys') ||
    org.includes('flipkart') ||
    org.includes('bannari amman') ||
    org.includes('ministry') ||
    org.includes('swayam') ||
    org.includes('nptel');

  if (isIndianOrg) {
    return {
      isIndiaOpportunity: true,
      reason: `Sponsored by recognized Indian institution or organization: ${opportunity.organization}.`,
    };
  }

  // 5. ACCEPT: Explicitly open to Indian students / applicants
  if (
    elig.includes('indian students') ||
    elig.includes('indian citizens') ||
    elig.includes('colleges in india') ||
    elig.includes('universities in india') ||
    elig.includes('indian applicants')
  ) {
    return {
      isIndiaOpportunity: true,
      reason: 'Explicitly open and verified for Indian collegiate applicants.',
    };
  }

  // 6. ACCEPT: Explicitly remote/online and globally accessible to collegiate students
  if (
    mode === 'remote' &&
    (elig.includes('all university students') ||
      elig.includes('open to all') ||
      elig.includes('global') ||
      elig.includes('enrolled students'))
  ) {
    return {
      isIndiaOpportunity: true,
      reason: 'Explicitly remote/online opportunity open to applicants in India.',
    };
  }

  // 7. General affinity test
  for (const pattern of INDIA_AFFINITY_PATTERNS) {
    if (pattern.test(combinedFullText)) {
      return {
        isIndiaOpportunity: true,
        reason: 'Matches verified Indian collegiate educational ecosystem criteria.',
      };
    }
  }

  // Default to false if cannot be confirmed
  return {
    isIndiaOpportunity: false,
    reason: 'Cannot verify relevance or eligibility for students in India.',
  };
}

export const evaluateIndiaEligibility = checkIndiaEligibility;

