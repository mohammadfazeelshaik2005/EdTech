async function checkSwayamCourseLines() {
  const res = await fetch('https://swayam.gov.in/explorer', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  // Find course cards or course titles in html
  const matches = Array.from(html.matchAll(/<h[345][^>]*>([\s\S]*?)<\/h[345]>/gi))
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(t => t.length > 5);
  console.log('SWAYAM headings (sample 10):', matches.slice(0, 10));

  // Find any API call in scripts
  const apiMatches = Array.from(html.matchAll(/fetch\s*\(\s*["']([^"']+)["']/gi)).map(m => m[1]);
  console.log('fetch calls in SWAYAM:', apiMatches);
}

checkSwayamCourseLines();
