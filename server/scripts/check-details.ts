import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function checkDetails() {
  // 1. Devpost
  console.log('--- Checking Devpost ---');
  try {
    const res = await fetch('https://devpost.com/hackathons', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });
    const text = await res.text();
    console.log('Devpost status:', res.status, 'Length:', text.length);
    // Find hackathon items
    // Devpost typically has .hackathon-tile or data-role="hackathon-tile" or .main-content
    const tiles = Array.from(text.matchAll(/class="[^"]*hackathon-tile[^"]*"([\s\S]*?)<\/article>/gi));
    console.log('Devpost hackathon-tile matches:', tiles.length);
    if (tiles.length === 0) {
      // Look for any links with /hackathons/ or h3
      const h3s = Array.from(text.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)).map(m => m[1].replace(/<[^>]+>/g, '').trim());
      console.log('Devpost h3s (first 6):', h3s.slice(0, 6));
    }
  } catch (e: any) {
    console.log('Devpost err:', e.message);
  }

  // 2. NPTEL
  console.log('\n--- Checking NPTEL ---');
  try {
    // Let's check nptel courses page or explorer
    const res = await fetch('https://nptel.ac.in/courses', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    const html = await res.text();
    console.log('NPTEL courses status:', res.status, 'Length:', html.length);
    // Search for course cards or json
    const scriptMatches = Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi));
    let foundJson = false;
    for (const sm of scriptMatches) {
      if (sm[1].includes('courseName') || sm[1].includes('course_id') || sm[1].includes('courses')) {
        console.log('Found course keyword in script: length', sm[1].length);
        foundJson = true;
        break;
      }
    }
    // Also check links
    const courseLinks = Array.from(html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
      .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
      .filter(x => x.href.includes('/courses/') && x.text.length > 5);
    console.log('NPTEL course links found:', courseLinks.length, courseLinks.slice(0, 3));
  } catch (e: any) {
    console.log('NPTEL err:', e.message);
  }

  // 3. AICTE
  console.log('\n--- Checking AICTE Internship ---');
  try {
    const res = await fetch('https://internship.aicte-india.org/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      // @ts-ignore
      agent: httpsAgent,
    });
    const html = await res.text();
    console.log('AICTE status:', res.status, 'Length:', html.length);
    // Look for internship links or headings
    const matches = Array.from(html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
      .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
      .filter(x => x.text.toLowerCase().includes('internship') || x.href.includes('internship'));
    console.log('AICTE matching links count:', matches.length, matches.slice(0, 5));
  } catch (e: any) {
    console.log('AICTE err:', e.message);
  }

  // 4. NSP
  console.log('\n--- Checking NSP Schemes ---');
  try {
    // Check if NSP has specific scheme page e.g. /public/schemeView
    const res = await fetch('https://scholarships.gov.in/public/schemeView', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      // @ts-ignore
      agent: httpsAgent,
    });
    console.log('NSP schemeView status:', res.status);
    const html = await res.text();
    console.log('NSP schemeView length:', html.length);
  } catch (e: any) {
    console.log('NSP schemeView err:', e.message);
  }

  // 5. SWAYAM
  console.log('\n--- Checking SWAYAM ---');
  try {
    const res = await fetch('https://swayam.gov.in/explorer', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    const html = await res.text();
    console.log('SWAYAM explorer status:', res.status, 'Length:', html.length);
    // Check for JSON embedded in HTML
    if (html.includes('window.__INITIAL_STATE__') || html.includes('__NEXT_DATA__') || html.includes('courseList')) {
      console.log('SWAYAM has embedded state/courseList!');
    }
  } catch (e: any) {
    console.log('SWAYAM err:', e.message);
  }
}

checkDetails();
