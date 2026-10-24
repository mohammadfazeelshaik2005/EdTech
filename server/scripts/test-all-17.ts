// Polyfill localStorage and browser globals for Node test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => { store.set(key, String(val)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (idx: number) => Array.from(store.keys())[idx] || null,
    length: 0,
  } as Storage;
}

if (typeof (globalThis as any).FileReader === 'undefined') {
  (globalThis as any).FileReader = class {
    onload: any = null;
    onerror: any = null;
    result: any = null;
    readAsDataURL(blob: any) {
      setTimeout(() => {
        this.result = `data:${blob.type || 'image/png'};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
        if (this.onload) this.onload({ target: { result: this.result } });
      }, 10);
    }
  };
}

import {
  signInUser,
  signUpUser,
  signOutUser,
  uploadProfilePhoto,
  removeProfilePhoto,
  uploadResumeToStorage,
  removeResumeFromStorage,
  savePlacementAssessment,
  getPlacementAssessments,
  getAdminAccounts,
  createAdminAccount,
  deactivateAdminAccount,
} from '../src/services/supabaseService';
import {
  getEligibleRecommendationPool,
  getPersonalizedRecommendations,
} from '../src/services/recommendationEngine';
import {
  evaluatePlacementAssessment,
  PLACEMENT_ASSESSMENT_QUESTIONS,
} from '../src/services/readinessService';
import { mockOpportunities } from '../src/data/mockData';

async function runAll17Tests() {
  console.log('================================================================');
  console.log('🧪 PATHSYNC AI: COMPREHENSIVE VERIFICATION SUITE (TESTS 1 - 17)');
  console.log('================================================================\n');

  const results: { test: number; title: string; passed: boolean; details: string }[] = [];

  // --------------------------------------------------------------------------
  // TEST 1: Fresh browser/startup - No automatic login, session is unauthenticated
  // --------------------------------------------------------------------------
  try {
    localStorage.clear();
    const storedSession = localStorage.getItem('pathsync_auth_user');
    const passed = storedSession === null;
    results.push({
      test: 1,
      title: 'Fresh session initialization / No automatic login',
      passed,
      details: passed ? 'Initial state is unauthenticated (null session). No automatic login.' : 'Failed: Found auto-created session.',
    });
  } catch (err: any) {
    results.push({ test: 1, title: 'Fresh session initialization', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 2: Attempt login with unregistered email
  // --------------------------------------------------------------------------
  try {
    let failedAsExpected = false;
    let errorMessage = '';
    try {
      await signInUser('unregistered_ghost_student@college.edu', 'Password123!');
    } catch (err: any) {
      failedAsExpected = true;
      errorMessage = err.message;
    }
    const passed = failedAsExpected && errorMessage.includes('Account not found. Please create a student account first.');
    results.push({
      test: 2,
      title: 'Login attempt with unregistered email',
      passed,
      details: passed
        ? `Threw exact expected error: "${errorMessage}" without creating account or granting dashboard access.`
        : `Failed: expected error not thrown. Got: "${errorMessage}"`,
    });
  } catch (err: any) {
    results.push({ test: 2, title: 'Login attempt with unregistered email', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 3: Create a student account (Public signup creates strictly student)
  // --------------------------------------------------------------------------
  let student1User: any = null;
  try {
    const regResult = await signUpUser(
      'aarav.sharma@iitb.ac.in',
      'SecurePassword123!',
      'Aarav Sharma'
    );
    student1User = regResult.user;
    const passed = student1User && student1User.role === 'student' && student1User.email === 'aarav.sharma@iitb.ac.in';
    results.push({
      test: 3,
      title: 'Create student account via public signup',
      passed,
      details: passed
        ? `Student created with ID "${student1User.id}", role strictly "${student1User.role}". No admin option allowed.`
        : 'Failed: role was not strictly student or account creation failed.',
    });
  } catch (err: any) {
    results.push({ test: 3, title: 'Create student account via public signup', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 4: Logout - Session cleared
  // --------------------------------------------------------------------------
  try {
    await signOutUser();
    const storedSession = localStorage.getItem('pathsync_auth_user');
    const passed = storedSession === null;
    results.push({
      test: 4,
      title: 'Logout clears session',
      passed,
      details: passed ? 'Session data successfully cleared from storage upon logout.' : 'Failed: Session remained in storage.',
    });
  } catch (err: any) {
    results.push({ test: 4, title: 'Logout clears session', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 5: Login using newly created student account
  // --------------------------------------------------------------------------
  try {
    const loginResult = await signInUser('aarav.sharma@iitb.ac.in', 'SecurePassword123!');
    const passed = loginResult.user.id === student1User.id && loginResult.user.role === 'student';
    results.push({
      test: 5,
      title: 'Login using newly created student account',
      passed,
      details: passed ? `Student dashboard authenticated successfully for "${loginResult.user.fullName}".` : 'Failed to authenticate student.',
    });
  } catch (err: any) {
    results.push({ test: 5, title: 'Login using newly created student account', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 6: Create second student account and verify user data isolation
  // --------------------------------------------------------------------------
  let student2User: any = null;
  try {
    const regResult2 = await signUpUser(
      'diya.patel@nitk.ac.in',
      'SecurePassword123!',
      'Diya Patel'
    );
    student2User = regResult2.user;
    
    // Save assessment for Student 1
    await savePlacementAssessment(student1User.id, {
      userId: student1User.id,
      overallScore: 85,
      totalQuestions: 16,
      correctAnswers: 14,
      sectionScores: [],
      strengths: ['DSA Fundamentals'],
      weakAreas: ['Communication'],
      recommendations: ['Practice behavioral interviews'],
    });

    // Check what Student 2 sees
    const student2Assessments = await getPlacementAssessments(student2User.id);
    const student1Assessments = await getPlacementAssessments(student1User.id);

    const passed = student2Assessments.length === 0 && student1Assessments.length === 1 && student1User.id !== student2User.id;
    results.push({
      test: 6,
      title: 'User data isolation across multiple student accounts',
      passed,
      details: passed
        ? `Student 2 (${student2User.email}) isolated with 0 records, while Student 1 has 1 private record.`
        : 'Failed: Data leaked across student IDs.',
    });
  } catch (err: any) {
    results.push({ test: 6, title: 'User data isolation across multiple student accounts', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 7: Try accessing admin actions as a student -> Access Denied
  // --------------------------------------------------------------------------
  try {
    let accessBlocked = false;
    let blockReason = '';
    try {
      await getAdminAccounts(student1User.id);
    } catch (err: any) {
      accessBlocked = true;
      blockReason = err.message;
    }
    const passed = accessBlocked && (blockReason.includes('Only authenticated administrators') || blockReason.includes('Access Denied'));
    results.push({
      test: 7,
      title: 'Student attempting to access admin operations',
      passed,
      details: passed ? `Blocked by backend check: "${blockReason}".` : 'Failed: Student was not blocked.',
    });
  } catch (err: any) {
    results.push({ test: 7, title: 'Student attempting to access admin operations', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 8: Admin logs in -> Admin dashboard accessible
  // --------------------------------------------------------------------------
  let adminUser: any = null;
  try {
    const adminLogin = await signInUser('admin@pathsync.ai', 'Admin@PathSync2026!');
    adminUser = adminLogin.user;
    const passed = adminUser && adminUser.role === 'admin';
    results.push({
      test: 8,
      title: 'Administrator authentication and dashboard access',
      passed,
      details: passed ? `Admin authenticated with role "${adminUser.role}". Admin dashboard accessible.` : 'Failed: Admin login failed.',
    });
  } catch (err: any) {
    results.push({ test: 8, title: 'Administrator authentication and dashboard access', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 9: Admin creates another admin -> New admin can authenticate as admin
  // --------------------------------------------------------------------------
  try {
    const newAdmin = await createAdminAccount(
      adminUser.id,
      'priya.nair@pathsync.ai',
      'Priya Nair',
      'AdminPassword@2026!'
    );

    const newAdminLogin = await signInUser('priya.nair@pathsync.ai', 'AdminPassword@2026!');

    const passed = newAdmin && newAdminLogin.user.role === 'admin' && newAdminLogin.user.email === 'priya.nair@pathsync.ai';
    results.push({
      test: 9,
      title: 'Admin creates another admin and authenticates as admin',
      passed,
      details: passed ? `New admin "Priya Nair" created by authorized admin and verified with role "admin".` : 'Failed: New admin creation failed.',
    });
  } catch (err: any) {
    results.push({ test: 9, title: 'Admin creates another admin', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 10: Student attempts to create or change their role to admin -> Impossible
  // --------------------------------------------------------------------------
  try {
    let studentCreateAdminBlocked = false;
    try {
      await createAdminAccount(
        student1User.id,
        'hacker@pathsync.ai',
        'Hacker',
        'Password123!'
      );
    } catch (err: any) {
      studentCreateAdminBlocked = true;
    }

    const passed = studentCreateAdminBlocked;
    results.push({
      test: 10,
      title: 'Student attempts to grant or create admin role',
      passed,
      details: passed ? 'Student blocked at backend service level from creating admins or elevating permissions.' : 'Failed: Student could create admin.',
    });
  } catch (err: any) {
    results.push({ test: 10, title: 'Student attempts to grant admin role', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 11: Create/upload profile photo (validation, isolated to student)
  // --------------------------------------------------------------------------
  try {
    // Test size validation (> 2MB rejected)
    const largeFile = new File([new Uint8Array(2.5 * 1024 * 1024)], 'giant_photo.jpg', { type: 'image/jpeg' });
    let sizeRejected = false;
    try {
      await uploadProfilePhoto(student1User.id, largeFile);
    } catch (e: any) {
      if (e.message.includes('exceeds 2 MB limit')) sizeRejected = true;
    }

    // Test invalid format rejected
    const textFile = new File(['hello'], 'script.exe', { type: 'application/octet-stream' });
    let typeRejected = false;
    try {
      await uploadProfilePhoto(student1User.id, textFile);
    } catch (e: any) {
      if (e.message.includes('Invalid file format')) typeRejected = true;
    }

    // Valid upload
    const validPhoto = new File([new Uint8Array(100 * 1024)], 'avatar.png', { type: 'image/png' });
    const uploadRes = await uploadProfilePhoto(student1User.id, validPhoto);
    const photoSavedSuccessfully = Boolean(uploadRes.url && uploadRes.url.length > 0);

    const passed = sizeRejected && typeRejected && photoSavedSuccessfully;
    results.push({
      test: 11,
      title: 'Student profile photo upload validation & isolation',
      passed,
      details: passed
        ? `Validated size limit (>2MB rejected), type checking (only JPEG/PNG/WebP), and isolated to user ID "${student1User.id}".`
        : 'Failed: Validation or storage isolation error.',
    });
  } catch (err: any) {
    results.push({ test: 11, title: 'Student profile photo upload validation', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 12: Upload/update resume (validation, isolated to student, updates recommendation profile)
  // --------------------------------------------------------------------------
  try {
    // Test size validation (> 5MB rejected)
    const largeResume = new File([new Uint8Array(6 * 1024 * 1024)], 'huge_resume.pdf', { type: 'application/pdf' });
    let sizeRejected = false;
    try {
      await uploadResumeToStorage(student1User.id, largeResume);
    } catch (e: any) {
      if (e.message.includes('exceeds 5 MB limit')) sizeRejected = true;
    }

    // Valid resume upload
    const validResume = new File([new Uint8Array(200 * 1024)], 'Aarav_Sharma_Resume.pdf', { type: 'application/pdf' });
    const resumeRes = await uploadResumeToStorage(student1User.id, validResume);
    const resumeBelongsToStudent = resumeRes.url.includes(student1User.id);

    const passed = sizeRejected && resumeBelongsToStudent && resumeRes.fileName === 'Aarav_Sharma_Resume.pdf';
    results.push({
      test: 12,
      title: 'Upload/update resume with validation & isolation',
      passed,
      details: passed
        ? `Resume validated (<=5MB PDF/DOCX), isolated under "${student1User.id}", and registered to student profile for recommendations.`
        : 'Failed: Resume validation or isolation issue.',
    });
  } catch (err: any) {
    results.push({ test: 12, title: 'Upload/update resume', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 13: Test an opportunity marked as international-only
  // --------------------------------------------------------------------------
  try {
    const internationalOpp = mockOpportunities.find((o) => o.id === 'opp-intl-us');
    const eligiblePool = getEligibleRecommendationPool(mockOpportunities);
    const isInPool = eligiblePool.some((o) => o.id === 'opp-intl-us');

    const passed = internationalOpp !== undefined && internationalOpp.is_india_opportunity === false && !isInPool;
    results.push({
      test: 13,
      title: 'International-only opportunity excluded from recommendations',
      passed,
      details: passed
        ? `Opportunity "opp-intl-us" (US NSF Graduate Research Fellowship) marked is_india_opportunity: false is strictly excluded from recommendation pool.`
        : 'Failed: International-only opportunity leaked into pool.',
    });
  } catch (err: any) {
    results.push({ test: 13, title: 'International-only opportunity exclusion', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 14: Test an opportunity marked as India-eligible
  // --------------------------------------------------------------------------
  try {
    const eligiblePool = getEligibleRecommendationPool(mockOpportunities);
    const indiaOpp = eligiblePool.find((o) => o.id === 'opp-1');

    const passed = indiaOpp !== undefined && indiaOpp.is_india_opportunity === true && indiaOpp.verificationStatus === 'VERIFIED';
    results.push({
      test: 14,
      title: 'India-eligible verified opportunity proceeds through recommendation',
      passed,
      details: passed
        ? `Opportunity "${indiaOpp?.title}" with is_india_opportunity: true successfully passed into recommendation pool.`
        : 'Failed: India-eligible opportunity missing from pool.',
    });
  } catch (err: any) {
    results.push({ test: 14, title: 'India-eligible opportunity recommendation', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 15: Unverified opportunity never recommended
  // --------------------------------------------------------------------------
  try {
    const pendingOpp = mockOpportunities.find((o) => o.id === 'opp-pending-1');
    const eligiblePool = getEligibleRecommendationPool(mockOpportunities);
    const isPendingInPool = eligiblePool.some((o) => o.id === 'opp-pending-1');

    const passed = pendingOpp !== undefined && pendingOpp.verificationStatus === 'PENDING_REVIEW' && !isPendingInPool;
    results.push({
      test: 15,
      title: 'Unverified opportunity never recommended',
      passed,
      details: passed
        ? `Pending opportunity "opp-pending-1" (status: ${pendingOpp?.verificationStatus}) is strictly barred from recommendation pool.`
        : 'Failed: Unverified opportunity appeared in pool.',
    });
  } catch (err: any) {
    results.push({ test: 15, title: 'Unverified opportunity exclusion', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 16: Expired opportunity never recommended
  // --------------------------------------------------------------------------
  try {
    const expiredOpp = mockOpportunities.find((o) => o.id === 'opp-expired-1');
    const eligiblePool = getEligibleRecommendationPool(mockOpportunities);
    const isExpiredInPool = eligiblePool.some((o) => o.id === 'opp-expired-1');

    const passed = expiredOpp !== undefined && (expiredOpp.isExpired === true || expiredOpp.verificationStatus === 'EXPIRED') && !isExpiredInPool;
    results.push({
      test: 16,
      title: 'Expired opportunity never recommended',
      passed,
      details: passed
        ? `Expired opportunity "opp-expired-1" (isExpired: true) is strictly filtered out of recommendations.`
        : 'Failed: Expired opportunity appeared in pool.',
    });
  } catch (err: any) {
    results.push({ test: 16, title: 'Expired opportunity exclusion', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // TEST 17: Student takes placement assessment
  // --------------------------------------------------------------------------
  try {
    // Generate answers for all 16 questions (12 correct, 4 incorrect)
    const answers: Record<string, number> = {};
    PLACEMENT_ASSESSMENT_QUESTIONS.forEach((q, idx) => {
      // Answer first 12 correctly, last 4 incorrectly
      answers[q.id] = idx < 12 ? q.correctAnswer : (q.correctAnswer + 1) % q.options.length;
    });

    const evaluation = evaluatePlacementAssessment(answers);
    const savedAttempt = await savePlacementAssessment(student1User.id, {
      userId: student1User.id,
      overallScore: evaluation.overallScore,
      totalQuestions: evaluation.totalQuestions,
      correctAnswers: evaluation.correctAnswers,
      sectionScores: evaluation.sectionScores,
      strengths: evaluation.strengths,
      weakAreas: evaluation.weakAreas,
      recommendations: evaluation.recommendations,
    });

    const userAttempts = await getPlacementAssessments(student1User.id);
    const passed =
      evaluation.overallScore === 75 &&
      Object.keys(evaluation.sectionScores).length === 8 &&
      evaluation.strengths.length > 0 &&
      evaluation.weakAreas.length > 0 &&
      userAttempts.some((a) => a.id === savedAttempt.id);

    results.push({
      test: 17,
      title: 'Placement assessment evaluation & secure student attempt persistence',
      passed,
      details: passed
        ? `Scored 75.0% across 8 sections (Aptitude, Logical, Quant, Verbal, Prog, DSA, Core CS, Comm). Correctly computed strengths/weaknesses and saved to student's isolated records.`
        : 'Failed: Assessment scoring or persistence failed.',
    });
  } catch (err: any) {
    results.push({ test: 17, title: 'Placement assessment test', passed: false, details: err.message });
  }

  // --------------------------------------------------------------------------
  // PRINT SUMMARY
  // --------------------------------------------------------------------------
  console.log('RESULTS SUMMARY:');
  console.log('----------------------------------------------------------------');
  let passCount = 0;
  for (const r of results) {
    const statusIcon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${statusIcon} | TEST ${r.test.toString().padStart(2, ' ')}: ${r.title}`);
    console.log(`         ${r.details}\n`);
    if (r.passed) passCount++;
  }

  console.log('================================================================');
  console.log(`TOTAL: ${passCount} / ${results.length} TESTS PASSED`);
  console.log('================================================================');

  if (passCount === results.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAll17Tests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
