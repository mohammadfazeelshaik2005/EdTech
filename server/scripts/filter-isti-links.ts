import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function snippetIstiOpportunities() {
  const url = 'https://www.indiascienceandtechnology.gov.in/fellowships-scholarships';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  const links = Array.from(html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
    .filter(x => x.href.includes('fellowship') || x.href.includes('scholarship') || x.href.includes('grant') || x.href.includes('opportunity') || x.href.includes('announcement'));
  console.log(`Found ${links.length} matching links:`, links);
}

snippetIstiOpportunities();
