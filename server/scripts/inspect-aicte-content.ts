import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectAicteContent() {
  const res = await fetch('https://internship.aicte-india.org/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  console.log('AICTE HTML length:', html.length);
  // Search for internship titles, cards, or headings
  const cardRegex = /<h[345][^>]*>([\s\S]*?)<\/h[345]>/gi;
  let match;
  const headings: string[] = [];
  while ((match = cardRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 3 && text.length < 100) headings.push(text);
  }
  console.log('Headings sample:', headings.slice(0, 15));
}

inspectAicteContent();
