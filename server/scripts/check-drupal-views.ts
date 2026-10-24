import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function checkDrupalViews() {
  const url = 'https://www.indiascienceandtechnology.gov.in/nurturing-minds/scholarships/graduation';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  // Find tables or views-row
  const rows = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map(m => m[1]);
  console.log(`Found ${rows.length} tr rows`);
  if (rows.length > 0) {
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      console.log(`Row ${i}:`, rows[i].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150));
    }
  }
}

checkDrupalViews();
