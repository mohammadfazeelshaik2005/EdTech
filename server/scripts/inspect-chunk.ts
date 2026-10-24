import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectChunk() {
  const chunkUrl = 'https://internship.aicte-india.org/_next/static/chunks/5042-85300f5f11245e4e.js';
  try {
    const res = await fetch(chunkUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      // @ts-ignore
      agent: httpsAgent,
    });
    const js = await res.text();
    console.log('Chunk length:', js.length);
    // Find fetch or api urls
    const fetches = Array.from(js.matchAll(/fetch\(["'`]([^"'`]+)["'`]/gi)).map(m => m[1]);
    console.log('Fetch calls in chunk:', fetches);
    // Find strings with /api/ or http
    const apis = Array.from(js.matchAll(/["'`](https?:\/\/[^"'`]+|\/api\/[^"'`]+)["'`]/gi)).map(m => m[1]);
    console.log('APIs in chunk:', apis.slice(0, 10));
  } catch (e: any) {
    console.log('Chunk err:', e.message);
  }
}

inspectChunk();
