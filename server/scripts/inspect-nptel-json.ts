async function inspectNptelJson() {
  const res = await fetch('https://nptel.ac.in/courses', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  const match = html.match(/courses\s*:\s*(\[\s*\{[\s\S]*?\}\s*\])/i);
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      console.log('Parsed NPTEL JSON courses count:', data.length);
      console.log('Sample course object:', data[0]);
    } catch (e) {
      console.log('Failed to parse full array, trying slice. Snippet:', match[1].slice(0, 300));
    }
  }
}

inspectNptelJson();
