import { Opportunity } from '@/types';
import {
  evaluateOpportunityStatus,
  formatKolkataReadable,
} from '@/lib/deadlineUtils';

export type ApplicationStatus =
  | 'Saved'
  | 'Planning to Apply'
  | 'Applied'
  | 'Shortlisted'
  | 'Selected'
  | 'Rejected';

export interface TimelineEntry {
  status: ApplicationStatus;
  date: string;
  note?: string;
}

export interface ApplicationItem {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  organization: string;
  category: string;
  deadline: string;
  status: ApplicationStatus;
  applicationDate?: string;
  notes: string;
  lastUpdated: string;
  matchScore: number;
  timeline: TimelineEntry[];
}

const STORAGE_KEY = 'pathsync_application_tracker_v1';

export const INITIAL_APPLICATIONS: ApplicationItem[] = [
  {
    id: 'app-1',
    opportunityId: 'opp-1',
    opportunityTitle: 'Deep Learning & Foundation Models Fellowship',
    organization: 'Stanford AI Lab • Academic Partner',
    category: 'Research Opportunities',
    deadline: 'April 30, 2026',
    status: 'Shortlisted',
    applicationDate: 'March 28, 2026',
    notes: 'Submitted portfolio highlighting PyTorch transformer research. Shortlisted for faculty interview round with Dr. Chelsea Finn.',
    lastUpdated: 'April 4, 2026',
    matchScore: 98,
    timeline: [
      { status: 'Saved', date: 'March 15, 2026', note: 'Bookmarked after finding via AI matching.' },
      { status: 'Planning to Apply', date: 'March 20, 2026', note: 'Drafted research statement with advisor.' },
      { status: 'Applied', date: 'March 28, 2026', note: 'Official portal submission confirmed.' },
      { status: 'Shortlisted', date: 'April 4, 2026', note: 'Invited to 45-min technical discussion.' },
    ],
  },
  {
    id: 'app-2',
    opportunityId: 'opp-3',
    opportunityTitle: 'Cloud Distributed Infrastructure Residency',
    organization: 'NextGen Cloud Systems Consortium',
    category: 'Internships',
    deadline: 'May 15, 2026',
    status: 'Applied',
    applicationDate: 'April 2, 2026',
    notes: 'Submitted resume and GitHub open-source repositories. Awaiting initial committee review.',
    lastUpdated: 'April 2, 2026',
    matchScore: 94,
    timeline: [
      { status: 'Saved', date: 'March 22, 2026', note: 'Saved to dashboard tracker.' },
      { status: 'Planning to Apply', date: 'March 26, 2026', note: 'Completed prerequisite alignment check.' },
      { status: 'Applied', date: 'April 2, 2026', note: 'Application submitted via student career portal.' },
    ],
  },
  {
    id: 'app-3',
    opportunityId: 'opp-2',
    opportunityTitle: 'National Frontier Computing Merit Scholarship',
    organization: 'Global STEM Foundation',
    category: 'Scholarships',
    deadline: 'May 10, 2026',
    status: 'Selected',
    applicationDate: 'February 18, 2026',
    notes: 'Final award letter received. $25,000 merit award confirmed for academic year 2026–2027.',
    lastUpdated: 'March 30, 2026',
    matchScore: 96,
    timeline: [
      { status: 'Saved', date: 'January 10, 2026' },
      { status: 'Applied', date: 'February 18, 2026' },
      { status: 'Shortlisted', date: 'March 12, 2026' },
      { status: 'Selected', date: 'March 30, 2026', note: 'Accepted offer and signed agreement.' },
    ],
  },
  {
    id: 'app-4',
    opportunityId: 'opp-6',
    opportunityTitle: 'Robotics Perception & Control Fellowship',
    organization: 'MIT Autonomous Systems Group',
    category: 'Research Opportunities',
    deadline: 'June 15, 2026',
    status: 'Planning to Apply',
    applicationDate: undefined,
    notes: 'Need to complete ROS2 bridging module before submitting application next week.',
    lastUpdated: 'April 5, 2026',
    matchScore: 89,
    timeline: [
      { status: 'Saved', date: 'April 1, 2026' },
      { status: 'Planning to Apply', date: 'April 5, 2026', note: 'Started preparing research statement.' },
    ],
  },
  {
    id: 'app-5',
    opportunityId: 'opp-10',
    opportunityTitle: 'High-Performance Quantitative Systems Intern',
    organization: 'Citadel Securities Tech Alliance',
    category: 'Internships',
    deadline: 'April 25, 2026',
    status: 'Rejected',
    applicationDate: 'March 10, 2026',
    notes: 'Completed algorithmic test. Received rejection letter due to specialized FPGA prerequisite.',
    lastUpdated: 'March 25, 2026',
    matchScore: 92,
    timeline: [
      { status: 'Applied', date: 'March 10, 2026' },
      { status: 'Rejected', date: 'March 25, 2026', note: 'Advised to re-apply after advanced systems elective.' },
    ],
  },
  {
    id: 'app-6',
    opportunityId: 'opp-8',
    opportunityTitle: 'Cloud Native Kubernetes Architect Micro-Degree',
    organization: 'Linux Foundation Education',
    category: 'Certifications',
    deadline: 'July 01, 2026',
    status: 'Saved',
    applicationDate: undefined,
    notes: 'Bookmarked certification voucher. Plan to complete in late summer session.',
    lastUpdated: 'April 6, 2026',
    matchScore: 87,
    timeline: [
      { status: 'Saved', date: 'April 6, 2026', note: 'Added to bookmarks.' },
    ],
  },
];

let memoryApplications: ApplicationItem[] = [...INITIAL_APPLICATIONS];

export function getApplications(): ApplicationItem[] {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to read application tracker from localStorage', e);
    }
  }
  return memoryApplications;
}

export function saveApplications(apps: ApplicationItem[]): void {
  memoryApplications = apps;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.error('Failed to save application tracker to localStorage', e);
    }
  }
}

export function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  note?: string
): ApplicationItem[] {
  const all = getApplications();
  const today = formatKolkataReadable();
  
  const updated = all.map((app) => {
    if (app.id !== id) return app;

    const timeline = [...app.timeline];
    // Add new timeline node if status changed
    if (app.status !== newStatus) {
      timeline.push({
        status: newStatus,
        date: today,
        note: note || `Status updated to ${newStatus}`,
      });
    }

    return {
      ...app,
      status: newStatus,
      lastUpdated: today,
      applicationDate: newStatus === 'Applied' && !app.applicationDate ? today : app.applicationDate,
      timeline,
    };
  });

  saveApplications(updated);
  return updated;
}

export function updateApplicationNotes(id: string, notes: string): ApplicationItem[] {
  const all = getApplications();
  const today = formatKolkataReadable();
  const updated = all.map((app) => (app.id === id ? { ...app, notes, lastUpdated: today } : app));
  saveApplications(updated);
  return updated;
}

export function addApplicationFromOpportunity(
  opportunity: Opportunity,
  initialStatus: ApplicationStatus = 'Planning to Apply',
  notes: string = ''
): ApplicationItem[] {
  const all = getApplications();
  
  // Check if already in tracker
  const existing = all.find((a) => a.opportunityId === opportunity.id);
  if (existing) {
    return updateApplicationStatus(existing.id, initialStatus, notes);
  }

  const today = formatKolkataReadable();
  const newItem: ApplicationItem = {
    id: `app-${Date.now()}`,
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    organization: opportunity.organization,
    category: opportunity.category,
    deadline: opportunity.deadline || 'Rolling Admissions',
    status: initialStatus,
    applicationDate: initialStatus === 'Applied' ? today : undefined,
    notes: notes || `Tracked from ${opportunity.organization}`,
    lastUpdated: today,
    matchScore: opportunity.matchScore || 90,
    timeline: [
      { status: 'Saved', date: today },
      ...(initialStatus !== 'Saved' ? [{ status: initialStatus, date: today, note: 'Initial tracking state' }] : []),
    ],
  };

  const updated = [newItem, ...all];
  saveApplications(updated);
  return updated;
}

export function removeApplication(id: string): ApplicationItem[] {
  const all = getApplications();
  const updated = all.filter((a) => a.id !== id);
  saveApplications(updated);
  return updated;
}

/**
 * Validates whether a given URL is a legitimate http/https URL.
 */
export function isValidOpportunityUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed.startsWith('javascript:')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Resolves the verified direct application URL specifically.
 * Returns null if missing or invalid.
 */
export function getDirectApplicationUrl(
  opportunity?: Partial<Opportunity> | null
): string | null {
  if (!opportunity) return null;
  const appUrl = (opportunity.application_url || opportunity.official_opportunity_url || opportunity.official_url)?.trim();
  if (!isValidOpportunityUrl(appUrl)) return null;
  return appUrl!;
}

/**
 * Resolves the official opportunity detail page URL.
 */
export function getOfficialOpportunityUrl(
  opportunity?: Partial<Opportunity> | null
): string | null {
  if (!opportunity) return null;
  const officialUrl = (opportunity.official_url || opportunity.official_opportunity_url)?.trim();
  if (isValidOpportunityUrl(officialUrl)) {
    return officialUrl!;
  }
  return null;
}

export interface OpportunityActionConfig {
  url: string | null;
  officialDetailsUrl: string | null;
  label: string;
  buttonText: string;
  cardLabel: string;
  isDirectApply: boolean;
  isAvailable: boolean;
  type: 'DIRECT_APPLY' | 'VIEW_OPPORTUNITY' | 'UNAVAILABLE' | 'EXPIRED' | 'CLOSED';
  notice?: string;
}

/**
 * Deterministically resolves the action button configuration adhering to the rules in Section 5:
 * 1. Expired or closed -> Disable Apply Now. Show "Applications Closed" or "Deadline Passed".
 * 2. Verified and currently open with direct application URL -> "Apply Now" (or "Apply Now ↗")
 * 3. Official opportunity detail page works but direct app link unavailable -> "View Official Details ↗" with disclaimer
 * 4. Neither valid -> "Application link unavailable" (Disabled)
 */
export function getOpportunityActionConfig(
  opportunity?: Partial<Opportunity> | null
): OpportunityActionConfig {
  if (!opportunity) {
    return {
      url: null,
      officialDetailsUrl: null,
      label: 'Application Link Unavailable',
      buttonText: 'Application Link Unavailable',
      cardLabel: 'Link unavailable',
      isDirectApply: false,
      isAvailable: false,
      type: 'UNAVAILABLE',
      notice: 'Opportunity information is not currently available.',
    };
  }

  const isLinkUnavailable = opportunity.application_status === 'LINK_UNAVAILABLE';
  const officialUrl = getOfficialOpportunityUrl(opportunity);

  // Check deadline and application status
  const statusEval = evaluateOpportunityStatus({
    deadline: opportunity.deadline,
    applicationUrl: isLinkUnavailable ? undefined : opportunity.application_url,
    officialOpportunityUrl: officialUrl,
    isLinkValid: !isLinkUnavailable,
    sourceStatus:
      opportunity.application_status === 'CLOSED' || opportunity.verificationStatus === 'CLOSED'
        ? 'CLOSED'
        : opportunity.application_status,
  });

  // Rule 1: When the source or evaluation confirms applications are closed
  if (
    statusEval.status === 'CLOSED' ||
    opportunity.verificationStatus === 'CLOSED' ||
    opportunity.application_status === 'CLOSED'
  ) {
    return {
      url: null,
      officialDetailsUrl: officialUrl,
      label: 'Applications Closed',
      buttonText: 'Applications Closed',
      cardLabel: 'Applications Closed',
      isDirectApply: false,
      isAvailable: false,
      type: 'CLOSED',
      notice: 'Applications for this opportunity are officially closed.',
    };
  }

  // Rule 2: When the opportunity deadline has expired
  if (
    statusEval.status === 'EXPIRED' ||
    opportunity.isExpired === true ||
    opportunity.verificationStatus === 'EXPIRED' ||
    opportunity.application_status === 'EXPIRED'
  ) {
    return {
      url: null,
      officialDetailsUrl: officialUrl,
      label: 'Deadline Passed',
      buttonText: 'Deadline Passed',
      cardLabel: 'Deadline Passed',
      isDirectApply: false,
      isAvailable: false,
      type: 'EXPIRED',
      notice: 'The deadline for this opportunity has passed. Applications are no longer accepted.',
    };
  }

  const directUrl = getDirectApplicationUrl(opportunity);
  // Rule: When verified and currently open with working direct application page
  if (directUrl && statusEval.status === 'OPEN') {
    return {
      url: directUrl,
      officialDetailsUrl: officialUrl,
      label: 'Apply Now',
      buttonText: 'Apply Now ↗',
      cardLabel: 'Apply ↗',
      isDirectApply: true,
      isAvailable: true,
      type: 'DIRECT_APPLY',
    };
  }

  // Rule: Official detail page works, but direct application URL is unavailable or unverified
  if (officialUrl) {
    return {
      url: officialUrl,
      officialDetailsUrl: officialUrl,
      label: 'View Official Details',
      buttonText: 'View Official Details ↗',
      cardLabel: 'Official Details ↗',
      isDirectApply: false,
      isAvailable: true,
      type: 'VIEW_OPPORTUNITY',
      notice:
        'Official information page is accessible, but direct application link could not be verified. Not labeled open without direct evidence.',
    };
  }

  // Rule: Neither link is usable
  return {
    url: null,
    officialDetailsUrl: null,
    label: 'Application Link Unavailable',
    buttonText: 'Application Link Unavailable',
    cardLabel: 'Link unavailable',
    isDirectApply: false,
    isAvailable: false,
    type: 'UNAVAILABLE',
    notice: 'Neither an official detail page nor an active application URL could be verified.',
  };
}

/**
 * Resolves the verified official application destination URL:
 * 1. verified application_url
 * 2. fallback to official_opportunity_url if application_url is unavailable
 * 3. returns null if neither exists or if invalid
 */
export function getVerifiedApplicationUrl(
  opportunity?: Partial<Opportunity> | null
): string | null {
  const config = getOpportunityActionConfig(opportunity);
  return config.url;
}

/**
 * Retrieves the application tracking item for a specific opportunity ID if one exists.
 */
export function getApplicationByOpportunityId(opportunityId: string): ApplicationItem | undefined {
  const all = getApplications();
  return all.find((a) => a.opportunityId === opportunityId);
}

/**
 * Records that a student opened an external official application link.
 * STRICT REQUIREMENTS:
 * - Does NOT mark the application as 'Applied' or 'Submitted'.
 * - Preserves or sets status to 'Planning to Apply' (Application Started / Link Opened).
 * - Synchronizes with the application tracker and records timeline entry.
 * - Returns null if the URL is missing or invalid.
 */
export function recordApplicationLinkOpened(
  opportunity: Opportunity
): { item: ApplicationItem; applicationUrl: string; isDirectApply: boolean } | null {
  const config = getOpportunityActionConfig(opportunity);
  if (!config.isAvailable || !config.url) {
    return null;
  }
  const applicationUrl = config.url;

  const all = getApplications();
  const existing = all.find((a) => a.opportunityId === opportunity.id);
  const today = formatKolkataReadable();

  let item: ApplicationItem;
  if (existing) {
    // Keep existing status (e.g. Planning to Apply, Applied, Shortlisted);
    // If it was 'Saved', update to 'Planning to Apply'.
    // NEVER automatically set to 'Applied'.
    const newStatus: ApplicationStatus =
      existing.status === 'Saved' ? 'Planning to Apply' : existing.status;
    const timeline = [...existing.timeline];
    timeline.push({
      status: newStatus,
      date: today,
      note: `Opened official application portal (${new URL(applicationUrl).hostname}). Submission must be completed externally and self-reported.`,
    });
    item = {
      ...existing,
      status: newStatus,
      lastUpdated: today,
      timeline,
    };
    const updated = all.map((a) => (a.id === existing.id ? item : a));
    saveApplications(updated);
  } else {
    item = {
      id: `app-${Date.now()}`,
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      organization: opportunity.organization,
      category: opportunity.category,
      deadline: opportunity.deadline || 'Rolling Admissions',
      status: 'Planning to Apply',
      applicationDate: undefined, // NOT submitted yet!
      notes: `Official application portal link opened (${opportunity.organization}). Complete application externally, then update status to Applied.`,
      lastUpdated: today,
      matchScore: opportunity.matchScore || 90,
      timeline: [
        { status: 'Saved', date: today },
        {
          status: 'Planning to Apply',
          date: today,
          note: `Opened official application portal (${new URL(applicationUrl).hostname}). Awaiting external completion.`,
        },
      ],
    };
    saveApplications([item, ...all]);
  }

  return { item, applicationUrl, isDirectApply: config.isDirectApply };
}

