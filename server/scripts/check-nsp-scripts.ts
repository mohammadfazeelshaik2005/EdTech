import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function checkNspScripts() {
  const res = await fetch('https://scholarships.gov.in/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  const scriptSrcs = Array.from(html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi)).map(m => m[1]);
  console.log('Script srcs in NSP:', scriptSrcs);

  // Check for any .json or api urls
  const apiMatches = Array.from(html.matchAll(/["'](\/[a-zA-Z0-9_\-\/]+\.(?:json|action|php|aspx|jsp))["']/gi)).map(m => m[1]);
  console.log('API or file matches in NSP:', apiMatches);
}

checkNspScripts();
