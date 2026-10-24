import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function checkIstiGraduation() {
  const url = 'https://www.indiascienceandtechnology.gov.in/nurturing-minds/scholarships/graduation';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  console.log('Status:', res.status);
  const html = await res.text();
  console.log('HTML Length:', html.length);
  // Find headings or list items
  const titles = Array.from(html.matchAll(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/gi))
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(t => t.length > 5 && !t.includes('Menu') && !t.includes('Footer'));
  console.log('Found opportunity titles:', titles);
}

checkIstiGraduation();
