export type VerificationStatus =
  | 'VERIFIED'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CLOSED'
  | 'NEEDS_REVIEW';

export type OpportunityApplicationStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'UPCOMING'
  | 'UNVERIFIED'
  | 'LINK_BROKEN'
  | 'EXPIRED'
  | 'NEEDS_REVIEW'
  | 'STATUS_UNKNOWN'
  | 'LINK_UNAVAILABLE';

export type LinkHealthStatus =
  | 'HEALTHY'
  | 'REDIRECTED'
  | 'BROKEN'
  | 'TIMEOUT'
  | 'LOGIN_REQUIRED'
  | 'BLOCKED'
  | 'UNCHECKED';

export interface VerificationSignal {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  description: string;
}

export interface VerificationAudit {
  status: VerificationStatus;
  verificationScore: number;
  source: string;
  sourceUrl?: string;
  organization: string;
  officialDomain: string;
  lastVerifiedDate: string;
  signals: VerificationSignal[];
  flagReason?: string;
  reviewNotes?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  organization: string;
  description: string;
  location: string;
  mode?: 'Remote' | 'Hybrid' | 'In-Person';
  duration: string;
  compensation?: string;
  matchScore: number;
  deadline?: string;
  application_deadline?: string;
  eligibility?: string;
  requiredSkills?: string[];
  educationLevel?: string;
  isVerified?: boolean;
  isSaved?: boolean;
  isExpired?: boolean;
  country?: string;
  eligibility_country?: string;
  eligibility_text?: string;
  is_india_opportunity?: boolean;
  source_url?: string;
  official_url?: string;
  official_opportunity_url?: string;
  application_url?: string;
  application_status?: OpportunityApplicationStatus;
  last_verified_at?: string;
  verification_source?: string;
  verification_notes?: string;
  link_health?: LinkHealthStatus;
  http_status_code?: number;
  stipend?: string;
  tags?: string[];
  image?: string;
  extracted_at?: string;
  type: 'fellowship' | 'internship' | 'academic' | 'residency' | 'scholarship' | 'hackathon' | 'competition' | 'certification';
  verificationStatus?: VerificationStatus;
  verificationScore?: number;
  source?: string;
  officialDomain?: string;
  lastVerifiedDate?: string;
  verificationAudit?: VerificationAudit;
}

export type AssessmentSectionId =
  | 'aptitude'
  | 'logical'
  | 'quantitative'
  | 'verbal'
  | 'programming'
  | 'dsa'
  | 'core_cs'
  | 'communication';

export interface AssessmentQuestion {
  id: string;
  sectionId: AssessmentSectionId;
  sectionTitle: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

export interface SectionScore {
  score: number;
  total: number;
  percentage: number;
}

export interface AssessmentResult {
  id: string;
  userId: string;
  overallScore: number;
  totalQuestions: number;
  correctAnswers: number;
  sectionScores: Record<AssessmentSectionId, SectionScore>;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  completedAt: string;
}

export interface AdminAccount {
  id: string;
  email: string;
  fullName: string;
  role: 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface Pathway {
  id: string;
  title: string;
  icon: string;
  category: string;
  description: string;
  coursesCount: number;
  estimatedMonths: number;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  subtext?: string;
  icon: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  major: string;
  university: string;
  graduationYear: string;
  matchScore: number;
  targetRole: string;
}

export * from './assessment';
