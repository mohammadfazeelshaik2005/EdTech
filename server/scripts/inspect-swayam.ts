async function inspectSwayam() {
  const res = await fetch('https://swayam.gov.in/explorer', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  console.log('SWAYAM length:', html.length);
  // Find any scripts or links with /courses/ or course
  const links = Array.from(html.matchAll(/<a[^>]*href=["']([^"']*(?:course|courses|explorer)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi))
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
    .filter(x => x.text.length > 5);
  console.log('SWAYAM course links (sample 6):', links.slice(0, 6));

  // Check if there is an API or data script
  const scripts = Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi));
  for (const s of scripts) {
    if (s[1].includes('course') && s[1].includes('title')) {
      console.log('Found course script in SWAYAM! Len:', s[1].length);
      console.log('Snippet:', s[1].slice(0, 300));
      break;
    }
  }
}

inspectSwayam();
