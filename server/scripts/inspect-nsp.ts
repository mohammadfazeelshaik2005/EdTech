import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectNsp() {
  try {
    const res = await fetch('https://scholarships.gov.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      // @ts-ignore
      agent: httpsAgent,
    });
    const html = await res.text();
    console.log('NSP HTML Length:', html.length);
    // Search for scheme names, accordion items, or ministry names
    const ministries = ['Ministry of Minority Affairs', 'Department of Higher Education', 'Ministry of Tribal Affairs', 'Department of Empowerment of Persons with Disabilities', 'Ministry of Social Justice'];
    for (const m of ministries) {
      console.log(`Contains "${m}":`, html.includes(m));
    }

    // Look for scheme tables or cards
    const cardRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    let count = 0;
    while ((match = cardRegex.exec(html)) !== null && count < 3) {
      if (match[1].toLowerCase().includes('scholarship') || match[1].toLowerCase().includes('scheme')) {
        count++;
        console.log(`Scheme table row ${count}:`, match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200));
      }
    }
  } catch (err: any) {
    console.error(err);
  }
}

inspectNsp();
