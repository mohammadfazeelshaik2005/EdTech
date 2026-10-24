import {
  parseOpportunityDeadline,
  getCurrentSystemTime,
} from '@/lib/deadlineUtils';

export interface DeadlineIntelligence {
  deadline: string;
  daysRemaining: number;
  urgency: 'URGENT' | 'APPROACHING' | 'ON_TRACK' | 'ROLLING' | 'EXPIRED';
  badgeLabel: string;
  badgeVariant: 'rose' | 'amber' | 'mint' | 'neutral';
  colorClasses: {
    text: string;
    bg: string;
    border: string;
    dot: string;
  };
}

export type NotificationType =
  | 'DEADLINE_URGENT'
  | 'NEW_MATCH'
  | 'SAVED_UPDATE'
  | 'MILESTONE';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  opportunityId?: string;
  opportunityTitle?: string;
  organization?: string;
  deadline?: string;
  daysRemaining?: number;
  timestamp: string;
  read: boolean;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  actionUrl: string;
  actionLabel: string;
}

const STORAGE_NOTIFICATIONS_KEY = 'pathsync_notifications_v1';

/**
 * Calculates deadline intelligence (days remaining and urgency tier)
 * based on the opportunity deadline string using the dynamic system clock in Asia/Kolkata.
 * 
 * Strict Phase 4 Rules:
 * - A countdown must only be shown for an opportunity confirmed to be open.
 * - If status is CLOSED -> "Applications Closed" (no countdown).
 * - If status is EXPIRED or past deadline -> "Deadline Passed" (no countdown).
 * - If status is NEEDS_REVIEW or ambiguous -> "Status Under Review" (no countdown).
 * - If status is LINK_UNAVAILABLE -> "Link Unavailable" (no countdown).
 * - Future deadlines do not automatically imply an open application.
 */
export function calculateDeadlineIntelligence(
  deadlineStr?: string,
  status?: string
): DeadlineIntelligence {
  const normStatus = status?.toUpperCase();

  // Explicit closed status overrides deadline string
  if (normStatus === 'CLOSED') {
    return {
      deadline: deadlineStr || 'Applications Closed',
      daysRemaining: 0,
      urgency: 'EXPIRED',
      badgeLabel: 'Applications Closed',
      badgeVariant: 'neutral',
      colorClasses: {
        text: 'text-slate-700',
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      },
    };
  }

  // Explicit expired status
  if (normStatus === 'EXPIRED') {
    return {
      deadline: deadlineStr || 'Deadline Passed',
      daysRemaining: 0,
      urgency: 'EXPIRED',
      badgeLabel: 'Deadline Passed',
      badgeVariant: 'rose',
      colorClasses: {
        text: 'text-rose-900',
        bg: 'bg-rose-50',
        border: 'border-rose-300',
        dot: 'bg-rose-500',
      },
    };
  }

  // Review or unknown status
  if (normStatus === 'NEEDS_REVIEW' || normStatus === 'STATUS_UNKNOWN') {
    return {
      deadline: deadlineStr || 'Status Under Review',
      daysRemaining: 0,
      urgency: 'ROLLING',
      badgeLabel: 'Status Under Review',
      badgeVariant: 'neutral',
      colorClasses: {
        text: 'text-amber-800',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-400',
      },
    };
  }

  // Link unavailable
  if (normStatus === 'LINK_UNAVAILABLE') {
    return {
      deadline: deadlineStr || 'Link Unavailable',
      daysRemaining: 0,
      urgency: 'ROLLING',
      badgeLabel: 'Link Unavailable',
      badgeVariant: 'neutral',
      colorClasses: {
        text: 'text-amber-800',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-400',
      },
    };
  }

  if (!deadlineStr || deadlineStr.toLowerCase().includes('rolling')) {
    return {
      deadline: deadlineStr || 'Rolling Admissions',
      daysRemaining: 999,
      urgency: 'ROLLING',
      badgeLabel: 'Rolling Admissions',
      badgeVariant: 'neutral',
      colorClasses: {
        text: 'text-slate-700',
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      },
    };
  }

  const parsed = parseOpportunityDeadline(deadlineStr);
  if (parsed.isExplicitlyClosed || parsed.isExplicitlyExpired) {
    return {
      deadline: deadlineStr,
      daysRemaining: 0,
      urgency: 'EXPIRED',
      badgeLabel: parsed.isExplicitlyClosed ? 'Applications Closed' : 'Deadline Passed',
      badgeVariant: 'neutral',
      colorClasses: {
        text: 'text-slate-700',
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      },
    };
  }

  if (parsed.isAmbiguous || !parsed.parsedDate) {
    return {
      deadline: deadlineStr,
      daysRemaining: 0,
      urgency: 'ROLLING',
      badgeLabel: 'Status Under Review',
      badgeVariant: 'neutral',
      colorClasses: {
        text: 'text-amber-800',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-400',
      },
    };
  }

  const now = getCurrentSystemTime().getTime();
  const diffMs = parsed.parsedDate.getTime() - now;

  if (diffMs <= 0) {
    return {
      deadline: deadlineStr,
      daysRemaining: 0,
      urgency: 'EXPIRED',
      badgeLabel: 'Deadline Passed',
      badgeVariant: 'neutral',
      colorClasses: {
        text: 'text-slate-700',
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      },
    };
  }

  // If status is given and is NOT 'OPEN', do NOT show countdown!
  if (normStatus && normStatus !== 'OPEN') {
    let badgeText = 'Status Unverified';
    if (normStatus === 'CLOSED') badgeText = 'Applications Closed';
    else if (normStatus === 'UPCOMING') badgeText = 'Applications Upcoming';
    else if (normStatus === 'LINK_BROKEN') badgeText = 'Link Broken';
    else if (normStatus === 'EXPIRED') badgeText = 'Deadline Passed';

    return {
      deadline: deadlineStr,
      daysRemaining: 0,
      urgency: 'ROLLING',
      badgeLabel: badgeText,
      badgeVariant: 'neutral',
      colorClasses: {
        text: 'text-slate-700',
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      },
    };
  }

  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (days <= 5) {
    return {
      deadline: deadlineStr,
      daysRemaining: days,
      urgency: 'URGENT',
      badgeLabel: `${days} ${days === 1 ? 'day' : 'days'} left • Urgent`,
      badgeVariant: 'rose',
      colorClasses: {
        text: 'text-rose-900',
        bg: 'bg-rose-50',
        border: 'border-rose-300',
        dot: 'bg-rose-600',
      },
    };
  }

  if (days <= 14) {
    return {
      deadline: deadlineStr,
      daysRemaining: days,
      urgency: 'APPROACHING',
      badgeLabel: `${days} days left • Approaching`,
      badgeVariant: 'amber',
      colorClasses: {
        text: 'text-amber-950',
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        dot: 'bg-amber-500',
      },
    };
  }

  return {
    deadline: deadlineStr,
    daysRemaining: days,
    urgency: 'ON_TRACK',
    badgeLabel: `${days} days left • On Track`,
    badgeVariant: 'mint',
    colorClasses: {
      text: 'text-emerald-900',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
  };
}

// --------------------------------------------------------------------------
// Default Notifications (Reflecting prompt requirements)
// --------------------------------------------------------------------------
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'DEADLINE_URGENT',
    title: 'Your internship application deadline is in 3 days.',
    message: 'Cloud Distributed Infrastructure Residency closing date is April 10, 2026. Review your notes and submit materials.',
    opportunityId: 'opp-3',
    opportunityTitle: 'Cloud Distributed Infrastructure Residency',
    organization: 'NextGen Cloud Systems Consortium',
    deadline: 'April 10, 2026',
    daysRemaining: 3,
    timestamp: '1 hour ago',
    read: false,
    urgency: 'HIGH',
    actionUrl: '/opportunity/opp-3',
    actionLabel: 'Submit Application →',
  },
  {
    id: 'notif-2',
    type: 'NEW_MATCH',
    title: 'New opportunity matching your profile.',
    message: 'Stanford AI Lab published Deep Learning & Foundation Models Fellowship with a 98% match to your verified PyTorch competencies.',
    opportunityId: 'opp-1',
    opportunityTitle: 'Deep Learning & Foundation Models Fellowship',
    organization: 'Stanford AI Lab • Academic Partner',
    deadline: 'April 30, 2026',
    daysRemaining: 23,
    timestamp: '4 hours ago',
    read: false,
    urgency: 'MEDIUM',
    actionUrl: '/opportunity/opp-1',
    actionLabel: 'View Opportunity →',
  },
  {
    id: 'notif-3',
    type: 'SAVED_UPDATE',
    title: 'An opportunity you saved has been updated.',
    message: 'National Frontier Computing Merit Scholarship updated applicant eligibility and confirmed an increased $25,000 grant award.',
    opportunityId: 'opp-2',
    opportunityTitle: 'National Frontier Computing Merit Scholarship',
    organization: 'Global STEM Foundation',
    deadline: 'May 10, 2026',
    daysRemaining: 33,
    timestamp: 'Yesterday',
    read: false,
    urgency: 'MEDIUM',
    actionUrl: '/opportunity/opp-2',
    actionLabel: 'Inspect Update →',
  },
  {
    id: 'notif-4',
    type: 'DEADLINE_URGENT',
    title: 'Research Fellowship deadline approaching in 12 days.',
    message: 'Robotics Perception & Control Fellowship application window closes April 20, 2026. Complete prerequisite bridge modules.',
    opportunityId: 'opp-6',
    opportunityTitle: 'Robotics Perception & Control Fellowship',
    organization: 'MIT Autonomous Systems Group',
    deadline: 'April 20, 2026',
    daysRemaining: 12,
    timestamp: '2 days ago',
    read: true,
    urgency: 'MEDIUM',
    actionUrl: '/opportunity/opp-6',
    actionLabel: 'Review Prerequisites →',
  },
];

export function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(items: NotificationItem[]): void {
  try {
    localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
}

export function markNotificationAsRead(id: string): NotificationItem[] {
  const current = getStoredNotifications();
  const updated = current.map((item) => (item.id === id ? { ...item, read: true } : item));
  saveStoredNotifications(updated);
  return updated;
}

export function markAllNotificationsAsRead(): NotificationItem[] {
  const current = getStoredNotifications();
  const updated = current.map((item) => ({ ...item, read: true }));
  saveStoredNotifications(updated);
  return updated;
}

export function dismissNotification(id: string): NotificationItem[] {
  const current = getStoredNotifications();
  const updated = current.filter((item) => item.id !== id);
  saveStoredNotifications(updated);
  return updated;
}
