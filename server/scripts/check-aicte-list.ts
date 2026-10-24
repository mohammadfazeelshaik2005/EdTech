import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function checkAicteInternshipsPage() {
  const res = await fetch('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  console.log('AICTE /internships status:', res.status);
  const html = await res.text();
  console.log('AICTE /internships HTML length:', html.length);
  // Look for cards, job titles, or JSON
  const matches = Array.from(html.matchAll(/<a[^>]*href=["'](\/internship\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi));
  console.log('AICTE /internship/<id> links:', matches.length);
  if (matches.length > 0) {
    for (let i = 0; i < Math.min(5, matches.length); i++) {
      console.log('Match ' + i + ':', matches[i][1], matches[i][2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100));
    }
  } else {
    // Check if there are articles or divs with class containing card or job
    const cards = Array.from(html.matchAll(/<div[^>]*class="[^"]*(?:card|listing|item|opportunity)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi));
    console.log('AICTE card divs count:', cards.length);
  }
}

checkAicteInternshipsPage();
