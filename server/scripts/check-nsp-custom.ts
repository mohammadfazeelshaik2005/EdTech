import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function checkCustomScripts() {
  const res = await fetch('https://scholarships.gov.in/public/assets2425/script/CustomScripts.js', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const js = await res.text();
  console.log('CustomScripts length:', js.length);
  // Look for any ajax or fetch endpoints in CustomScripts
  const urls = Array.from(js.matchAll(/url\s*:\s*["']([^"']+)["']/gi)).map(m => m[1]);
  console.log('AJAX urls found:', urls);
}

checkCustomScripts();
