import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectHtmlLinks(url: string, keyword: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      // @ts-ignore
      agent: httpsAgent,
    });
    const html = await res.text();
    const matches: string[] = [];
    const linkRegex = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      if (match[1].toLowerCase().includes(keyword.toLowerCase())) {
        matches.push(match[1]);
      }
    }
    console.log(`URL: ${url}`);
    console.log(`Keyword: ${keyword}`);
    console.log(`Matches (${matches.length}):`, Array.from(new Set(matches)).slice(0, 10));
  } catch (err: any) {
    console.error(err.message);
  }
}

async function run() {
  await inspectHtmlLinks('https://www.indiascienceandtechnology.gov.in/', 'opportunit');
  await inspectHtmlLinks('https://www.indiascienceandtechnology.gov.in/', 'fellowship');
  await inspectHtmlLinks('https://scholarships.gov.in/', 'scheme');
  await inspectHtmlLinks('https://internship.aicte-india.org/', 'internship');
}

run();
