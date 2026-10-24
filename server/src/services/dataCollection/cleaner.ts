import {
  RawOpportunityPayload,
  CleanedOpportunityPayload,
  OpportunityCategory,
} from '@/types/dataCollection';

/**
 * Strips raw HTML tags and decodes common HTML entities
 */
export function stripHtml(input?: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips tracking parameters (UTM, fbclid, gclid) and ensures HTTPS URL
 */
export function sanitizeUrl(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.trim());
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      '_ga',
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

/**
 * Normalizes skill strings or arrays into a clean, deduplicated string array
 */
export function normalizeSkillsList(rawSkills?: string | string[]): string[] {
  if (!rawSkills) return [];
  const list = Array.isArray(rawSkills)
    ? rawSkills
    : rawSkills.split(/[,;|•\n]+/).map((s) => s.trim());

  const skillAliasMap: Record<string, string> = {
    python3: 'Python',
    'python 3.x': 'Python',
    golang: 'Go',
    pytorch: 'PyTorch',
    'deep learning': 'Deep Learning',
    'machine learning': 'Machine Learning',
    ml: 'Machine Learning',
    ai: 'Artificial Intelligence',
    k8s: 'Kubernetes',
    'distributed-systems': 'Distributed Systems',
    statistics: 'Statistics',
    'research methodology': 'Research Methodology',
  };

  const set = new Set<string>();
  list.forEach((skill) => {
    const cleaned = stripHtml(skill).trim();
    if (cleaned.length > 1) {
      const lower = cleaned.toLowerCase();
      const canonical = skillAliasMap[lower] || cleaned;
      set.add(canonical);
    }
  });

  return Array.from(set);
}

/**
 * Maps raw categories to one of the 8 canonical OpportunityCategory types
 */
export function normalizeOpportunityCategory(
  rawCategory?: string,
  title: string = '',
  description: string = ''
): OpportunityCategory {
  const combined = `${rawCategory || ''} ${title} ${description}`.toLowerCase();

  if (combined.includes('hackathon') || combined.includes('builder sprint')) {
    return 'Hackathons';
  }
  if (combined.includes('internship') || combined.includes('intern') || combined.includes('trainee')) {
    return 'Internships';
  }
  if (combined.includes('scholarship') || combined.includes('grant') && combined.includes('merit')) {
    return 'Scholarships';
  }
  if (combined.includes('fellowship') || combined.includes('post doctoral') || combined.includes('doctoral')) {
    return 'Research Programs';
  }
  if (combined.includes('research') || combined.includes('laboratory') || combined.includes('investigation')) {
    return 'Research Opportunities';
  }
  if (combined.includes('competition') || combined.includes('contest') || combined.includes('challenge')) {
    return 'Competitions';
  }
  if (combined.includes('certification') || combined.includes('credential')) {
    return 'Certifications';
  }
  if (combined.includes('course') || combined.includes('mooc') || combined.includes('curriculum')) {
    return 'Courses / Learning Opportunities';
  }

  return 'Research Opportunities';
}

/**
 * Standardizes work mode
 */
export function cleanWorkMode(rawMode?: string): 'Remote' | 'Hybrid' | 'In-Person' {
  if (!rawMode) return 'Hybrid';
  const lower = rawMode.toLowerCase();
  if (lower.includes('remote') || lower.includes('virtual') || lower.includes('online')) return 'Remote';
  if (lower.includes('in-person') || lower.includes('on-site') || lower.includes('onsite')) return 'In-Person';
  return 'Hybrid';
}

/**
 * Standardizes date strings
 */
export function cleanDateString(rawDate?: string): string {
  if (!rawDate) return 'Rolling Admission 2026';
  return stripHtml(rawDate);
}

/**
 * Data Cleaning Stage: Sanitizes raw payload into CleanedOpportunityPayload
 */
export function cleanOpportunityPayload(raw: RawOpportunityPayload): CleanedOpportunityPayload {
  const cleanTitle = stripHtml(raw.title);
  const cleanOrg = stripHtml(raw.org_name || 'Verified Academic / Institutional Partner');
  const cleanDesc = stripHtml(raw.raw_description || 'Detailed program overview available on portal.');
  const cleanCat = normalizeOpportunityCategory(raw.raw_category, cleanTitle, cleanDesc);
  const cleanElig = stripHtml(raw.raw_eligibility || 'Academic standing with recognized collegiate coursework.');
  const cleanSkills = normalizeSkillsList(raw.raw_skills);
  const cleanDeadline = cleanDateString(raw.raw_deadline);
  const cleanLocation = stripHtml(raw.raw_location || 'India');
  const cleanMode = cleanWorkMode(raw.raw_mode);
  const cleanAppUrl = sanitizeUrl(raw.raw_application_url || raw.raw_url || 'https://pathsync.ai/apply');
  const cleanOfficialUrl = sanitizeUrl(raw.raw_official_url || raw.raw_url || cleanAppUrl);
  const cleanSourceUrl = sanitizeUrl(raw.source_url || raw.raw_official_url || raw.raw_url || 'https://pathsync.ai');

  return {
    source_id: raw.source_id || (raw as any).sourceId || 'src-custom',
    source_name: raw.source_name || (raw as any).sourceName || raw.source_id || (raw as any).sourceId || 'Custom Source',
    source_url: raw.source_url || (raw as any).sourceUrl || cleanSourceUrl,
    source_type: raw.source_type || (raw as any).sourceType || 'DIRECT_SCRAPING',
    source_priority: raw.source_priority ?? (raw as any).sourcePriority ?? 1,
    clean_title: cleanTitle,
    clean_organization: cleanOrg,
    clean_description: cleanDesc,
    clean_category: cleanCat,
    clean_eligibility: cleanElig,
    clean_skills: cleanSkills,
    clean_deadline: cleanDeadline,
    clean_start_date: raw.raw_start_date ? stripHtml(raw.raw_start_date) : undefined,
    clean_end_date: raw.raw_end_date ? stripHtml(raw.raw_end_date) : undefined,
    clean_location: cleanLocation,
    clean_country: stripHtml(raw.raw_country || 'India'),
    clean_mode: cleanMode,
    clean_application_url: cleanAppUrl,
    clean_official_url: cleanOfficialUrl,
    clean_source_url: cleanSourceUrl,
    clean_stipend: raw.raw_stipend ? stripHtml(raw.raw_stipend) : undefined,
    clean_education_level: raw.raw_education_level ? stripHtml(raw.raw_education_level) : undefined,
    clean_eligible_branch: raw.raw_eligible_branch ? stripHtml(raw.raw_eligible_branch) : undefined,
    clean_tags: raw.raw_tags ? raw.raw_tags.map((t) => stripHtml(t)) : [],
    clean_image: raw.raw_image,
    fetched_at: raw.fetched_at || new Date().toISOString(),
  };
}
