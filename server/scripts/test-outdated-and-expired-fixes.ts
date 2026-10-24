import {
  evaluateOpportunityStatus,
  getCurrentSystemTime,
  getKolkataISOString,
  formatKolkataReadable,
  parseOpportunityDeadline,
} from '../src/lib/deadlineUtils';
import {
  getActiveVerifiedOpportunities,
  getAllOpportunitiesForAdmin,
  updateOrInsertOpportunity,
  auditOpportunityRecord,
  saveVerifiedOpportunities,
  resetOpportunityStore,
} from '../src/services/dataCollection/activeOpportunityStore';
import { getOpportunityActionConfig } from '../src/services/trackerService';
import { runScraperWithRetry } from '../src/services/dataCollection/pipeline';
import { Opportunity } from '../src/types';
import { NormalizedOpportunity } from '../src/types/dataCollection';

async function runOutdatedAndExpiredAuditTests() {
  console.log('================================================================');
  console.log('🧪 PATHSYNC AI: SECTION 9 AUDIT & EXPIRED LINKS TEST SUITE');
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

  const nowIST = getKolkataISOString();
  console.log(`🕒 Current System Time (Asia/Kolkata): ${nowIST}`);
  console.log(`   Formatted: ${formatKolkataReadable()}\n`);

  // -------------------------------------------------------------------------
  // TEST CASE 1: An opportunity with a deadline in the past
  // -------------------------------------------------------------------------
  const pastOpportunity: Opportunity = {
    id: 'test-case-1-past',
    title: 'IISc Summer Fellowship 2026 (Past Cycle)',
    category: 'Research Opportunities',
    organization: 'IISc Bangalore',
    description: 'Investigating deep reinforcement learning for robotics.',
    location: 'Bengaluru, India',
    mode: 'In-Person',
    compensation: '₹40,000/mo',
    matchScore: 95,
    deadline: 'April 30, 2026', // Clearly past relative to October 2026
    eligibility: 'B.Tech/M.Tech',
    requiredSkills: ['Python', 'Robotics'],
    educationLevel: 'Undergraduate',
    isVerified: true,
    type: 'fellowship',
    isSaved: false,
    verificationStatus: 'VERIFIED',
    verificationScore: 95,
    source: 'IISc Portal',
    officialDomain: 'iisc.ac.in',
    official_opportunity_url: 'https://cds.iisc.ac.in/admissions',
    application_url: 'https://cds.iisc.ac.in/admissions/apply',
    lastVerifiedDate: 'April 2, 2026',
    country: 'India',
    eligibility_country: 'India',
    is_india_opportunity: true,
  };

  const auditedPast = auditOpportunityRecord(pastOpportunity);
  const actionPast = getOpportunityActionConfig(auditedPast);

  // Update store with auditedPast
  updateOrInsertOpportunity(auditedPast);
  const openFeed1 = getActiveVerifiedOpportunities();
  const isInOpenFeed1 = openFeed1.some((o) => o.id === pastOpportunity.id);

  assert(
    auditedPast.application_status === 'EXPIRED' &&
      auditedPast.verificationStatus === 'EXPIRED' &&
      auditedPast.isExpired === true &&
      !isInOpenFeed1 &&
      actionPast.type === 'EXPIRED' &&
      actionPast.isAvailable === false &&
      actionPast.label === 'Deadline Passed',
    'TEST CASE 1: Opportunity with deadline in the past',
    `Status: ${auditedPast.application_status} | Excluded from open feed: ${!isInOpenFeed1} | Button: "${actionPast.label}" (isAvailable: ${actionPast.isAvailable})`
  );

  // -------------------------------------------------------------------------
  // TEST CASE 2: An opportunity with a future deadline and a working application form
  // -------------------------------------------------------------------------
  const futureOpenOpportunity: Opportunity = {
    id: 'test-case-2-open',
    title: 'National Technology Innovation Challenge 2026-2027',
    category: 'Hackathons',
    organization: 'Ministry of Electronics and Information Technology (MeitY)',
    description: 'National innovation challenge for undergraduate engineering students in India.',
    location: 'New Delhi, India',
    mode: 'Hybrid',
    compensation: '₹5,00,000 Prize Pool',
    matchScore: 98,
    deadline: 'December 15, 2026', // Future relative to October 2026
    eligibility: 'Enrolled students in Indian colleges',
    requiredSkills: ['Python', 'Cloud', 'AI'],
    educationLevel: 'Undergraduate',
    isVerified: true,
    type: 'hackathon',
    isSaved: false,
    verificationStatus: 'VERIFIED',
    verificationScore: 98,
    source: 'MeitY Innovation Portal',
    officialDomain: 'meity.gov.in',
    official_opportunity_url: 'https://innovateindia.mygov.in/meity-challenge',
    application_url: 'https://innovateindia.mygov.in/meity-challenge/register',
    country: 'India',
    eligibility_country: 'India',
    is_india_opportunity: true,
  };

  const auditedFuture = auditOpportunityRecord(futureOpenOpportunity);
  const actionFuture = getOpportunityActionConfig(auditedFuture);

  updateOrInsertOpportunity(auditedFuture);
  const openFeed2 = getActiveVerifiedOpportunities();
  const isInOpenFeed2 = openFeed2.some((o) => o.id === futureOpenOpportunity.id);

  assert(
    auditedFuture.application_status === 'OPEN' &&
      auditedFuture.verificationStatus === 'VERIFIED' &&
      isInOpenFeed2 &&
      actionFuture.type === 'DIRECT_APPLY' &&
      actionFuture.isAvailable === true &&
      actionFuture.label === 'Apply Now' &&
      actionFuture.url === 'https://innovateindia.mygov.in/meity-challenge/register',
    'TEST CASE 2: Opportunity with future deadline and working application form',
    `Status: ${auditedFuture.application_status} | Included in open feed: ${isInOpenFeed2} | Button: "${actionFuture.label}" -> ${actionFuture.url}`
  );

  // -------------------------------------------------------------------------
  // TEST CASE 3: An opportunity whose application has closed before its listed deadline
  // -------------------------------------------------------------------------
  const closedEarlyOpportunity: Opportunity = {
    id: 'test-case-3-closed-early',
    title: 'ISRO Satellite Technology Cohort (Closed Early Capacity)',
    category: 'Research Opportunities',
    organization: 'ISRO URSC',
    description: 'Design and simulate telemetry and command data handling subsystems.',
    location: 'Bengaluru, India',
    mode: 'In-Person',
    compensation: '₹35,000/mo',
    matchScore: 92,
    deadline: 'December 31, 2026', // Future deadline in text
    eligibility: 'Indian engineering students',
    requiredSkills: ['C++', 'Embedded Systems'],
    educationLevel: 'Undergraduate',
    isVerified: true,
    type: 'fellowship',
    isSaved: false,
    verificationStatus: 'CLOSED', // Source confirmed closed early
    application_status: 'CLOSED',
    verificationScore: 90,
    source: 'ISRO Academic Portal',
    officialDomain: 'isro.gov.in',
    official_opportunity_url: 'https://isro.gov.in/careers',
    application_url: 'https://isro.gov.in/careers/satellite-cohort-apply',
    country: 'India',
    eligibility_country: 'India',
    is_india_opportunity: true,
  };

  const auditedClosed = auditOpportunityRecord(closedEarlyOpportunity);
  const actionClosed = getOpportunityActionConfig(auditedClosed);

  updateOrInsertOpportunity(auditedClosed);
  const openFeed3 = getActiveVerifiedOpportunities();
  const isInOpenFeed3 = openFeed3.some((o) => o.id === closedEarlyOpportunity.id);

  assert(
    auditedClosed.application_status === 'CLOSED' &&
      auditedClosed.verificationStatus === 'CLOSED' &&
      !isInOpenFeed3 &&
      actionClosed.type === 'CLOSED' &&
      actionClosed.isAvailable === false &&
      actionClosed.label === 'Applications Closed',
    'TEST CASE 3: Opportunity closed before listed deadline',
    `Status: ${auditedClosed.application_status} | Excluded from open feed: ${!isInOpenFeed3} | Button: "${actionClosed.label}" (isAvailable: ${actionClosed.isAvailable})`
  );

  // -------------------------------------------------------------------------
  // TEST CASE 4: An opportunity with a broken direct application URL
  // -------------------------------------------------------------------------
  const brokenLinkOpportunity: Opportunity = {
    id: 'test-case-4-broken-link',
    title: 'AICTE Industrial Collaboration Scheme',
    category: 'Internships',
    organization: 'AICTE',
    description: 'Industry internship in microelectronics.',
    location: 'Hyderabad, India',
    mode: 'Hybrid',
    compensation: '₹20,000/mo',
    matchScore: 88,
    deadline: 'November 25, 2026',
    eligibility: 'AICTE approved college students',
    requiredSkills: ['VLSI', 'Verilog'],
    educationLevel: 'Undergraduate',
    isVerified: true,
    type: 'internship',
    isSaved: false,
    verificationStatus: 'VERIFIED',
    verificationScore: 88,
    source: 'AICTE Internship Portal',
    officialDomain: 'aicte-india.org',
    source_url: 'https://aicte-india.org/',
    official_opportunity_url: undefined, // Neither official nor application link works
    application_url: 'https://broken-404-aicte.org/nonexistent-apply-form',
    country: 'India',
    eligibility_country: 'India',
    is_india_opportunity: true,
  };

  const statusEvalBroken = evaluateOpportunityStatus({
    deadline: brokenLinkOpportunity.deadline,
    applicationUrl: brokenLinkOpportunity.application_url,
    officialOpportunityUrl: brokenLinkOpportunity.official_opportunity_url,
    isLinkValid: false,
  });

  const auditedBroken: Opportunity = {
    ...brokenLinkOpportunity,
    application_status: statusEvalBroken.status,
    verificationStatus: 'NEEDS_REVIEW',
  };

  const actionBroken = getOpportunityActionConfig(auditedBroken);
  updateOrInsertOpportunity(auditedBroken);
  const openFeed4 = getActiveVerifiedOpportunities();
  const isInOpenFeed4 = openFeed4.some((o) => o.id === brokenLinkOpportunity.id);

  assert(
    statusEvalBroken.status === 'LINK_UNAVAILABLE' &&
      !isInOpenFeed4 &&
      actionBroken.type === 'UNAVAILABLE' &&
      actionBroken.isAvailable === false &&
      actionBroken.label === 'Application Link Unavailable',
    'TEST CASE 4: Opportunity with broken direct application URL',
    `Status: ${statusEvalBroken.status} | Excluded from open feed: ${!isInOpenFeed4} | Button: "${actionBroken.label}" (isAvailable: ${actionBroken.isAvailable})`
  );

  // -------------------------------------------------------------------------
  // TEST CASE 5: An opportunity with a working information page but unavailable application form
  // -------------------------------------------------------------------------
  const infoOnlyOpportunity: Opportunity = {
    id: 'test-case-5-info-only',
    title: 'IIT Bombay C-MInDS Advanced Lab Residency',
    category: 'Research Opportunities',
    organization: 'IIT Bombay Centre of Machine Intelligence',
    description: 'Pre-doctoral research in multimodal transformers for Indian healthcare.',
    location: 'Mumbai, India',
    mode: 'In-Person',
    compensation: '₹35,000/mo',
    matchScore: 91,
    deadline: 'December 20, 2026',
    eligibility: 'B.Tech/M.Tech with PyTorch foundations',
    requiredSkills: ['PyTorch', 'Transformers'],
    educationLevel: 'Undergraduate',
    isVerified: true,
    type: 'fellowship',
    isSaved: false,
    verificationStatus: 'VERIFIED',
    verificationScore: 95,
    source: 'IIT Bombay Portal',
    officialDomain: 'iitb.ac.in',
    source_url: 'https://minds.iitb.ac.in/',
    official_opportunity_url: 'https://minds.iitb.ac.in/fellowship-info',
    application_url: undefined, // No direct application form URL
    country: 'India',
    eligibility_country: 'India',
    is_india_opportunity: true,
  };

  const auditedInfoOnly = auditOpportunityRecord(infoOnlyOpportunity);
  const actionInfoOnly = getOpportunityActionConfig(auditedInfoOnly);

  updateOrInsertOpportunity(auditedInfoOnly);
  const openFeed5 = getActiveVerifiedOpportunities();
  const isInOpenFeed5 = openFeed5.some((o) => o.id === infoOnlyOpportunity.id);

  assert(
    auditedInfoOnly.application_status === 'NEEDS_REVIEW' &&
      !isInOpenFeed5 &&
      actionInfoOnly.type === 'VIEW_OPPORTUNITY' &&
      actionInfoOnly.isAvailable === true &&
      (actionInfoOnly.label.includes('View Official Details') || actionInfoOnly.label.includes('View Opportunity')) &&
      actionInfoOnly.url === 'https://minds.iitb.ac.in/fellowship-info',
    'TEST CASE 5: Working information page but unavailable application form',
    `Status: ${auditedInfoOnly.application_status} | Excluded from open feed: ${!isInOpenFeed5} | Button: "${actionInfoOnly.label}" -> ${actionInfoOnly.url} (never labeled OPEN)`
  );

  // -------------------------------------------------------------------------
  // TEST CASE 6: An opportunity with no deadline or ambiguous deadline
  // -------------------------------------------------------------------------
  const noDeadlineOpportunity: Opportunity = {
    id: 'test-case-6-no-deadline',
    title: 'T-Hub Hardware Prototype Incubation Grant',
    category: 'Scholarships',
    organization: 'T-Hub Hyderabad',
    description: 'Seed grant for student hardware ventures.',
    location: 'Hyderabad, India',
    mode: 'Hybrid',
    compensation: '₹2,00,000 Prototype Grant',
    matchScore: 85,
    deadline: 'TBD - To Be Announced Soon', // Ambiguous / missing
    eligibility: 'Student founders',
    requiredSkills: ['Hardware', 'IoT'],
    educationLevel: 'Undergraduate',
    isVerified: false,
    type: 'scholarship',
    isSaved: false,
    verificationStatus: 'PENDING_REVIEW',
    verificationScore: 70,
    source: 'Startup Ecosystem Feed',
    officialDomain: 't-hub.co',
    official_opportunity_url: 'https://t-hub.co/programs',
    application_url: 'https://t-hub.co/apply-prototype',
    country: 'India',
    eligibility_country: 'India',
    is_india_opportunity: true,
  };

  const parsedAmbiguous = parseOpportunityDeadline(noDeadlineOpportunity.deadline);
  const auditedNoDeadline = auditOpportunityRecord(noDeadlineOpportunity);

  updateOrInsertOpportunity(auditedNoDeadline);
  const openFeed6 = getActiveVerifiedOpportunities();
  const isInOpenFeed6 = openFeed6.some((o) => o.id === noDeadlineOpportunity.id);

  assert(
    parsedAmbiguous.isAmbiguous === true &&
      (auditedNoDeadline.application_status === 'NEEDS_REVIEW' ||
        auditedNoDeadline.application_status === 'STATUS_UNKNOWN') &&
      !isInOpenFeed6,
    'TEST CASE 6: Opportunity with no deadline / ambiguous date',
    `Parsed isAmbiguous: ${parsedAmbiguous.isAmbiguous} | Status: ${auditedNoDeadline.application_status} | Excluded from open feed: ${!isInOpenFeed6}`
  );

  // -------------------------------------------------------------------------
  // TEST CASE 7: A duplicate opportunity discovered in another scraping run
  // -------------------------------------------------------------------------
  const duplicateNormalized: NormalizedOpportunity = {
    id: 'norm-dup-test-7',
    source_id: 'src-nsp',
    source_name: 'National Scholarship Portal (NSP)',
    source_url: 'https://scholarships.gov.in/',
    official_opportunity_url: 'https://scholarships.gov.in/public/schemeGuidelines/CSSS_Guideline.pdf',
    application_url: 'https://scholarships.gov.in/fresh/newstdRegfrmInstruction',
    title: 'Central Sector Scheme of Scholarship for College and University Students (Second Ingestion)',
    organization: 'Department of Higher Education, Ministry of Education, Govt. of India',
    description: 'Updated guidelines for the 2026-2027 academic cycle.',
    category: 'Scholarships',
    location: 'Nationwide, India',
    country: 'India',
    mode: 'In-Person',
    stipend: '₹12,000/yr',
    deadline: '2026-11-30T23:59:59+05:30',
    eligibility_country: 'India',
    is_india_opportunity: true,
    verification_status: 'VERIFIED',
    verification_score: 98,
    required_skills: ['Academics'],
    eligibility_text: 'Top 80th percentile',
    tags: ['NSP'],
    extracted_at: getKolkataISOString(),
    last_verified_at: getKolkataISOString(),
  };

  const countBeforeDup = getAllOpportunitiesForAdmin().length;
  // First insert
  const inserted1 = updateOrInsertOpportunity(duplicateNormalized);
  const countAfterFirst = getAllOpportunitiesForAdmin().length;

  // Second insert with identical application_url and title
  const inserted2 = updateOrInsertOpportunity(duplicateNormalized);
  const countAfterSecond = getAllOpportunitiesForAdmin().length;

  assert(
    countAfterSecond === countAfterFirst,
    'TEST CASE 7: Duplicate opportunity discovered in subsequent run',
    `Before: ${countBeforeDup} | After first: ${countAfterFirst} | After duplicate: ${countAfterSecond} (no duplicate created)`
  );

  // -------------------------------------------------------------------------
  // TEST CASE 8: An expired opportunity already saved by a student
  // -------------------------------------------------------------------------
  // Verify student tracking history & saved list integrity
  const studentSavedExpired: Opportunity = {
    id: 'test-case-8-student-saved-expired',
    title: 'ACM ICPC Regional Prelims 2025-2026 (Student Completed)',
    category: 'Competitions',
    organization: 'ACM ICPC Asia Region',
    description: 'Competitive programming contest at Amritapuri.',
    location: 'Kollam, Kerala, India',
    mode: 'In-Person',
    compensation: 'Certificate & World Finals Qualification',
    matchScore: 94,
    deadline: 'February 15, 2026', // Expired
    eligibility: 'Enrolled students',
    requiredSkills: ['C++', 'Algorithms'],
    educationLevel: 'Undergraduate',
    isVerified: true,
    type: 'competition',
    isSaved: true, // STUDENT SAVED THIS RECORD
    verificationStatus: 'EXPIRED',
    application_status: 'EXPIRED',
    isExpired: true,
    verificationScore: 92,
    source: 'ICPC Global Archive',
    officialDomain: 'icpc.global',
    official_opportunity_url: 'https://icpc.global/regionals/amritapuri',
    application_url: 'https://icpc.global/apply',
    country: 'India',
    eligibility_country: 'India',
    is_india_opportunity: true,
  };

  updateOrInsertOpportunity(studentSavedExpired);
  const adminStore = getAllOpportunitiesForAdmin();
  const preservedRecord = adminStore.find((o) => o.id === studentSavedExpired.id);
  const openList = getActiveVerifiedOpportunities();
  const inOpenList = openList.some((o) => o.id === studentSavedExpired.id);

  assert(
    preservedRecord !== undefined &&
      preservedRecord.isSaved === true &&
      preservedRecord.isExpired === true &&
      preservedRecord.application_status === 'EXPIRED' &&
      !inOpenList,
    'TEST CASE 8: Expired opportunity already saved by student',
    `Preserved in database: ${!!preservedRecord} | isSaved retained: ${preservedRecord?.isSaved} | Excluded from open feed: ${!inOpenList} | Student records preserved without deletion`
  );

  // -------------------------------------------------------------------------
  // TEST CASE 9: A source that is temporarily unavailable
  // -------------------------------------------------------------------------
  let retryCount = 0;
  const failingAdapter = {
    sourceId: 'src-test-temporary-fail',
    sourceName: 'Temporary Down Ministry Server',
    sourceUrl: 'https://down-server.gov.in',
    scrape: async () => {
      retryCount++;
      if (retryCount <= 2) {
        throw new Error('Connection timeout (504 Gateway Timeout)');
      }
      return {
        sourceId: 'src-test-temporary-fail',
        sourceName: 'Temporary Down Ministry Server',
        status: 'SUCCESS' as const,
        discoveredCount: 1,
        items: [
          {
            source_id: 'src-test-temporary-fail',
            source_name: 'Temporary Down Ministry Server',
            source_url: 'https://down-server.gov.in',
            title: 'National Recovered Fellowship',
            org_name: 'Govt of India',
            raw_description: 'Fellowship after network recovered.',
            raw_deadline: '2026-12-31T23:59:59+05:30',
            raw_url: 'https://down-server.gov.in/fellowship',
            raw_category: 'Research Programs',
            fetched_at: getKolkataISOString(),
          },
        ],
        logs: ['Attempt succeeded on retry.'],
        durationMs: 150,
      };
    },
  };

  const retryResult = await runScraperWithRetry(failingAdapter, 3, 50);

  assert(
    retryResult.status === 'SUCCESS' && retryCount === 3 && retryResult.discoveredCount === 1,
    'TEST CASE 9: Source temporarily unavailable (handled with retry & fault isolation)',
    `Retried ${retryCount} times, recovered with status: ${retryResult.status}, discovered: ${retryResult.discoveredCount} items`
  );

  // -------------------------------------------------------------------------
  // TEST CASE 10: Successful refresh updates existing record without duplicating
  // -------------------------------------------------------------------------
  const existingRecordToRefresh: Opportunity = {
    id: 'opp-to-refresh-10',
    title: 'SWAYAM Cloud Computing and DevOps Track',
    category: 'Courses / Learning Opportunities',
    organization: 'NPTEL & IIT Madras',
    description: 'Initial scraping description from early cycle.',
    location: 'Online, India',
    mode: 'Remote',
    compensation: 'Academic Credits',
    matchScore: 90,
    deadline: 'October 25, 2026', // Old deadline
    eligibility: 'College students',
    requiredSkills: ['Linux', 'Docker'],
    educationLevel: 'Undergraduate',
    isVerified: true,
    type: 'academic',
    isSaved: true,
    verificationStatus: 'VERIFIED',
    verificationScore: 90,
    source: 'SWAYAM Portal',
    officialDomain: 'swayam.gov.in',
    source_url: 'https://swayam.gov.in/',
    official_opportunity_url: 'https://swayam.gov.in/courses/cloud-devops',
    application_url: 'https://swayam.gov.in/enroll/cloud-devops',
    country: 'India',
    eligibility_country: 'India',
    is_india_opportunity: true,
  };

  updateOrInsertOpportunity(existingRecordToRefresh);
  const totalBeforeRefresh = getAllOpportunitiesForAdmin().length;

  // New incoming scrape of the same opportunity with updated deadline and enriched description
  const updatedScrapedOpportunity: Opportunity = {
    ...existingRecordToRefresh,
    description: 'Refreshed and updated curriculum for Winter 2026 cohort with live Kubernetes labs.',
    deadline: 'November 28, 2026', // Extended deadline verified from portal
    last_verified_at: getKolkataISOString(),
    lastVerifiedDate: formatKolkataReadable(),
  };

  const updatedSuccessfully = updateOrInsertOpportunity(updatedScrapedOpportunity);
  const allAfterRefresh = getAllOpportunitiesForAdmin();
  const totalAfterRefresh = allAfterRefresh.length;
  const refreshedFound = allAfterRefresh.find((o) => o.id === existingRecordToRefresh.id);

  assert(
    updatedSuccessfully &&
      totalAfterRefresh === totalBeforeRefresh &&
      refreshedFound?.deadline === 'November 28, 2026' &&
      refreshedFound?.description.includes('Kubernetes labs'),
    'TEST CASE 10: Successful refresh updates existing record without duplicating',
    `Before count: ${totalBeforeRefresh} | After count: ${totalAfterRefresh} | Updated deadline: "${refreshedFound?.deadline}" | In-place update verified`
  );

  console.log('================================================================');
  console.log(`RESULTS: ${passed} / ${passed + failed} TEST CASES PASSED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runOutdatedAndExpiredAuditTests().catch((err) => {
  console.error('Fatal error running audit test suite:', err);
  process.exit(1);
});
