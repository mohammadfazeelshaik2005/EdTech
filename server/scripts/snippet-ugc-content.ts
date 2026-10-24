import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function snippetUgcContent() {
  const res = await fetch('https://www.ugc.gov.in/ugc_notices.aspx', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  // Find where 'table' or 'grid' or 'notice' appears
  const idx = html.toLowerCase().indexOf('notices');
  console.log('Snippet around "notices" (idx ' + idx + '):');
  console.log(html.slice(idx, idx + 1000).replace(/\s+/g, ' '));
}

snippetUgcContent();
