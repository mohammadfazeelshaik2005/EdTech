import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function findChunks() {
  const res = await fetch('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  const chunks = Array.from(html.matchAll(/static\/chunks\/([a-zA-Z0-9_\-\.\/]+)\.js/gi)).map(m => m[1]);
  console.log('All chunk names:', Array.from(new Set(chunks)));
}

findChunks();
