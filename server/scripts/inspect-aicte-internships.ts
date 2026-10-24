import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectAicteInternships() {
  const res = await fetch('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  console.log('Status:', res.status);
  const html = await res.text();
  console.log('Length:', html.length);
  // Search for card classes or internship titles
  const cardRegex = /class=["']([^"']*(?:card|internship|job|item)[^"']*)["']/gi;
  let match;
  const classes = new Set<string>();
  while ((match = cardRegex.exec(html)) !== null) {
    classes.add(match[1]);
  }
  console.log('Classes:', Array.from(classes).slice(0, 10));
}

inspectAicteInternships();
