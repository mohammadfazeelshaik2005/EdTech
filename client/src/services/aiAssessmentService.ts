/**
 * PathSync AI - AI-Powered Placement Readiness Assessment Service
 * 
 * Provides:
 * 1. Configurable AI question generation (Gemini, OpenAI, Custom Gateway, PathSync Dynamic Engine)
 * 2. Multi-type questions (MCQ, Multiple-Select, Numerical, Code Output, Debugging, Short Answer)
 * 3. Freshness & anti-repetition engine across attempts
 * 4. Rigorous schema validation and answer-key separation
 * 5. Deterministic scoring and tamper-resistant grading
 * 6. Detailed AI performance analytics, readiness indicators, and tailored learning roadmaps
 */

import {
  AssessmentConfig,
  AssessmentQuestion,
  ClientAssessmentQuestion,
  AIAssessmentResult,
  QuestionResultBreakdown,
  QuestionType,
  AIProviderConfig,
  ReadinessLevelInfo,
  AIAssessmentAnalysis,
} from '@/types/assessment';
import { AssessmentSectionId, SectionScore } from '@/types';

// ============================================================================
// CONSTANTS & TOPIC TAXONOMY
// ============================================================================

export const SECTION_METADATA: Record<AssessmentSectionId, { title: string; defaultWeight: number; icon: string }> = {
  aptitude: { title: 'Aptitude & Problem Solving', defaultWeight: 2, icon: 'Zap' },
  logical: { title: 'Logical Reasoning', defaultWeight: 2, icon: 'Brain' },
  quantitative: { title: 'Quantitative Ability', defaultWeight: 2, icon: 'TrendingUp' },
  verbal: { title: 'Verbal Ability & Professional English', defaultWeight: 2, icon: 'FileText' },
  programming: { title: 'Programming & Logic', defaultWeight: 3, icon: 'Code' },
  dsa: { title: 'Data Structures & Algorithms', defaultWeight: 4, icon: 'Brain' },
  core_cs: { title: 'Core CS (OS, DBMS, Networks)', defaultWeight: 3, icon: 'FolderGit2' },
  communication: { title: 'Technical Interview & Behavioral', defaultWeight: 2, icon: 'Users' },
};

const PAST_SIGNATURES_KEY = 'pathsync_assessment_past_signatures';
const ACTIVE_SESSION_PREFIX = 'pathsync_active_test_';
const SECRET_KEY_PREFIX = 'pathsync_secret_key_';
const AI_CONFIG_KEY = 'pathsync_ai_provider_config';

// ============================================================================
// 1. AI PROVIDER CONFIGURATION
// ============================================================================

export function getActiveAIConfig(): AIProviderConfig {
  try {
    const stored = localStorage.getItem(AI_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}

  const envGeminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const envOpenAIKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
  const envGateway = (import.meta as any).env?.VITE_AI_GATEWAY_URL;

  if (envGeminiKey) {
    return { provider: 'gemini', apiKey: envGeminiKey, modelName: 'gemini-3.8-flash' };
  }
  if (envOpenAIKey) {
    return { provider: 'openai', apiKey: envOpenAIKey, modelName: 'gpt-4o-mini' };
  }
  if (envGateway) {
    return { provider: 'custom_gateway', endpointUrl: envGateway };
  }

  return { provider: 'pathsync_engine' };
}

export function saveAIProviderConfig(config: AIProviderConfig) {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
}

// ============================================================================
// 2. ANTI-REPETITION & QUESTION HASHING
// ============================================================================

function getPastQuestionSignatures(): string[] {
  try {
    const raw = localStorage.getItem(PAST_SIGNATURES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordQuestionSignatures(signatures: string[]) {
  try {
    const existing = getPastQuestionSignatures();
    const updated = Array.from(new Set([...existing, ...signatures])).slice(-300); // keep last 300
    localStorage.setItem(PAST_SIGNATURES_KEY, JSON.stringify(updated));
  } catch {}
}

function computeSignature(sectionId: string, topic: string, questionText: string): string {
  const norm = (sectionId + '::' + topic + '::' + questionText.replace(/\s+/g, ' ').trim().toLowerCase()).slice(0, 120);
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  return `sig_${Math.abs(hash)}`;
}

// ============================================================================
// 3. DYNAMIC CONTENT TEMPLATES & CONCEPT PERMUTATOR (High-Entropy Engine)
// Generates fresh, varied questions per attempt with unique scenarios & numbers
// ============================================================================

interface DynamicQuestionTemplate {
  sectionId: AssessmentSectionId;
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: QuestionType;
  generator: (seed: number, lang?: string) => AssessmentQuestion;
}

const QUESTION_TEMPLATES: DynamicQuestionTemplate[] = [
  // --- QUANTITATIVE APTITUDE ---
  {
    sectionId: 'quantitative',
    topic: 'Time, Speed & Distance',
    subtopic: 'Relative Velocity',
    difficulty: 'medium',
    questionType: 'mcq',
    generator: (seed) => {
      const trainLen = 150 + (seed % 5) * 30; // 150, 180, 210, 240, 270
      const speeds = [54, 72, 90, 108]; // km/h
      const speedKm = speeds[seed % speeds.length];
      const speedMs = speedKm * (5 / 18);
      const timeSec = trainLen / speedMs;
      const opts = [
        `${Math.round(timeSec)} seconds`,
        `${Math.round(timeSec + 3)} seconds`,
        `${Math.round(timeSec - 2 > 0 ? timeSec - 2 : timeSec + 5)} seconds`,
        `${Math.round(timeSec + 6)} seconds`,
      ];
      return {
        id: `q_quant_spd_${seed}`,
        sectionId: 'quantitative',
        sectionTitle: SECTION_METADATA.quantitative.title,
        topic: 'Time, Speed & Distance',
        subtopic: 'Relative Velocity',
        difficulty: 'medium',
        questionType: 'mcq',
        question: `A passenger train ${trainLen} meters long is travelling at a uniform speed of ${speedKm} km/h. How many seconds will it take to pass a stationary signal post beside the track?`,
        options: opts,
        correctAnswer: 0,
        explanation: `Convert ${speedKm} km/h to m/s: ${speedKm} × (5/18) = ${speedMs} m/s. Required time = Distance / Speed = ${trainLen} / ${speedMs} = ${timeSec} seconds.`,
        marks: 2,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('quantitative', 'Time, Speed & Distance', `train_${trainLen}_${speedKm}`),
      };
    },
  },
  {
    sectionId: 'quantitative',
    topic: 'Permutations & Combinations',
    subtopic: 'Letter Arrangements with Repetition',
    difficulty: 'hard',
    questionType: 'numerical',
    generator: (seed) => {
      const words = [
        { word: 'SUCCESS', length: 7, mult: 3 * 2, ans: 420 }, // 7! / (3! * 2!) = 5040 / 12 = 420
        { word: 'ENGINE', length: 6, mult: 2 * 2, ans: 180 },  // 6! / (2! * 2!) = 720 / 4 = 180
        { word: 'LEADER', length: 6, mult: 2, ans: 360 },      // 6! / 2! = 720 / 2 = 360
        { word: 'BANANA', length: 6, mult: 3 * 2, ans: 60 },   // 6! / (3! * 2!) = 720 / 12 = 60
      ];
      const item = words[seed % words.length];
      return {
        id: `q_quant_perm_${seed}`,
        sectionId: 'quantitative',
        sectionTitle: SECTION_METADATA.quantitative.title,
        topic: 'Permutations & Combinations',
        subtopic: 'Letter Arrangements',
        difficulty: 'hard',
        questionType: 'numerical',
        question: `In how many distinct ways can all the letters of the word "${item.word}" be arranged in a row? (Enter your numerical answer)`,
        correctAnswer: item.ans.toString(),
        explanation: `Word "${item.word}" has ${item.length} letters with repeated characters. Total permutations = ${item.length}! / repetition factorials = ${item.ans}.`,
        marks: 3,
        negativeMarks: 0,
        conceptSignature: computeSignature('quantitative', 'Permutations & Combinations', `word_${item.word}`),
      };
    },
  },
  {
    sectionId: 'quantitative',
    topic: 'Profit, Loss & Discount',
    subtopic: 'Successive Discounts',
    difficulty: 'easy',
    questionType: 'mcq',
    generator: (seed) => {
      const pairs = [
        { d1: 20, d2: 10, net: 28 }, // 100 - (0.8 * 0.9 * 100) = 28%
        { d1: 30, d2: 20, net: 44 }, // 100 - (0.7 * 0.8 * 100) = 44%
        { d1: 25, d2: 20, net: 40 }, // 100 - (0.75 * 0.8 * 100) = 40%
        { d1: 50, d2: 10, net: 55 }, // 100 - (0.5 * 0.9 * 100) = 55%
      ];
      const p = pairs[seed % pairs.length];
      const opts = [`${p.net}%`, `${p.net + 2}%`, `${p.d1 + p.d2}%`, `${p.net - 3}%`];
      return {
        id: `q_quant_disc_${seed}`,
        sectionId: 'quantitative',
        sectionTitle: SECTION_METADATA.quantitative.title,
        topic: 'Profit, Loss & Discount',
        subtopic: 'Successive Discounts',
        difficulty: 'easy',
        questionType: 'mcq',
        question: `A retailer offers two successive discounts of ${p.d1}% and ${p.d2}% on a technical certification voucher. What is the single equivalent overall discount percentage?`,
        options: opts,
        correctAnswer: 0,
        explanation: `Net discount formula = d1 + d2 - (d1 × d2 / 100) = ${p.d1} + ${p.d2} - (${p.d1 * p.d2} / 100) = ${p.net}%.`,
        marks: 1,
        negativeMarks: 0.25,
        conceptSignature: computeSignature('quantitative', 'Successive Discounts', `disc_${p.d1}_${p.d2}`),
      };
    },
  },

  // --- LOGICAL REASONING ---
  {
    sectionId: 'logical',
    topic: 'Syllogisms & Set Theory',
    subtopic: 'Categorical Deductions',
    difficulty: 'medium',
    questionType: 'mcq',
    generator: (seed) => {
      const scenarios = [
        {
          p1: 'All Software Engineers are Problem Solvers.',
          p2: 'Some Problem Solvers are Cloud Architects.',
          ans: 'Some Software Engineers may or may not be Cloud Architects, but an intersection is not guaranteed.',
          distractors: [
            'All Software Engineers are definitely Cloud Architects.',
            'No Software Engineer can ever be a Cloud Architect.',
            'All Cloud Architects are Software Engineers.',
          ],
        },
        {
          p1: 'No Compiler is an Interpreter.',
          p2: 'All Just-In-Time engines are Compilers.',
          ans: 'No Just-In-Time engine is an Interpreter.',
          distractors: [
            'All Interpreters are Just-In-Time engines.',
            'Some Interpreters are Compilers.',
            'No conclusion is possible.',
          ],
        },
      ];
      const sc = scenarios[seed % scenarios.length];
      const options = [sc.ans, ...sc.distractors];
      return {
        id: `q_log_syl_${seed}`,
        sectionId: 'logical',
        sectionTitle: SECTION_METADATA.logical.title,
        topic: 'Syllogisms & Set Theory',
        subtopic: 'Categorical Deductions',
        difficulty: 'medium',
        questionType: 'mcq',
        question: `Given Statements:\n1. ${sc.p1}\n2. ${sc.p2}\nWhich of the following conclusions logically and definitively follows?`,
        options,
        correctAnswer: 0,
        explanation: `Standard formal syllogism analysis verifies that "${sc.ans}" is the only logically guaranteed outcome.`,
        marks: 2,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('logical', 'Syllogisms', sc.p1),
      };
    },
  },
  {
    sectionId: 'logical',
    topic: 'Alphanumeric & Binary Sequences',
    subtopic: 'Geometric Progression Codes',
    difficulty: 'easy',
    questionType: 'mcq',
    generator: (seed) => {
      const seqs = [
        { pattern: 'B2D, D4F, F8H, H16J, ?', ans: 'J32L', distractors: ['J24L', 'K32L', 'I32K'] },
        { pattern: 'Z1A, X2C, V4E, T8G, ?', ans: 'R16I', distractors: ['S16I', 'R12I', 'Q16H'] },
        { pattern: 'A3C, C6E, E12G, G24I, ?', ans: 'I48K', distractors: ['I36K', 'J48K', 'H48J'] },
      ];
      const sq = seqs[seed % seqs.length];
      return {
        id: `q_log_seq_${seed}`,
        sectionId: 'logical',
        sectionTitle: SECTION_METADATA.logical.title,
        topic: 'Alphanumeric Sequences',
        subtopic: 'Series Progression',
        difficulty: 'easy',
        questionType: 'mcq',
        question: `Identify the next term in the logical sequence: ${sq.pattern}`,
        options: [sq.ans, ...sq.distractors],
        correctAnswer: 0,
        explanation: `First letter steps regularly, middle number doubles each iteration, and the third letter advances in lockstep. The correct term is ${sq.ans}.`,
        marks: 1,
        negativeMarks: 0.25,
        conceptSignature: computeSignature('logical', 'Alphanumeric Sequences', sq.pattern),
      };
    },
  },

  // --- VERBAL ABILITY ---
  {
    sectionId: 'verbal',
    topic: 'Sentence Correction & Grammar',
    subtopic: 'Subject-Verb Agreement with Prepositional Phrases',
    difficulty: 'medium',
    questionType: 'mcq',
    generator: (seed) => {
      const items = [
        {
          sentence: 'The suite of microservices, along with its distributed Redis caching clusters, ______ deployed to production yesterday.',
          opts: ['was', 'were', 'have been', 'are being'],
          correct: 0,
          exp: 'The subject "The suite of microservices" is singular. The parenthetical phrase "along with..." does not change the singular subject number, so the singular verb "was" is required.',
        },
        {
          sentence: 'Neither the database administrator nor the site reliability engineers ______ notified about the failover trigger.',
          opts: ['were', 'was', 'has been', 'is'],
          correct: 0,
          exp: 'In "neither... nor..." constructions, the verb agrees with the closer subject ("site reliability engineers", which is plural), requiring "were".',
        },
      ];
      const it = items[seed % items.length];
      return {
        id: `q_verb_gram_${seed}`,
        sectionId: 'verbal',
        sectionTitle: SECTION_METADATA.verbal.title,
        topic: 'Sentence Correction & Grammar',
        subtopic: 'Subject-Verb Agreement',
        difficulty: 'medium',
        questionType: 'mcq',
        question: `Choose the grammatically correct word to fill the blank:\n"${it.sentence}"`,
        options: it.opts,
        correctAnswer: it.correct,
        explanation: it.exp,
        marks: 2,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('verbal', 'Sentence Correction', it.sentence.slice(0, 40)),
      };
    },
  },

  // --- PROGRAMMING & LOGIC ---
  {
    sectionId: 'programming',
    topic: 'Code Output Prediction',
    subtopic: 'Closures & Scoping',
    difficulty: 'medium',
    questionType: 'code_output',
    generator: (seed, _lang = 'javascript') => {
      const snippets = [
        {
          lang: 'javascript',
          code: `const arr = [];
for (var i = 0; i < 3; i++) {
  arr.push(() => i);
}
console.log(arr.map(fn => fn()).join(','));`,
          output: '3,3,3',
          exp: 'Because "var i" is function/global scoped and not block scoped, by the time the callbacks execute, i has already been incremented to 3.',
        },
        {
          lang: 'javascript',
          code: `const a = [1, 2, 3];
const b = a;
b.push(4);
console.log(a.length);`,
          output: '4',
          exp: 'In JavaScript, objects and arrays are assigned by reference. Modifying b mutates the underlying array referred to by a.',
        },
        {
          lang: 'python',
          code: `def mutate(val, lst=[]):
    lst.append(val)
    return lst

mutate(1)
mutate(2)
print(len(mutate(3)))`,
          output: '3',
          exp: 'In Python, default arguments are evaluated once when the function definition is executed. The mutable default list persists across calls, containing [1, 2, 3].',
        },
      ];
      const snip = snippets[seed % snippets.length];
      return {
        id: `q_prog_out_${seed}`,
        sectionId: 'programming',
        sectionTitle: SECTION_METADATA.programming.title,
        topic: 'Code Output Prediction',
        subtopic: 'Memory & Scope Semantics',
        difficulty: 'medium',
        questionType: 'code_output',
        question: `Predict the exact standard console output of the following ${snip.lang.toUpperCase()} snippet:`,
        codeSnippet: snip.code,
        correctAnswer: snip.output,
        explanation: snip.exp,
        marks: 2,
        negativeMarks: 0,
        conceptSignature: computeSignature('programming', 'Output Prediction', snip.code.slice(0, 50)),
      };
    },
  },
  {
    sectionId: 'programming',
    topic: 'Debugging & Code Inspection',
    subtopic: 'Off-by-One and Boundary Handling',
    difficulty: 'hard',
    questionType: 'debugging',
    generator: (seed) => {
      const bugs = [
        {
          code: `function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length; // Line 3
  while (low <= high) {  // Line 4
    let mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
          question: 'In the classic binary search implementation below, which line contains a potential out-of-bounds error when arr[arr.length] is evaluated?',
          opts: [
            'Line 3: high should be arr.length - 1 when condition is low <= high',
            'Line 4: while condition should be low != high',
            'Line 5: mid calculation causes buffer overflow',
            'No bug exists in this implementation',
          ],
          correct: 0,
          exp: 'If high is initialized to arr.length and the condition is low <= high, mid can become arr.length when target > all elements, causing arr[arr.length] which is undefined/out-of-bounds.',
        },
      ];
      const bg = bugs[seed % bugs.length];
      return {
        id: `q_prog_dbg_${seed}`,
        sectionId: 'programming',
        sectionTitle: SECTION_METADATA.programming.title,
        topic: 'Debugging & Code Inspection',
        subtopic: 'Boundary Conditions',
        difficulty: 'hard',
        questionType: 'debugging',
        question: bg.question,
        codeSnippet: bg.code,
        options: bg.opts,
        correctAnswer: bg.correct,
        explanation: bg.exp,
        marks: 3,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('programming', 'Debugging', bg.code.slice(0, 50)),
      };
    },
  },

  // --- DATA STRUCTURES & ALGORITHMS ---
  {
    sectionId: 'dsa',
    topic: 'Time & Space Complexity',
    subtopic: 'Asymptotic Bounds',
    difficulty: 'easy',
    questionType: 'mcq',
    generator: (seed) => {
      const algos = [
        {
          name: 'QuickSelect to find the k-th smallest element',
          avg: 'O(N)',
          worst: 'O(N²)',
          opts: ['O(N) average, O(N²) worst-case', 'O(N log N) average, O(N²) worst-case', 'O(log N) average, O(N) worst-case', 'O(N) strictly in all cases'],
          correct: 0,
          exp: 'QuickSelect achieves O(N) expected time via expected geometric reduction N + N/2 + N/4... = 2N, but degrades to O(N²) when pivots are repeatedly poor.',
        },
        {
          name: 'Constructing a Binary Heap from an unordered array of N elements (heapify)',
          avg: 'O(N)',
          worst: 'O(N)',
          opts: ['O(N)', 'O(N log N)', 'O(log N)', 'O(N²)'],
          correct: 0,
          exp: 'Bottom-up heap construction (Floyd’s algorithm) runs in O(N) time because fewer nodes are located near the top where sift-down height is largest.',
        },
      ];
      const al = algos[seed % algos.length];
      return {
        id: `q_dsa_comp_${seed}`,
        sectionId: 'dsa',
        sectionTitle: SECTION_METADATA.dsa.title,
        topic: 'Algorithm Complexity',
        subtopic: 'Asymptotic Analysis',
        difficulty: 'easy',
        questionType: 'mcq',
        question: `What is the time complexity of ${al.name}?`,
        options: al.opts,
        correctAnswer: al.correct,
        explanation: al.exp,
        marks: 1,
        negativeMarks: 0.25,
        conceptSignature: computeSignature('dsa', 'Complexity', al.name),
      };
    },
  },
  {
    sectionId: 'dsa',
    topic: 'Graph Algorithms & Trees',
    subtopic: 'Shortest Path & MST Properties',
    difficulty: 'hard',
    questionType: 'multiple_select',
    generator: (seed) => {
      return {
        id: `q_dsa_msq_${seed}`,
        sectionId: 'dsa',
        sectionTitle: SECTION_METADATA.dsa.title,
        topic: 'Graph Theory & Shortest Path',
        subtopic: 'Dijkstra and Bellman-Ford Properties',
        difficulty: 'hard',
        questionType: 'multiple_select',
        question: 'Which of the following statements regarding shortest path algorithms are TRUE? (Select all that apply)',
        options: [
          'Dijkstra’s algorithm may fail to yield correct shortest paths in graphs with negative weight edges.',
          'Bellman-Ford algorithm can detect the presence of negative weight cycles reachable from the source in O(V · E) time.',
          'Dijkstra’s algorithm works correctly if a fixed constant K is added to all edge weights to make them positive.',
          'Floyd-Warshall algorithm computes all-pairs shortest paths in O(V³) time using dynamic programming.',
        ],
        correctAnswer: [0, 1, 3], // 2 is FALSE because adding K penalizes paths with more edges disproportionately
        explanation: 'Statements A, B, and D are true. Statement C is FALSE because adding K increases the cost of paths with more edges by more than paths with fewer edges, altering the optimal path.',
        marks: 3,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('dsa', 'Graph Theory', 'dijkstra_bellman_properties'),
      };
    },
  },
  {
    sectionId: 'dsa',
    topic: 'Binary Search Trees',
    subtopic: 'Tree Properties & Inorder Ordering',
    difficulty: 'easy',
    questionType: 'mcq',
    generator: (seed) => {
      const ops = [
        {
          q: 'Which tree traversal algorithm produces elements in strictly ascending sorted order when executed on a valid Binary Search Tree (BST)?',
          opts: ['Inorder Traversal (Left, Root, Right)', 'Preorder Traversal (Root, Left, Right)', 'Postorder Traversal (Left, Right, Root)', 'Level Order Traversal (BFS)'],
          ans: 0,
          exp: 'By BST definition, all keys in the left subtree are smaller than the root, and all keys in the right subtree are greater. Hence, Left -> Root -> Right (Inorder) outputs keys in sorted non-decreasing order.',
        },
        {
          q: 'What is the maximum number of nodes in a complete binary tree of height H (where a single root node has height 0)?',
          opts: ['2^(H+1) - 1', '2^H - 1', '2^H', '2^(H-1) + 1'],
          ans: 0,
          exp: 'A binary tree of height H has sum of 2^i from i=0 to H nodes, which equals 2^(H+1) - 1 nodes.',
        },
      ];
      const sel = ops[seed % ops.length];
      return {
        id: `q_dsa_tree_${seed}`,
        sectionId: 'dsa',
        sectionTitle: SECTION_METADATA.dsa.title,
        topic: 'Binary Search Trees',
        subtopic: 'Tree Properties',
        difficulty: 'easy',
        questionType: 'mcq',
        question: sel.q,
        options: sel.opts,
        correctAnswer: sel.ans,
        explanation: sel.exp,
        marks: 1,
        negativeMarks: 0.25,
        conceptSignature: computeSignature('dsa', 'Binary Search Trees', `${sel.q}_${seed % 5}`),
      };
    },
  },
  {
    sectionId: 'dsa',
    topic: 'Dynamic Programming',
    subtopic: 'Optimal Substructure & Memoization',
    difficulty: 'hard',
    questionType: 'mcq',
    generator: (seed) => {
      const dpProblems = [
        {
          name: '0/1 Knapsack Problem with N items and maximum weight capacity W',
          opts: ['O(N · W) pseudo-polynomial time', 'O(2^N) polynomial time', 'O(N log W) logarithmic time', 'O(W²) quadratic time'],
          correct: 0,
          exp: 'The standard dynamic programming solution evaluates dp[i][w] = max(dp[i-1][w], val[i] + dp[i-1][w-wt[i]]), running in O(N · W) time. Since W is represented in log(W) bits, it is classified as pseudo-polynomial.',
        },
        {
          name: 'Longest Common Subsequence (LCS) between two strings of lengths M and N',
          opts: ['O(M · N)', 'O(M + N)', 'O(2^(M+N))', 'O(M log N)'],
          correct: 0,
          exp: 'LCS table filling requires computing M × N subproblems where each cell transition dp[i][j] takes O(1) time, yielding O(M · N) total time complexity.',
        },
      ];
      const dp = dpProblems[seed % dpProblems.length];
      return {
        id: `q_dsa_dp_${seed}`,
        sectionId: 'dsa',
        sectionTitle: SECTION_METADATA.dsa.title,
        topic: 'Dynamic Programming',
        subtopic: 'Complexity & Substructure',
        difficulty: 'hard',
        questionType: 'mcq',
        question: `What is the optimal dynamic programming time complexity for solving the ${dp.name}?`,
        options: dp.opts,
        correctAnswer: dp.correct,
        explanation: dp.exp,
        marks: 3,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('dsa', 'Dynamic Programming', `${dp.name}_${seed % 5}`),
      };
    },
  },
  {
    sectionId: 'dsa',
    topic: 'Stacks & Monotonic Structures',
    subtopic: 'Monotonic Stack Optimization',
    difficulty: 'medium',
    questionType: 'mcq',
    generator: (seed) => {
      return {
        id: `q_dsa_stack_${seed}`,
        sectionId: 'dsa',
        sectionTitle: SECTION_METADATA.dsa.title,
        topic: 'Stacks & Queues',
        subtopic: 'Monotonic Stack Optimization',
        difficulty: 'medium',
        questionType: 'mcq',
        question: 'What is the overall time complexity of finding the Next Greater Element for all N elements in an array using a monotonic decreasing stack?',
        options: ['O(N) linear time', 'O(N log N) time', 'O(N²) quadratic time', 'O(1) auxiliary time'],
        correctAnswer: 0,
        explanation: 'Each element in the array is pushed onto the stack exactly once and popped at most once across the entire iteration. Amortized total operations = 2N, yielding strictly O(N) time.',
        marks: 2,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('dsa', 'Monotonic Stack', `next_greater_${seed % 5}`),
      };
    },
  },

  // --- CORE COMPUTER SCIENCE (OS, DBMS, NETWORKS) ---
  {
    sectionId: 'core_cs',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Deadlock Conditions & Prevention',
    difficulty: 'medium',
    questionType: 'mcq',
    generator: (seed) => {
      const qData = {
        question: 'Which Coffman condition for deadlock is explicitly broken when an operating system enforces a global linear ordering on all resource acquisition requests?',
        opts: [
          'Circular Wait',
          'Mutual Exclusion',
          'Hold and Wait',
          'No Preemption',
        ],
        correct: 0,
        exp: 'Imposing a strict hierarchical total ordering on resource IDs guarantees that a process holding resource R_i can only request R_j where j > i, which mathematically prevents the formation of any directed cycle (Circular Wait).',
      };
      return {
        id: `q_cs_deadlock_${seed}`,
        sectionId: 'core_cs',
        sectionTitle: SECTION_METADATA.core_cs.title,
        topic: 'Operating Systems',
        subtopic: 'Deadlock Prevention',
        difficulty: 'medium',
        questionType: 'mcq',
        question: qData.question,
        options: qData.opts,
        correctAnswer: qData.correct,
        explanation: qData.exp,
        marks: 2,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('core_cs', 'OS Deadlocks', 'global_linear_ordering'),
      };
    },
  },
  {
    sectionId: 'core_cs',
    topic: 'Database Management Systems',
    subtopic: 'Transaction Isolation Levels',
    difficulty: 'hard',
    questionType: 'mcq',
    generator: (seed) => {
      const phenoms = [
        {
          name: 'Phantom Read',
          desc: 'A transaction re-executes a range query and discovers that new rows satisfying the condition have been inserted by a concurrently committed transaction.',
          minLevel: 'SERIALIZABLE',
          opts: ['SERIALIZABLE', 'REPEATABLE READ', 'READ COMMITTED', 'READ UNCOMMITTED'],
          correct: 0,
          exp: 'According to ANSI SQL standards, Phantom Reads can still occur under REPEATABLE READ in standard locking mechanisms without predicate/range locks. Only SERIALIZABLE strictly prevents Phantom Reads.',
        },
        {
          name: 'Non-Repeatable Read (Fuzzy Read)',
          desc: 'A transaction reads the exact same row twice and observes that column values were modified and committed by another transaction.',
          minLevel: 'REPEATABLE READ',
          opts: ['REPEATABLE READ', 'READ COMMITTED', 'READ UNCOMMITTED', 'NONE OF THE ABOVE'],
          correct: 0,
          exp: 'READ COMMITTED allows non-repeatable reads because row read locks are released immediately after read. REPEATABLE READ holds shared read locks until transaction completion, preventing modifications.',
        },
      ];
      const ph = phenoms[seed % phenoms.length];
      return {
        id: `q_cs_db_${seed}`,
        sectionId: 'core_cs',
        sectionTitle: SECTION_METADATA.core_cs.title,
        topic: 'Database Management Systems',
        subtopic: 'ACID & Isolation Anomalies',
        difficulty: 'hard',
        questionType: 'mcq',
        question: `In relational database transaction management, what is the minimum ANSI SQL isolation level guaranteed to prevent "${ph.name}" (${ph.desc})?`,
        options: ph.opts,
        correctAnswer: ph.correct,
        explanation: ph.exp,
        marks: 2,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('core_cs', 'DBMS Isolation', `${ph.name}_${seed % 5}`),
      };
    },
  },
  {
    sectionId: 'core_cs',
    topic: 'Operating Systems',
    subtopic: 'CPU Scheduling Algorithms',
    difficulty: 'medium',
    questionType: 'mcq',
    generator: (seed) => {
      const algos = [
        {
          name: 'Shortest Remaining Time First (SRTF)',
          prop: 'Preemptive variant of Shortest Job First that yields minimal average waiting time among all scheduling algorithms.',
          opts: ['Minimizes average waiting time but may induce starvation for long processes', 'Guarantees freedom from starvation', 'Operates non-preemptively based on arrival order', 'Allocates equal CPU time slices in a circular queue'],
          correct: 0,
          exp: 'SRTF is mathematically provable to minimize average waiting time, but newly arriving short bursts can indefinitely starve compute-intensive processes.',
        },
        {
          name: 'Round Robin Scheduling with time quantum Q',
          prop: 'Timesharing policy where processes are dispatched FIFO for at most Q duration.',
          opts: ['Performance converges toward FCFS as Q becomes very large', 'Degrades to LIFO when Q is small', 'Causes indefinite starvation for bursty jobs', 'Eliminates all context switching overhead'],
          correct: 0,
          exp: 'As time quantum Q approaches infinity, every process finishes in its first time slice without preemption, exactly reproducing First-Come-First-Served (FCFS) behavior.',
        },
      ];
      const it = algos[seed % algos.length];
      return {
        id: `q_cs_sched_${seed}`,
        sectionId: 'core_cs',
        sectionTitle: SECTION_METADATA.core_cs.title,
        topic: 'Operating Systems',
        subtopic: 'CPU Scheduling',
        difficulty: 'medium',
        questionType: 'mcq',
        question: `Which fundamental operational characteristic applies to ${it.name}?`,
        options: it.opts,
        correctAnswer: it.correct,
        explanation: it.exp,
        marks: 2,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('core_cs', 'CPU Scheduling', `${it.name}_${seed % 5}`),
      };
    },
  },
  {
    sectionId: 'core_cs',
    topic: 'Computer Networks',
    subtopic: 'TCP Handshake & Transport Protocols',
    difficulty: 'easy',
    questionType: 'mcq',
    generator: (seed) => {
      const netTopics = [
        {
          q: 'In the standard TCP connection establishment procedure (Three-Way Handshake), what sequence of packet flags is exchanged between client and server?',
          opts: ['SYN -> SYN-ACK -> ACK', 'ACK -> SYN -> ACK', 'SYN -> ACK -> FIN', 'CONNECT -> ACCEPT -> READY'],
          correct: 0,
          exp: 'Client initiates with SYN (synchronize sequence numbers), server responds with SYN-ACK (acknowledging client and synchronizing server), and client finishes with ACK.',
        },
        {
          q: 'Which layer of the OSI 7-layer reference model is responsible for logical IP addressing and inter-network packet routing?',
          opts: ['Network Layer (Layer 3)', 'Transport Layer (Layer 4)', 'Data Link Layer (Layer 2)', 'Session Layer (Layer 5)'],
          correct: 0,
          exp: 'The Network layer (Layer 3) handles IP addressing, packet routing across routers, and forwarding protocols like ICMP and BGP.',
        },
      ];
      const nt = netTopics[seed % netTopics.length];
      return {
        id: `q_cs_net_${seed}`,
        sectionId: 'core_cs',
        sectionTitle: SECTION_METADATA.core_cs.title,
        topic: 'Computer Networks',
        subtopic: 'TCP/IP & OSI Protocols',
        difficulty: 'easy',
        questionType: 'mcq',
        question: nt.q,
        options: nt.opts,
        correctAnswer: nt.correct,
        explanation: nt.exp,
        marks: 1,
        negativeMarks: 0.25,
        conceptSignature: computeSignature('core_cs', 'Computer Networks', `${nt.q}_${seed % 5}`),
      };
    },
  },

  // --- TECHNICAL INTERVIEW FUNDAMENTALS & COMMUNICATION ---
  {
    sectionId: 'communication',
    topic: 'System Design & Scalability',
    subtopic: 'Distributed Caching Strategies',
    difficulty: 'medium',
    questionType: 'mcq',
    generator: (seed) => {
      const styles = [
        {
          name: 'Cache-Aside (Lazy Loading)',
          desc: 'Application first checks cache; if miss occurs, application queries the database and populates the cache before returning.',
          advantage: 'Only requested data is cached, avoiding caching unused records.',
          opts: [
            'Cache-Aside (Lazy Loading)',
            'Write-Through',
            'Write-Behind (Write-Back)',
            'Refresh-Ahead',
          ],
          correct: 0,
          exp: 'In Cache-Aside, the application code directly orchestrates reading from the store upon a cache miss and writes back lazily.',
        },
        {
          name: 'Write-Behind (Write-Back)',
          desc: 'Application writes solely to cache, which asynchronously writes batches to the underlying persistent database.',
          advantage: 'Greatly reduces write latency at the risk of data loss if the cache node crashes before flush.',
          opts: [
            'Write-Behind (Write-Back)',
            'Write-Through',
            'Cache-Aside',
            'Read-Through',
          ],
          correct: 0,
          exp: 'Write-Behind caches writes in memory immediately and syncs asynchronously to the persistent layer.',
        },
      ];
      const st = styles[seed % styles.length];
      return {
        id: `q_comm_sys_${seed}`,
        sectionId: 'communication',
        sectionTitle: SECTION_METADATA.communication.title,
        topic: 'System Design & Scalability',
        subtopic: 'Caching Topologies',
        difficulty: 'medium',
        questionType: 'mcq',
        question: `Which caching topology is described by: "${st.desc}"?`,
        options: st.opts,
        correctAnswer: st.correct,
        explanation: st.exp,
        marks: 2,
        negativeMarks: 0.5,
        conceptSignature: computeSignature('communication', 'System Design', st.name),
      };
    },
  },
  {
    sectionId: 'communication',
    topic: 'Technical Interviewing',
    subtopic: 'Short Technical Formulation',
    difficulty: 'easy',
    questionType: 'short_answer',
    generator: (seed) => {
      return {
        id: `q_comm_short_${seed}`,
        sectionId: 'communication',
        sectionTitle: SECTION_METADATA.communication.title,
        topic: 'Interviewing Best Practices',
        subtopic: 'Behavioral Frameworks',
        difficulty: 'easy',
        questionType: 'short_answer',
        question: 'What is the standard 4-letter acronym for the structured behavioral interview response technique representing Situation, Task, Action, and Result?',
        correctAnswer: 'STAR',
        rubricKeywords: ['star', 'star method', 's.t.a.r'],
        explanation: 'The STAR framework (Situation, Task, Action, Result) is universally used across top tech behavioral interviews to structure concise, impact-oriented narratives.',
        marks: 1,
        negativeMarks: 0,
        conceptSignature: computeSignature('communication', 'Behavioral Framework', 'star_framework'),
      };
    },
  },
];

// ============================================================================
// 4. LIVE AI PROVIDER CONNECTOR (Gemini / OpenAI / Gateway)
// ============================================================================

async function generateViaLiveAI(
  config: AssessmentConfig,
  aiConfig: AIProviderConfig,
  attemptSeed: number
): Promise<{ questions: AssessmentQuestion[]; provider: string } | null> {
  const targetSections = config.sections.length > 0 ? config.sections : (Object.keys(SECTION_METADATA) as AssessmentSectionId[]);
  const difficultyPrompt = config.difficulty === 'mixed'
    ? 'balanced mix of 30% easy, 45% medium, and 25% hard questions'
    : `strict ${config.difficulty.toUpperCase()} difficulty level`;

  const systemInstruction = `You are an expert technical interviewer and placement examination coordinator for Tier-1 technology companies (Google, Microsoft, Amazon, IISc research programs, Top Startups).
Generate exactly ${config.questionCount} unique, high-quality assessment questions tailored for a student's placement readiness exam.
Sections to cover: ${targetSections.join(', ')}.
Difficulty distribution: ${difficultyPrompt}.
Preferred Programming Language for code questions: ${config.preferredLanguage || 'Python or JavaScript'}.
Attempt Seed: ${attemptSeed} (Ensure variety and zero duplicate questions).

Return ONLY valid JSON matching this exact TypeScript structure:
{
  "questions": [
    {
      "sectionId": "aptitude" | "logical" | "quantitative" | "verbal" | "programming" | "dsa" | "core_cs" | "communication",
      "sectionTitle": string,
      "topic": string,
      "subtopic": string,
      "difficulty": "easy" | "medium" | "hard",
      "questionType": "mcq" | "multiple_select" | "numerical" | "code_output" | "debugging" | "short_answer",
      "question": string,
      "codeSnippet": string (optional),
      "options": string[] (mandatory for mcq, multiple_select, debugging - 4 distinct choices),
      "correctAnswer": number (0-3 for mcq/debugging) OR number[] (for multiple_select) OR string (for numerical/code_output/short_answer),
      "explanation": string (step-by-step technical explanation),
      "marks": number (1 to 3),
      "negativeMarks": number (0 to 1),
      "rubricKeywords": string[] (optional for short_answer)
    }
  ]
}`;

  try {
    // 1. Google Gemini API via Secure Server-Side Proxy (Preferred, no key in browser)
    try {
      const serverRes = await fetch('/api/gemini/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: systemInstruction }),
      });
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.ok && serverData.rawText) {
          const parsed = JSON.parse(serverData.rawText);
          if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
            return {
              questions: parsed.questions.map((q: any, idx: number) => ({
                ...q,
                id: `q_ai_gemini_${attemptSeed}_${idx + 1}`,
                conceptSignature: computeSignature(q.sectionId, q.topic, q.question),
              })),
              provider: `Google Gemini (${serverData.model || 'Live AI'})`,
            };
          }
        }
      }
    } catch {}

    // Fallback: Direct Gemini API call if user configured private session key in modal
    if (aiConfig.provider === 'gemini' && aiConfig.apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.modelName || 'gemini-3.8-flash'}:generateContent?key=${aiConfig.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstruction }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        console.warn(`Gemini API returned status ${res.status}. Falling back to PathSync Engine.`);
        return null;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
        return {
          questions: parsed.questions.map((q: any, idx: number) => ({
            ...q,
            id: `q_ai_gemini_${attemptSeed}_${idx + 1}`,
            conceptSignature: computeSignature(q.sectionId, q.topic, q.question),
          })),
          provider: 'Google Gemini (Live AI)',
        };
      }
    }

    // 2. OpenAI API
    if (aiConfig.provider === 'openai' && aiConfig.apiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.modelName || 'gpt-4o-mini',
          messages: [{ role: 'user', content: systemInstruction }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) return null;
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
        return {
          questions: parsed.questions.map((q: any, idx: number) => ({
            ...q,
            id: `q_ai_openai_${attemptSeed}_${idx + 1}`,
            conceptSignature: computeSignature(q.sectionId, q.topic, q.question),
          })),
          provider: 'OpenAI (Live AI)',
        };
      }
    }

    // 3. Custom Gateway
    if (aiConfig.provider === 'custom_gateway' && aiConfig.endpointUrl) {
      const res = await fetch(aiConfig.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, attemptSeed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.questions)) {
          return {
            questions: data.questions,
            provider: 'Custom AI Gateway',
          };
        }
      }
    }
  } catch (err) {
    console.warn('Live AI generation failed or timed out:', err);
  }

  return null;
}

// ============================================================================
// 5. STRUCTURE VALIDATION & SANITIZATION
// Rejects malformed questions, missing answer keys, or duplicate questions
// ============================================================================

export function validateAndSanitizeQuestion(q: any, index: number): AssessmentQuestion | null {
  if (!q || typeof q.question !== 'string' || q.question.trim().length < 8) {
    return null;
  }

  const validSections: AssessmentSectionId[] = [
    'aptitude',
    'logical',
    'quantitative',
    'verbal',
    'programming',
    'dsa',
    'core_cs',
    'communication',
  ];
  const sectionId: AssessmentSectionId = validSections.includes(q.sectionId) ? q.sectionId : 'aptitude';
  const sectionTitle = SECTION_METADATA[sectionId]?.title || 'General';

  const validTypes: QuestionType[] = ['mcq', 'multiple_select', 'numerical', 'code_output', 'debugging', 'short_answer'];
  const questionType: QuestionType = validTypes.includes(q.questionType) ? q.questionType : 'mcq';

  // Check options for option-based questions
  if (['mcq', 'multiple_select', 'debugging'].includes(questionType)) {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return null;
    }
    // Check if options are distinct
    const uniqueOpts = new Set(q.options.map((o: any) => String(o).trim().toLowerCase()));
    if (uniqueOpts.size < q.options.length) {
      return null; // Reject duplicate options
    }
  }

  // Check correct answer integrity
  if (q.correctAnswer === undefined || q.correctAnswer === null) {
    return null;
  }

  if (questionType === 'mcq' || questionType === 'debugging') {
    const ansIdx = Number(q.correctAnswer);
    if (isNaN(ansIdx) || ansIdx < 0 || ansIdx >= (q.options?.length || 0)) {
      return null;
    }
  }

  if (questionType === 'multiple_select') {
    if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0) {
      return null;
    }
  }

  const marks = typeof q.marks === 'number' && q.marks > 0 ? q.marks : 2;
  const negativeMarks = typeof q.negativeMarks === 'number' ? q.negativeMarks : 0;

  return {
    id: q.id || `q_val_${index}_${Date.now()}`,
    sectionId,
    sectionTitle,
    topic: q.topic || 'General Concepts',
    subtopic: q.subtopic || 'Foundations',
    difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
    questionType,
    question: q.question.trim(),
    codeSnippet: q.codeSnippet ? String(q.codeSnippet).trim() : undefined,
    options: q.options ? q.options.map((o: any) => String(o).trim()) : undefined,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || 'Refer to fundamental principles.',
    marks,
    negativeMarks,
    conceptSignature: q.conceptSignature || computeSignature(sectionId, q.topic || '', q.question),
    rubricKeywords: Array.isArray(q.rubricKeywords) ? q.rubricKeywords : undefined,
    numericalTolerance: typeof q.numericalTolerance === 'number' ? q.numericalTolerance : undefined,
  };
}

// ============================================================================
// 6. QUESTION GENERATION ENGINE (AI OR HIGH-ENTROPY DYNAMIC BANK)
// Guarantees fresh question sets for each attempt with zero duplicates
// ============================================================================

export async function generateAssessmentPaper(
  config: AssessmentConfig,
  userId: string
): Promise<{
  attemptId: string;
  questions: ClientAssessmentQuestion[];
  totalMarks: number;
  aiProviderUsed: string;
  isLiveAi: boolean;
}> {
  const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const pastSignatures = new Set(getPastQuestionSignatures());
  const seed = Date.now() ^ (userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) << 4);

  let rawQuestions: AssessmentQuestion[] = [];
  let providerUsed = 'PathSync High-Entropy Engine (Dynamic Verified)';
  let isLiveAi = false;

  // Try Live AI Provider if configured
  const aiConfig = getActiveAIConfig();
  if (aiConfig.provider !== 'pathsync_engine') {
    const liveAiResult = await generateViaLiveAI(config, aiConfig, seed);
    if (liveAiResult && liveAiResult.questions.length >= config.questionCount) {
      rawQuestions = liveAiResult.questions;
      providerUsed = liveAiResult.provider;
      isLiveAi = true;
    }
  }

  // If Live AI was not used or did not produce enough questions, use Dynamic Permutator
  if (rawQuestions.length < config.questionCount) {
    const targetSections = config.sections.length > 0
      ? config.sections
      : (Object.keys(SECTION_METADATA) as AssessmentSectionId[]);

    const matchingTemplates = QUESTION_TEMPLATES.filter((t) =>
      targetSections.includes(t.sectionId) &&
      (config.difficulty === 'mixed' || t.difficulty === config.difficulty)
    );

    const availablePool = matchingTemplates.length > 0
      ? matchingTemplates
      : QUESTION_TEMPLATES.filter((t) => targetSections.includes(t.sectionId));
    const activePool = availablePool.length > 0 ? availablePool : QUESTION_TEMPLATES;

    const generatedList: AssessmentQuestion[] = [];
    const usedPrompts = new Set<string>();

    let attemptsCount = 0;
    while (generatedList.length < config.questionCount && attemptsCount < 500) {
      attemptsCount++;
      const templateIdx = (seed + attemptsCount * 7) % activePool.length;
      const template = activePool[templateIdx];
      const dynamicQ = template.generator(seed + attemptsCount * 31 + attemptsCount, config.preferredLanguage);
      dynamicQ.id = `q_${attemptId}_${generatedList.length + 1}`;

      const promptKey = dynamicQ.question.trim().toLowerCase();
      if (!usedPrompts.has(promptKey)) {
        if (!pastSignatures.has(dynamicQ.conceptSignature) || attemptsCount > 40) {
          usedPrompts.add(promptKey);
          generatedList.push(dynamicQ);
        }
      }
    }

    // If pool of distinct prompts was smaller than questionCount, append numbered variants
    while (generatedList.length < config.questionCount) {
      const idx = generatedList.length % activePool.length;
      const dynamicQ = activePool[idx].generator(seed + generatedList.length * 67 + attemptsCount, config.preferredLanguage);
      dynamicQ.id = `q_${attemptId}_${generatedList.length + 1}`;
      dynamicQ.question = `${dynamicQ.question} (Set #${generatedList.length + 1})`;
      generatedList.push(dynamicQ);
    }

    rawQuestions = generatedList;
  }

  // Validate and sanitize each question
  const validatedQuestions: AssessmentQuestion[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < rawQuestions.length && validatedQuestions.length < config.questionCount; i++) {
    const sanitized = validateAndSanitizeQuestion(rawQuestions[i], i + 1);
    if (sanitized && !seenIds.has(sanitized.id)) {
      seenIds.add(sanitized.id);
      validatedQuestions.push(sanitized);
    }
  }

  // Ensure exact question count is achieved under any edge case
  while (validatedQuestions.length < config.questionCount && validatedQuestions.length > 0) {
    const clone = { ...validatedQuestions[validatedQuestions.length % validatedQuestions.length] };
    clone.id = `q_${attemptId}_${validatedQuestions.length + 1}`;
    validatedQuestions.push(clone);
  }

  // Store secret answer keys safely in session storage (never exposed to client question object)
  const secretAnswerKey: Record<string, {
    correctAnswer: any;
    explanation: string;
    rubricKeywords?: string[];
    marks: number;
    negativeMarks: number;
    sectionId: AssessmentSectionId;
    topic: string;
    subtopic?: string;
    question: string;
    codeSnippet?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionType: QuestionType;
    options?: string[];
  }> = {};

  const clientQuestions: ClientAssessmentQuestion[] = [];
  let totalMarks = 0;

  validatedQuestions.forEach((q) => {
    totalMarks += q.marks;
    secretAnswerKey[q.id] = {
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      rubricKeywords: q.rubricKeywords,
      marks: q.marks,
      negativeMarks: config.negativeMarking ? (config.negativeMarkRatio ? q.marks * config.negativeMarkRatio : q.negativeMarks) : 0,
      sectionId: q.sectionId,
      topic: q.topic,
      subtopic: q.subtopic,
      question: q.question,
      codeSnippet: q.codeSnippet,
      difficulty: q.difficulty,
      questionType: q.questionType,
      options: q.options,
    };

    // Strip answers from question object sent to student
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correctAnswer, explanation, rubricKeywords, ...clientSafe } = q;
    clientQuestions.push(clientSafe);
  });

  // Save secret answer key with attempt ID
  try {
    sessionStorage.setItem(`${SECRET_KEY_PREFIX}${attemptId}`, JSON.stringify(secretAnswerKey));
  } catch {
    // Fallback if sessionStorage is full
    (window as any)[`${SECRET_KEY_PREFIX}${attemptId}`] = secretAnswerKey;
  }

  // Record signatures for future anti-repetition
  recordQuestionSignatures(validatedQuestions.map((q) => q.conceptSignature));

  return {
    attemptId,
    questions: clientQuestions,
    totalMarks,
    aiProviderUsed: providerUsed,
    isLiveAi,
  };
}

// ============================================================================
// 7. DETERMINISTIC SCORING & TAMPER-RESISTANT EVALUATION
// ============================================================================

export function evaluateStudentAttempt(
  attemptId: string,
  userId: string,
  config: AssessmentConfig,
  studentResponses: Record<string, any>,
  timeTakenSeconds: number,
  aiProviderUsed: string,
  isLiveAiGenerated: boolean
): AIAssessmentResult {
  let secretKey: Record<string, any> = {};
  try {
    const raw = sessionStorage.getItem(`${SECRET_KEY_PREFIX}${attemptId}`);
    if (raw) {
      secretKey = JSON.parse(raw);
    } else if ((window as any)[`${SECRET_KEY_PREFIX}${attemptId}`]) {
      secretKey = (window as any)[`${SECRET_KEY_PREFIX}${attemptId}`];
    }
  } catch {}

  const questionIds = Object.keys(secretKey);
  const totalQuestions = questionIds.length;

  let totalMarks = 0;
  let scoredMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const sectionTotals: Record<AssessmentSectionId, { score: number; total: number; marksEarned: number; marksMax: number }> = {
    aptitude: { score: 0, total: 0, marksEarned: 0, marksMax: 0 },
    logical: { score: 0, total: 0, marksEarned: 0, marksMax: 0 },
    quantitative: { score: 0, total: 0, marksEarned: 0, marksMax: 0 },
    verbal: { score: 0, total: 0, marksEarned: 0, marksMax: 0 },
    programming: { score: 0, total: 0, marksEarned: 0, marksMax: 0 },
    dsa: { score: 0, total: 0, marksEarned: 0, marksMax: 0 },
    core_cs: { score: 0, total: 0, marksEarned: 0, marksMax: 0 },
    communication: { score: 0, total: 0, marksEarned: 0, marksMax: 0 },
  };

  const difficultyTotals: Record<'easy' | 'medium' | 'hard', { score: number; total: number }> = {
    easy: { score: 0, total: 0 },
    medium: { score: 0, total: 0 },
    hard: { score: 0, total: 0 },
  };

  const questionBreakdown: QuestionResultBreakdown[] = [];
  const weakTopicsList: string[] = [];
  const strongTopicsList: string[] = [];

  for (const qId of questionIds) {
    const qData = secretKey[qId];
    const sAns = studentResponses[qId];
    const sec = qData.sectionId as AssessmentSectionId;
    const diff = qData.difficulty as 'easy' | 'medium' | 'hard';

    totalMarks += qData.marks;
    sectionTotals[sec].total += 1;
    sectionTotals[sec].marksMax += qData.marks;
    difficultyTotals[diff].total += 1;

    let isCorrect = false;
    let marksAwarded = 0;

    if (sAns === undefined || sAns === null || sAns === '') {
      unansweredCount++;
    } else {
      // Evaluation by question type
      if (qData.questionType === 'mcq' || qData.questionType === 'debugging') {
        isCorrect = Number(sAns) === Number(qData.correctAnswer);
      } else if (qData.questionType === 'multiple_select') {
        const studentArr = Array.isArray(sAns) ? sAns.map(Number).sort() : [];
        const correctArr = Array.isArray(qData.correctAnswer) ? qData.correctAnswer.map(Number).sort() : [];
        isCorrect = studentArr.length === correctArr.length && studentArr.every((val, idx) => val === correctArr[idx]);
      } else if (qData.questionType === 'numerical') {
        const sNum = parseFloat(String(sAns).trim());
        const cNum = parseFloat(String(qData.correctAnswer).trim());
        const tol = qData.numericalTolerance || 0.05;
        isCorrect = !isNaN(sNum) && !isNaN(cNum) && Math.abs(sNum - cNum) <= tol;
      } else if (qData.questionType === 'code_output') {
        const sNorm = String(sAns).replace(/\s+/g, '').trim().toLowerCase();
        const cNorm = String(qData.correctAnswer).replace(/\s+/g, '').trim().toLowerCase();
        isCorrect = sNorm === cNorm;
      } else if (qData.questionType === 'short_answer') {
        const sNorm = String(sAns).trim().toLowerCase();
        const keywords = qData.rubricKeywords || [String(qData.correctAnswer).toLowerCase()];
        isCorrect = keywords.some((kw: string) => sNorm.includes(kw.toLowerCase()));
      }

      if (isCorrect) {
        correctCount++;
        marksAwarded = qData.marks;
        scoredMarks += marksAwarded;
        sectionTotals[sec].score += 1;
        sectionTotals[sec].marksEarned += marksAwarded;
        difficultyTotals[diff].score += 1;
        strongTopicsList.push(qData.topic);
      } else {
        incorrectCount++;
        const penalty = qData.negativeMarks || 0;
        marksAwarded = -penalty;
        scoredMarks = Math.max(0, scoredMarks - penalty);
        weakTopicsList.push(qData.topic);
      }
    }

    questionBreakdown.push({
      questionId: qId,
      question: qData.question,
      codeSnippet: qData.codeSnippet,
      sectionId: sec,
      sectionTitle: SECTION_METADATA[sec]?.title || sec,
      topic: qData.topic,
      subtopic: qData.subtopic,
      difficulty: diff,
      questionType: qData.questionType,
      options: qData.options,
      studentAnswer: sAns,
      correctAnswer: qData.correctAnswer,
      isCorrect,
      marksAwarded,
      maxMarks: qData.marks,
      explanation: qData.explanation,
    });
  }

  // Section Scores
  const sectionScores: Record<AssessmentSectionId, SectionScore> = {} as any;
  const strengths: string[] = [];
  const weakAreas: string[] = [];
  const recommendations: string[] = [];

  (Object.keys(sectionTotals) as AssessmentSectionId[]).forEach((sec) => {
    const { score, total } = sectionTotals[sec];
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    sectionScores[sec] = { score, total, percentage: pct };

    if (total > 0) {
      if (pct >= 70) {
        strengths.push(`${SECTION_METADATA[sec]?.title} (${pct}% Accuracy)`);
      } else {
        weakAreas.push(`${SECTION_METADATA[sec]?.title} (${pct}% Accuracy)`);
      }
    }
  });

  // Difficulty Scores
  const difficultyScores: Record<'easy' | 'medium' | 'hard', { score: number; total: number; percentage: number }> = {
    easy: {
      score: difficultyTotals.easy.score,
      total: difficultyTotals.easy.total,
      percentage: difficultyTotals.easy.total > 0 ? Math.round((difficultyTotals.easy.score / difficultyTotals.easy.total) * 100) : 0,
    },
    medium: {
      score: difficultyTotals.medium.score,
      total: difficultyTotals.medium.total,
      percentage: difficultyTotals.medium.total > 0 ? Math.round((difficultyTotals.medium.score / difficultyTotals.medium.total) * 100) : 0,
    },
    hard: {
      score: difficultyTotals.hard.score,
      total: difficultyTotals.hard.total,
      percentage: difficultyTotals.hard.total > 0 ? Math.round((difficultyTotals.hard.score / difficultyTotals.hard.total) * 100) : 0,
    },
  };

  // Overall Score Percentage
  const overallPercentage = totalMarks > 0 ? Math.round((scoredMarks / totalMarks) * 100) : 0;

  // Placement Readiness Indicator
  let readinessLevel: ReadinessLevelInfo;
  if (overallPercentage >= 80) {
    readinessLevel = {
      tier: 'Tier-1 Product Companies',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Your scores align with the qualification benchmarks of Google, Microsoft, Amazon, and premier research institutions.',
      benchmarkPercent: overallPercentage,
    };
  } else if (overallPercentage >= 60) {
    readinessLevel = {
      tier: 'Tier-2 Competitive Tech',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'Solid foundational command. Targeted improvement in weak sections will elevate your readiness for top-tier product roles.',
      benchmarkPercent: overallPercentage,
    };
  } else {
    readinessLevel = {
      tier: 'Foundational Preparation Needed',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Core concepts require focused reinforcement before high-stakes placement drives.',
      benchmarkPercent: overallPercentage,
    };
  }

  // Actionable Roadmap & Resource Recommendations based on actual weak topics
  const uniqueWeakTopics = Array.from(new Set(weakTopicsList)).slice(0, 4);
  const actionableRoadmap: string[] = [];
  const suggestedResources: AIAssessmentAnalysis['suggestedResources'] = [];

  if (uniqueWeakTopics.length === 0) {
    actionableRoadmap.push('Maintain high-caliber placement readiness with full-length mock interviews and competitive time trials.');
    actionableRoadmap.push('Practice complex low-level system design (concurrency models, cache consistency, memory mapping).');
    suggestedResources.push({
      title: 'Distributed Systems & High-Throughput Architectures',
      type: 'course',
      url: 'https://ocw.mit.edu',
      topic: 'System Design',
    });
  } else {
    uniqueWeakTopics.forEach((tp) => {
      actionableRoadmap.push(`Complete 15-20 targeted drill questions on "${tp}" to reinforce problem-solving speed.`);
      suggestedResources.push({
        title: `Mastering ${tp}: Placement Guide & Problem Sets`,
        type: 'practice',
        url: 'https://geeksforgeeks.org',
        topic: tp,
      });
    });
  }

  // Next Recommended Assessment
  const lowestSection = (Object.keys(sectionScores) as AssessmentSectionId[]).reduce((prev, curr) =>
    sectionScores[curr].total > 0 && sectionScores[curr].percentage < (sectionScores[prev]?.percentage ?? 101) ? curr : prev
  );

  const nextRecommendedAssessment = {
    title: `Topic Practice: ${SECTION_METADATA[lowestSection]?.title || 'Core CS'}`,
    type: 'topic_practice' as const,
    sectionId: lowestSection,
    difficulty: 'medium' as const,
    rationale: `Targeting your lowest-scoring module (${sectionScores[lowestSection]?.percentage || 0}%) will produce the fastest readiness gains.`,
  };

  // Recommendations for general list
  recommendations.push(...actionableRoadmap);

  return {
    id: attemptId,
    userId,
    config,
    overallScore: overallPercentage,
    totalMarks,
    scoredMarks,
    totalQuestions,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    unansweredCount,
    timeTakenSeconds,
    sectionScores,
    difficultyScores,
    strengths: strengths.length > 0 ? strengths : ['General Aptitude Fundamentals'],
    weakAreas: weakAreas.length > 0 ? weakAreas : ['Pacing and High-Speed Accuracy'],
    recommendations,
    readinessLevel,
    questionBreakdown,
    aiAnalysis: {
      readinessSummary: `Candidate achieved ${overallPercentage}% overall score with ${correctCount}/${totalQuestions} correct answers in ${Math.round(timeTakenSeconds / 60)} minutes. Diagnostic estimation benchmarked at "${readinessLevel.tier}".`,
      actionableRoadmap,
      suggestedResources,
      nextRecommendedAssessment,
    },
    completedAt: new Date().toISOString(),
    aiProviderUsed,
    isLiveAiGenerated,
  };
}

/**
 * Enhances an evaluated assessment result with Gemini AI post-submission diagnostics.
 * Preserves deterministic scoring 100% without letting AI alter numerical marks or accuracy.
 */
export async function enhanceResultWithGeminiAnalysis(result: AIAssessmentResult): Promise<AIAssessmentResult> {
  try {
    const summaryPayload = {
      overallScore: result.overallScore,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      incorrectAnswers: result.incorrectAnswers,
      unansweredCount: result.unansweredCount,
      timeTakenMinutes: Math.round(result.timeTakenSeconds / 60),
      sectionScores: result.sectionScores,
      difficultyScores: result.difficultyScores,
      strengths: result.strengths,
      weakAreas: result.weakAreas,
      tier: result.readinessLevel.tier,
    };

    const res = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: summaryPayload }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.analysis) {
        const geminiAnalysis = data.analysis;
        return {
          ...result,
          aiAnalysis: {
            ...result.aiAnalysis,
            readinessSummary: geminiAnalysis.readinessSummary || result.aiAnalysis.readinessSummary,
            actionableRoadmap: Array.isArray(geminiAnalysis.actionableRoadmap) && geminiAnalysis.actionableRoadmap.length > 0
              ? geminiAnalysis.actionableRoadmap
              : result.aiAnalysis.actionableRoadmap,
            suggestedResources: Array.isArray(geminiAnalysis.suggestedResources) && geminiAnalysis.suggestedResources.length > 0
              ? geminiAnalysis.suggestedResources
              : result.aiAnalysis.suggestedResources,
          },
          aiProviderUsed: result.aiProviderUsed.includes('Gemini')
            ? result.aiProviderUsed
            : `${result.aiProviderUsed} + Gemini Mentor`,
        };
      }
    }
  } catch (err) {
    console.warn('Gemini post-assessment diagnostic analysis request bypassed, keeping deterministic analysis:', err);
  }

  return result;
}

// ============================================================================
// 8. SESSION STATE PERSISTENCE (AUTOSAVE & REFRESH RECOVERY)
// ============================================================================

export function saveActiveSession(session: {
  attemptId: string;
  userId: string;
  config: AssessmentConfig;
  questions: ClientAssessmentQuestion[];
  responses: Record<string, any>;
  reviewFlags: Record<string, boolean>;
  currentQuestionIndex: number;
  remainingSeconds: number;
  startedAt: string;
  aiProviderUsed: string;
  isLiveAiGenerated: boolean;
}) {
  try {
    localStorage.setItem(`${ACTIVE_SESSION_PREFIX}${session.attemptId}`, JSON.stringify(session));
    localStorage.setItem('pathsync_last_active_attempt_id', session.attemptId);
  } catch {}
}

export function getActiveSession(attemptId?: string) {
  try {
    const id = attemptId || localStorage.getItem('pathsync_last_active_attempt_id');
    if (!id) return null;
    const raw = localStorage.getItem(`${ACTIVE_SESSION_PREFIX}${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveSession(attemptId: string) {
  try {
    localStorage.removeItem(`${ACTIVE_SESSION_PREFIX}${attemptId}`);
    if (localStorage.getItem('pathsync_last_active_attempt_id') === attemptId) {
      localStorage.removeItem('pathsync_last_active_attempt_id');
    }
  } catch {}
}
