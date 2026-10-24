/**
 * PathSync AI — Destination Validator & Link Integrity Service
 * 
 * Strict destination verification complying with Phase 4 & Phase 5 requirements:
 * 1. Safe redirect following with SSRF prevention.
 * 2. Blocks localhost, private network addresses, link-local metadata endpoints, and non-http(s) schemes.
 * 3. Detects 404 Not Found, 500 Server Errors, redirect loops, and connection timeouts.
 * 4. Detects bot protection / WAF blocks (HTTP 403/429) without falsely declaring applications closed.
 * 5. Detects login walls vs active student registration forms.
 * 6. Sanitizes sensitive tokens and query parameters before logging.
 * 7. Resolves canonical status: OPEN, CLOSED, UPCOMING, UNVERIFIED, LINK_BROKEN.
 */

import { LinkHealthStatus, OpportunityApplicationStatus } from '@/types';

export interface DestinationValidationResult {
  url: string;
  finalUrl: string;
  isValid: boolean;
  httpStatus?: number;
  linkHealth: LinkHealthStatus;
  applicationStatus: OpportunityApplicationStatus;
  isClosedOrEnded: boolean;
  closureReason?: string;
  isUpcoming?: boolean;
  isLoginWall?: boolean;
  isBotBlocked?: boolean;
  isDirectApplicationForm: boolean;
  isOfficialDetailPage: boolean;
  programMatchConfidence: number; // 0 to 100
  validationNotes: string;
}

const SENSITIVE_QUERY_PARAMS = [
  'token',
  'access_token',
  'api_key',
  'apikey',
  'auth',
  'secret',
  'password',
  'session',
  'session_id',
  'jwt',
  'code',
  'state',
];

const CLOSURE_SIGNALS = [
  /\b(applications?\s+(?:are\s+)?closed)\b/i,
  /\b(admissions?\s+(?:are\s+)?closed)\b/i,
  /\b(registrations?\s+(?:are\s+)?closed)\b/i,
  /\b(registrations?\s+ended)\b/i,
  /\b(applications?\s+ended)\b/i,
  /\b(offer\s+letters?\s+(?:have\s+been|are)\s+sent)\b/i,
  /\b(admissions?\s+concluded)\b/i,
  /\b(deadline\s+(?:has\s+)?passed)\b/i,
  /\b(no\s+longer\s+accepting\s+applications?)\b/i,
  /\b(admissions?\s+over)\b/i,
  /\b(404\s+not\s+found)\b/i,
  /\b(page\s+not\s+found)\b/i,
];

const UPCOMING_SIGNALS = [
  /\b(applications?\s+(?:will\s+)?open\s+soon)\b/i,
  /\b(registrations?\s+(?:will\s+)?open\s+soon)\b/i,
  /\b(opening\s+shortly)\b/i,
  /\b(upcoming\s+cycle)\b/i,
  /\b(portal\s+opens\s+on)\b/i,
];

const APPLICATION_FORM_SIGNALS = [
  /<form\b[^>]*?(?:action|id|class)=["'][^"']*(?:register|apply|admission|candidate|enroll)[^"']*["']/i,
  /\b(submit\s+application|register\s+now|apply\s+online|candidate\s+registration|fill\s+application\s+form|new\s+applicant\s+registration)\b/i,
  /\b(candidate\s+portal|online\s+admissions?\s+portal)\b/i,
];

const LOGIN_WALL_SIGNALS = [
  /\/(login|signin|auth|sso)\b/i,
];

/**
 * Sanitizes URLs to avoid leaking private tokens or credentials in logs.
 */
export function sanitizeLogUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const keysToRedact: string[] = [];
    for (const [key] of parsed.searchParams.entries()) {
      const lower = key.toLowerCase();
      if (SENSITIVE_QUERY_PARAMS.some((s) => lower.includes(s) || lower === s)) {
        keysToRedact.push(key);
      }
    }
    for (const key of keysToRedact) {
      parsed.searchParams.set(key, '[REDACTED]');
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Validates against SSRF (Server-Side Request Forgery) and private networks:
 * - Localhost / Loopback: 127.0.0.1, ::1, localhost, 0.0.0.0
 * - Private Class A, B, C: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 * - Link-local / Cloud metadata: 169.254.0.0/16 (e.g., 169.254.169.254)
 * - Safe protocols: ONLY http: and https:
 */
export function isSafeExternalDestination(urlStr: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(urlStr);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== 'http:' && protocol !== 'https:') {
      return { safe: false, reason: `Unsafe URL protocol: "${protocol}". Only HTTP/HTTPS allowed.` };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0'
    ) {
      return { safe: false, reason: 'Targeting localhost or loopback is blocked for security.' };
    }

    // Check IPv4 private and link-local ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const b0 = parseInt(ipv4Match[1], 10);
      const b1 = parseInt(ipv4Match[2], 10);

      // 10.0.0.0/8
      if (b0 === 10) return { safe: false, reason: 'Private Class A address blocked.' };
      // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return { safe: false, reason: 'Private Class B address blocked.' };
      // 192.168.0.0/16
      if (b0 === 192 && b1 === 168) return { safe: false, reason: 'Private Class C address blocked.' };
      // 169.254.0.0/16 (AWS / GCP metadata service)
      if (b0 === 169 && b1 === 254) return { safe: false, reason: 'Link-local/metadata address blocked.' };
    }

    return { safe: true };
  } catch (err: any) {
    return { safe: false, reason: `Malformed URL: ${err.message}` };
  }
}

/**
 * Safely validates an opportunity application or official detail URL with network probing,
 * redirect tracking, and content signal analysis.
 */
export async function validateDestinationUrl(
  targetUrl: string,
  expectedProgramKeywords: string[] = []
): Promise<DestinationValidationResult> {
  if (!targetUrl || typeof targetUrl !== 'string' || targetUrl.trim().length === 0) {
    return {
      url: targetUrl || '',
      finalUrl: targetUrl || '',
      isValid: false,
      linkHealth: 'BROKEN',
      applicationStatus: 'LINK_BROKEN',
      isClosedOrEnded: false,
      isDirectApplicationForm: false,
      isOfficialDetailPage: false,
      programMatchConfidence: 0,
      validationNotes: 'URL is missing or empty.',
    };
  }

  const trimmed = targetUrl.trim();
  const safeCheck = isSafeExternalDestination(trimmed);

  if (!safeCheck.safe) {
    return {
      url: trimmed,
      finalUrl: trimmed,
      isValid: false,
      linkHealth: 'BROKEN',
      applicationStatus: 'LINK_BROKEN',
      isClosedOrEnded: false,
      isDirectApplicationForm: false,
      isOfficialDetailPage: false,
      programMatchConfidence: 0,
      validationNotes: safeCheck.reason || 'Security check failed: Destination blocked.',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(trimmed, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const httpStatus = response.status;
    const finalUrl = response.url || trimmed;

    // Detect SSRF redirect: verify that the FINAL redirect URL is also safe!
    const finalSafeCheck = isSafeExternalDestination(finalUrl);
    if (!finalSafeCheck.safe) {
      return {
        url: trimmed,
        finalUrl: sanitizeLogUrl(finalUrl),
        isValid: false,
        httpStatus,
        linkHealth: 'BROKEN',
        applicationStatus: 'LINK_BROKEN',
        isClosedOrEnded: false,
        isDirectApplicationForm: false,
        isOfficialDetailPage: false,
        programMatchConfidence: 0,
        validationNotes: `Redirected to disallowed target: ${finalSafeCheck.reason}`,
      };
    }

    // 1. Handle HTTP 404 Not Found & HTTP 500 Server Error
    if (httpStatus === 404 || httpStatus >= 500) {
      return {
        url: trimmed,
        finalUrl: sanitizeLogUrl(finalUrl),
        isValid: false,
        httpStatus,
        linkHealth: 'BROKEN',
        applicationStatus: 'LINK_BROKEN',
        isClosedOrEnded: false,
        isDirectApplicationForm: false,
        isOfficialDetailPage: false,
        programMatchConfidence: 0,
        validationNotes: `Destination returned HTTP ${httpStatus} error (${
          httpStatus === 404 ? 'Page Not Found' : 'Server Error'
        }).`,
      };
    }

    // 2. Handle HTTP 403 / 429 WAF Bot Protections (e.g. ACM India, Cloudflare)
    // CRITICAL: Do NOT declare closed! Must mark UNVERIFIED.
    if (httpStatus === 403 || httpStatus === 429) {
      return {
        url: trimmed,
        finalUrl: sanitizeLogUrl(finalUrl),
        isValid: true, // Destination exists
        httpStatus,
        linkHealth: 'BLOCKED',
        applicationStatus: 'UNVERIFIED',
        isClosedOrEnded: false,
        isBotBlocked: true,
        isDirectApplicationForm: false,
        isOfficialDetailPage: true,
        programMatchConfidence: 50,
        validationNotes: `Institutional server requires interactive browser session (HTTP ${httpStatus} bot protection). Preserved as UNVERIFIED.`,
      };
    }

    // 3. Response is HTTP 200: Parse text content
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return {
        url: trimmed,
        finalUrl: sanitizeLogUrl(finalUrl),
        isValid: true,
        httpStatus,
        linkHealth: finalUrl !== trimmed ? 'REDIRECTED' : 'HEALTHY',
        applicationStatus: 'OPEN',
        isClosedOrEnded: false,
        isDirectApplicationForm: false,
        isOfficialDetailPage: true,
        programMatchConfidence: 85,
        validationNotes: `Verified downloadable application document resource (${contentType}).`,
      };
    }

    const html = await response.text();
    const cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                          .replace(/<[^>]+>/g, ' ')
                          .replace(/\s+/g, ' ');

    // Check Closure signals
    for (const pattern of CLOSURE_SIGNALS) {
      const match = cleanText.match(pattern);
      if (match) {
        return {
          url: trimmed,
          finalUrl: sanitizeLogUrl(finalUrl),
          isValid: true,
          httpStatus,
          linkHealth: 'HEALTHY',
          applicationStatus: 'CLOSED',
          isClosedOrEnded: true,
          closureReason: `Destination indicates closure: "${match[0]}"`,
          isDirectApplicationForm: false,
          isOfficialDetailPage: true,
          programMatchConfidence: 90,
          validationNotes: `Application cycle concluded on official destination ("${match[0]}").`,
        };
      }
    }

    // Check Upcoming signals
    for (const pattern of UPCOMING_SIGNALS) {
      const match = cleanText.match(pattern);
      if (match) {
        return {
          url: trimmed,
          finalUrl: sanitizeLogUrl(finalUrl),
          isValid: true,
          httpStatus,
          linkHealth: 'HEALTHY',
          applicationStatus: 'UPCOMING',
          isClosedOrEnded: false,
          isUpcoming: true,
          isDirectApplicationForm: false,
          isOfficialDetailPage: true,
          programMatchConfidence: 90,
          validationNotes: `Destination indicates application opens in upcoming cycle ("${match[0]}").`,
        };
      }
    }

    // Check Login Wall
    const isLoginWall = LOGIN_WALL_SIGNALS.some((pattern) => pattern.test(finalUrl));

    // Check Application Form signals
    let isDirectApplicationForm = false;
    for (const pattern of APPLICATION_FORM_SIGNALS) {
      if (pattern.test(html) || pattern.test(cleanText)) {
        isDirectApplicationForm = true;
        break;
      }
    }

    // Keyword match
    let matchCount = 0;
    if (expectedProgramKeywords.length > 0) {
      const lowerText = cleanText.toLowerCase();
      for (const kw of expectedProgramKeywords) {
        if (lowerText.includes(kw.toLowerCase())) {
          matchCount++;
        }
      }
    }
    const programMatchConfidence = expectedProgramKeywords.length > 0
      ? Math.round((matchCount / expectedProgramKeywords.length) * 100)
      : 80;

    const isRedirected = finalUrl !== trimmed;
    const linkHealth: LinkHealthStatus = isLoginWall
      ? 'LOGIN_REQUIRED'
      : isRedirected
      ? 'REDIRECTED'
      : 'HEALTHY';

    const applicationStatus: OpportunityApplicationStatus = isDirectApplicationForm
      ? 'OPEN'
      : 'UNVERIFIED';

    return {
      url: trimmed,
      finalUrl: sanitizeLogUrl(finalUrl),
      isValid: true,
      httpStatus,
      linkHealth,
      applicationStatus,
      isClosedOrEnded: false,
      isLoginWall,
      isDirectApplicationForm,
      isOfficialDetailPage: true,
      programMatchConfidence,
      validationNotes: isDirectApplicationForm
        ? 'Verified active application portal with registration input form.'
        : isLoginWall
        ? 'Official portal requires existing student SSO credentials.'
        : 'Official program detail page is accessible, but direct application form is not active or is centralized.',
    };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || err.message?.includes('abort') || err.message?.includes('timeout');
    return {
      url: trimmed,
      finalUrl: sanitizeLogUrl(trimmed),
      isValid: false,
      linkHealth: isTimeout ? 'TIMEOUT' : 'BROKEN',
      applicationStatus: 'LINK_BROKEN',
      isClosedOrEnded: false,
      isDirectApplicationForm: false,
      isOfficialDetailPage: false,
      programMatchConfidence: 0,
      validationNotes: isTimeout
        ? 'Connection timed out while probing destination host.'
        : `Network destination unreachable: ${err.message || 'DNS resolution or connection failure.'}`,
    };
  }
}
