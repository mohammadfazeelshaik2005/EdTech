import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function searchCalls() {
  const url = 'https://internship.aicte-india.org/_next/static/chunks/app/internships/page-b3809f7d8bbd9ae6.js';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const js = await res.text();
  const fetchIdx = js.indexOf('fetch(');
  console.log('fetch( index:', fetchIdx);
  // Look for any method like .get( or .post( or function that queries backend
  const postMatches = Array.from(js.matchAll(/\.post\(([^)]+)\)/gi)).map(m => m[1]);
  console.log('post calls:', postMatches.slice(0, 5));
  // Look for quotes containing /
  const pathMatches = Array.from(js.matchAll(/["'](\/[a-zA-Z0-9_\-\/]+)["']/gi)).map(m => m[1]);
  console.log('Paths:', Array.from(new Set(pathMatches)).slice(0, 20));
}

searchCalls();
