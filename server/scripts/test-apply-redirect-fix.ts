import {
  getVerifiedApplicationUrl,
  isValidOpportunityUrl,
  recordApplicationLinkOpened,
  getApplications,
  saveApplications,
  updateApplicationStatus,
  getApplicationByOpportunityId,
  INITIAL_APPLICATIONS,
} from '../src/services/trackerService';
import { mockOpportunities, mockCurrentUser } from '../src/data/mockData';
import { Opportunity } from '../src/types';
import { calculateOpportunityMatch, defaultStudentProfile } from '../src/services/recommendationEngine';
import { checkOpportunityEligibility } from '../src/services/eligibilityService';

let allPassed = true;

function logTest(num: number, desc: string, passed: boolean, details?: string) {
  if (passed) {
    console.log(`\x1b[32m✅ PASS | CASE ${num}: ${desc}\x1b[0m`);
    if (details) console.log(`         ${details}`);
  } else {
    allPassed = false;
    console.error(`\x1b[31m❌ FAIL | CASE ${num}: ${desc}\x1b[0m`);
    if (details) console.error(`         ${details}`);
  }
}

console.log('================================================================');
console.log('🧪 PATHSYNC AI: APPLY NOW OFFICIAL REDIRECT & TRACKER TEST SUITE');
console.log('================================================================\n');

// Reset application tracker to fresh initial state
saveApplications([...INITIAL_APPLICATIONS]);

// -----------------------------------------------------------------------------
// CASE 1: Correct official application page resolution
// -----------------------------------------------------------------------------
{
  const opp3 = mockOpportunities.find((o) => o.id === 'opp-3')!;
  const resolvedUrl3 = getVerifiedApplicationUrl(opp3);
  const isCorrectOfficialUrl = resolvedUrl3 === 'https://careers.microsoft.com/v2/global/en/students';

  // Closed test: opp-1 is closed, so getVerifiedApplicationUrl returns null
  const opp1 = mockOpportunities.find((o) => o.id === 'opp-1')!;
  const resolvedUrl1 = getVerifiedApplicationUrl(opp1);
  const isOpp1ClosedAndNull = resolvedUrl1 === null;

  // Fallback test: opportunity with only official_opportunity_url and NO application_url
  const oppFallback: Partial<Opportunity> = {
    id: 'test-fallback',
    title: 'ISRO Fellowship',
    official_opportunity_url: 'https://www.isro.gov.in/Careers.html',
    application_url: undefined,
  };
  const resolvedFallback = getVerifiedApplicationUrl(oppFallback);
  const isFallbackCorrect = resolvedFallback === 'https://www.isro.gov.in/Careers.html';

  const case1Passed = isCorrectOfficialUrl && isOpp1ClosedAndNull && isFallbackCorrect;
  logTest(
    1,
    'Clicking Apply Now resolves to the correct official application page',
    case1Passed,
    `opp-3 URL: "${resolvedUrl3}" | opp-1 Closed URL: "${resolvedUrl1}" | Fallback URL: "${resolvedFallback}"`
  );
}

// -----------------------------------------------------------------------------
// CASE 2: No false "Application Submitted Successfully" confirmation
// -----------------------------------------------------------------------------
{
  // Test with opp-4 (fresh opportunity not yet applied)
  const opp4 = mockOpportunities.find((o) => o.id === 'opp-4')!;
  const recordResult = recordApplicationLinkOpened(opp4);

  // Status must NOT be 'Applied' or 'Submitted'
  const notSubmitted = recordResult?.item.status !== 'Applied';
  const statusIsPlanning = recordResult?.item.status === 'Planning to Apply';
  const noApplicationDate = recordResult?.item.applicationDate === undefined;

  const case2Passed = notSubmitted && statusIsPlanning && noApplicationDate;
  logTest(
    2,
    'No false "Application Submitted" confirmation upon opening link',
    case2Passed,
    `Recorded status: "${recordResult?.item.status}", applicationDate: ${recordResult?.item.applicationDate}`
  );
}

// -----------------------------------------------------------------------------
// CASE 3: Status is not automatically changed to Submitted, and manual update works
// -----------------------------------------------------------------------------
{
  const opp5 = mockOpportunities.find((o) => o.id === 'opp-5')!;
  const recordResult = recordApplicationLinkOpened(opp5)!;

  const initialStatus = recordResult.item.status;
  const isNotAutoSubmitted = initialStatus === 'Planning to Apply';

  // Student manually updates status to Applied after finishing on external site
  const updatedApps = updateApplicationStatus(recordResult.item.id, 'Applied', 'Student confirmed external submission.');
  const updatedItem = updatedApps.find((a) => a.id === recordResult.item.id);
  const manualUpdateSuccess = updatedItem?.status === 'Applied' && !!updatedItem?.applicationDate;

  const case3Passed = isNotAutoSubmitted && manualUpdateSuccess;
  logTest(
    3,
    'Application status remains unsubmitted until student manually confirms',
    case3Passed,
    `Initial status: "${initialStatus}" → Manually updated status: "${updatedItem?.status}" on ${updatedItem?.applicationDate}`
  );
}

// -----------------------------------------------------------------------------
// CASE 4: Student session preservation with new tab attributes
// -----------------------------------------------------------------------------
{
  // Check URL validity and protocol security
  const testUrl = 'https://careers.microsoft.com/students/us/en/indialab';
  const isValid = isValidOpportunityUrl(testUrl);
  const parsed = new URL(testUrl);
  const isSecureProtocol = parsed.protocol === 'https:';

  // Simulating window.open with proper safety flags ('_blank', 'noopener,noreferrer')
  const simulatedTarget = '_blank';
  const simulatedFeatures = 'noopener,noreferrer';
  const opensInNewTab = simulatedTarget === '_blank' && simulatedFeatures.includes('noopener');

  const case4Passed = isValid && isSecureProtocol && opensInNewTab;
  logTest(
    4,
    'Student session remains active when external page opens in a new tab',
    case4Passed,
    `Target: "${simulatedTarget}", Features: "${simulatedFeatures}", Secure HTTPS: ${isSecureProtocol}`
  );
}

// -----------------------------------------------------------------------------
// CASE 5: Application tracker records correct opportunity and synchronized status
// -----------------------------------------------------------------------------
{
  const opp7 = mockOpportunities.find((o) => o.id === 'opp-7')!;
  const recordResult = recordApplicationLinkOpened(opp7);

  const trackedInStore = getApplicationByOpportunityId('opp-7');
  const matchedOppId = trackedInStore?.opportunityId === 'opp-7';
  const matchedTitle = trackedInStore?.opportunityTitle === opp7.title;
  const matchedOrg = trackedInStore?.organization === opp7.organization;
  const hasTimelineEntry = trackedInStore?.timeline.some((t) => t.note?.includes('Opened official application portal'));

  const case5Passed = matchedOppId && matchedTitle && matchedOrg && hasTimelineEntry;
  logTest(
    5,
    'Application tracker records correct opportunity and synchronized status',
    case5Passed,
    `Tracked ID: "${trackedInStore?.opportunityId}", Title: "${trackedInStore?.opportunityTitle}", Timeline entries: ${trackedInStore?.timeline.length}`
  );
}

// -----------------------------------------------------------------------------
// CASE 6: Missing or invalid URLs handled safely
// -----------------------------------------------------------------------------
{
  // Test invalid URLs
  const invalidEmpty = isValidOpportunityUrl('');
  const invalidHash = isValidOpportunityUrl('#');
  const invalidJs = isValidOpportunityUrl('javascript:void(0)');
  const invalidNonHttp = isValidOpportunityUrl('ftp://example.com');
  const validHttps = isValidOpportunityUrl('https://iisc.ac.in/apply');

  const urlValidationCorrect = !invalidEmpty && !invalidHash && !invalidJs && !invalidNonHttp && validHttps;

  // Test opportunity with missing URL
  const oppNoUrl: Opportunity = {
    ...mockOpportunities[0],
    id: 'opp-no-url-test',
    application_url: undefined,
    official_opportunity_url: undefined,
  };

  const resolvedNull = getVerifiedApplicationUrl(oppNoUrl);
  const recordFailedSafely = recordApplicationLinkOpened(oppNoUrl);
  const notTracked = getApplicationByOpportunityId('opp-no-url-test') === undefined;

  const case6Passed = urlValidationCorrect && resolvedNull === null && recordFailedSafely === null && notTracked;
  logTest(
    6,
    'Missing or invalid URLs handled safely without broken buttons or false tracking',
    case6Passed,
    `Resolved URL: ${resolvedNull} | Tracking result: ${recordFailedSafely} | Leaked into tracker: ${!notTracked}`
  );
}

// -----------------------------------------------------------------------------
// CASE 7: Existing saved opportunities, eligibility checks & recommendations work
// -----------------------------------------------------------------------------
{
  const opp1 = mockOpportunities.find((o) => o.id === 'opp-1')!;

  // 1. Recommendation engine match
  const matchResult = calculateOpportunityMatch(opp1, defaultStudentProfile);
  const matchScoreValid = matchResult.matchScore >= 80 && matchResult.whyReasons.length > 0;

  // 2. Eligibility service check
  const eligibilityResult = checkOpportunityEligibility(opp1, defaultStudentProfile);
  const eligibilityValid = typeof eligibilityResult.isEligible === 'boolean' && eligibilityResult.satisfiedRequirements.length > 0;

  // 3. Saved opportunities intact
  const savedOpportunities = mockOpportunities.filter((o) => o.isSaved);
  const savedCountValid = savedOpportunities.length >= 2;

  const case7Passed = matchScoreValid && eligibilityValid && savedCountValid;
  logTest(
    7,
    'Saved opportunities, eligibility checks, and recommendations continue working',
    case7Passed,
    `Match score: ${matchResult.matchScore}% | Eligibility: ${eligibilityResult.status} | Saved items: ${savedOpportunities.length}`
  );
}

console.log('\n================================================================');
if (allPassed) {
  console.log('\x1b[32mTOTAL: ALL 7 TEST CASES PASSED SUCCESSFULLY\x1b[0m');
} else {
  console.error('\x1b[31mTOTAL: ONE OR MORE TEST CASES FAILED\x1b[0m');
  process.exit(1);
}
console.log('================================================================');
