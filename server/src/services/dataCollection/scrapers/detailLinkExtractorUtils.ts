/**
 * Utility helpers for detailLinkExtractor
 */

const EXCLUDE_URL_PATTERNS = [
  /^javascript:/i,
  /^mailto:/i,
  /^tel:/i,
  /^#$/,
  /\/(terms|privacy|contact|about|faq|help|disclaimer|feedback|sitemap)\b/i,
  /\/(login|signin)\b/i,
];

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  '_ga',
  'msclkid',
  'ref',
];

export function sanitizeApplicationUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }
    return parsed.href;
  } catch {
    return urlStr;
  }
}

export function resolveRelativeUrl(href: string, baseUrl: string): string | null {
  if (!href || typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (EXCLUDE_URL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return null;
  }

  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return null;
    }
    return sanitizeApplicationUrl(resolved.href);
  } catch {
    return null;
  }
}
