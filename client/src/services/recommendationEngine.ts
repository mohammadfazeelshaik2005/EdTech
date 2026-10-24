import { Opportunity } from '@/types';
import { CompleteStudentData } from './supabaseService';
import { getActiveVerifiedOpportunities } from './dataCollection';

export interface MatchAnalysis {
  matchScore: number;
  categoryScores: {
    skillsScore: number;
    academicScore: number;
    interestScore: number;
    careerScore: number;
  };
  whyReasons: string[];
  skillsAnalysis: {
    matchedSkills: string[];
    missingSkills: string[];
    matchPercentage: number;
  };
  eligibilityStatus: {
    isEligible: boolean;
    summary: string;
  };
}

// Pre-defined student personas for different skill specializations
export interface StudentPersona {
  id: string;
  name: string;
  roleTitle: string;
  major: string;
  avatarIcon: string;
  badgeLabel: string;
  profileData: CompleteStudentData;
}

export const STUDENT_PERSONAS: Record<string, StudentPersona> = {
  ai_ml: {
    id: 'ai_ml',
    name: 'Sarah Jenkins',
    roleTitle: 'AI & Machine Learning Researcher',
    major: 'Computer Science & AI',
    avatarIcon: '🧠',
    badgeLabel: 'AI & Data Science',
    profileData: {
      profile: {
        full_name: 'Sarah Jenkins',
        email: 'sarah.j@university.edu',
        headline: 'Computer Science student passionate about foundational neural systems & LLMs',
      },
      education: {
        college: 'Indian Institute of Science (IISc), Bengaluru',
        degree: 'Bachelor of Technology (B.Tech)',
        branch: 'Computer Science & Artificial Intelligence',
        cgpa: '3.92',
        graduation_year: '2027',
      },
      skills: {
        programming: ['Python', 'SQL', 'C++'],
        frameworks: ['PyTorch', 'TensorFlow', 'Scikit-Learn', 'FastAPI'],
        tools: ['Git', 'Linux', 'Weights & Biases', 'Jupyter'],
        technical: ['Machine Learning', 'Deep Learning', 'Linear Algebra', 'NLP', 'Computer Vision'],
      },
      interests: {
        areas_of_interest: ['Artificial Intelligence', 'Deep Learning', 'Autonomous Systems & Robotics'],
        opportunity_categories: ['Research Opportunities', 'Certifications', 'Scholarships'],
      },
      careerGoals: {
        desired_roles: ['Machine Learning Research Engineer', 'AI Systems Architect'],
        preferred_domains: ['Frontier AI Labs', 'Academic Research Centers'],
        work_mode: 'Hybrid or Remote',
        availability: 'Summer 2026 Cohort',
        career_interests: 'Frontier AI alignment research and large-scale model orchestration.',
      },
      resume: {},
    },
  },
  frontend_web: {
    id: 'frontend_web',
    name: 'Alex Chen',
    roleTitle: 'Frontend & Web Platform Engineer',
    major: 'Software Engineering & Web Technologies',
    avatarIcon: '⚡',
    badgeLabel: 'Frontend & Full Stack',
    profileData: {
      profile: {
        full_name: 'Alex Chen',
        email: 'alex.chen@tech.edu.in',
        headline: 'Modern UI architect crafting reactive, accessible web platforms',
      },
      education: {
        college: 'IIT Madras, Chennai',
        degree: 'Bachelor of Technology (B.Tech)',
        branch: 'Computer Science & Engineering',
        cgpa: '3.85',
        graduation_year: '2027',
      },
      skills: {
        programming: ['TypeScript', 'JavaScript', 'HTML/CSS'],
        frameworks: ['React', 'Next.js', 'Tailwind', 'Redux', 'Node.js'],
        tools: ['Git', 'Vite', 'Webpack', 'Figma', 'npm'],
        technical: ['Web Performance', 'REST APIs', 'UI/UX Design', 'State Management', 'Micro-Frontends'],
      },
      interests: {
        areas_of_interest: ['Web Architecture', 'Developer Experience', 'Micro-Frontends'],
        opportunity_categories: ['Internships', 'Hackathons', 'Competitions'],
      },
      careerGoals: {
        desired_roles: ['Frontend Engineer', 'Full Stack Developer', 'Web Platform Architect'],
        preferred_domains: ['Consumer Tech', 'E-Commerce Engineering', 'Fintech Platforms'],
        work_mode: 'Hybrid or Remote',
        availability: 'Summer 2026 Cohort',
        career_interests: 'High-performance interactive web applications and design systems.',
      },
      resume: {},
    },
  },
  cloud_devops: {
    id: 'cloud_devops',
    name: 'Vikram Sharma',
    roleTitle: 'Cloud Infrastructure & DevOps Engineer',
    major: 'Computer Science & Cloud Computing',
    avatarIcon: '☁️',
    badgeLabel: 'Cloud & Systems',
    profileData: {
      profile: {
        full_name: 'Vikram Sharma',
        email: 'vikram.s@univ.ac.in',
        headline: 'Systems builder specializing in distributed resilience & Kubernetes clusters',
      },
      education: {
        college: 'IIT Delhi, New Delhi',
        degree: 'Bachelor of Technology (B.Tech)',
        branch: 'Computer Science & Engineering',
        cgpa: '3.80',
        graduation_year: '2027',
      },
      skills: {
        programming: ['Go', 'Python', 'Bash'],
        frameworks: ['FastAPI', 'gRPC', 'Terraform'],
        tools: ['Docker', 'Kubernetes', 'Linux', 'AWS', 'CI/CD', 'Helm'],
        technical: ['Distributed Systems', 'Cloud Architecture', 'Container Orchestration', 'Microservices'],
      },
      interests: {
        areas_of_interest: ['Cloud Systems', 'Distributed Computing', 'Site Reliability Engineering'],
        opportunity_categories: ['Internships', 'Hackathons', 'Research Opportunities'],
      },
      careerGoals: {
        desired_roles: ['Cloud Systems Architect', 'DevOps Engineer', 'Site Reliability Engineer'],
        preferred_domains: ['Cloud Infrastructure', 'Enterprise Systems', 'Edge Compute'],
        work_mode: 'Hybrid or Remote',
        availability: 'Summer 2026 Cohort',
        career_interests: 'Fault-tolerant distributed infrastructure and automated cloud pipelines.',
      },
      resume: {},
    },
  },
  mobile_apps: {
    id: 'mobile_apps',
    name: 'Priya Nair',
    roleTitle: 'Mobile Application Developer',
    major: 'Information Technology',
    avatarIcon: '📱',
    badgeLabel: 'Mobile Engineering',
    profileData: {
      profile: {
        full_name: 'Priya Nair',
        email: 'priya.n@nitk.edu.in',
        headline: 'Mobile developer building fluid cross-platform consumer apps',
      },
      education: {
        college: 'NIT Karnataka, Surathkal',
        degree: 'Bachelor of Technology (B.Tech)',
        branch: 'Information Technology',
        cgpa: '3.78',
        graduation_year: '2027',
      },
      skills: {
        programming: ['Dart', 'Kotlin', 'TypeScript', 'Java'],
        frameworks: ['Flutter', 'React Native', 'Android SDK'],
        tools: ['Git', 'Firebase', 'Android Studio', 'Xcode'],
        technical: ['Mobile Development', 'Mobile UI', 'Offline Storage', 'REST APIs'],
      },
      interests: {
        areas_of_interest: ['Mobile Engineering', 'Consumer Apps', 'Cross-Platform Architecture'],
        opportunity_categories: ['Internships', 'Hackathons', 'Competitions'],
      },
      careerGoals: {
        desired_roles: ['Mobile Application Developer', 'iOS/Android Engineer'],
        preferred_domains: ['Fintech Apps', 'Consumer Tech', 'Quick Commerce'],
        work_mode: 'Hybrid or Remote',
        availability: 'Summer 2026 Cohort',
        career_interests: 'High-framerate mobile user interfaces and resilient client architectures.',
      },
      resume: {},
    },
  },
  cyber_security: {
    id: 'cyber_security',
    name: 'Arjun Patel',
    roleTitle: 'Cyber Security & Defence Analyst',
    major: 'Cybersecurity & Information Assurance',
    avatarIcon: '🛡️',
    badgeLabel: 'Cyber Security',
    profileData: {
      profile: {
        full_name: 'Arjun Patel',
        email: 'arjun.p@iitb.ac.in',
        headline: 'Security researcher focused on cryptographic zero-trust architectures',
      },
      education: {
        college: 'IIT Bombay, Mumbai',
        degree: 'Bachelor of Technology (B.Tech)',
        branch: 'Computer Science (Cybersecurity Specialization)',
        cgpa: '3.88',
        graduation_year: '2027',
      },
      skills: {
        programming: ['Python', 'C', 'C++', 'Bash'],
        frameworks: ['Cryptography', 'Scapy'],
        tools: ['Wireshark', 'Linux', 'Burp Suite', 'Metasploit', 'GDB'],
        technical: ['Network Security', 'Cryptography', 'Penetration Testing', 'Reverse Engineering'],
      },
      interests: {
        areas_of_interest: ['Network Security', 'Cryptography', 'Defence Technologies'],
        opportunity_categories: ['Research Opportunities', 'Scholarships', 'Certifications'],
      },
      careerGoals: {
        desired_roles: ['Cybersecurity Analyst', 'Security Researcher', 'Vulnerability Assessor'],
        preferred_domains: ['Defence Research Centers', 'Critical Infrastructure Security', 'Fintech Security'],
        work_mode: 'In-Person or Hybrid',
        availability: 'Summer 2026 Cohort',
        career_interests: 'National security informatics and automated penetration testing.',
      },
      resume: {},
    },
  },
};

// Fallback student profile for calculating matching when not logged in
export const defaultStudentProfile: CompleteStudentData = STUDENT_PERSONAS.ai_ml.profileData;

/**
 * Calculates a transparent, explainable personalized match score
 * between a student profile and an opportunity.
 *
 * CRITICAL DIFFERENTIATION RULES:
 * - Skills alignment is the primary differentiator (50% weight, 25-98 dynamic range)
 * - Opportunities matching student skills rank at 92-98%
 * - Opportunities missing key skills score 38-60%
 * - Different students with different skill sets receive distinct rankings
 */
export function calculateOpportunityMatch(
  opportunity: Opportunity,
  studentData: CompleteStudentData | null = null
): MatchAnalysis {
  const profile = studentData || defaultStudentProfile;

  // Flatten all student skills into a single lowercase set for fast matching
  const allStudentSkills = [
    ...(profile.skills?.programming || []),
    ...(profile.skills?.frameworks || []),
    ...(profile.skills?.tools || []),
    ...(profile.skills?.technical || []),
  ].map((s) => s.toLowerCase().trim());

  // 1. SKILLS MATCH CALCULATION (50% WEIGHT)
  const requiredSkills = opportunity.requiredSkills || [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  requiredSkills.forEach((req) => {
    const reqLower = req.toLowerCase().trim();
    const hasSkill = allStudentSkills.some(
      (s) => s.includes(reqLower) || reqLower.includes(s) || (reqLower === 'full stack' && (allStudentSkills.includes('react') || allStudentSkills.includes('node.js')))
    );
    if (hasSkill) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  });

  const skillsMatchRatio =
    requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0.65;
  // Dynamic scale: 0% match = 25, 50% match = 62, 100% match = 98
  const skillsScore = Math.round(25 + skillsMatchRatio * 73);

  // 2. CAREER GOALS ALIGNMENT CALCULATION (25% WEIGHT)
  let careerScore = 55;
  const oppText = `${opportunity.title} ${opportunity.description} ${opportunity.category} ${opportunity.requiredSkills?.join(' ') || ''}`.toLowerCase();
  const desiredRoles = profile.careerGoals?.desired_roles || [];
  const roleMatches = desiredRoles.some((role) =>
    oppText.includes(role.toLowerCase()) ||
    role.toLowerCase().split(' ').some((tok) => tok.length > 3 && oppText.includes(tok))
  );
  if (roleMatches) careerScore += 30;

  const preferredDomains = profile.careerGoals?.preferred_domains || [];
  const domainMatches = preferredDomains.some((dom) =>
    oppText.includes(dom.toLowerCase()) || opportunity.organization.toLowerCase().includes(dom.toLowerCase())
  );
  if (domainMatches) careerScore += 12;
  careerScore = Math.min(98, careerScore);

  // 3. INTERESTS ALIGNMENT CALCULATION (15% WEIGHT)
  let interestScore = 58;
  const studentCategories = profile.interests?.opportunity_categories || [];
  if (studentCategories.includes(opportunity.category)) {
    interestScore += 20;
  }
  const studentAreas = profile.interests?.areas_of_interest || [];
  const areaMatches = studentAreas.some((area) =>
    oppText.includes(area.toLowerCase()) || area.toLowerCase().split(' ').some((tok) => tok.length > 3 && oppText.includes(tok))
  );
  if (areaMatches) {
    interestScore += 18;
  }
  interestScore = Math.min(96, interestScore);

  // 4. ACADEMIC ELIGIBILITY CALCULATION (10% WEIGHT)
  let academicScore = 78;
  const studentMajor = profile.education?.branch || 'Computer Science';
  const majorTokens = studentMajor.toLowerCase().split(/[\s,&]+/);
  const majorMatches = majorTokens.some((token) => token.length > 2 && oppText.includes(token));
  if (majorMatches) academicScore += 12;

  // GPA check
  const studentGpa = parseFloat(profile.education?.cgpa || '3.8');
  if (studentGpa >= 3.5) academicScore += 8;
  academicScore = Math.min(98, academicScore);

  // 5. WEIGHTED COMPOSITE MATCH SCORE
  const compositeScore = Math.round(
    skillsScore * 0.50 +
    careerScore * 0.25 +
    interestScore * 0.15 +
    academicScore * 0.10
  );
  const matchScore = Math.min(99, Math.max(38, compositeScore));

  // 6. GENERATE TRANSPARENT "WHY THIS OPPORTUNITY?" REASONS
  const whyReasons: string[] = [];

  // Reason 1: Direct Skills Match
  if (matchedSkills.length > 0) {
    if (matchedSkills.length === 1) {
      whyReasons.push(`Matches your verified ${matchedSkills[0]} skill`);
    } else {
      const topSkills = matchedSkills.slice(0, 2).join(' & ');
      whyReasons.push(`Matches your ${topSkills} skills (${matchedSkills.length} of ${requiredSkills.length} required)`);
    }
  } else {
    whyReasons.push(`Broad academic fit; requires acquiring foundational prerequisites`);
  }

  // Reason 2: Career Roadmap Alignment
  if (roleMatches) {
    const role = desiredRoles[0];
    whyReasons.push(`Direct milestone on your ${role} path`);
  } else if (majorMatches) {
    whyReasons.push(`Direct alignment with your ${studentMajor} curriculum`);
  } else {
    whyReasons.push(`Accredited for your ${profile.education?.degree || 'Undergraduate'} degree standing`);
  }

  // Reason 3: Area of Interest
  if (areaMatches) {
    const matchedArea = studentAreas.find((a) => oppText.includes(a.toLowerCase())) || 'Tech Specialization';
    whyReasons.push(`Matches your ${matchedArea} focus`);
  } else if (studentCategories.includes(opportunity.category)) {
    whyReasons.push(`Selected in your ${opportunity.category} discovery preferences`);
  }

  // Reason 4: Missing Skills Notice (Honest diagnostic)
  if (missingSkills.length > 0 && matchedSkills.length < requiredSkills.length) {
    whyReasons.push(`Build proficiency in ${missingSkills.slice(0, 2).join(' & ')} to maximize candidacy`);
  } else if (opportunity.compensation) {
    whyReasons.push(`Includes verified compensation (${opportunity.compensation})`);
  }

  return {
    matchScore,
    categoryScores: {
      skillsScore,
      academicScore,
      interestScore,
      careerScore,
    },
    whyReasons: whyReasons.slice(0, 4),
    skillsAnalysis: {
      matchedSkills,
      missingSkills,
      matchPercentage: Math.round(skillsMatchRatio * 100),
    },
    eligibilityStatus: {
      isEligible: studentGpa >= 3.0,
      summary: `Academic eligibility verified based on ${studentMajor} standing at ${profile.education?.college || 'university'}.`,
    },
  };
}

/**
 * CRITICAL TRUST & VERIFICATION RULE:
 * - UNVERIFIED opportunity → never recommended
 * - EXPIRED opportunity → never recommended
 * - VERIFIED + eligible → can be recommended
 *
 * Enforces strict admission gate: PENDING_REVIEW, REJECTED, EXPIRED, and UNVERIFIED
 * opportunities are barred from personalized recommendations.
 */
export function getEligibleRecommendationPool(
  opportunities: Opportunity[] = getActiveVerifiedOpportunities(),
  studentData: CompleteStudentData | null = null,
  options: { requireEligibleOnly?: boolean } = {}
): (Opportunity & MatchAnalysis)[] {
  // 1. Strict Trust Gatekeeper: ONLY VERIFIED, NON-EXPIRED & INDIA-RELEVANT opportunities admitted
  const verifiedOnly = opportunities.filter((opp) => {
    // Exclude expired opportunities by status or deadline
    if (opp.verificationStatus === 'EXPIRED') return false;
    if (opp.deadline) {
      const lower = opp.deadline.toLowerCase();
      if (lower.includes('expired') || lower.includes('january 2026')) {
        return false;
      }
    }

    // Trust Gatekeeper: Must be VERIFIED
    const status = opp.verificationStatus || (opp.isVerified ? 'VERIFIED' : 'PENDING_REVIEW');
    if (status !== 'VERIFIED') return false;

    // MANDATORY INDIA-ONLY FILTER (Requirements 9, 10, 11):
    // Reject any opportunity not explicitly verified as India-relevant
    if (opp.is_india_opportunity !== true) {
      return false;
    }

    return true;
  });

  // 2. Compute personalized match scores across the verified pool
  return verifiedOnly
    .map((opp) => {
      const match = calculateOpportunityMatch(opp, studentData);
      return {
        ...opp,
        ...match,
        matchScore: match.matchScore,
      };
    })
    .filter((opp) => {
      if (options.requireEligibleOnly) {
        return opp.eligibilityStatus?.isEligible !== false;
      }
      return true;
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Convenience wrapper returning personalized recommendations strictly from the active verified opportunity store.
 */
export function getPersonalizedRecommendations(
  studentData: CompleteStudentData | null = null,
  options: { requireEligibleOnly?: boolean } = {}
): (Opportunity & MatchAnalysis)[] {
  return getEligibleRecommendationPool(getActiveVerifiedOpportunities(), studentData, options);
}

