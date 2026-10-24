import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function findAicteCards() {
  const res = await fetch('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  // Check for Next.js or React hydration data
  if (html.includes('__NEXT_DATA__')) {
    console.log('AICTE has __NEXT_DATA__!');
    const match = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
    if (match) {
      const data = JSON.parse(match[1]);
      console.log('Next.js Page Props keys:', Object.keys(data.props?.pageProps || {}));
      const list = data.props?.pageProps?.internships || data.props?.pageProps?.data || [];
      console.log('Found internships in Next data:', list.length);
      if (list.length > 0) {
        console.log('Sample Next internship:', list[0]);
      }
    }
  } else {
    // Look for script tags with JSON
    const scriptMatches = Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi));
    for (const sm of scriptMatches) {
      if (sm[1].includes('internship') && sm[1].includes('{')) {
        console.log('Found script with internship JSON (len ' + sm[1].length + ')');
        console.log('Snippet:', sm[1].slice(0, 300));
        break;
      }
    }
  }
}

findAicteCards();
