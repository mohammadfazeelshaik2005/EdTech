import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function snippetIstiPage() {
  const url = 'https://www.indiascienceandtechnology.gov.in/fellowships-scholarships';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  // Strip tags and see what sections exist
  const links = Array.from(html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
    .filter(x => x.text.length > 5 && !x.href.startsWith('#'));
  console.log(`Found ${links.length} total links:`, links.slice(0, 10));
}

snippetIstiPage();
