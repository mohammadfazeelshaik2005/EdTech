import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function checkUgcText() {
  const res = await fetch('https://www.ugc.gov.in/ugc_notices.aspx', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  // Strip tags and print first 1500 chars
  const text = html.replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  console.log('Plain text length:', text.length);
  console.log('Plain text snippet:', text.slice(0, 1000));
}

checkUgcText();
