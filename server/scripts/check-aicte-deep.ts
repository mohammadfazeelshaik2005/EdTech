import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function checkAicteCards() {
  const res = await fetch('https://internship.aicte-india.org/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  console.log('AICTE HTML length:', html.length);
  // Look for headings, cards, or internship listings
  const hMatches = Array.from(html.matchAll(/<h[345][^>]*>([\s\S]*?)<\/h[345]>/gi))
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(t => t.length > 5);
  console.log('AICTE headings (sample 15):', hMatches.slice(0, 15));

  // Look for links to specific internships (e.g. /internship/ or /opportunity/ or id)
  const oppLinks = Array.from(html.matchAll(/<a[^>]*href=["']([^"']*(?:internship|opportunity|view)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi))
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
    .filter(x => x.text.length > 3);
  console.log('AICTE opportunity links (sample 10):', oppLinks.slice(0, 10));
}

checkAicteCards();
