async function inspectNptelDetail() {
  const res = await fetch('https://nptel.ac.in/courses', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  // Find script containing course array
  const matches = Array.from(html.matchAll(/courses\s*:\s*(\[[^\]]+\])/gi));
  console.log('courses array matches:', matches.length);
  // Look for course links
  const regex = /<a[^>]*href=["'](\/courses\/[0-9]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const items: any[] = [];
  while ((m = regex.exec(html)) !== null && items.length < 5) {
    items.push({
      url: `https://nptel.ac.in${m[1]}`,
      content: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });
  }
  console.log('NPTEL parsed sample courses:', items);
}

inspectNptelDetail();
