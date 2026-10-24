import https from 'node:https';

// Helper to fetch with custom agent ignoring strict cert errors if gov.in sites have self-signed intermediate chains
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function testUrl(label: string, url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/json,*/*',
      },
      // @ts-ignore
      agent: url.startsWith('https') ? httpsAgent : undefined,
    });
    clearTimeout(timeout);
    const text = await res.text();
    console.log(`[${res.status}] ${label}: ${url} (length: ${text.length})`);
    return { status: res.status, text };
  } catch (err: any) {
    console.log(`[ERR] ${label}: ${url} -> ${err.message}`);
    return { status: 'ERR', text: err.message };
  }
}

async function run() {
  console.log('Testing specific URLs & alternatives...\n');
  
  // 1. AICTE
  await testUrl('AICTE Internship 1', 'https://internship.aicte-india.org/');
  await testUrl('AICTE Portal Main', 'https://www.aicte-india.org/');
  
  // 2. ISTI Portal
  await testUrl('ISTI Root', 'https://www.indiascienceandtechnology.gov.in/');
  await testUrl('ISTI Scholarships', 'https://www.indiascienceandtechnology.gov.in/opportunities/scholarships-and-fellowships');

  // 3. SERB / ANRF
  await testUrl('ANRF Main', 'https://anrf.gov.in/');
  await testUrl('SERB Main', 'https://serb.gov.in/');

  // 4. UGC Notices / Scholarships
  await testUrl('UGC Notices', 'https://www.ugc.gov.in/ugc_notices.aspx');
  await testUrl('UGC Scholarships', 'https://www.ugc.gov.in/page/Scholarships-and-Fellowships.aspx');

  // 5. Unstop API or JSON
  await testUrl('Unstop Opportunities API', 'https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=10');
  
  // 6. NPTEL Courses
  await testUrl('NPTEL Courses Feed', 'https://nptel.ac.in/courses');
  
  // 7. SWAYAM API / Explorer
  await testUrl('SWAYAM Courses API', 'https://swayam.gov.in/api/v1/courses/search?page=1&limit=10');
}

run();
