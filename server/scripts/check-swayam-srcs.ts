async function checkSwayamScripts() {
  const res = await fetch('https://swayam.gov.in/explorer', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  const srcs = Array.from(html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi)).map(m => m[1]);
  console.log('SWAYAM script srcs:', srcs);
}

checkSwayamScripts();
