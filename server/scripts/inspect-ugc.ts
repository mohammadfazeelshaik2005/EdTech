import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectUgc() {
  const res = await fetch('https://www.ugc.gov.in/page/Scholarships-and-Fellowships.aspx', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  console.log('UGC Scholarships length:', html.length);
  // Look for links or table rows
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  const items: { href: string; title: string }[] = [];
  while ((match = linkRegex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (text.toLowerCase().includes('fellowship') || text.toLowerCase().includes('scholarship') || text.toLowerCase().includes('award')) {
      items.push({ href: match[1], title: text });
    }
  }
  console.log(`Found ${items.length} scholarship/fellowship links on UGC:`, items.slice(0, 8));
}

inspectUgc();
