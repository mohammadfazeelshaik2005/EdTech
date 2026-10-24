import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function checkNsp() {
  const res = await fetch('https://scholarships.gov.in/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  console.log('NSP HTML size:', html.length);
  // Find all accordion or scheme headings
  const schemeNames = Array.from(html.matchAll(/<button[^>]*class="[^"]*accordion-button[^"]*"[^>]*>([\s\S]*?)<\/button>/gi))
    .map(m => m[1].replace(/<[^>]+>/g, '').trim());
  console.log('NSP Accordion buttons:', schemeNames);

  // Search for "Scheme" or "Scholarship" in any tag
  const matches = Array.from(html.matchAll(/>([^<]{10,80}(?:Scholarship|Fellowship|Scheme)[^<]{0,80})</gi))
    .map(m => m[1].replace(/\s+/g, ' ').trim())
    .filter(t => !t.includes('{') && !t.includes('function') && !t.includes('NSP'));
  console.log('NSP matches count:', matches.length, 'Samples:', matches.slice(0, 8));
}

checkNsp();
