import { Opportunity } from '@/types';
import { CompleteStudentData } from './supabaseService';
import { mockOpportunities } from '@/data/mockData';

export interface CourseRecommendation {
  id: string;
  skill: string;
  title: string;
  provider: string;
  platform: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  reviewsCount: string;
  description: string;
  syllabus: string[];
  link: string;
  badgeText?: string;
}

export interface CertificationRecommendation {
  id: string;
  skill: string;
  title: string;
  issuer: string;
  duration: string;
  validity: string;
  examFormat: string;
  description: string;
  link: string;
  recognizedBy: string;
}

export interface ResourceRecommendation {
  id: string;
  skill: string;
  title: string;
  type: 'Interactive Lab' | 'Research Paper Guide' | 'Documentation' | 'GitHub Repository' | 'Cheat Sheet';
  source: string;
  description: string;
  link: string;
  difficulty: string;
}

export interface RoadmapMilestone {
  id: string;
  phase: number;
  title: string;
  description: string;
  type: 'Course' | 'Project' | 'Paper' | 'Practice';
  estimatedDays: number;
  targetSkill: string;
  completed: boolean;
  deliverable: string;
}

export interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  subtitle: string;
  durationWeeks: string;
  targetSkills: string[];
  milestones: RoadmapMilestone[];
}

export interface SkillGapAnalysisResult {
  targetOpportunity: Opportunity;
  requiredSkills: string[];
  studentSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  coveragePercentage: number;
  estimatedWeeksToBridge: number;
  initialMatchScore: number;
  projectedMatchScore: number;
  courses: CourseRecommendation[];
  certifications: CertificationRecommendation[];
  resources: ResourceRecommendation[];
  phases: RoadmapPhase[];
}

const STORAGE_PREFIX = 'pathsync_skill_roadmap_';

// --------------------------------------------------------------------------
// Curated Database of Learning Recommendations per Skill
// --------------------------------------------------------------------------
const CURATED_COURSES: Record<string, CourseRecommendation[]> = {
  Statistics: [
    {
      id: 'crs-stat-1',
      skill: 'Statistics',
      title: 'Statistical Learning & Probability for AI Researchers',
      provider: 'Stanford Center for Professional Development',
      platform: 'Stanford Online',
      duration: '4 Weeks • 6 hrs/week',
      level: 'Intermediate',
      rating: 4.9,
      reviewsCount: '3.4k reviews',
      description:
        'Rigorous treatment of multivariate hypothesis testing, Bayesian parameter estimation, empirical risk minimization, and bootstrap sampling.',
      syllabus: [
        'Probability density formulations & Expectation maximization',
        'Parametric vs Non-parametric hypothesis testing',
        'Bayesian inference & Markov Chain Monte Carlo',
        'P-value hacking avoidance & empirical significance in ML',
      ],
      link: 'https://online.stanford.edu/courses/stats-learning',
      badgeText: 'Faculty Endorsed',
    },
    {
      id: 'crs-stat-2',
      skill: 'Statistics',
      title: 'Foundations of Empirical Data Analysis & Inference',
      provider: 'MIT Department of Mathematics & EECS',
      platform: 'MIT OpenCourseWare',
      duration: '5 Weeks • 5 hrs/week',
      level: 'Advanced',
      rating: 4.8,
      reviewsCount: '2.1k reviews',
      description:
        'Mathematical formulation of estimation theory, central limit theorems in high dimensions, and confidence interval propagation.',
      syllabus: [
        'High-dimensional random vectors & covariance matrices',
        'Maximum Likelihood Estimation (MLE) asymptotic optimality',
        'Regression diagnostics & residual variance analysis',
      ],
      link: 'https://ocw.mit.edu/courses/mathematics/statistics',
    },
  ],
  'Research basics': [
    {
      id: 'crs-res-1',
      skill: 'Research basics',
      title: 'Scientific Research Methodology & Computing Paper Writing',
      provider: 'Carnegie Mellon University AI Initiative',
      platform: 'Coursera Academic',
      duration: '3 Weeks • 4 hrs/week',
      level: 'Intermediate',
      rating: 4.9,
      reviewsCount: '1.8k reviews',
      description:
        'Learn how to formulate formal research hypotheses, design controlled ablation studies, construct reproducible evaluation harnesses, and draft NeurIPS/ICLR format papers.',
      syllabus: [
        'Formulating novel hypotheses from existing literature',
        'Ablation test matrices & statistical baselines',
        'LaTeX drafting with conference formatting standards',
        'Ethics, reproducibility checklists & code artifact publishing',
      ],
      link: 'https://cmu.edu/ai/research-methods',
      badgeText: 'Lab Prerequisite',
    },
    {
      id: 'crs-res-2',
      skill: 'Research basics',
      title: 'Empirical AI Experimentation & Benchmarking Harnesses',
      provider: 'DeepLearning.AI',
      platform: 'DeepLearning.AI Portal',
      duration: '2 Weeks • 5 hrs/week',
      level: 'Intermediate',
      rating: 4.8,
      reviewsCount: '4.2k reviews',
      description:
        'Hands-on lab training on tracking experiments with Weights & Biases, establishing seed consistency, and computing confidence intervals over multi-run models.',
      syllabus: [
        'Experiment orchestration & artifact versioning',
        'Statistical significance of validation metrics',
        'Benchmark dataset curation and leakage prevention',
      ],
      link: 'https://deeplearning.ai/courses/empirical-ai',
    },
  ],
  ROS2: [
    {
      id: 'crs-ros-1',
      skill: 'ROS2',
      title: 'ROS2 Robotics Architecture & Node Communication',
      provider: 'Open Robotics Foundation',
      platform: 'Robotics Academy',
      duration: '4 Weeks • 6 hrs/week',
      level: 'Intermediate',
      rating: 4.8,
      reviewsCount: '1.2k reviews',
      description:
        'Master ROS2 composition, DDS middleware protocols, custom message types, and real-time pub/sub node pipelines.',
      syllabus: ['ROS2 nodes, publishers, and subscribers', 'Action servers and services', 'DDS QoS profiles'],
      link: 'https://ros.org',
    },
  ],
  'Computer Vision': [
    {
      id: 'crs-cv-1',
      skill: 'Computer Vision',
      title: 'Deep Learning for Computer Vision & Spatial Models',
      provider: 'University of Michigan',
      platform: 'edX Online',
      duration: '5 Weeks • 6 hrs/week',
      level: 'Advanced',
      rating: 4.9,
      reviewsCount: '5.1k reviews',
      description:
        'Convolutional backbones, Vision Transformers (ViT), object detection architectures (YOLOv9, DETR), and depth estimation.',
      syllabus: ['Attention mechanisms in vision', 'Object detection & segmentation', '3D vision & SLAM'],
      link: 'https://umich.edu',
    },
  ],
  Go: [
    {
      id: 'crs-go-1',
      skill: 'Go',
      title: 'Concurrent Systems & Microservices in Golang',
      provider: 'Google Cloud Training',
      platform: 'Coursera',
      duration: '3 Weeks • 5 hrs/week',
      level: 'Intermediate',
      rating: 4.8,
      reviewsCount: '6.7k reviews',
      description:
        'Goroutines, channels, mutex synchronization, context cancellation, and gRPC communication protocols.',
      syllabus: ['Goroutines & Channel multiplexing', 'Context propagation', 'gRPC & Protobuf serialization'],
      link: 'https://go.dev',
    },
  ],
};

const CURATED_CERTS: Record<string, CertificationRecommendation[]> = {
  Statistics: [
    {
      id: 'cert-stat-1',
      skill: 'Statistics',
      title: 'Professional Certificate in Applied Statistics & Machine Learning',
      issuer: 'Stanford Center for Professional Development',
      duration: 'Exam + 3 Capstones (Approx. 6 Weeks)',
      validity: 'Lifetime Verified Credential',
      examFormat: 'Proctored Mathematical Examination & Statistical Code Audit',
      description:
        'Accredited institutional certificate validating mathematical rigor in probability models, stochastic processes, and empirical hypothesis testing.',
      link: 'https://online.stanford.edu/programs/applied-statistics-certificate',
      recognizedBy: 'Stanford AI Lab, OpenAI, DeepMind, Top Research Universities',
    },
  ],
  'Research basics': [
    {
      id: 'cert-res-1',
      skill: 'Research basics',
      title: 'Frontier AI Research Fellow Certification (FAIR-C)',
      issuer: 'AI Research & Education Consortium',
      duration: 'Independent Capstone Review (Approx. 4 Weeks)',
      validity: '3 Years Active Credential',
      examFormat: 'Double-Blind Peer-Reviewed Replication Paper & Code Benchmark',
      description:
        'Demonstrates ability to independently reproduce an existing academic paper, implement clean ablation experiments, and author a publication-ready report.',
      link: 'https://ai-consortium.org/fair-certification',
      recognizedBy: 'National Science Foundation Affiliates, IEEE, ACM',
    },
  ],
  ROS2: [
    {
      id: 'cert-ros-1',
      skill: 'ROS2',
      title: 'Certified ROS2 Developer (CR2D)',
      issuer: 'Open Source Robotics Foundation (OSRF)',
      duration: 'Practical Hands-on Simulation Exam',
      validity: 'Permanent Credential',
      examFormat: 'Live Navigation & Node Debugging Scenario',
      description: 'Verifies proficiency in designing robotic control algorithms and sensor telemetry pipelines.',
      link: 'https://osrf.org',
      recognizedBy: 'MIT Robotics, Boston Dynamics, NASA JPL',
    },
  ],
  'Computer Vision': [
    {
      id: 'cert-cv-1',
      skill: 'Computer Vision',
      title: 'Professional Certificate in Vision AI Systems',
      issuer: 'NVIDIA Deep Learning Institute',
      duration: '4 Proctored Labs',
      validity: '2 Years Credential',
      examFormat: 'TensorRT Acceleration & Detection Pipeline Benchmark',
      description: 'Hands-on validation of GPU-accelerated spatial inference and segmentation architectures.',
      link: 'https://nvidia.com/dli',
      recognizedBy: 'Autonomous Vehicle & Robotics Engineering Labs',
    },
  ],
  Go: [
    {
      id: 'cert-go-1',
      skill: 'Go',
      title: 'Certified Cloud Native Go Architect',
      issuer: 'Cloud Native Computing Foundation (CNCF)',
      duration: 'Hands-on Performance Exam',
      validity: '3 Years Credential',
      examFormat: 'Distributed Systems Debugging & Concurrency Benchmarking',
      description: 'Certifies high-throughput systems design, memory profiling, and race condition remediation.',
      link: 'https://cncf.io',
      recognizedBy: 'Kubernetes Maintainers, Docker, Google Cloud',
    },
  ],
};

const CURATED_RESOURCES: Record<string, ResourceRecommendation[]> = {
  Statistics: [
    {
      id: 'res-stat-1',
      skill: 'Statistics',
      title: 'An Introduction to Statistical Learning (ISLR Python Edition)',
      type: 'Documentation',
      source: 'James, Witten, Hastie, Tibshirani (Springer Free Textbook)',
      description:
        'The gold-standard reference for statistical concepts in machine learning with complete Python Jupyter notebooks for all chapters.',
      link: 'https://www.statlearning.com',
      difficulty: 'Intermediate',
    },
    {
      id: 'res-stat-2',
      skill: 'Statistics',
      title: 'Interactive Hypothesis Testing & Distribution Visualizer',
      type: 'Interactive Lab',
      source: 'Seeing Theory (Brown University Interactive Tool)',
      description:
        'Visual interactive simulations exploring Bayesian inference, random variables, and central limit theorems directly in the browser.',
      link: 'https://seeing-theory.brown.edu',
      difficulty: 'Beginner to Intermediate',
    },
    {
      id: 'res-stat-3',
      skill: 'Statistics',
      title: 'Statistical Testing for Machine Learning Cheat Sheet',
      type: 'Cheat Sheet',
      source: 'PathSync Academic Knowledge Base',
      description:
        'Comprehensive 4-page reference card covering t-tests, ANOVA, Mann-Whitney U, Wilcoxon signed-rank, and Bonferroni corrections.',
      link: '#',
      difficulty: 'All Levels',
    },
  ],
  'Research basics': [
    {
      id: 'res-res-1',
      skill: 'Research basics',
      title: 'How to Read & Critique Academic Computer Science Papers',
      type: 'Research Paper Guide',
      source: 'Stanford CS Research Guide (Prof. S. Keshav Methodology)',
      description:
        'The classical three-pass approach to efficiently analyzing academic papers, synthesizing contributions, and identifying experimental flaws.',
      link: 'https://web.stanford.edu/class/cs244/papers/HowtoReadPaper.pdf',
      difficulty: 'Beginner',
    },
    {
      id: 'res-res-2',
      skill: 'Research basics',
      title: 'Papers With Code Benchmark Replication Template Harness',
      type: 'GitHub Repository',
      source: 'GitHub Open Source Community',
      description:
        'Pre-configured PyTorch experimentation harness with modular configs (Hydra), logging (Wandb), seed management, and automatic LaTeX table generation.',
      link: 'https://github.com/paperswithcode/paper-template',
      difficulty: 'Intermediate',
    },
    {
      id: 'res-res-3',
      skill: 'Research basics',
      title: 'Official NeurIPS & ICLR LaTeX Style Guidelines & Checklist',
      type: 'Documentation',
      source: 'Conference on Neural Information Processing Systems',
      description:
        'Official templates, author guidelines, reproducibility checklist, and reviewer scoring rubric for computer science submissions.',
      link: 'https://neurips.cc/Conferences/2026/CallForPapers',
      difficulty: 'Intermediate',
    },
  ],
};

// --------------------------------------------------------------------------
// Core Service Helper: Extract Flattened Student Skills
// --------------------------------------------------------------------------
export function getFlattenedStudentSkills(studentData?: CompleteStudentData | null): string[] {
  if (studentData?.skills) {
    return [
      ...(studentData.skills.programming || []),
      ...(studentData.skills.frameworks || []),
      ...(studentData.skills.tools || []),
      ...(studentData.skills.technical || []),
    ];
  }

  // Realistic default profile matching prompt demonstration
  return [
    'Python',
    'Machine Learning',
    'PyTorch',
    'FastAPI',
    'Docker',
    'Git',
    'Linux',
    'Data Structures',
    'SQL',
  ];
}

// --------------------------------------------------------------------------
// Roadmap Local Storage Milestone Persistence
// --------------------------------------------------------------------------
export function getSavedMilestones(oppId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${oppId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMilestoneToggle(oppId: string, milestoneId: string, completed: boolean): void {
  try {
    const current = getSavedMilestones(oppId);
    current[milestoneId] = completed;
    localStorage.setItem(`${STORAGE_PREFIX}${oppId}`, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save milestone progress:', err);
  }
}

// --------------------------------------------------------------------------
// Skill Gap Analysis Engine
// --------------------------------------------------------------------------
export function analyzeOpportunitySkillGap(
  opportunity: Opportunity,
  studentData?: CompleteStudentData | null
): SkillGapAnalysisResult {
  const studentSkills = getFlattenedStudentSkills(studentData);
  const requiredSkills = opportunity.requiredSkills || [];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  requiredSkills.forEach((req) => {
    const normalizedReq = req.trim().toLowerCase();
    const has = studentSkills.some((s) => {
      const normalizedStudent = s.trim().toLowerCase();
      return (
        normalizedStudent === normalizedReq ||
        normalizedStudent.includes(normalizedReq) ||
        normalizedReq.includes(normalizedStudent)
      );
    });

    if (has) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  });

  const totalReq = requiredSkills.length;
  const coveragePercentage = totalReq > 0 ? Math.round((matchedSkills.length / totalReq) * 100) : 100;

  // Approximate weeks to bridge based on number of missing skills
  const estimatedWeeksToBridge = Math.max(2, missingSkills.length * 2);

  const initialMatchScore = opportunity.matchScore || Math.max(65, coveragePercentage);
  const projectedMatchScore = Math.min(99, initialMatchScore + (100 - coveragePercentage) * 0.4);

  // Collect recommendations for all missing skills
  const courses: CourseRecommendation[] = [];
  const certifications: CertificationRecommendation[] = [];
  const resources: ResourceRecommendation[] = [];

  missingSkills.forEach((skill) => {
    if (CURATED_COURSES[skill]) {
      courses.push(...CURATED_COURSES[skill]);
    } else {
      // Dynamic fallback recommendation for any skill
      courses.push({
        id: `crs-dyn-${skill}`,
        skill,
        title: `${skill} Mastery & Applied Foundations`,
        provider: 'PathSync Accredited Curriculum Partner',
        platform: 'Online Learning Platform',
        duration: '3 Weeks • 5 hrs/week',
        level: 'Intermediate',
        rating: 4.8,
        reviewsCount: '1.5k reviews',
        description: `Comprehensive modular course targeted at mastering ${skill} fundamentals and applying it to real-world ${opportunity.category} rubrics.`,
        syllabus: [
          `Core concepts & architecture of ${skill}`,
          `Practical implementation exercises and debugging`,
          `Applied portfolio project satisfying ${opportunity.title} prerequisites`,
        ],
        link: 'https://coursera.org',
      });
    }

    if (CURATED_CERTS[skill]) {
      certifications.push(...CURATED_CERTS[skill]);
    } else {
      certifications.push({
        id: `cert-dyn-${skill}`,
        skill,
        title: `Professional Certificate in ${skill}`,
        issuer: 'Global Computing Credential Council',
        duration: '3 Weeks (Capstone Assessment)',
        validity: 'Permanent Verified Credential',
        examFormat: 'Live Code Examination & Portfolio Audit',
        description: `Industry-recognized competency standard certifying hands-on proficiency in ${skill}.`,
        link: 'https://credential.net',
        recognizedBy: 'Partner Research Labs & Industry Consortiums',
      });
    }

    if (CURATED_RESOURCES[skill]) {
      resources.push(...CURATED_RESOURCES[skill]);
    } else {
      resources.push({
        id: `res-dyn-${skill}`,
        skill,
        title: `${skill} Official Specifications & Architecture Guide`,
        type: 'Documentation',
        source: 'Open Source Community',
        description: `Authoritative guide, architectural reference, and best practices documentation for ${skill}.`,
        link: 'https://github.com',
        difficulty: 'Intermediate',
      });
    }
  });

  // If student has 0 missing skills, still provide advanced enhancement recommendations
  if (missingSkills.length === 0) {
    courses.push({
      id: 'crs-adv-mastery',
      skill: 'Advanced Specialization',
      title: 'Frontier AI System Benchmarks & Publication Mastery',
      provider: 'Stanford AI Lab Academic Consortium',
      platform: 'Stanford Online',
      duration: '3 Weeks • 4 hrs/week',
      level: 'Advanced',
      rating: 4.9,
      reviewsCount: '2.8k reviews',
      description:
        'Elevate your profile from qualified to top 1% fellowship candidate with advanced publication workflows.',
      syllabus: ['Multi-node cluster scaling', 'High-throughput inference tuning', 'Peer review rebuttal strategies'],
      link: 'https://online.stanford.edu',
      badgeText: 'Honors Track',
    });
  }

  // Build Personalized Multi-Phase Learning Roadmap
  const savedMilestoneMap = getSavedMilestones(opportunity.id);

  const phases: RoadmapPhase[] = [
    {
      phaseNumber: 1,
      title: 'Phase 1: Foundational Prerequisites',
      subtitle: 'Close core conceptual gaps and mathematical fundamentals',
      durationWeeks: 'Weeks 1–2',
      targetSkills: missingSkills.slice(0, 1).length > 0 ? [missingSkills[0]] : ['Foundations'],
      milestones: [
        {
          id: `${opportunity.id}-m1-1`,
          phase: 1,
          title: `Complete ${missingSkills[0] || 'Core'} Modular Coursework`,
          description: `Study theoretical foundations, probability distributions, and parameter estimation mechanics.`,
          type: 'Course',
          estimatedDays: 7,
          targetSkill: missingSkills[0] || 'Core',
          completed: Boolean(savedMilestoneMap[`${opportunity.id}-m1-1`]),
          deliverable: 'Course completion verification badge & problem set solutions',
        },
        {
          id: `${opportunity.id}-m1-2`,
          phase: 1,
          title: 'Practical Jupyter Notebooks & Diagnostic Problem Sets',
          description:
            'Implement key algorithms from scratch without high-level library abstraction to solidify understanding.',
          type: 'Practice',
          estimatedDays: 5,
          targetSkill: missingSkills[0] || 'Core',
          completed: Boolean(savedMilestoneMap[`${opportunity.id}-m1-2`]),
          deliverable: 'Clean GitHub repository with annotated code tests',
        },
      ],
    },
    {
      phaseNumber: 2,
      title: 'Phase 2: Methodological & Applied Competencies',
      subtitle: `Master ${missingSkills[1] || 'domain'} techniques required for lab residency`,
      durationWeeks: 'Weeks 3–4',
      targetSkills: missingSkills.slice(1, 2).length > 0 ? [missingSkills[1]] : ['Applied Techniques'],
      milestones: [
        {
          id: `${opportunity.id}-m2-1`,
          phase: 2,
          title: `Execute Controlled Experiments with ${missingSkills[1] || 'Research Methodology'}`,
          description:
            'Design baseline comparison tables, establish reproducibility seeds, and document ablation study matrices.',
          type: 'Project',
          estimatedDays: 8,
          targetSkill: missingSkills[1] || 'Research Methodology',
          completed: Boolean(savedMilestoneMap[`${opportunity.id}-m2-1`]),
          deliverable: 'Structured experiment log and ablation report',
        },
        {
          id: `${opportunity.id}-m2-2`,
          phase: 2,
          title: 'Academic Literature Critique & Paper Synthesis',
          description:
            'Conduct a formal literature review of 5 foundational papers cited in the target lab’s publications.',
          type: 'Paper',
          estimatedDays: 4,
          targetSkill: missingSkills[1] || 'Research basics',
          completed: Boolean(savedMilestoneMap[`${opportunity.id}-m2-2`]),
          deliverable: 'Literature survey summary PDF prepared for faculty interview',
        },
      ],
    },
    {
      phaseNumber: 3,
      title: 'Phase 3: Portfolio Capstone & Opportunity Readiness',
      subtitle: 'Compile verified artifacts to maximize admission probability',
      durationWeeks: 'Week 5',
      targetSkills: missingSkills,
      milestones: [
        {
          id: `${opportunity.id}-m3-1`,
          phase: 3,
          title: 'Capstone Mini-Project Aligned with Target Opportunity',
          description: `Build an open-source demonstration applying both ${missingSkills.join(' & ') || 'core skills'} to a real benchmark.`,
          type: 'Project',
          estimatedDays: 6,
          targetSkill: missingSkills.join(', ') || 'Capstone',
          completed: Boolean(savedMilestoneMap[`${opportunity.id}-m3-1`]),
          deliverable: 'Live GitHub repo with clean README, benchmark tables & interactive demo',
        },
        {
          id: `${opportunity.id}-m3-2`,
          phase: 3,
          title: 'Update PathSync Profile & Submit Application',
          description:
            'Add newly certified competencies to your PathSync profile to trigger 98%+ match score and submit verified portfolio.',
          type: 'Practice',
          estimatedDays: 1,
          targetSkill: 'Application Readiness',
          completed: Boolean(savedMilestoneMap[`${opportunity.id}-m3-2`]),
          deliverable: 'Official submission confirmation in Application Tracker',
        },
      ],
    },
  ];

  return {
    targetOpportunity: opportunity,
    requiredSkills,
    studentSkills,
    matchedSkills,
    missingSkills,
    coveragePercentage,
    estimatedWeeksToBridge,
    initialMatchScore,
    projectedMatchScore: Math.round(projectedMatchScore),
    courses,
    certifications,
    resources,
    phases,
  };
}

// --------------------------------------------------------------------------
// List all opportunities that can serve as target benchmarks
// --------------------------------------------------------------------------
export function getEligibleTargetOpportunities(): Opportunity[] {
  return mockOpportunities.filter(
    (o) => o.verificationStatus === 'VERIFIED' && o.requiredSkills && o.requiredSkills.length > 0
  );
}
