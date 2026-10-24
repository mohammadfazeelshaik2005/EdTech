import { Opportunity } from '@/types';
import { CompleteStudentData } from './supabaseService';
import { defaultStudentProfile } from './recommendationEngine';

export interface EligibilityItem {
  id: string;
  title: string;
  category: 'academic' | 'skills' | 'standing' | 'discipline';
  status: 'satisfied' | 'missing';
  detail: string;
  studentValue: string;
  requiredValue: string;
}

export interface LearningRecommendation {
  id: string;
  title: string;
  provider: string;
  estimatedTime: string;
  description: string;
  skillBadge: string;
  actionLabel: string;
}

export interface EligibilityReport {
  status: 'Eligible' | 'Not Currently Eligible';
  isEligible: boolean;
  scorePercentage: number;
  satisfiedRequirements: EligibilityItem[];
  missingRequirements: EligibilityItem[];
  howToBecomeEligible: {
    recommendations: LearningRecommendation[];
    advisingNotes: string[];
  };
  overallSummary: string;
}

/**
 * Curated bridge learning courses mapped by missing skill keywords.
 */
const BRIDGE_COURSES: Record<string, LearningRecommendation> = {
  bioinformatics: {
    id: 'bridge-bio',
    title: 'Computational Biology & Genomic Sequences with Python',
    provider: 'Broad Institute & Stanford Online',
    estimatedTime: '4 Weeks (12 Hours)',
    description: 'Master fastq sequence parsing, variant call analysis, and biopython neural model architectures.',
    skillBadge: '+Bioinformatics',
    actionLabel: 'Enroll in Bridge Module',
  },
  go: {
    id: 'bridge-go',
    title: 'High-Performance Go for Distributed Systems',
    provider: 'Cloud Native Computing Foundation (CNCF)',
    estimatedTime: '3 Weeks (9 Hours)',
    description: 'Build goroutine concurrency, gRPC microservices, and Raft consensus protocols in modern Go.',
    skillBadge: '+Go & Concurrency',
    actionLabel: 'Start Self-Paced Track',
  },
  ros2: {
    id: 'bridge-ros',
    title: 'ROS2 & Real-Time Autonomous Robotics Control',
    provider: 'MIT Open Learning',
    estimatedTime: '5 Weeks (15 Hours)',
    description: 'Learn sensor fusion, SLAM navigation, and real-time node publishing with ROS2 Humble.',
    skillBadge: '+ROS2 Robotics',
    actionLabel: 'Explore Robotics Lab',
  },
  cuda: {
    id: 'bridge-cuda',
    title: 'Accelerated GPU Parallelism with CUDA C++',
    provider: 'NVIDIA Deep Learning Institute (DLI)',
    estimatedTime: '3 Weeks (8 Hours)',
    description: 'GPU memory hierarchy, warp divergence, and PyTorch custom CUDA kernel extensions.',
    skillBadge: '+CUDA Acceleration',
    actionLabel: 'Access DLI Courseware',
  },
  'network protocols': {
    id: 'bridge-net',
    title: 'Low-Latency Systems & Network Architecture',
    provider: 'Systems Engineering Academy',
    estimatedTime: '4 Weeks (10 Hours)',
    description: 'In-depth socket programming, TCP/UDP tuning, and zero-copy ring buffers.',
    skillBadge: '+Network Protocols',
    actionLabel: 'Start Systems Course',
  },
  'computer architecture': {
    id: 'bridge-arch',
    title: 'Modern Computer Architecture & Memory Hierarchies',
    provider: 'UC Berkeley EECS OpenCourseWare',
    estimatedTime: '6 Weeks (18 Hours)',
    description: 'Pipelining, branch predictors, cache coherence, and out-of-order execution.',
    skillBadge: '+Computer Architecture',
    actionLabel: 'Review EECS Curriculum',
  },
};

/**
 * Evaluates full academic, skill, and institutional eligibility
 * for a student against a specific opportunity.
 */
export function checkOpportunityEligibility(
  opportunity: Opportunity,
  studentData: CompleteStudentData | null = null,
  overrideSkills?: string[],
  overrideCgpa?: string
): EligibilityReport {
  const profile = studentData || defaultStudentProfile;

  const satisfiedRequirements: EligibilityItem[] = [];
  const missingRequirements: EligibilityItem[] = [];

  // Flatten student skills
  const studentSkillsList = overrideSkills || [
    ...(profile.skills?.programming || []),
    ...(profile.skills?.frameworks || []),
    ...(profile.skills?.tools || []),
    ...(profile.skills?.technical || []),
  ];
  const lowerStudentSkills = studentSkillsList.map((s) => s.toLowerCase().trim());

  const currentCgpaStr = overrideCgpa || profile.education?.cgpa || '3.88';
  const studentCgpa = parseFloat(currentCgpaStr);
  const studentMajor = profile.education?.branch || 'Computer Science & Artificial Intelligence';
  const studentDegree = profile.education?.degree || 'Bachelor of Science (B.S.)';
  const studentGradYear = profile.education?.graduation_year || '2027';

  // ---------------------------------------------------------
  // 1. MINIMUM CGPA REQUIREMENT
  // ---------------------------------------------------------
  const oppEligibilityText = (opportunity.eligibility || '').toLowerCase();
  let requiredGpa = 3.0; // default institutional baseline

  if (oppEligibilityText.includes('3.9')) {
    requiredGpa = 3.9;
  } else if (oppEligibilityText.includes('3.7')) {
    requiredGpa = 3.7;
  } else if (oppEligibilityText.includes('3.5')) {
    requiredGpa = 3.5;
  } else if (oppEligibilityText.includes('3.2')) {
    requiredGpa = 3.2;
  }

  if (studentCgpa >= requiredGpa) {
    satisfiedRequirements.push({
      id: 'cgpa-check',
      title: 'Minimum CGPA Requirement',
      category: 'academic',
      status: 'satisfied',
      detail: `Your verified ${studentCgpa.toFixed(2)} CGPA satisfies and exceeds the ${requiredGpa.toFixed(2)} minimum requirement.`,
      studentValue: `${studentCgpa.toFixed(2)} CGPA`,
      requiredValue: `Min ${requiredGpa.toFixed(2)} CGPA`,
    });
  } else {
    missingRequirements.push({
      id: 'cgpa-check',
      title: 'Minimum CGPA Requirement',
      category: 'academic',
      status: 'missing',
      detail: `Requires a minimum ${requiredGpa.toFixed(2)} cumulative GPA. Your current recorded GPA is ${studentCgpa.toFixed(2)}.`,
      studentValue: `${studentCgpa.toFixed(2)} CGPA`,
      requiredValue: `Min ${requiredGpa.toFixed(2)} CGPA`,
    });
  }

  // ---------------------------------------------------------
  // 2. EDUCATION LEVEL & STANDING (Undergraduate vs Masters)
  // ---------------------------------------------------------
  const requiredLevel = opportunity.educationLevel || 'Undergraduate';
  const isStudentUndergrad = studentDegree.toLowerCase().includes('bachelor') || studentDegree.toLowerCase().includes('b.s');

  if (requiredLevel === 'Masters' && isStudentUndergrad) {
    // Requires Graduate standing
    missingRequirements.push({
      id: 'degree-standing-check',
      title: 'Degree Level & Graduate Standing',
      category: 'standing',
      status: 'missing',
      detail: 'This laboratory fellowship is designated exclusively for enrolled Masters / Graduate degree candidates. Your current profile indicates Undergraduate standing.',
      studentValue: studentDegree,
      requiredValue: 'Master of Science (M.S.) / Graduate',
    });
  } else {
    satisfiedRequirements.push({
      id: 'degree-standing-check',
      title: 'Academic Degree Standing',
      category: 'standing',
      status: 'satisfied',
      detail: `Open to ${requiredLevel} candidates. Your enrollment in ${studentDegree} (Graduation: ${studentGradYear}) is verified.`,
      studentValue: `${studentDegree} (Class of ${studentGradYear})`,
      requiredValue: `${requiredLevel} Standing`,
    });
  }

  // ---------------------------------------------------------
  // 3. DISCIPLINE / MAJOR ALIGNMENT
  // ---------------------------------------------------------
  const oppFullText = `${opportunity.title} ${opportunity.description} ${opportunity.eligibility || ''}`.toLowerCase();
  const majorTokens = studentMajor.toLowerCase().split(/[\s,&]+/);
  const majorMatches = majorTokens.some((token) => token.length > 2 && oppFullText.includes(token)) ||
    oppFullText.includes('stem') || oppFullText.includes('computer') || oppFullText.includes('engineering');

  if (majorMatches || requiredLevel === 'All Levels') {
    satisfiedRequirements.push({
      id: 'discipline-check',
      title: 'Discipline & Major Alignment',
      category: 'discipline',
      status: 'satisfied',
      detail: `Your degree program in ${studentMajor} matches the accredited discipline qualifications for this track.`,
      studentValue: studentMajor,
      requiredValue: 'Computer Science, STEM, or related discipline',
    });
  } else {
    missingRequirements.push({
      id: 'discipline-check',
      title: 'Discipline Alignment',
      category: 'discipline',
      status: 'missing',
      detail: `Host program prioritizes candidates enrolled in specialized disciplines specified in prerequisites.`,
      studentValue: studentMajor,
      requiredValue: 'Specific Technical Major',
    });
  }

  // ---------------------------------------------------------
  // 4. REQUIRED SKILLS & TECHNICAL PREREQUISITES
  // ---------------------------------------------------------
  const requiredSkills = opportunity.requiredSkills || [];

  requiredSkills.forEach((skill) => {
    const skillLower = skill.toLowerCase().trim();
    const hasSkill = lowerStudentSkills.some(
      (s) => s.includes(skillLower) || skillLower.includes(s)
    );

    if (hasSkill) {
      satisfiedRequirements.push({
        id: `skill-${skillLower}`,
        title: `Prerequisite Skill: ${skill}`,
        category: 'skills',
        status: 'satisfied',
        detail: `Verified proficiency in ${skill} is documented in your technical profile.`,
        studentValue: 'Verified in profile',
        requiredValue: skill,
      });
    } else {
      missingRequirements.push({
        id: `skill-${skillLower}`,
        title: `Missing Skill: ${skill}`,
        category: 'skills',
        status: 'missing',
        detail: `Required technical competency in ${skill} has not yet been verified in your profile credentials.`,
        studentValue: 'Not yet verified',
        requiredValue: skill,
      });
    }
  });

  // ---------------------------------------------------------
  // 5. DETERMINE OVERALL STATUS
  // ---------------------------------------------------------
  // Student is strictly Eligible if there are NO missing requirements in academic or standing,
  // and no more than 1 optional missing skill (or 0 for strict criteria).
  // For strict truthfulness: if any academic/standing requirement is missing, or any missing skill,
  // we declare "Not Currently Eligible".
  const isEligible = missingRequirements.length === 0;
  const status = isEligible ? 'Eligible' : 'Not Currently Eligible';

  const totalCriteria = satisfiedRequirements.length + missingRequirements.length;
  const scorePercentage = Math.round((satisfiedRequirements.length / Math.max(1, totalCriteria)) * 100);

  // ---------------------------------------------------------
  // 6. GENERATE "HOW CAN YOU BECOME ELIGIBLE?" RECOMMENDATIONS
  // ---------------------------------------------------------
  const recommendations: LearningRecommendation[] = [];
  const advisingNotes: string[] = [];

  missingRequirements.forEach((req) => {
    if (req.category === 'skills') {
      const skillName = req.requiredValue.toLowerCase().trim();
      // Find matching bridge course
      const matchedBridge = Object.entries(BRIDGE_COURSES).find(([key]) =>
        skillName.includes(key) || key.includes(skillName)
      );

      if (matchedBridge) {
        recommendations.push(matchedBridge[1]);
      } else {
        recommendations.push({
          id: `custom-bridge-${skillName}`,
          title: `Self-Paced Intensive: Foundation in ${req.requiredValue}`,
          provider: 'PathSync Accredited Curriculum Partner',
          estimatedTime: '2–3 Weeks (8 Hours)',
          description: `Acquire and verify foundational competencies in ${req.requiredValue} with hands-on code reviews.`,
          skillBadge: `+${req.requiredValue}`,
          actionLabel: `Explore ${req.requiredValue} Pathway`,
        });
      }
    } else if (req.id === 'degree-standing-check') {
      advisingNotes.push(
        'Faculty Prerequisite Waiver: Upper-division undergraduates with prior laboratory publications or faculty recommendations may petition for an admission waiver.'
      );
    } else if (req.id === 'cgpa-check') {
      advisingNotes.push(
        'GPA Verification & Petition: If you have recent uncalculated semester marks, upload an updated unofficial transcript to trigger an automated GPA recount.'
      );
    }
  });

  if (advisingNotes.length === 0 && !isEligible) {
    advisingNotes.push(
      'Schedule a peer advisement sync or consult the PathSync Faculty Liaison to review conditional eligibility guidelines.'
    );
  }

  const overallSummary = isEligible
    ? `You satisfy all ${satisfiedRequirements.length} verified eligibility criteria for this opportunity. Your application will be prioritized for admissions committee review.`
    : `You currently satisfy ${satisfiedRequirements.length} of ${totalCriteria} requirements. Resolving ${missingRequirements.length} missing item${missingRequirements.length > 1 ? 's' : ''} will unlock full eligibility.`;

  return {
    status,
    isEligible,
    scorePercentage,
    satisfiedRequirements,
    missingRequirements,
    howToBecomeEligible: {
      recommendations,
      advisingNotes,
    },
    overallSummary,
  };
}
