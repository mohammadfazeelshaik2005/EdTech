async function checkSwayamScript() {
  const res = await fetch('https://swayam.gov.in/explorer', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  const scripts = Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi));
  for (const s of scripts) {
    if (s[1].includes('window.popularCoursesCategories')) {
      const content = s[1];
      // Find window.* variables
      const vars = Array.from(content.matchAll(/window\.([a-zA-Z0-9_]+)\s*=/g)).map(m => m[1]);
      console.log('Window variables in SWAYAM:', vars);
      // Check for courses or courseList
      if (content.includes('courseList') || content.includes('courses')) {
        console.log('Has courses / courseList keyword');
      }
      break;
    }
  }
}

checkSwayamScript();
