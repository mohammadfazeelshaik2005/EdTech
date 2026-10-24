import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function examineAicteCards() {
  const res = await fetch('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  const cards = Array.from(html.matchAll(/<div[^>]*class="[^"]*(?:card|listing|item|opportunity)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi));
  for (let i = 0; i < Math.min(5, cards.length); i++) {
    console.log(`\nCard ${i} snippet:`);
    console.log(cards[i][1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300));
  }
}

examineAicteCards();
