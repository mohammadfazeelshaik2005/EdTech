/**
 * PathSync AI — Detail Link Extractor
 * Automatically extracts and validates direct application/registration URLs
 * from official opportunity detail pages and HTML content without guessing or fabrication.
 * 
 * Strict Phase 3 Rules:
 * - Never guess URL paths or append /apply, /apply-now, or /online-application to a domain.
 * - Never copy the source homepage into the application URL.
 * - Never reuse application links across disparate opportunities.
 * - Never treat page existence (HTTP 200) as proof that applications are open.
 * - Separate storage of source_url, official_opportunity_url, application_url, deadline, application_status, and last_verified_at.
 * - If direct application URL cannot be verified, store as unavailable rather than inventing one.
 */

import { sanitizeApplicationUrl, resolveRelativeUrl } from './detailLinkExtractorUtils';
export { sanitizeApplicationUrl, resolveRelativeUrl };

export interface ExtractedApplicationLinkResult {
  applicationUrl: string | null;
  buttonLabelFound?: string;
  isDirectRegistration: boolean;
  confidence: number;
  sourceNote?: string;
  isExplicitlyClosed?: boolean;
  closureReason?: string;
  extractedDeadline?: string;
  applicationStatus?: 'OPEN' | 'CLOSED' | 'NEEDS_REVIEW' | 'LINK_UNAVAILABLE';
}

export interface StructuredOpportunityExtraction {
  source_url: string;
  official_opportunity_url: string;
  application_url?: string;
  deadline?: string;
  application_status: 'OPEN' | 'CLOSED' | 'NEEDS_REVIEW' | 'LINK_UNAVAILABLE' | 'EXPIRED';
  last_verified_at: string;
  isDirectApply: boolean;
}

// Action intent patterns sorted by specificity
const APPLICATION_INTENT_REGEX =
  /\b(apply\s+now|apply\s+online|apply\s+here|submit\s+application|start\s+application|register\s+now|register\s+here|register\s+online|student\s+registration|candidate\s+registration|enroll\s+now|enroll\s+here|enroll\s+online|join\s+course|fill\s+application|apply)\b/i;

const CLOSURE_INTENT_REGEX =
  /\b(applications?\s+(?:are\s+)?closed|admissions?\s+(?:are\s+)?closed|registrations?\s+(?:are\s+)?closed|registrations?\s+ended|applications?\s+ended|offer\s+letters?\s+(?:have\s+been|are)\s+sent|deadline\s+(?:has\s+)?passed|no\s+longer\s+accepting\s+applications?)\b/i;

/**
 * Validates that an extracted URL is a legitimate sub-path or portal,
 * and NOT merely the domain root / homepage.
 */
export function isNonRootApplicationUrl(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const parsedBase = new URL(baseUrl);

    // If points to domain root / homepage, reject as application URL
    if (parsed.pathname === '/' || parsed.pathname === '') {
      return false;
    }

    // Check against obvious root domain homepages
    if (parsed.href === parsedBase.origin || parsed.href === `${parsedBase.origin}/`) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts a direct application or registration link from HTML content.
 * Inspects <a> tags, <button> tags with onclick, and <form> elements.
 */
export function extractDirectApplicationLink(
  html: string,
  baseUrl: string
): ExtractedApplicationLinkResult {
  if (!html || typeof html !== 'string') {
    return { applicationUrl: null, isDirectRegistration: false, confidence: 0 };
  }

  // 0. Check for explicit closure signals in the page text
  const cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                        .replace(/<[^>]+>/g, ' ');

  const closureMatch = cleanText.match(CLOSURE_INTENT_REGEX);
  if (closureMatch) {
    return {
      applicationUrl: null,
      isDirectRegistration: false,
      confidence: 95,
      isExplicitlyClosed: true,
      closureReason: `Source page confirms applications are closed: "${closureMatch[0]}"`,
      applicationStatus: 'CLOSED',
    };
  }

  // 1. Search anchor tags: <a ... href="..." ...>Text</a>
  const anchorRegex = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  const candidates: {
    url: string;
    label: string;
    score: number;
    isRegister: boolean;
  }[] = [];

  while ((match = anchorRegex.exec(html)) !== null) {
    const [, attrBefore, href, attrAfter, innerHtml] = match;
    const combinedAttrs = `${attrBefore} ${attrAfter}`;
    const rawText = innerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // Check title or aria-label attributes
    const ariaLabelMatch = combinedAttrs.match(/aria-label=["']([^"']+)["']/i);
    const titleMatch = combinedAttrs.match(/title=["']([^"']+)["']/i);
    const combinedLabel = `${rawText} ${ariaLabelMatch?.[1] || ''} ${titleMatch?.[1] || ''}`.trim();

    if (APPLICATION_INTENT_REGEX.test(combinedLabel)) {
      const resolved = resolveRelativeUrl(href, baseUrl);
      if (resolved && isNonRootApplicationUrl(resolved, baseUrl)) {
        let score = 70;
        const lowerLabel = combinedLabel.toLowerCase();
        const isRegister = lowerLabel.includes('register') || lowerLabel.includes('enroll');

        if (lowerLabel.includes('apply now') || lowerLabel.includes('apply online')) score += 25;
        if (lowerLabel.includes('register now') || lowerLabel.includes('enroll now')) score += 25;
        if (resolved.includes('register') || resolved.includes('apply') || resolved.includes('form') || resolved.includes('enroll')) {
          score += 15;
        }

        // Avoid linking back to the exact current detail page URL itself
        if (resolved === baseUrl || resolved === `${baseUrl}/`) {
          score -= 50;
        }

        candidates.push({
          url: resolved,
          label: combinedLabel,
          score,
          isRegister,
        });
      }
    }
  }

  // 2. Search form actions: <form ... action="..." ...>
  const formRegex = /<form\b([^>]*?)action=["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/form>/gi;
  while ((match = formRegex.exec(html)) !== null) {
    const [, , action, , innerHtml] = match;
    if (APPLICATION_INTENT_REGEX.test(innerHtml)) {
      const resolved = resolveRelativeUrl(action, baseUrl);
      if (resolved && isNonRootApplicationUrl(resolved, baseUrl)) {
        candidates.push({
          url: resolved,
          label: 'Application Form Action',
          score: 85,
          isRegister: true,
        });
      }
    }
  }

  // 3. Search buttons with inline window.location / open
  const buttonRegex = /<button\b([^>]*?)(?:onclick|data-href)=["'](?:window\.location(?:\.href)?=['"]?|location\.href=['"]?|window\.open\(['"]?)([^"'\)]+)["']?([^>]*?)>([\s\S]*?)<\/button>/gi;
  while ((match = buttonRegex.exec(html)) !== null) {
    const [, , targetUrl, , innerHtml] = match;
    const buttonText = innerHtml.replace(/<[^>]+>/g, ' ').trim();
    if (APPLICATION_INTENT_REGEX.test(buttonText)) {
      const resolved = resolveRelativeUrl(targetUrl, baseUrl);
      if (resolved && isNonRootApplicationUrl(resolved, baseUrl)) {
        candidates.push({
          url: resolved,
          label: buttonText,
          score: 85,
          isRegister: true,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return { applicationUrl: null, isDirectRegistration: false, confidence: 0, applicationStatus: 'NEEDS_REVIEW' };
  }

  // Sort by highest score
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  return {
    applicationUrl: best.url,
    buttonLabelFound: best.label,
    isDirectRegistration: best.isRegister,
    confidence: best.score,
    sourceNote: `Extracted from button/link matching "${best.label}"`,
    applicationStatus: 'OPEN',
  };
}

/**
 * Attempts to inspect a live detail URL (with timeout and error handling)
 * or falls back to known domain direct endpoints.
 */
export async function extractAndValidateDetailApplicationLink(
  detailUrl: string,
  fallbackHtml?: string
): Promise<string | null> {
  if (fallbackHtml) {
    const extracted = extractDirectApplicationLink(fallbackHtml, detailUrl);
    if (extracted.applicationUrl) return extracted.applicationUrl;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(detailUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const extracted = extractDirectApplicationLink(text, detailUrl);
      if (extracted.applicationUrl) {
        return extracted.applicationUrl;
      }
    }
  } catch {
    // Network or CORS restriction
  }

  return null;
}
