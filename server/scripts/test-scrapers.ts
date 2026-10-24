import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectSource(name: string, fn: () => Promise<any>) {
  console.log(`\n==============================================`);
  console.log(`🔍 INSPECTING SOURCE: ${name}`);
  console.log(`==============================================`);
  try {
    const res = await fn();
    console.log(`Result for ${name}:`, res);
  } catch (err: any) {
    console.error(`Error inspecting ${name}:`, err.message);
  }
}

async function run() {
  // 1. Unstop
  await inspectSource('Unstop Public Opportunities API', async () => {
    const res = await fetch('https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=5', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
      },
    });
    const json = await res.json();
    const data = json?.data?.data || json?.data || [];
    console.log(`Unstop returned ${data.length} items. Sample item:`);
    if (data.length > 0) {
      const item = data[0];
      console.log({
        title: item.title,
        organisation: item.organisation?.name || item.org_name,
        category: item.opportunity_type || item.type,
        regnRequirements: item.regnRequirements,
        filters: item.filters,
        start_date: item.start_date,
        end_date: item.end_date,
        deadline: item.regnRequirements?.end_regn_dt || item.end_date,
        public_url: item.seo_url ? `https://unstop.com/${item.seo_url}` : item.url,
      });
    }
    return { count: data.length };
  });

  // 2. ISTI Portal
  await inspectSource('ISTI Portal (Nurturing Minds Scholarships)', async () => {
    const res = await fetch('https://www.indiascienceandtechnology.gov.in/nurturing-minds/scholarships/graduation', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      // @ts-ignore
      agent: httpsAgent,
    });
    const html = await res.text();
    // Parse table rows
    const rows = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).slice(1); // skip header
    const extracted = rows.map(r => {
      const rowContent = r[1];
      const linkMatch = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(rowContent);
      const tds = Array.from(rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      return {
        title: linkMatch ? linkMatch[2].replace(/<[^>]+>/g, '').trim() : tds[0],
        url: linkMatch ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.indiascienceandtechnology.gov.in${linkMatch[1]}`) : '',
        agency: tds[1] || '',
      };
    }).filter(x => x.title);
    console.log(`ISTI extracted ${extracted.length} scholarships. Sample:`, extracted.slice(0, 2));
    return { count: extracted.length };
  });

  // 3. ANRF / SERB
  await inspectSource('ANRF Portal (anrf.gov.in)', async () => {
    const res = await fetch('https://anrf.gov.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      // @ts-ignore
      agent: httpsAgent,
    });
    const html = await res.text();
    // Check links mentioning scheme, call, fellowship, research
    const links = Array.from(html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
      .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() }))
      .filter(x => x.text.length > 5 && (x.text.toLowerCase().includes('scheme') || x.text.toLowerCase().includes('fellowship') || x.text.toLowerCase().includes('call') || x.text.toLowerCase().includes('anrf') || x.text.toLowerCase().includes('grant')));
    console.log(`ANRF extracted ${links.length} matching scheme links. Sample:`, links.slice(0, 4));
    return { count: links.length };
  });

  // 4. NSP (National Scholarship Portal)
  await inspectSource('NSP Portal (scholarships.gov.in)', async () => {
    const res = await fetch('https://scholarships.gov.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      // @ts-ignore
      agent: httpsAgent,
    });
    const html = await res.text();
    // Look for scheme tables or links
    const schemes = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi))
      .map(m => m[1])
      .filter(r => r.toLowerCase().includes('scholarship') || r.toLowerCase().includes('scheme'))
      .map(r => {
        const link = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(r);
        return {
          title: link ? link[2].replace(/<[^>]+>/g, '').trim() : r.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80),
          href: link ? link[1] : '',
        };
      });
    console.log(`NSP extracted schemes count: ${schemes.length}. Sample:`, schemes.slice(0, 3));
    return { count: schemes.length, length: html.length };
  });

  // 5. UGC
  await inspectSource('UGC Portal (ugc.gov.in)', async () => {
    const res = await fetch('https://www.ugc.gov.in/ugc_notices.aspx', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      // @ts-ignore
      agent: httpsAgent,
    });
    const html = await res.text();
    // Check for notices / scholarships in UGC page
    const links = Array.from(html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
      .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() }))
      .filter(x => x.text.length > 10 && (x.text.toLowerCase().includes('fellowship') || x.text.toLowerCase().includes('scholarship') || x.text.toLowerCase().includes('inviting') || x.text.toLowerCase().includes('scheme')));
    console.log(`UGC extracted notices/schemes count: ${links.length}. Sample:`, links.slice(0, 3));
    return { count: links.length };
  });

  // 6. AICTE Internship Portal
  await inspectSource('AICTE Internship Portal (internship.aicte-india.org)', async () => {
    const res = await fetch('https://internship.aicte-india.org/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      // @ts-ignore
      agent: httpsAgent,
    });
    const html = await res.text();
    // Look for internship listings or cards in html
    const hasNextData = html.includes('__NEXT_DATA__');
    console.log(`AICTE HTML length: ${html.length}, has __NEXT_DATA__: ${hasNextData}`);
    return { length: html.length, hasNextData };
  });

  // 7. Devpost
  await inspectSource('Devpost (devpost.com)', async () => {
    const res = await fetch('https://devpost.com/hackathons', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    console.log(`Devpost HTTP Status: ${res.status}`);
    const text = await res.text();
    const isCloudflare = res.status === 403 || text.includes('Just a moment...');
    console.log(`Devpost Cloudflare Blocked: ${isCloudflare}`);
    return { status: res.status, blocked: isCloudflare };
  });

  // 8. NPTEL
  await inspectSource('NPTEL (nptel.ac.in)', async () => {
    const res = await fetch('https://nptel.ac.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    const html = await res.text();
    console.log(`NPTEL Status: ${res.status}, Length: ${html.length}`);
    return { status: res.status, length: html.length };
  });

  // 9. SWAYAM
  await inspectSource('SWAYAM (swayam.gov.in)', async () => {
    const res = await fetch('https://swayam.gov.in/explorer', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    const html = await res.text();
    console.log(`SWAYAM Status: ${res.status}, Length: ${html.length}`);
    return { status: res.status, length: html.length };
  });
}

run().catch(console.error);
