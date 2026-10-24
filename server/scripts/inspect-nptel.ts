async function inspectNptel() {
  try {
    const res = await fetch('https://nptel.ac.in/courses', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    const html = await res.text();
    console.log('NPTEL HTML length:', html.length);
    // Check if JSON-LD or window.__INITIAL_DATA__ or specific course cards exist
    const hasNextData = html.includes('__NEXT_DATA__');
    const hasInitialData = html.includes('window.__INITIAL_STATE__');
    console.log('Has __NEXT_DATA__:', hasNextData, 'Has __INITIAL_STATE__:', hasInitialData);
    
    // Look for course titles or links
    const matches: string[] = [];
    const courseRegex = /href=["'](\/courses\/[0-9]+)["'][^>]*>([^<]+)</gi;
    let match;
    while ((match = courseRegex.exec(html)) !== null) {
      matches.push(`${match[2].trim()} (${match[1]})`);
    }
    console.log(`Found ${matches.length} course pattern matches:`, matches.slice(0, 5));
  } catch (err: any) {
    console.error('NPTEL error:', err.message);
  }
}

inspectNptel();
