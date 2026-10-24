/**
 * PathSync AI - Comprehensive All-Opportunity Link & Status Verification Test Suite
 * File: scripts/test-all-opportunity-links-and-status.ts
 */

import { mockOpportunities } from '../src/data/mockData';
import { getOpportunityActionConfig, getVerifiedApplicationUrl } from '../src/services/trackerService';
import { calculateDeadlineIntelligence } from '../src/services/notificationService';
import { isSafeExternalDestination, sanitizeLogUrl } from '../src/services/dataCollection/destinationValidator';
import { auditOpportunityRecord } from '../src/services/dataCollection/activeOpportunityStore';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail: string) {
  if (condition) {
    passedCount++;
    console.log(`\x1b[32m✅ PASS | ${testName}\x1b[0m\n         ${detail}`);
  } else {
    failedCount++;
    console.error(`\x1b[31m❌ FAIL | ${testName}\x1b[0m\n         ${detail}`);
  }
}

console.log('================================================================');
console.log('🧪 PATHSYNC AI: ALL-OPPORTUNITY LINK & STATUS VERIFICATION SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. SSRF and Destination Safety Validator
// -----------------------------------------------------------------------------
console.log('--- 1. SSRF, Security & Destination Safety Checks ---');
const ssrfTests = [
  { url: 'http://localhost:3000/admin', expected: false, desc: 'Block localhost' },
  { url: 'http://127.0.0.1:8080/secrets', expected: false, desc: 'Block IPv4 loopback' },
  { url: 'http://169.254.169.254/latest/meta-data/', expected: false, desc: 'Block AWS metadata' },
  { url: 'http://10.0.1.5/internal', expected: false, desc: 'Block private class A' },
  { url: 'http://192.168.1.1/router', expected: false, desc: 'Block private class C' },
  { url: 'javascript:alert(1)', expected: false, desc: 'Block javascript pseudo-scheme' },
  { url: 'https://cds.iisc.ac.in/admissions/', expected: true, desc: 'Allow legitimate HTTPS public domain' },
  { url: 'https://careers.microsoft.com/v2/global/en/students', expected: true, desc: 'Allow legitimate HTTPS portal' },
];

for (const t of ssrfTests) {
  const result = isSafeExternalDestination(t.url);
  assert(result.safe === t.expected, `SSRF Guard: ${t.desc}`, `URL: ${t.url} | Allowed: ${result.safe}`);
}

// -----------------------------------------------------------------------------
// 2. Sensitive Credential Redaction in Logging
// -----------------------------------------------------------------------------
console.log('\n--- 2. Log Redaction & Security Parameter Protection ---');
const secretUrl = 'https://portal.ac.in/apply?token=secret_jwt_xyz123&apiKey=supersecret987';
const sanitized = sanitizeLogUrl(secretUrl);
assert(
  !sanitized.includes('secret_jwt') &&
  !sanitized.includes('supersecret987') &&
  (sanitized.includes('REDACTED') || decodeURIComponent(sanitized).includes('[REDACTED]')),
  'Log Redaction of Secrets',
  `Sanitized: ${sanitized}`
);

// -----------------------------------------------------------------------------
// 3. IISc Bangalore CDS Audit Verification
// -----------------------------------------------------------------------------
console.log('\n--- 3. IISc Bangalore CDS Root Cause & Audit Fix ---');
const opp1 = mockOpportunities.find((o) => o.id === 'opp-1')!;
const actionOpp1 = getOpportunityActionConfig(opp1);
const intelOpp1 = calculateDeadlineIntelligence(opp1.deadline, opp1.application_status);

assert(
  opp1.application_status === 'CLOSED' &&
    opp1.application_url === undefined &&
    opp1.official_url === 'https://cds.iisc.ac.in/admissions/' &&
    !actionOpp1.isAvailable &&
    actionOpp1.type === 'CLOSED' &&
    actionOpp1.officialDetailsUrl === 'https://cds.iisc.ac.in/admissions/' &&
    intelOpp1.badgeLabel === 'Applications Closed' &&
    intelOpp1.daysRemaining === 0,
  'IISc opp-1: Fabricated 404 URL Removed, Status CLOSED, Apply Now Disabled',
  `Status: ${opp1.application_status} | Official URL: ${opp1.official_url} | Action: ${actionOpp1.buttonText}`
);

// -----------------------------------------------------------------------------
// 4. Audit Every Single Opportunity Card & Action Resolution
// -----------------------------------------------------------------------------
console.log('\n--- 4. Comprehensive Audit Across All Opportunities ---');
interface DiagnosticEntry {
  id: string;
  title: string;
  status: string;
  health: string;
  httpStatus: number | string;
  directApplyUrl: string;
  officialDetailsUrl: string;
  buttonLabel: string;
}

const tableData: DiagnosticEntry[] = [];

for (const opp of mockOpportunities) {
  const audited = auditOpportunityRecord(opp);
  const action = getOpportunityActionConfig(audited);
  const intel = calculateDeadlineIntelligence(audited.deadline, audited.application_status);

  // Assertions per category
  if (audited.application_status === 'OPEN') {
    assert(
      action.isDirectApply && action.url !== null && intel.daysRemaining > 0,
      `Opportunity ${opp.id} (${opp.title.slice(0, 30)}...): Verified OPEN`,
      `Direct Apply URL: ${action.url} | Days remaining: ${intel.daysRemaining}`
    );
  } else if (audited.application_status === 'CLOSED') {
    assert(
      !action.isDirectApply && intel.daysRemaining === 0,
      `Opportunity ${opp.id} (${opp.title.slice(0, 30)}...): Verified CLOSED`,
      `Apply Now Disabled: true | Official Details: ${action.officialDetailsUrl || 'None'}`
    );
  } else if (audited.application_status === 'UPCOMING') {
    assert(
      !action.isDirectApply && intel.badgeLabel === 'Applications Upcoming',
      `Opportunity ${opp.id} (${opp.title.slice(0, 30)}...): Verified UPCOMING`,
      `Status: UPCOMING | Official Portal: ${action.officialDetailsUrl}`
    );
  } else if (audited.application_status === 'UNVERIFIED') {
    assert(
      !action.isDirectApply,
      `Opportunity ${opp.id} (${opp.title.slice(0, 30)}...): Status UNVERIFIED`,
      `Direct application not falsely claimed | Details fallback: ${action.officialDetailsUrl || 'None'}`
    );
  }

  tableData.push({
    id: opp.id,
    title: opp.title.length > 35 ? opp.title.slice(0, 35) + '...' : opp.title,
    status: audited.application_status || 'STATUS_UNKNOWN',
    health: audited.link_health || 'UNCHECKED',
    httpStatus: audited.http_status_code ?? 'N/A',
    directApplyUrl: audited.application_url || 'None (Direct form unavailable)',
    officialDetailsUrl: audited.official_url || audited.official_opportunity_url || 'None',
    buttonLabel: action.buttonText,
  });
}

// -----------------------------------------------------------------------------
// 5. Bot-Block Handling (Cloudflare WAF HTTP 403 on opp-7)
// -----------------------------------------------------------------------------
console.log('\n--- 5. Bot-Block Handling (Cloudflare 403) ---');
const opp7 = mockOpportunities.find((o) => o.id === 'opp-7')!;
assert(
  opp7.link_health === 'BLOCKED' && opp7.application_status === 'UNVERIFIED' && opp7.http_status_code === 403,
  'Bot-Block on ACM India: Treated as UNVERIFIED (never falsely declared closed)',
  `Health: ${opp7.link_health} | Status: ${opp7.application_status} | HTTP: ${opp7.http_status_code}`
);

// -----------------------------------------------------------------------------
// 6. Print Diagnostic Table
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log('📊 PATHSYNC AI: ALL 14 OPPORTUNITIES AUDIT & LINK HEALTH TABLE');
console.log('================================================================');
console.table(tableData);

console.log('================================================================');
console.log(`TOTAL RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('================================================================');

if (failedCount > 0) {
  process.exit(1);
}
