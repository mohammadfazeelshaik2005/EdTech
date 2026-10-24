import {
  executeDataCollectionPipeline,
  cleanOpportunityPayload,
  normalizeOpportunityPayload,
  evaluateIndiaEligibility,
  checkOpportunityDuplicate,
  verifyOpportunity,
  saveVerifiedOpportunities,
  getActiveVerifiedOpportunities,
  resetOpportunityStore,
  INGESTION_SOURCES,
  runScraperForSource,
  ALL_SOURCE_SCRAPERS,
  startScheduler,
  stopScheduler,
  getSchedulerConfig,
  getSchedulerHistory,
  triggerScheduledRunNow,
} from '../src/services/dataCollection';
import { getPersonalizedRecommendations } from '../src/services/recommendationEngine';
import { RawOpportunityPayload, NormalizedOpportunity } from '../src/types/dataCollection';

async function runPipelineVerificationSuite() {
  console.log('================================================================');
  console.log('🧪 PATHSYNC AI: AUTOMATIC COLLECTION & VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail: string) {
    if (condition) {
      console.log(`✅ PASS | ${testName}`);
      console.log(`         ${detail}\n`);
      passed++;
    } else {
      console.error(`❌ FAIL | ${testName}`);
      console.error(`         ${detail}\n`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Source Registry & 9 Approved Sources
  // -------------------------------------------------------------------------
  assert(
    INGESTION_SOURCES.length === 9,
    'TEST 1: 9 Approved Sources Configured',
    `Registered sources: ${INGESTION_SOURCES.map((s) => s.name).join(', ')}`
  );

  // -------------------------------------------------------------------------
  // TEST 2: Scrape Single Source (e.g., Unstop)
  // -------------------------------------------------------------------------
  const singleReport = await executeDataCollectionPipeline({ sourceId: 'src-unstop' });
  assert(
    singleReport.totalCollected > 0 &&
      singleReport.sourceStats['src-unstop'] &&
      singleReport.sourceStats['src-unstop'].status === 'SUCCESS',
    'TEST 2: Scrape Single Source (Unstop)',
    `Extracted ${singleReport.totalCollected} items, verified ${singleReport.totalVerified}, status: SUCCESS`
  );

  // -------------------------------------------------------------------------
  // TEST 3: Scrape All Sources with Error & Protection Handling
  // -------------------------------------------------------------------------
  const allReport = await executeDataCollectionPipeline();
  assert(
    allReport.totalCollected > 0 &&
      Object.keys(allReport.sourceStats).length === 9,
    'TEST 3: Scrape All 9 Sources Execution',
    `Processed 9 sources: collected ${allReport.totalCollected}, normalized ${allReport.totalNormalized}, verified ${allReport.totalVerified}`
  );

  // -------------------------------------------------------------------------
  // TEST 4: Devpost Cloudflare HTTP 403 Bot Protection Handled (Rule 2 & 21)
  // -------------------------------------------------------------------------
  const devpostStat = allReport.sourceStats['src-devpost'];
  assert(
    devpostStat &&
      devpostStat.status === 'BLOCKED' &&
      devpostStat.discoveredCount === 0 &&
      devpostStat.errorDetails?.includes('Cloudflare'),
    'TEST 4: Devpost Cloudflare Bot Protection Handled Honestly',
    `Reported status: BLOCKED without CAPTCHA bypass or fabricated records per Rule 2 & Rule 21.`
  );

  // -------------------------------------------------------------------------
  // TEST 5: Normalization - 24 Canonical Required Fields
  // -------------------------------------------------------------------------
  const rawSample: RawOpportunityPayload = {
    source_id: 'src-isti',
    source_name: 'ISTI Portal',
    source_url: 'https://www.indiascienceandtechnology.gov.in/',
    fetched_at: new Date().toISOString(),
    title: 'DST National Postdoctoral Fellowship in Quantum Materials',
    org_name: 'Department of Science and Technology',
    raw_description: 'Research grant funded by DST Government of India for young scientists.',
    raw_category: 'Research Programs',
    raw_url: 'https://online-dst.gov.in/Projectproposal.aspx',
    raw_official_url: 'https://www.indiascienceandtechnology.gov.in/scheme/dst-npdf',
    raw_location: 'New Delhi, India',
    raw_country: 'India',
    raw_eligibility: 'Indian citizens with PhD or MD in Science or Engineering.',
    raw_deadline: '2026-11-30',
    raw_start_date: '2027-01-01',
    raw_end_date: '2029-01-01',
    raw_skills: ['Quantum Computing', 'Condensed Matter Physics'],
    raw_education_level: 'Postgraduate / Doctorate',
    raw_eligible_branch: 'Physics / Materials Science',
    raw_stipend: '₹55,000/month + HRA',
    raw_mode: 'In-Person',
    raw_tags: ['Quantum', 'DST', 'Research Grant'],
    raw_image: 'https://www.indiascienceandtechnology.gov.in/images/dst_logo.png',
  };

  const cleaned = cleanOpportunityPayload(rawSample);
  const normalized = normalizeOpportunityPayload(cleaned, 'test-norm-1');

  const hasAllFields =
    'title' in normalized &&
    'description' in normalized &&
    'opportunity_type' in normalized &&
    'organization' in normalized &&
    'source_name' in normalized &&
    'source_url' in normalized &&
    'application_url' in normalized &&
    'official_opportunity_url' in normalized &&
    'location' in normalized &&
    'country' in normalized &&
    'eligibility_country' in normalized &&
    'eligibility_text' in normalized &&
    'deadline' in normalized &&
    'start_date' in normalized &&
    'end_date' in normalized &&
    'required_skills' in normalized &&
    'academic_requirements' in normalized &&
    'education_level' in normalized &&
    'eligible_branch' in normalized &&
    'stipend' in normalized &&
    'mode' in normalized &&
    'tags' in normalized &&
    'image' in normalized &&
    'extracted_at' in normalized;

  assert(
    hasAllFields && normalized.title === 'DST National Postdoctoral Fellowship in Quantum Materials',
    'TEST 5: Data Normalization into 24-Field Canonical Structure',
    `Normalized DST scheme with all 24 required fields preserved.`
  );

  // -------------------------------------------------------------------------
  // TEST 6: India Eligibility Evaluation - Strict Rule (Section 5)
  // -------------------------------------------------------------------------
  // Case A: Pure Indian opportunity
  const indiaEvalA = evaluateIndiaEligibility({
    title: 'ISRO RESPOND Junior Research Fellowship',
    description: 'Fellowship for Indian students across premier Indian institutes.',
    country: 'India',
    location: 'Bengaluru, Karnataka',
    eligibility_country: 'India',
    eligibility_text: 'Open to Indian nationals with BE/BTech/MTech.',
    source_name: 'ISTI Portal',
    source_url: 'https://isro.gov.in',
  });

  // Case B: Foreign-only opportunity
  const indiaEvalB = evaluateIndiaEligibility({
    title: 'US National Science Foundation Graduate Research Fellowship',
    description: 'Fellowship supporting graduate students in STEM disciplines.',
    country: 'United States',
    location: 'Washington D.C., USA',
    eligibility_country: 'United States',
    eligibility_text: 'Must be a US citizen, US national, or permanent resident alien.',
    source_name: 'Devpost',
    source_url: 'https://nsf.gov',
  });

  // Case C: Indian source but foreign-only opportunity
  const indiaEvalC = evaluateIndiaEligibility({
    title: 'DAAD Germany Summer Research Program (EU Residents Only)',
    description: 'Notice published on Indian board for bilateral EU exchange.',
    country: 'Germany',
    location: 'Munich, Germany',
    eligibility_country: 'Germany',
    eligibility_text: 'Strictly restricted to European Union passport holders.',
    source_name: 'UGC Portal',
    source_url: 'https://ugc.ac.in',
  });

  // Case D: Global Remote opportunity open to Indian applicants
  const indiaEvalD = evaluateIndiaEligibility({
    title: 'Google Summer of Code 2026',
    description: 'Global remote open source contributor mentorship program.',
    country: 'Global',
    location: 'Remote / Virtual',
    mode: 'Remote',
    eligibility_text: 'Open to participants worldwide including Indian students.',
    source_name: 'Unstop',
    source_url: 'https://summerofcode.withgoogle.com',
  });

  assert(
    indiaEvalA.isIndiaOpportunity === true &&
      indiaEvalB.isIndiaOpportunity === false &&
      indiaEvalC.isIndiaOpportunity === false &&
      indiaEvalD.isIndiaOpportunity === true,
    'TEST 6: Strict India Eligibility Multi-Rule Evaluation',
    `India Local: ${indiaEvalA.isIndiaOpportunity} | Foreign Only: ${indiaEvalB.isIndiaOpportunity} | Indian Source Foreign Only: ${indiaEvalC.isIndiaOpportunity} | Remote Worldwide: ${indiaEvalD.isIndiaOpportunity}`
  );

  // -------------------------------------------------------------------------
  // TEST 7: Duplicate Detection Across Sources & Repeated Scraping
  // -------------------------------------------------------------------------
  const existingList: NormalizedOpportunity[] = [normalized];
  const duplicateCandidate: NormalizedOpportunity = {
    ...normalized,
    id: 'test-norm-dup-1',
    title: 'DST National Postdoctoral Fellowship in Quantum Materials (2026)', // Minor variation
    application_url: 'https://online-dst.gov.in/Projectproposal.aspx?utm_source=telegram', // Tracking param variation
  };

  const dupResult = checkOpportunityDuplicate(duplicateCandidate, existingList);
  assert(
    dupResult.isDuplicate === true,
    'TEST 7: Duplicate Detection Heuristics',
    `Detected duplicate with match reason: "${dupResult.matchReason}"`
  );

  // -------------------------------------------------------------------------
  // TEST 8: Expired Opportunity Exclusion (Rule 10)
  // -------------------------------------------------------------------------
  const expiredCandidate: NormalizedOpportunity = {
    ...normalized,
    id: 'test-expired-1',
    deadline: '2024-01-15', // Past deadline
  };

  const expiredVerify = verifyOpportunity(expiredCandidate);
  assert(
    expiredVerify.status === 'EXPIRED',
    'TEST 8: Expired Opportunity Exclusion',
    `Deadline "2024-01-15" evaluated as status: ${expiredVerify.status}`
  );

  // -------------------------------------------------------------------------
  // TEST 9: Suspicious / Predatory Fee Opportunity Rejection (Rule 7)
  // -------------------------------------------------------------------------
  const predatoryCandidate: NormalizedOpportunity = {
    ...normalized,
    id: 'test-predatory-1',
    title: 'Guaranteed Multi-National Placement Internship',
    description: 'Direct placement guarantee after upfront mandatory training fee payment of ₹2,499.',
    eligibility_text: 'Deposit registration fee of INR 2,499 via UPI to confirm your interview slot.',
  };

  const predatoryVerify = verifyOpportunity(predatoryCandidate);
  assert(
    predatoryVerify.status === 'REJECTED' &&
      predatoryVerify.rejectionReason?.includes('Predatory'),
    'TEST 9: Suspicious / Predatory Fee Opportunity Rejection',
    `Flagged predatory scheme with reason: "${predatoryVerify.rejectionReason}"`
  );

  // -------------------------------------------------------------------------
  // TEST 10: Active Database Isolation (Students NEVER see unverified items)
  // -------------------------------------------------------------------------
  resetOpportunityStore();
  const unverifiedCandidate: NormalizedOpportunity = {
    ...normalized,
    id: 'test-unverified-raw-1',
    verification_status: 'PENDING_REVIEW',
  };

  // Attempting to save unverified record
  const savedCount = saveVerifiedOpportunities([unverifiedCandidate]);
  const activeStudentPool = getActiveVerifiedOpportunities();
  const leakedToStudentPool = activeStudentPool.some((o) => o.id === 'test-unverified-raw-1');

  assert(
    savedCount === 0 && !leakedToStudentPool,
    'TEST 10: Active Database Isolation (Rule 8)',
    `Unverified record strictly rejected from active database (admitted: ${savedCount}, leaked: ${leakedToStudentPool})`
  );

  // -------------------------------------------------------------------------
  // TEST 11: Recommendation Engine Gatekeeper (Only verified India-eligible)
  // -------------------------------------------------------------------------
  // Insert verified record
  const verifiedValidCandidate: NormalizedOpportunity = {
    ...normalized,
    id: 'test-verified-admitted-1',
    verification_status: 'VERIFIED',
    is_india_opportunity: true,
  };
  saveVerifiedOpportunities([verifiedValidCandidate]);

  const recommended = getPersonalizedRecommendations();
  const allRecommendedAreVerified = recommended.every((r) => r.isVerified && r.is_india_opportunity);
  const foundAdmitted = recommended.some((r) => r.id === 'test-verified-admitted-1');

  assert(
    allRecommendedAreVerified && foundAdmitted,
    'TEST 11: Recommendation Engine Receives Strictly Verified India Opportunities',
    `All ${recommended.length} recommendations are verified & India-eligible. Admitted item found: ${foundAdmitted}`
  );

  // -------------------------------------------------------------------------
  // TEST 12: Source Failure Isolation (Rule 13)
  // -------------------------------------------------------------------------
  const failingSourceResult = await runScraperForSource('src-non-existent-mock');
  assert(
    failingSourceResult.status === 'ERROR' &&
      failingSourceResult.errorDetails?.includes('No scraper adapter found') &&
      failingSourceResult.discoveredCount === 0,
    'TEST 12: Source Failure Isolation (Rule 13)',
    `Failed source reported status ERROR with meaningful details without terminating execution.`
  );

  // -------------------------------------------------------------------------
  // TEST 13: Missing Deadline Handling
  // -------------------------------------------------------------------------
  const missingDeadlineRaw: RawOpportunityPayload = {
    ...rawSample,
    raw_deadline: undefined,
  };
  const cleanedMissingDeadline = cleanOpportunityPayload(missingDeadlineRaw);
  const normalizedMissingDeadline = normalizeOpportunityPayload(cleanedMissingDeadline, 'test-no-deadline');
  const verifyMissingDeadline = verifyOpportunity(normalizedMissingDeadline);

  assert(
    cleanedMissingDeadline.clean_deadline === 'Rolling Admission 2026' &&
      verifyMissingDeadline.status === 'VERIFIED',
    'TEST 13: Missing Deadline Handling',
    `Missing deadline normalized safely to "${cleanedMissingDeadline.clean_deadline}" without throwing runtime errors.`
  );

  // -------------------------------------------------------------------------
  // TEST 14: Missing Application URL Sanitization
  // -------------------------------------------------------------------------
  const missingUrlRaw: RawOpportunityPayload = {
    ...rawSample,
    raw_url: undefined,
    raw_official_url: undefined,
  };
  const cleanedMissingUrl = cleanOpportunityPayload(missingUrlRaw);
  assert(
    cleanedMissingUrl.clean_application_url.startsWith('https://') &&
      cleanedMissingUrl.clean_official_url.startsWith('https://'),
    'TEST 14: Missing Application URL Fallback & Sanitization',
    `Fallback URLs generated safely: application="${cleanedMissingUrl.clean_application_url}".`
  );

  // -------------------------------------------------------------------------
  // TEST 15: Malformed Webpage Data & Tracking Parameters Sanitization
  // -------------------------------------------------------------------------
  const malformedRaw: RawOpportunityPayload = {
    ...rawSample,
    title: '<b>Indian Space Research &amp; Robotics Fellowship</b><script>alert("XSS")</script>',
    raw_url: 'https://isro.gov.in/fellowship?utm_source=twitter&utm_medium=cpc&fbclid=AQb_1234',
    raw_skills: 'Python3, Deep Learning, ML, AI, &nbsp;Distributed-Systems',
  };
  const cleanedMalformed = cleanOpportunityPayload(malformedRaw);
  assert(
    !cleanedMalformed.clean_title.includes('<script>') &&
      cleanedMalformed.clean_title.includes('Indian Space Research & Robotics Fellowship') &&
      !cleanedMalformed.clean_application_url.includes('utm_source') &&
      !cleanedMalformed.clean_application_url.includes('fbclid') &&
      cleanedMalformed.clean_skills.includes('Python') &&
      cleanedMalformed.clean_skills.includes('Machine Learning') &&
      cleanedMalformed.clean_skills.includes('Distributed Systems'),
    'TEST 15: Malformed Webpage Data, XSS Tags & Tracking Parameter Cleaning',
    `Cleaned title: "${cleanedMalformed.clean_title}", URL: "${cleanedMalformed.clean_application_url}", normalized skills: [${cleanedMalformed.clean_skills.join(', ')}].`
  );

  // -------------------------------------------------------------------------
  // TEST 16: Automated Collection Scheduler Lifecycle (Rule 11)
  // -------------------------------------------------------------------------
  const startedConfig = startScheduler({ intervalMinutes: 360, targetSourceId: 'ALL' });
  const scheduledReport = await triggerScheduledRunNow();
  const stoppedConfig = stopScheduler();
  const history = getSchedulerHistory();

  assert(
    startedConfig.enabled === true &&
      startedConfig.intervalMinutes === 360 &&
      scheduledReport.totalCollected > 0 &&
      stoppedConfig.enabled === false &&
      history.length > 0,
    'TEST 16: Automated Collection Scheduler Architecture Lifecycle',
    `Configured cadence (360 mins), triggered scheduled cycle (${scheduledReport.totalCollected} items), and verified history persistence.`
  );

  // -------------------------------------------------------------------------
  // TEST 17: Individual Scraper Execution Across All 9 Approved Sources
  // -------------------------------------------------------------------------
  let all9Passed = true;
  const individualResults: string[] = [];

  for (const source of INGESTION_SOURCES) {
    const res = await runScraperForSource(source.id);
    const valid =
      res.sourceId === source.id &&
      (res.status === 'SUCCESS' || res.status === 'BLOCKED') &&
      Array.isArray(res.logs) &&
      res.logs.length > 0;
    if (!valid) all9Passed = false;
    individualResults.push(`${source.id}: ${res.status} (${res.discoveredCount} items)`);
  }

  assert(
    all9Passed,
    'TEST 17: Individual Scraper Adapter Verification Across All 9 Sources',
    `Individually verified 9 sources: ${individualResults.join(' | ')}`
  );

  console.log('================================================================');
  console.log(`TOTAL PIPELINE TESTS: ${passed} / ${passed + failed} PASSED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPipelineVerificationSuite().catch((err) => {
  console.error('Fatal error in pipeline test suite:', err);
  process.exit(1);
});
