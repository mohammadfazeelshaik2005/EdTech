export interface SubCompetency {
  name: string;
  score: number;
  status: 'Mastered' | 'Proficient' | 'Needs Practice';
}

export interface ReadinessArea {
  id: string;
  name: string;
  shortName: string;
  category: 'Technical' | 'Practical' | 'Communication';
  score: number;
  weight: number;
  tier: 'Expert' | 'Advanced' | 'Proficient' | 'Needs Polish';
  summary: string;
  subCompetencies: SubCompetency[];
  isStrength: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ReadinessAction {
  id: string;
  areaId: string;
  title: string;
  description: string;
  estimatedEffort: string;
  impactScorePts: number;
  completed: boolean;
  resourceLink?: string;
  deliverable: string;
}

export interface ReadinessReport {
  overallScore: number;
  percentile: string;
  tierLabel: string;
  statusSummary: string;
  areas: ReadinessArea[];
  strengths: { area: string; title: string; detail: string; score: number }[];
  improvements: { area: string; title: string; detail: string; score: number; priority: 'High' | 'Medium' }[];
  recommendedActions: ReadinessAction[];
}

const STORAGE_KEY_ACTIONS = 'pathsync_readiness_actions_v1';

export const INITIAL_READINESS_AREAS: ReadinessArea[] = [
  {
    id: 'area-tech',
    name: 'Technical Skills',
    shortName: 'Tech Stack',
    category: 'Technical',
    score: 92,
    weight: 0.15,
    tier: 'Advanced',
    summary: 'Strong command of machine learning pipelines, cloud services, and production developer tooling.',
    subCompetencies: [
      { name: 'Machine Learning & PyTorch', score: 96, status: 'Mastered' },
      { name: 'Cloud Infrastructure (AWS/Docker)', score: 90, status: 'Mastered' },
      { name: 'Databases & SQL Optimization', score: 88, status: 'Proficient' },
      { name: 'Linux Shell & Git Workflows', score: 94, status: 'Mastered' },
    ],
    isStrength: true,
    priority: 'Low',
  },
  {
    id: 'area-dsa',
    name: 'DSA (Data Structures & Algorithms)',
    shortName: 'DSA',
    category: 'Technical',
    score: 78,
    weight: 0.15,
    tier: 'Proficient',
    summary: 'Solid foundational data structures knowledge; speed and edge-case handling in dynamic programming and graph theory need targeted practice.',
    subCompetencies: [
      { name: 'Arrays, Strings & HashMaps', score: 92, status: 'Mastered' },
      { name: 'Trees, Heaps & Tries', score: 84, status: 'Proficient' },
      { name: 'Dynamic Programming & Memoization', score: 68, status: 'Needs Practice' },
      { name: 'Graph Traversal & Shortest Path', score: 72, status: 'Needs Practice' },
    ],
    isStrength: false,
    priority: 'High',
  },
  {
    id: 'area-prog',
    name: 'Programming',
    shortName: 'Coding Fluency',
    category: 'Technical',
    score: 94,
    weight: 0.15,
    tier: 'Expert',
    summary: 'Exceptional language idiomatic fluency in Python, modern C++, and TypeScript with robust modular test architecture.',
    subCompetencies: [
      { name: 'Python Idiomatic Design & OOP', score: 98, status: 'Mastered' },
      { name: 'C++ Systems & Memory Model', score: 90, status: 'Mastered' },
      { name: 'Modular Architecture & Clean Code', score: 95, status: 'Mastered' },
      { name: 'Unit Testing & Pytest/CI', score: 92, status: 'Mastered' },
    ],
    isStrength: true,
    priority: 'Low',
  },
  {
    id: 'area-comm',
    name: 'Communication',
    shortName: 'Communication',
    category: 'Communication',
    score: 80,
    weight: 0.10,
    tier: 'Proficient',
    summary: 'Articulate technical explainer; structuring behavioral responses around the STAR framework will strengthen interview conversion.',
    subCompetencies: [
      { name: 'Technical Concept Explanation', score: 88, status: 'Proficient' },
      { name: 'STAR Behavioral Articulation', score: 72, status: 'Needs Practice' },
      { name: 'Cross-Functional Team Collaboration', score: 84, status: 'Proficient' },
      { name: 'Research Paper Presentation', score: 86, status: 'Proficient' },
    ],
    isStrength: false,
    priority: 'Medium',
  },
  {
    id: 'area-resume',
    name: 'Resume',
    shortName: 'ATS Resume',
    category: 'Practical',
    score: 85,
    weight: 0.15,
    tier: 'Proficient',
    summary: 'Clean modern ATS-compliant format with strong technical vocabulary; project bullet points will benefit from quantified outcome metrics.',
    subCompetencies: [
      { name: 'ATS Parser Compatibility', score: 95, status: 'Mastered' },
      { name: 'Quantified Impact Metrics (XYZ Formula)', score: 76, status: 'Needs Practice' },
      { name: 'Format, Hierarchy & Typography', score: 90, status: 'Mastered' },
      { name: 'Keyword Alignment to Lab Rubrics', score: 88, status: 'Proficient' },
    ],
    isStrength: false,
    priority: 'Medium',
  },
  {
    id: 'area-projects',
    name: 'Projects',
    shortName: 'Portfolio',
    category: 'Practical',
    score: 93,
    weight: 0.15,
    tier: 'Expert',
    summary: 'Standout open-source portfolio with real-world transformer reproduction, live Docker deployment, and active GitHub stars.',
    subCompetencies: [
      { name: 'Code Quality & GitHub Activity', score: 96, status: 'Mastered' },
      { name: 'Live Deployment & Demos', score: 92, status: 'Mastered' },
      { name: 'Documentation & System Architecture', score: 94, status: 'Mastered' },
      { name: 'Real-World Technical Complexity', score: 90, status: 'Mastered' },
    ],
    isStrength: true,
    priority: 'Low',
  },
  {
    id: 'area-interview',
    name: 'Interview Preparation',
    shortName: 'Interview Prep',
    category: 'Communication',
    score: 81,
    weight: 0.15,
    tier: 'Proficient',
    summary: 'Proficient in live code walkthroughs; requires additional mock rehearsals under strict 45-minute timed technical constraints.',
    subCompetencies: [
      { name: 'System Design Fundamentals', score: 78, status: 'Needs Practice' },
      { name: 'Live Whiteboard Thought Cadence', score: 84, status: 'Proficient' },
      { name: 'Edge Case Verification & Testing', score: 80, status: 'Proficient' },
      { name: 'Faculty & Technical Q&A Rehearsal', score: 82, status: 'Proficient' },
    ],
    isStrength: false,
    priority: 'Medium',
  },
];

export const INITIAL_ACTIONS: ReadinessAction[] = [
  {
    id: 'act-1',
    areaId: 'area-dsa',
    title: 'Solve 15 NeetCode Medium/Hard DP & Graph Patterns',
    description: 'Drill topological sorting, Dijkstra, and 2D dynamic programming memoization under a 25-minute timer.',
    estimatedEffort: '10–12 Hours',
    impactScorePts: 4,
    completed: false,
    deliverable: '15 verified submissions with optimal time/space complexity notes',
  },
  {
    id: 'act-2',
    areaId: 'area-comm',
    title: 'Draft STAR Behavioral Cards for 5 Core Themes',
    description: 'Structure concise 90-second narratives covering: Technical Disagreement, Critical Failure, Ambiguity, Leadership, and Complex Optimization.',
    estimatedEffort: '3 Hours',
    impactScorePts: 3,
    completed: true,
    deliverable: 'Written STAR response document reviewed with academic mentor',
  },
  {
    id: 'act-3',
    areaId: 'area-resume',
    title: 'Quantify Project Bullets with Google’s XYZ Formula',
    description: 'Update project descriptions to format: "Accomplished [X], as measured by [Y], by doing [Z]" with measurable latency/throughput figures.',
    estimatedEffort: '2 Hours',
    impactScorePts: 3,
    completed: false,
    deliverable: 'Revised 1-page PDF passing ATS check with 95%+ impact score',
  },
  {
    id: 'act-4',
    areaId: 'area-interview',
    title: 'Schedule 2 Peer Mock Technical Interviews',
    description: 'Conduct live audio/video coding simulations with peers or mentors on Pramp/Interviewing.io to practice vocalizing thought processes.',
    estimatedEffort: '4 Hours',
    impactScorePts: 5,
    completed: false,
    deliverable: 'Peer scorecard feedback highlighting communication cadence',
  },
  {
    id: 'act-5',
    areaId: 'area-projects',
    title: 'Add Architecture Diagram & Latency Benchmarks to Top Repo',
    description: 'Include visual ASCII/Mermaid architectural diagram, VRAM usage table, and multi-GPU throughput curves in the README.',
    estimatedEffort: '3 Hours',
    impactScorePts: 2,
    completed: true,
    deliverable: 'Updated GitHub README with professional documentation standard',
  },
];

export function getStoredActions(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveActionToggle(actionId: string, completed: boolean): void {
  try {
    const stored = getStoredActions();
    stored[actionId] = completed;
    localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(stored));
  } catch (err) {
    console.error('Failed to save action state:', err);
  }
}

export function getPlacementReadinessReport(): ReadinessReport {
  const storedActions = getStoredActions();

  // Combine actions with stored toggle state
  const actions: ReadinessAction[] = INITIAL_ACTIONS.map((a) => ({
    ...a,
    completed: storedActions[a.id] !== undefined ? storedActions[a.id] : a.completed,
  }));

  // Calculate weighted overall score
  const totalWeight = INITIAL_READINESS_AREAS.reduce((acc, a) => acc + a.weight, 0);
  const rawWeightedSum = INITIAL_READINESS_AREAS.reduce((acc, a) => acc + a.score * a.weight, 0);
  let baseScore = Math.round(rawWeightedSum / totalWeight);

  // Completed actions contribute positive points
  const bonusPts = actions.filter((a) => a.completed).length * 1.5;
  const overallScore = Math.min(99, Math.round(baseScore + bonusPts));

  // Strengths
  const strengths = [
    {
      area: 'Programming (94%)',
      title: 'Production Coding & Clean Architecture',
      detail: 'Demonstrates exceptional language fluency in Python and modern frameworks with structured test coverage, modular patterns, and clean git history.',
      score: 94,
    },
    {
      area: 'Projects (93%)',
      title: 'High-Impact Open-Source Portfolio',
      detail: 'Lead repository features real-world deployed deep learning pipelines, comprehensive documentation, and open-source community validation (120+ GitHub stars).',
      score: 93,
    },
    {
      area: 'Technical Skills (92%)',
      title: 'Deep Cloud & ML Tooling Competency',
      detail: 'Demonstrated proficiency in PyTorch, Linux internals, containerization (Docker/Kubernetes), and GPU acceleration hooks matching top lab standards.',
      score: 92,
    },
  ];

  // Areas for improvement
  const improvements = [
    {
      area: 'DSA (78%)',
      title: 'Dynamic Programming & Graph Traversal Speed',
      detail: 'Under timed 30-minute interview conditions, complex 2D state transitions and topological graphs take longer than the competitive threshold.',
      score: 78,
      priority: 'High' as const,
    },
    {
      area: 'Communication (80%)',
      title: 'Behavioral STAR Framework Articulation',
      detail: 'Situational and leadership prompt responses occasionally omit quantifiable result summaries. Needs structured practice adhering to the STAR method.',
      score: 80,
      priority: 'Medium' as const,
    },
    {
      area: 'Interview Prep (81%)',
      title: 'Live Whiteboard System Design Cadence',
      detail: 'Requires targeted practice vocalizing database trade-offs (SQL vs NoSQL, caching invalidation) and handling unexpected interviewer curveballs.',
      score: 81,
      priority: 'Medium' as const,
    },
    {
      area: 'Resume (85%)',
      title: 'Quantified Business & Research Impact',
      detail: 'Several project bullet points describe responsibilities rather than measurable outcomes. Incorporate Google XYZ metric benchmarks.',
      score: 85,
      priority: 'Medium' as const,
    },
  ];

  return {
    overallScore,
    percentile: 'Top 8th Percentile',
    tierLabel: 'Tier-1 Placement Ready',
    statusSummary: 'Highly competitive candidate for top research labs, tech residencies, and frontier computing fellowships.',
    areas: INITIAL_READINESS_AREAS,
    strengths,
    improvements,
    recommendedActions: actions,
  };
}

// ============================================================================
// PLACEMENT ASSESSMENT QUESTION BANK & EVALUATION ENGINE (Requirement 12 & 13)
// Sections: Aptitude, Logical Reasoning, Quantitative Ability, Verbal Ability,
// Programming / Technical, DSA Fundamentals, Core CS Concepts, Communication
// ============================================================================

import { AssessmentQuestion, AssessmentResult, AssessmentSectionId, SectionScore } from '@/types';

export const PLACEMENT_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // 1. Aptitude
  {
    id: 'q-apt-1',
    sectionId: 'aptitude',
    sectionTitle: 'Aptitude & Problem Solving',
    question: 'A train 180 meters long is running at a speed of 54 km/h. How many seconds will it take to pass an electric pole beside the track?',
    options: ['10 seconds', '12 seconds', '15 seconds', '18 seconds'],
    correctAnswer: 1, // 12 seconds: 54 * (5/18) = 15 m/s. 180 / 15 = 12s
    explanation: 'Convert 54 km/h to m/s: 54 × (5/18) = 15 m/s. Time = Distance / Speed = 180 / 15 = 12 seconds.',
    topic: 'Time & Distance',
  },
  {
    id: 'q-apt-2',
    sectionId: 'aptitude',
    sectionTitle: 'Aptitude & Problem Solving',
    question: 'A vendor buys lemons at 6 for ₹10 and sells them at 4 for ₹8. What is the net profit percentage?',
    options: ['15%', '20%', '25%', '30%'],
    correctAnswer: 1, // CP = 10/6 = 1.667. SP = 8/4 = 2.0. Profit% = (2 - 1.667)/1.667 = 20%
    explanation: 'Cost price per lemon = ₹10 / 6 = ₹1.67. Selling price per lemon = ₹8 / 4 = ₹2.00. Profit = ₹0.33. Profit percentage = (0.33 / 1.67) × 100 = 20%.',
    topic: 'Profit & Loss',
  },

  // 2. Logical Reasoning
  {
    id: 'q-log-1',
    sectionId: 'logical',
    sectionTitle: 'Logical Reasoning',
    question: 'If all Coders are Designers, and some Designers are Founders, which statement is logically guaranteed?',
    options: [
      'All Coders are Founders',
      'Some Coders may be Founders',
      'No Coder can be a Founder',
      'All Founders are Designers',
    ],
    correctAnswer: 1,
    explanation: 'Since all Coders are Designers and some Designers are Founders, Coders and Founders intersect potentially, but are not guaranteed to be identical.',
    topic: 'Syllogisms & Set Theory',
  },
  {
    id: 'q-log-2',
    sectionId: 'logical',
    sectionTitle: 'Logical Reasoning',
    question: 'Find the next term in the logical sequence: B2D, D4F, F8H, H16J, ?',
    options: ['J32L', 'J24L', 'K32L', 'I32K'],
    correctAnswer: 0,
    explanation: 'First letters increment by 2 (B, D, F, H, J). Numbers double each step (2, 4, 8, 16, 32). Third letters increment by 2 (D, F, H, J, L). Next term is J32L.',
    topic: 'Alphanumeric Patterns',
  },

  // 3. Quantitative Ability
  {
    id: 'q-quant-1',
    sectionId: 'quantitative',
    sectionTitle: 'Quantitative Ability',
    question: 'In how many different ways can the letters of the word "ENGINE" be arranged?',
    options: ['120', '180', '360', '720'],
    correctAnswer: 1, // 6! / (2! * 2!) = 720 / 4 = 180
    explanation: 'Word length is 6 with 2 E’s and 2 N’s. Total permutations = 6! / (2! × 2!) = 720 / 4 = 180.',
    topic: 'Permutations & Combinations',
  },
  {
    id: 'q-quant-2',
    sectionId: 'quantitative',
    sectionTitle: 'Quantitative Ability',
    question: 'Two fair 6-sided dice are rolled simultaneously. What is the probability of getting a sum greater than 9?',
    options: ['1/6', '5/36', '1/4', '7/36'],
    correctAnswer: 0, // Sum 10: (4,6),(5,5),(6,4)=3. Sum 11: (5,6),(6,5)=2. Sum 12: (6,6)=1. Total = 6 / 36 = 1/6
    explanation: 'Favorable pairs yielding sum 10, 11, or 12 are (4,6), (5,5), (6,4), (5,6), (6,5), and (6,6) = 6 outcomes. Probability = 6 / 36 = 1/6.',
    topic: 'Probability',
  },

  // 4. Verbal Ability
  {
    id: 'q-verb-1',
    sectionId: 'verbal',
    sectionTitle: 'Verbal Ability',
    question: 'Choose the grammatically sound sentence with precise vocabulary for an executive technical report:',
    options: [
      'The new algorithm effectively mitigated latency, while ensuring backwards compatibility.',
      'The new algorithm did good with the latency and also kept backwards compatibility.',
      'Latency was made low by the algorithm whom also kept old versions working.',
      'The algorithm effected latency reduction whereas keeping compatibility.',
    ],
    correctAnswer: 0,
    explanation: '"Mitigated latency, while ensuring backwards compatibility" uses formal, precise technical vocabulary correctly.',
    topic: 'Grammar & Professional Register',
  },
  {
    id: 'q-verb-2',
    sectionId: 'verbal',
    sectionTitle: 'Verbal Ability',
    question: 'Select the word most opposite in meaning to "PRAGMATIC":',
    options: ['Empirical', 'Idealistic', 'Rational', 'Expedient'],
    correctAnswer: 1,
    explanation: 'Pragmatic means practical and dealing with realistic consequences; idealistic relates to visionary perfection contrary to pure practicality.',
    topic: 'Vocabulary & Antonyms',
  },

  // 5. Programming / Technical Skills
  {
    id: 'q-prog-1',
    sectionId: 'programming',
    sectionTitle: 'Programming & Technical Skills',
    question: 'In Python, what is the time complexity of checking membership `x in s` when `s` is a built-in `set` vs a `list` of size N?',
    options: [
      'O(1) average for set, O(N) for list',
      'O(N) for set, O(1) for list',
      'O(log N) for set, O(log N) for list',
      'O(1) for both',
    ],
    correctAnswer: 0,
    explanation: 'Python `set` uses hash tables providing O(1) average lookup, whereas a `list` requires linear scan O(N).',
    topic: 'Data Types & Big-O Complexity',
  },
  {
    id: 'q-prog-2',
    sectionId: 'programming',
    sectionTitle: 'Programming & Technical Skills',
    question: 'Which of the following is true regarding concurrency and memory safety in systems programming?',
    options: [
      'Deadlocks can only occur if a single thread acquires multiple locks',
      'A race condition occurs when two threads access shared mutable state without proper synchronization and at least one is a write',
      'Garbage-collected runtimes eliminate all memory leaks automatically',
      'Mutex locks never incur kernel context-switching overhead',
    ],
    correctAnswer: 1,
    explanation: 'Data races happen whenever multiple threads access concurrent memory locations without synchronization and at least one write occurs.',
    topic: 'Concurrency & Threading',
  },

  // 6. DSA Fundamentals
  {
    id: 'q-dsa-1',
    sectionId: 'dsa',
    sectionTitle: 'DSA Fundamentals',
    question: 'Which data structure is optimal for implementing an LRU (Least Recently Used) cache with O(1) `get` and `put` operations?',
    options: [
      'Array combined with Binary Heap',
      'Doubly Linked List combined with Hash Map',
      'Red-Black Tree combined with Stack',
      'Singly Linked List combined with Queue',
    ],
    correctAnswer: 1,
    explanation: 'A Hash Map provides O(1) key-node lookup, while a Doubly Linked List enables O(1) removal and head insertion for recency tracking.',
    topic: 'LRU Cache & Linked Lists',
  },
  {
    id: 'q-dsa-2',
    sectionId: 'dsa',
    sectionTitle: 'DSA Fundamentals',
    question: 'What is the worst-case time complexity of QuickSort and how can it be mitigated in production implementations?',
    options: [
      'O(N log N); mitigated with bubble pass',
      'O(N²); mitigated using randomized pivot or Median-of-Three partitioning',
      'O(N³); mitigated using external merge sort',
      'O(log N); mitigated using dual heaps',
    ],
    correctAnswer: 1,
    explanation: 'Worst-case O(N²) occurs when the pivot is always an extreme element; randomized pivot selection or IntroSort avoids quadratic degradation.',
    topic: 'Sorting Algorithms',
  },

  // 7. Core CS Concepts
  {
    id: 'q-core-1',
    sectionId: 'core_cs',
    sectionTitle: 'Core CS Concepts',
    question: 'In Operating Systems, what is the primary cause of "Thrashing"?',
    options: [
      'CPU clock rate throttling under thermal load',
      'Excessive page swapping between RAM and disk due to insufficient working set frames',
      'Deadlock in kernel interrupt request queues',
      'Memory fragmentation inside user space heap allocations',
    ],
    correctAnswer: 1,
    explanation: 'Thrashing occurs when the virtual memory subsystem spends more time paging frames to and from secondary storage than executing user instructions.',
    topic: 'Operating Systems & Virtual Memory',
  },
  {
    id: 'q-core-2',
    sectionId: 'core_cs',
    sectionTitle: 'Core CS Concepts',
    question: 'In Relational Database Management Systems, what does the "I" in ACID properties guarantee?',
    options: [
      'Integrity of foreign key constraints',
      'Isolation: concurrent transactions execute without interfering with one another',
      'Immutability of transaction logs',
      'Indexing of primary columns',
    ],
    correctAnswer: 1,
    explanation: 'Isolation ensures that intermediate states of concurrent transactions remain invisible to each other, preventing dirty reads and non-repeatable reads.',
    topic: 'DBMS & ACID Transactions',
  },

  // 8. Communication / Interview Readiness
  {
    id: 'q-comm-1',
    sectionId: 'communication',
    sectionTitle: 'Communication & Interview Readiness',
    question: 'When answering behavioral interview prompts such as "Tell me about a time you solved a critical system bug", what is the recognized best-practice structure?',
    options: [
      'The STAR Method: Situation, Task, Action, Result',
      'The Chronological CV Method: Start from first year coursework',
      'The Blame-Deflection Framework: Emphasize team shortcomings',
      'The Technical Only Strategy: Recite code syntax without context',
    ],
    correctAnswer: 0,
    explanation: 'The STAR framework (Situation, Task, Action, Result) ensures candidates provide structured, impactful, and quantifiable narratives.',
    topic: 'Behavioral Interviews (STAR)',
  },
  {
    id: 'q-comm-2',
    sectionId: 'communication',
    sectionTitle: 'Communication & Interview Readiness',
    question: 'During a technical interview, you realize your proposed algorithm has an edge case flaw after the interviewer points it out. What is the most effective response?',
    options: [
      'Defend the initial code adamantly and argue the edge case is unrealistic',
      'Acknowledge the observation calmly, trace the failing input aloud, and propose an explicit boundary check or refactor',
      'Remain silent until the interviewer tells you the exact answer',
      'Start coding from scratch in a different language without explanation',
    ],
    correctAnswer: 1,
    explanation: 'Top interviewers value collaborative debugging, intellectual humility, and vocalized reasoning when handling edge cases.',
    topic: 'Collaborative Problem Solving',
  },
];

export function evaluatePlacementAssessment(
  answers: Record<string, number>
): Omit<AssessmentResult, 'id' | 'userId'> {
  const sections: AssessmentSectionId[] = [
    'aptitude',
    'logical',
    'quantitative',
    'verbal',
    'programming',
    'dsa',
    'core_cs',
    'communication',
  ];

  const sectionTotals: Record<AssessmentSectionId, { score: number; total: number }> = {
    aptitude: { score: 0, total: 0 },
    logical: { score: 0, total: 0 },
    quantitative: { score: 0, total: 0 },
    verbal: { score: 0, total: 0 },
    programming: { score: 0, total: 0 },
    dsa: { score: 0, total: 0 },
    core_cs: { score: 0, total: 0 },
    communication: { score: 0, total: 0 },
  };

  let totalCorrect = 0;

  PLACEMENT_ASSESSMENT_QUESTIONS.forEach((q) => {
    sectionTotals[q.sectionId].total += 1;
    if (answers[q.id] === q.correctAnswer) {
      sectionTotals[q.sectionId].score += 1;
      totalCorrect += 1;
    }
  });

  const sectionScores: Record<AssessmentSectionId, SectionScore> = {} as any;
  const strengths: string[] = [];
  const weakAreas: string[] = [];
  const recommendations: string[] = [];

  const SECTION_TITLES: Record<AssessmentSectionId, string> = {
    aptitude: 'Aptitude & Problem Solving',
    logical: 'Logical Reasoning',
    quantitative: 'Quantitative Ability',
    verbal: 'Verbal Ability & Professional Communication',
    programming: 'Programming & Technical Mastery',
    dsa: 'DSA Fundamentals',
    core_cs: 'Core CS Concepts (OS, DBMS, Networks)',
    communication: 'Communication & Behavioral Readiness',
  };

  sections.forEach((sec) => {
    const { score, total } = sectionTotals[sec];
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    sectionScores[sec] = { score, total, percentage };

    if (percentage >= 75) {
      strengths.push(`${SECTION_TITLES[sec]} (${percentage}% Accuracy)`);
    } else {
      weakAreas.push(`${SECTION_TITLES[sec]} (${percentage}% Accuracy)`);
      if (sec === 'dsa') {
        recommendations.push('Practice dynamic programming state transitions and graph BFS/DFS on LeetCode/GeeksforGeeks.');
      } else if (sec === 'core_cs') {
        recommendations.push('Review operating system virtual memory paging and database ACID transaction isolation levels.');
      } else if (sec === 'quantitative') {
        recommendations.push('Revise permutations, combinations, and conditional probability concepts with speed tests.');
      } else if (sec === 'aptitude') {
        recommendations.push('Solve timed train speed, work-rate, and profit/loss benchmark sets.');
      } else if (sec === 'logical') {
        recommendations.push('Review categorical syllogisms and alphanumeric pattern sequences.');
      } else if (sec === 'verbal') {
        recommendations.push('Practice formal business English writing and sentence correction patterns.');
      } else if (sec === 'programming') {
        recommendations.push('Deepen understanding of memory models, concurrency data races, and language-specific hash maps.');
      } else if (sec === 'communication') {
        recommendations.push('Rehearse behavioral responses using the STAR method (Situation, Task, Action, Result).');
      }
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('Maintain high-caliber preparation with mock technical interview sessions and company-specific past papers.');
  }

  const overallScore = Math.round((totalCorrect / PLACEMENT_ASSESSMENT_QUESTIONS.length) * 100);

  return {
    overallScore,
    totalQuestions: PLACEMENT_ASSESSMENT_QUESTIONS.length,
    correctAnswers: totalCorrect,
    sectionScores,
    strengths,
    weakAreas,
    recommendations,
    completedAt: new Date().toISOString(),
  };
}

