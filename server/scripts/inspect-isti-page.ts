import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectIstiPage() {
  const url = 'https://www.indiascienceandtechnology.gov.in/fellowships-scholarships';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  console.log('ISTI Status:', res.status);
  const html = await res.text();
  console.log('ISTI HTML Length:', html.length);
  // Search for opportunity titles and links
  const regex = /<a[^>]*href=["'](\/announcementsopportunity\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  const opps: { link: string; title: string }[] = [];
  while ((match = regex.exec(html)) !== null) {
    opps.push({ link: match[1], title: match[2].replace(/<[^>]+>/g, '').trim() });
  }
  console.log(`Found ${opps.length} opportunities:`, opps.slice(0, 5));
}

inspectIstiPage();
