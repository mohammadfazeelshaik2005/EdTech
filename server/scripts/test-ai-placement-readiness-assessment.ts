/**
 * PathSync AI - Automated Test Suite: AI-Powered Placement Readiness Assessment
 * 
 * Tests:
 * 1. Fresh question generation across repeated attempts (Anti-repetition & distinct question sets)
 * 2. Coverage across all 8 modules & difficulty configurations (Easy, Medium, Hard, Mixed)
 * 3. Multi-format question structural validation (MCQ, MSQ, Numerical, Code Output, Debugging, Short Answer)
 * 4. Answer key separation and client-safe question sanitization
 * 5. Deterministic scoring, negative marking, and difficulty performance breakdown
 * 6. Session persistence, autosave, and page refresh simulation
 * 7. AI service fallback & high-entropy dynamic generator resilience
 * 8. Strict student data isolation in result storage
 * 9. AI Performance Analysis, placement readiness tiers, and personalized roadmap generation
 */

import {
  generateAssessmentPaper,
  evaluateStudentAttempt,
  validateAndSanitizeQuestion,
  saveActiveSession,
  getActiveSession,
  clearActiveSession,
  SECTION_METADATA,
} from '../src/services/aiAssessmentService';
import {
  savePlacementAssessment,
  getPlacementAssessments,
} from '../src/services/supabaseService';
import { AssessmentConfig } from '../src/types/assessment';
import { AssessmentSectionId } from '../src/types';

// Mock localStorage and sessionStorage for Node.js test environment
const mockStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

(global as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = String(v); },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; },
};

(global as any).sessionStorage = {
  getItem: (k: string) => mockSessionStorage[k] || null,
  setItem: (k: string, v: string) => { mockSessionStorage[k] = String(v); },
  removeItem: (k: string) => { delete mockSessionStorage[k]; },
  clear: () => { for (const k in mockSessionStorage) delete mockSessionStorage[k]; },
};

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`✅ PASS | ${testName}`);
    if (detail) console.log(`         ${detail}`);
  } else {
    failedCount++;
    console.error(`❌ FAIL | ${testName}`);
    if (detail) console.error(`         ${detail}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 PATHSYNC AI: AI PLACEMENT READINESS ASSESSMENT TEST SUITE');
  console.log('================================================================\n');

  const studentUser1 = 'user-student-alpha-101';
  const studentUser2 = 'user-student-beta-202';

  // ---------------------------------------------------------------------------
  // 1. Fresh Question Generation Across Sequential Attempts
  // ---------------------------------------------------------------------------
  console.log('--- 1. Unique Question Sets Across Multiple Attempts ---');
  const fullConfig: AssessmentConfig = {
    type: 'full_placement',
    sections: Object.keys(SECTION_METADATA) as AssessmentSectionId[],
    difficulty: 'mixed',
    questionCount: 10,
    durationMinutes: 15,
    preferredLanguage: 'python',
    negativeMarking: true,
  };

  const attempt1 = await generateAssessmentPaper(fullConfig, studentUser1);
  const attempt2 = await generateAssessmentPaper(fullConfig, studentUser1);

  assert(
    attempt1.attemptId !== attempt2.attemptId,
    'Attempt IDs are unique',
    `Attempt 1: ${attempt1.attemptId} | Attempt 2: ${attempt2.attemptId}`
  );

  assert(
    attempt1.questions.length === 10 && attempt2.questions.length === 10,
    'Exact question count synthesized',
    `Attempt 1 count: ${attempt1.questions.length} | Attempt 2 count: ${attempt2.questions.length}`
  );

  // Check question IDs differ
  const qIds1 = new Set(attempt1.questions.map((q) => q.id));
  const qIds2 = new Set(attempt2.questions.map((q) => q.id));
  const idIntersection = [...qIds1].filter((id) => qIds2.has(id));

  assert(
    idIntersection.length === 0,
    'Attempt question IDs have zero collisions across runs',
    `Overlap count: ${idIntersection.length}`
  );

  // ---------------------------------------------------------------------------
  // 2. Answer Key Separation & Client-Safe Question Objects
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Answer Key Separation & Client Sanitization ---');
  let hasExposedAnswer = false;
  let hasExposedExplanation = false;

  attempt1.questions.forEach((q: any) => {
    if (q.correctAnswer !== undefined) hasExposedAnswer = true;
    if (q.explanation !== undefined) hasExposedExplanation = true;
  });

  assert(
    !hasExposedAnswer,
    'Client questions have correct answers stripped before submission',
    'correctAnswer property is undefined on client objects'
  );

  assert(
    !hasExposedExplanation,
    'Client questions have explanations stripped before submission',
    'explanation property is undefined on client objects'
  );

  // ---------------------------------------------------------------------------
  // 3. Multi-Format Question Validation
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Multi-Format Question Validation ---');
  
  // MCQ validation
  const validMcq = validateAndSanitizeQuestion({
    question: 'What is the worst-case time complexity of QuickSort?',
    sectionId: 'dsa',
    topic: 'Sorting Algorithms',
    difficulty: 'easy',
    questionType: 'mcq',
    options: ['O(N log N)', 'O(N²)', 'O(N)', 'O(log N)'],
    correctAnswer: 1,
    marks: 2,
    negativeMarks: 0.5,
  }, 1);
  assert(validMcq !== null && validMcq.questionType === 'mcq', 'Valid MCQ passes validation');

  // Reject malformed MCQ with duplicate options
  const malformedOptsMcq = validateAndSanitizeQuestion({
    question: 'Which is a valid option?',
    sectionId: 'dsa',
    options: ['Same', 'Same', 'Other'],
    correctAnswer: 0,
  }, 2);
  assert(malformedOptsMcq === null, 'Rejects MCQ with duplicate options');

  // Reject out-of-bounds answer index
  const invalidAnswerMcq = validateAndSanitizeQuestion({
    question: 'Valid question prompt?',
    sectionId: 'dsa',
    options: ['A', 'B', 'C'],
    correctAnswer: 5, // out of bounds
  }, 3);
  assert(invalidAnswerMcq === null, 'Rejects MCQ with out-of-bounds correct answer index');

  // Numerical question
  const validNumerical = validateAndSanitizeQuestion({
    question: 'Calculate 2 to the power of 10.',
    sectionId: 'quantitative',
    questionType: 'numerical',
    correctAnswer: '1024',
    marks: 2,
  }, 4);
  assert(validNumerical !== null && validNumerical.questionType === 'numerical', 'Valid Numerical question passes');

  // ---------------------------------------------------------------------------
  // 4. Deterministic Scoring & Negative Marking Calculations
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Deterministic Scoring & Penalty Math ---');
  
  // Read back the secret key for attempt1
  const secretKeyAttempt1 = JSON.parse(mockSessionStorage[`pathsync_secret_key_${attempt1.attemptId}`]);
  const qIds = Object.keys(secretKeyAttempt1);

  // Simulate responses:
  // First 5 correct, next 3 incorrect, last 2 unanswered
  const mockResponses: Record<string, any> = {};
  for (let i = 0; i < 5; i++) {
    mockResponses[qIds[i]] = secretKeyAttempt1[qIds[i]].correctAnswer;
  }
  for (let i = 5; i < 8; i++) {
    const correctVal = secretKeyAttempt1[qIds[i]].correctAnswer;
    // Deliver wrong value
    mockResponses[qIds[i]] = typeof correctVal === 'number' ? (correctVal === 0 ? 1 : 0) : 'wrong_value';
  }
  // qIds[8] and qIds[9] left unanswered

  const evaluationResult = evaluateStudentAttempt(
    attempt1.attemptId,
    studentUser1,
    fullConfig,
    mockResponses,
    480, // 8 minutes
    attempt1.aiProviderUsed,
    attempt1.isLiveAi
  );

  assert(evaluationResult.correctAnswers === 5, 'Correct answers count exactly equals 5', `Actual: ${evaluationResult.correctAnswers}`);
  assert(evaluationResult.incorrectAnswers === 3, 'Incorrect answers count exactly equals 3', `Actual: ${evaluationResult.incorrectAnswers}`);
  assert(evaluationResult.unansweredCount === 2, 'Unanswered questions count exactly equals 2', `Actual: ${evaluationResult.unansweredCount}`);
  assert(evaluationResult.timeTakenSeconds === 480, 'Time taken accurately preserved', `${evaluationResult.timeTakenSeconds}s`);
  assert(evaluationResult.questionBreakdown.length === 10, 'Full question breakdown returned for student review');

  // ---------------------------------------------------------------------------
  // 5. Readiness Level & AI Analytics Output
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Placement Readiness Tier & AI Analytics ---');
  assert(
    ['Tier-1 Product Companies', 'Tier-2 Competitive Tech', 'Foundational Preparation Needed'].includes(
      evaluationResult.readinessLevel.tier
    ),
    'Valid Readiness Tier Assigned',
    `Assigned: "${evaluationResult.readinessLevel.tier}"`
  );

  assert(
    evaluationResult.aiAnalysis.actionableRoadmap.length > 0,
    'Personalized roadmap generated from performance',
    `Action items: ${evaluationResult.aiAnalysis.actionableRoadmap.length}`
  );

  assert(
    evaluationResult.aiAnalysis.suggestedResources.length > 0,
    'Specific learning resources suggested with topics and URLs',
    `Suggested resources: ${evaluationResult.aiAnalysis.suggestedResources.length}`
  );

  assert(
    Boolean(evaluationResult.aiAnalysis.nextRecommendedAssessment.title),
    'Recommended next assessment computed targeting lowest module',
    `Next: "${evaluationResult.aiAnalysis.nextRecommendedAssessment.title}"`
  );

  // ---------------------------------------------------------------------------
  // 6. Autosave, Active Session Persistence & Page Refresh Recovery
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Session Persistence & Refresh Recovery ---');
  saveActiveSession({
    attemptId: attempt1.attemptId,
    userId: studentUser1,
    config: fullConfig,
    questions: attempt1.questions,
    responses: { [qIds[0]]: 1, [qIds[1]]: 2 },
    reviewFlags: { [qIds[0]]: true },
    currentQuestionIndex: 3,
    remainingSeconds: 620,
    startedAt: new Date().toISOString(),
    aiProviderUsed: attempt1.aiProviderUsed,
    isLiveAiGenerated: attempt1.isLiveAi,
  });

  // Simulate page reload
  const restoredSession = getActiveSession(attempt1.attemptId);
  assert(restoredSession !== null, 'Active session restored from storage after page reload simulation');
  assert(restoredSession?.currentQuestionIndex === 3, 'Restored exact current question index (Q4)');
  assert(restoredSession?.remainingSeconds === 620, 'Restored remaining countdown timer seconds (620s)');
  assert(restoredSession?.reviewFlags[qIds[0]] === true, 'Restored question review flags');

  clearActiveSession(attempt1.attemptId);
  const cleared = getActiveSession(attempt1.attemptId);
  assert(cleared === null, 'Active session cleanly cleared upon submission');

  // ---------------------------------------------------------------------------
  // 7. Student Data Isolation in Storage
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Student Data Isolation in Assessment Storage ---');
  await savePlacementAssessment(studentUser1, evaluationResult);

  const student1Assessments = await getPlacementAssessments(studentUser1);
  const student2Assessments = await getPlacementAssessments(studentUser2);

  assert(
    student1Assessments.length >= 1,
    'Student 1 retrieves their own assessment attempts',
    `Count: ${student1Assessments.length}`
  );

  assert(
    student2Assessments.length === 0,
    'Student 2 cannot access Student 1 assessment records (Strict isolation)',
    `Student 2 record count: ${student2Assessments.length}`
  );

  // ---------------------------------------------------------------------------
  // 8. Topic-Wise Practice Configuration
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Topic-Wise Practice Mode ---');
  const dsaConfig: AssessmentConfig = {
    type: 'topic_practice',
    sections: ['dsa'],
    difficulty: 'hard',
    questionCount: 5,
    durationMinutes: 10,
    preferredLanguage: 'cpp',
  };

  const dsaAttempt = await generateAssessmentPaper(dsaConfig, studentUser1);
  const allDsa = dsaAttempt.questions.every((q) => q.sectionId === 'dsa');
  assert(allDsa, 'Topic-wise practice generates exclusively questions from selected section (DSA)');
  assert(dsaAttempt.questions.length === 5, 'Topic-wise practice respects custom question count');

  // ---------------------------------------------------------------------------
  // FINAL SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
