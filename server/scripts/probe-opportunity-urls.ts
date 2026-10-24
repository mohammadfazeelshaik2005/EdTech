import { mockOpportunities } from '../src/data/mockData';

async function probe() {
  console.log('Probing all opportunity URLs...\n');
  for (const opp of mockOpportunities) {
    console.log(`\n========================================`);
    console.log(`ID: ${opp.id} | ${opp.title}`);
    console.log(`Org: ${opp.organization}`);
    console.log(`Application URL: ${opp.application_url}`);
    console.log(`Official URL: ${opp.official_opportunity_url}`);

    const urlsToTest = [
      { type: 'Application URL', url: opp.application_url },
      { type: 'Official URL', url: opp.official_opportunity_url }
    ].filter(u => !!u.url);

    for (const item of urlsToTest) {
      const u = item.url!;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(u, {
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });
        clearTimeout(timeout);
        console.log(`  [${item.type}] HTTP ${res.status} | Final: ${res.url}`);
      } catch (e: any) {
        console.log(`  [${item.type}] Error: ${e.message}`);
      }
    }
  }
}

probe();
