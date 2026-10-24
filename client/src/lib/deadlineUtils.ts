/**
 * PathSync AI — Dynamic Deadline & Status Verification Utilities
 * 
 * Strict compliance with Indian Opportunity standards:
 * - Current date dynamically obtained from the system clock
 * - Strict evaluation in Asia/Kolkata timezone (IST, UTC+5:30)
 * - Zero hardcoded demo dates
 * - Rigorous classification: OPEN, EXPIRED, CLOSED, NEEDS_REVIEW, STATUS_UNKNOWN, LINK_UNAVAILABLE
 */

export const KOLKATA_TIMEZONE = 'Asia/Kolkata';

export type OpportunityApplicationStatus =
  | 'OPEN'
  | 'EXPIRED'
  | 'CLOSED'
  | 'UPCOMING'
  | 'UNVERIFIED'
  | 'LINK_BROKEN'
  | 'NEEDS_REVIEW'
  | 'STATUS_UNKNOWN'
  | 'LINK_UNAVAILABLE';

export interface DeadlineParseResult {
  parsedDate: Date | null;
  rawString: string;
  isRolling: boolean;
  isAmbiguous: boolean;
  isExplicitlyClosed: boolean;
  isExplicitlyExpired: boolean;
  formattedKolkataDate?: string;
}

export interface StatusEvaluationResult {
  status: OpportunityApplicationStatus;
  reason: string;
  daysRemaining: number | null;
  isCurrentlyOpen: boolean;
  verifiedAt: string;
}

/**
 * Returns current Date object from the dynamic system clock.
 */
export function getCurrentSystemTime(): Date {
  return new Date();
}

/**
 * Returns current date and time formatted in Asia/Kolkata timezone.
 * e.g., "2026-10-19T13:45:00+05:30" or human-readable format.
 */
export function getKolkataISOString(date: Date = getCurrentSystemTime()): string {
  // Format to Asia/Kolkata components
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KOLKATA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`;
}

/**
 * Returns current date in Asia/Kolkata formatted as readable string (e.g. "Oct 19, 2026").
 */
export function formatKolkataReadable(date: Date = getCurrentSystemTime()): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: KOLKATA_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Resolves a date string into an exact epoch timestamp relative to Asia/Kolkata.
 */
export function parseOpportunityDeadline(deadlineStr?: string | null): DeadlineParseResult {
  if (!deadlineStr || typeof deadlineStr !== 'string' || deadlineStr.trim().length === 0) {
    return {
      parsedDate: null,
      rawString: '',
      isRolling: false,
      isAmbiguous: true,
      isExplicitlyClosed: false,
      isExplicitlyExpired: false,
    };
  }

  const trimmed = deadlineStr.trim();
  const lower = trimmed.toLowerCase();

  // Check explicit closed keywords
  const isExplicitlyClosed =
    lower.includes('closed') ||
    lower.includes('ended') ||
    lower.includes('finished') ||
    lower.includes('withdrawn') ||
    lower.includes('cancelled') ||
    lower.includes('completed') ||
    lower.includes('past deadline');

  const isExplicitlyExpired =
    lower.includes('expired') || lower.includes('archive') || lower.includes('passed');

  // Check rolling/ongoing keywords
  const isRolling =
    lower.includes('rolling') ||
    lower.includes('ongoing') ||
    lower.includes('open year round') ||
    lower.includes('round the year');

  // Check ambiguous / missing keywords
  const isAmbiguous =
    lower === 'tbd' ||
    lower === 'unknown' ||
    lower === 'n/a' ||
    lower === 'soon' ||
    lower === 'to be announced' ||
    lower === 'announced soon' ||
    lower === 'check website';

  if (isAmbiguous) {
    return {
      parsedDate: null,
      rawString: trimmed,
      isRolling: false,
      isAmbiguous: true,
      isExplicitlyClosed: false,
      isExplicitlyExpired: false,
    };
  }

  if (isRolling) {
    return {
      parsedDate: null,
      rawString: trimmed,
      isRolling: true,
      isAmbiguous: false,
      isExplicitlyClosed: false,
      isExplicitlyExpired: false,
    };
  }

  // Attempt standard ISO or natural language parsing
  // Clean ordinal suffixes like 1st, 2nd, 3rd, 4th -> 1, 2, 3, 4
  const cleanedStr = trimmed.replace(/\b(\d+)(st|nd|rd|th)\b/gi, '$1');

  // Try direct Date.parse
  let timestamp = Date.parse(cleanedStr);

  // If timestamp failed, try parsing Indian DD/MM/YYYY or DD-MM-YYYY format
  if (isNaN(timestamp)) {
    const ddmmyyyyMatch = cleanedStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyyMatch) {
      const [, d, m, y] = ddmmyyyyMatch;
      // In IST, set end of day 23:59:59
      const isoCandidate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T23:59:59+05:30`;
      timestamp = Date.parse(isoCandidate);
    }
  }

  let parsedDate: Date | null = null;
  if (!isNaN(timestamp)) {
    parsedDate = new Date(timestamp);
  } else {
    // If we could not reliably parse the date, mark ambiguous
    return {
      parsedDate: null,
      rawString: trimmed,
      isRolling: false,
      isAmbiguous: true,
      isExplicitlyClosed,
      isExplicitlyExpired,
    };
  }

  return {
    parsedDate,
    rawString: trimmed,
    isRolling: false,
    isAmbiguous: false,
    isExplicitlyClosed,
    isExplicitlyExpired,
    formattedKolkataDate: formatKolkataReadable(parsedDate),
  };
}

/**
 * Evaluates the definitive Application Status based on:
 * 1. Parsed deadline vs current dynamic system clock in Asia/Kolkata
 * 2. Explicit closure / cancellation indicators
 * 3. Link validity and accessibility
 *
 * Rules:
 * - If deadline passed -> EXPIRED
 * - If source confirms closed -> CLOSED (even if deadline appears in future)
 * - If cancelled or withdrawn -> CLOSED
 * - If deadline missing or ambiguous -> NEEDS_REVIEW / STATUS_UNKNOWN
 * - If future deadline but application page unavailable -> LINK_UNAVAILABLE / NEEDS_REVIEW
 * - Only mark OPEN when verified future deadline AND verified active application link
 */
export function evaluateOpportunityStatus(params: {
  deadline?: string | null;
  sourceStatus?: string | null;
  applicationUrl?: string | null;
  officialOpportunityUrl?: string | null;
  isLinkValid?: boolean;
}): StatusEvaluationResult {
  const verifiedAt = getKolkataISOString();
  const { deadline, sourceStatus, applicationUrl, officialOpportunityUrl, isLinkValid } = params;

  // 1. Check source-specific explicit status (e.g. Unstop reg_status = 'FINISHED')
  if (sourceStatus) {
    const sLower = sourceStatus.toLowerCase();
    if (
      sLower.includes('finished') ||
      sLower.includes('closed') ||
      sLower.includes('ended') ||
      sLower.includes('inactive')
    ) {
      return {
        status: 'CLOSED',
        reason: `Source confirmed applications are closed (${sourceStatus}).`,
        daysRemaining: 0,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }
    if (sLower.includes('cancelled') || sLower.includes('withdrawn')) {
      return {
        status: 'CLOSED',
        reason: `Opportunity was cancelled or withdrawn by host institution.`,
        daysRemaining: 0,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }
    if (sLower.includes('upcoming')) {
      return {
        status: 'UPCOMING',
        reason: `Applications have not opened yet.`,
        daysRemaining: null,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }
    if (sLower.includes('broken')) {
      return {
        status: 'LINK_BROKEN',
        reason: `Official application URL is inaccessible or invalid.`,
        daysRemaining: null,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }
    if (sLower.includes('unverified')) {
      return {
        status: 'UNVERIFIED',
        reason: `Application status cannot be verified from reliable official evidence.`,
        daysRemaining: null,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }
  }

  // 2. Parse deadline
  const parseResult = parseOpportunityDeadline(deadline);

  if (parseResult.isExplicitlyClosed) {
    return {
      status: 'CLOSED',
      reason: 'Application deadline notice indicates applications are closed.',
      daysRemaining: 0,
      isCurrentlyOpen: false,
      verifiedAt,
    };
  }

  if (parseResult.isExplicitlyExpired) {
    return {
      status: 'EXPIRED',
      reason: 'Application deadline has elapsed.',
      daysRemaining: 0,
      isCurrentlyOpen: false,
      verifiedAt,
    };
  }

  if (parseResult.isAmbiguous) {
    return {
      status: 'NEEDS_REVIEW',
      reason: 'Deadline is missing, unspecified, or ambiguous. Requires administrative review.',
      daysRemaining: null,
      isCurrentlyOpen: false,
      verifiedAt,
    };
  }

  const now = getCurrentSystemTime().getTime();

  // 3. Compare deadline against current system clock
  if (parseResult.parsedDate) {
    const deadlineTime = parseResult.parsedDate.getTime();
    const diffMs = deadlineTime - now;

    if (diffMs <= 0) {
      const daysPast = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
      return {
        status: 'EXPIRED',
        reason: `Application deadline elapsed ${daysPast} ${daysPast === 1 ? 'day' : 'days'} ago.`,
        daysRemaining: 0,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }

    const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // 4. Verify application destination availability
    const hasApplicationUrl = Boolean(applicationUrl && applicationUrl.trim().length > 5);
    const hasOfficialUrl = Boolean(officialOpportunityUrl && officialOpportunityUrl.trim().length > 5);

    // If explicit broken flag passed
    if (isLinkValid === false) {
      return {
        status: 'LINK_UNAVAILABLE',
        reason: 'Application link is broken or returned an error destination.',
        daysRemaining,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }

    if (!hasApplicationUrl && !hasOfficialUrl) {
      return {
        status: 'LINK_UNAVAILABLE',
        reason: 'No application or official detail URL available.',
        daysRemaining,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }

    if (!hasApplicationUrl && hasOfficialUrl) {
      // Info page works, but direct application URL is unavailable
      return {
        status: 'NEEDS_REVIEW',
        reason: 'Official information page accessible, but direct application form URL is unverified.',
        daysRemaining,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }

    return {
      status: 'OPEN',
      reason: `Verified active application cycle with ${daysRemaining} days remaining.`,
      daysRemaining,
      isCurrentlyOpen: true,
      verifiedAt,
    };
  }

  // 5. Rolling admissions handling
  if (parseResult.isRolling) {
    const hasApplicationUrl = Boolean(applicationUrl && applicationUrl.trim().length > 5);
    const hasOfficialUrl = Boolean(officialOpportunityUrl && officialOpportunityUrl.trim().length > 5);

    if (isLinkValid === false || (!hasApplicationUrl && !hasOfficialUrl)) {
      return {
        status: 'LINK_UNAVAILABLE',
        reason: 'Rolling admission opportunity but application link is unavailable.',
        daysRemaining: 999,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }

    if (!hasApplicationUrl && hasOfficialUrl) {
      return {
        status: 'NEEDS_REVIEW',
        reason: 'Rolling admission: Information page accessible, direct form unverified.',
        daysRemaining: 999,
        isCurrentlyOpen: false,
        verifiedAt,
      };
    }

    return {
      status: 'OPEN',
      reason: 'Verified rolling admissions cycle.',
      daysRemaining: 999,
      isCurrentlyOpen: true,
      verifiedAt,
    };
  }

  return {
    status: 'STATUS_UNKNOWN',
    reason: 'Opportunity status could not be conclusively determined.',
    daysRemaining: null,
    isCurrentlyOpen: false,
    verifiedAt,
  };
}
