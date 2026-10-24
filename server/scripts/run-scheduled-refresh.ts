/**
 * PathSync AI — Server-Side Scheduled Opportunity Refresh Runner
 *
 * This script runs autonomously on a server or scheduled runner (e.g. Linux cron, systemd timer,
 * Docker container, or GitHub Actions workflow) independently of client browser sessions.
 *
 * Usage:
 *   npx tsx scripts/run-scheduled-refresh.ts [--source=src-unstop] [--revalidate-links]
 *
 * Cron configuration example (run every 6 hours):
 *   0 * /6 * * * cd /var/www/pathsync && npx tsx scripts/run-scheduled-refresh.ts >> /var/log/pathsync-refresh.log 2>&1
 */

// Node polyfill for localStorage
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

import {
  executeDataCollectionPipeline,
  revalidateAllApplicationLinks,
  auditAllStoredOpportunities,
} from '../src/services/dataCollection';
import { getKolkataISOString, getCurrentSystemTime } from '../src/lib/deadlineUtils';

async function main() {
  console.log('================================================================');
  console.log('🔄 PATHSYNC AI: SERVER-SIDE SCHEDULED OPPORTUNITY REFRESH');
  console.log(`⏰ Current System Time (IST): ${getKolkataISOString()}`);
  console.log('================================================================\n');

  const args = process.argv.slice(2);
  const sourceArg = args.find((a) => a.startsWith('--source='));
  const targetSourceId = sourceArg ? sourceArg.split('=')[1] : undefined;
  const shouldRevalidate = args.includes('--revalidate-links');

  try {
    // 1. Audit current stored records
    console.log('Step 1: Auditing existing opportunities against dynamic Asia/Kolkata clock...');
    const auditRes = auditAllStoredOpportunities();
    console.log(`  • Audited ${auditRes.checked} total records:`);
    console.log(`    - Open:             ${auditRes.open}`);
    console.log(`    - Expired:          ${auditRes.expired}`);
    console.log(`    - Closed:           ${auditRes.closed}`);
    console.log(`    - Needs Review:     ${auditRes.needsReview}`);
    console.log(`    - Link Unavailable: ${auditRes.linkUnavailable}\n`);

    // 2. Revalidate links if requested or by default
    if (shouldRevalidate) {
      console.log('Step 2: Revalidating application links across all records...');
      const linkRes = await revalidateAllApplicationLinks();
      console.log(`  • Checked ${linkRes.checked} links: ${linkRes.valid} valid, ${linkRes.broken} broken/unavailable.\n`);
    }

    // 3. Execute collection & refresh pipeline
    console.log(`Step 3: Executing collection pipeline for ${targetSourceId || 'all approved Indian sources'}...`);
    const report = await executeDataCollectionPipeline({
      sourceId: targetSourceId,
      isScheduled: true,
    });

    console.log('\n================================================================');
    console.log('✅ REFRESH RUN COMPLETED SUCCESSFULLY');
    console.log(`  • Total Collected:          ${report.totalCollected}`);
    console.log(`  • Total Cleaned:            ${report.totalCleaned}`);
    console.log(`  • Total Normalized:         ${report.totalNormalized}`);
    console.log(`  • Verified Open:            ${report.totalVerified}`);
    console.log(`  • Expired Detected:         ${report.totalExpired}`);
    console.log(`  • Closed Detected:          ${report.totalClosed || 0}`);
    console.log(`  • Needs Review:             ${report.totalNeedsReview || 0}`);
    console.log(`  • Broken Links:             ${report.totalBrokenLinks || 0}`);
    console.log(`  • Admitted to Feeds:        ${report.admittedToRecommendations}`);
    console.log(`  • Blocked from Feeds:       ${report.blockedFromRecommendations}`);
    console.log('================================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ FATAL ERROR in scheduled refresh runner:', err);
    process.exit(1);
  }
}

main();
