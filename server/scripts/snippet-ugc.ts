import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function snippetUgc() {
  const res = await fetch('https://www.ugc.gov.in/ugc_notices.aspx', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  console.log('Title tag:', /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim());
  // Find where body starts and print 500 chars
  const bodyIdx = html.indexOf('<body');
  console.log('Snippet of body:');
  console.log(html.slice(bodyIdx, bodyIdx + 1000).replace(/\s+/g, ' '));
}

snippetUgc();
