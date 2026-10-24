import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function findAicteApi() {
  const res = await fetch('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  // Find all endpoints mentioned in html or scripts
  const apiMatches = Array.from(html.matchAll(/["'](\/[a-zA-Z0-9_\-\/]+(?:api|search|get|list|filter|internship)[a-zA-Z0-9_\-\/]*)["']/gi)).map(m => m[1]);
  console.log('Unique API endpoints in AICTE HTML:', Array.from(new Set(apiMatches)));

  // Also check if there's an API route like /api/internships or /api/v1/internships
  const candidateApis = [
    'https://internship.aicte-india.org/api/internships',
    'https://internship.aicte-india.org/api/v1/internships',
    'https://internship.aicte-india.org/internships/api',
  ];
  for (const api of candidateApis) {
    try {
      const ares = await fetch(api, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        // @ts-ignore
        agent: httpsAgent,
      });
      console.log(`API check ${api}: status ${ares.status}`);
    } catch (e: any) {
      console.log(`API check ${api} failed: ${e.message}`);
    }
  }
}

findAicteApi();
