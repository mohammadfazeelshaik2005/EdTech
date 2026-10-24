import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectNspSchemes() {
  const res = await fetch('https://scholarships.gov.in/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  const index = html.indexOf('Ministry of Minority Affairs');
  console.log('Snippet around Ministry of Minority Affairs:');
  console.log(html.slice(index - 100, index + 800).replace(/\s+/g, ' '));
}

inspectNspSchemes();
