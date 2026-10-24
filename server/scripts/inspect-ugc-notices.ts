import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectUgcNotices() {
  const res = await fetch('https://www.ugc.gov.in/ugc_notices.aspx', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  console.log('UGC Notices length:', html.length);
  // Look for table rows: typically UGC notices are in a <table> with Date and Subject
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  const notices: { date?: string; title?: string; link?: string }[] = [];
  while ((match = rowRegex.exec(html)) !== null) {
    const rowHtml = match[1];
    const linkMatch = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(rowHtml);
    if (linkMatch) {
      const title = linkMatch[2].replace(/<[^>]+>/g, '').trim();
      const href = linkMatch[1];
      // Try to find date in td
      const tdMatches = Array.from(rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map(m => m[1].replace(/<[^>]+>/g, '').trim());
      notices.push({
        date: tdMatches[0] || '',
        title,
        link: href.startsWith('http') ? href : `https://www.ugc.gov.in/${href.replace(/^\//, '')}`,
      });
    }
  }
  console.log(`Found ${notices.length} notices on UGC:`, notices.slice(0, 5));
}

inspectUgcNotices();
