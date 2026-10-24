import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectPageChunk() {
  const url = 'https://internship.aicte-india.org/_next/static/chunks/app/internships/page-b3809f7d8bbd9ae6.js';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const js = await res.text();
  console.log('page chunk length:', js.length);
  // Look for any string with http or api
  const matches = Array.from(js.matchAll(/["'`](https?:\/\/[^"'`\s]+|\/api\/[^"'`\s]+)["'`]/gi)).map(m => m[1]);
  console.log('URLs/APIs in page chunk:', Array.from(new Set(matches)));
}

inspectPageChunk();
