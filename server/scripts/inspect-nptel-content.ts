import fs from 'node:fs';

async function inspectNptelContent() {
  try {
    const res = await fetch('https://nptel.ac.in/courses', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    const html = await res.text();
    // Search for script tags containing JSON or courses
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let scriptCount = 0;
    while ((match = scriptRegex.exec(html)) !== null) {
      scriptCount++;
      const content = match[1];
      if (content.includes('course') || content.includes('discipline')) {
        console.log(`Script ${scriptCount} has course keywords (length: ${content.length})`);
        console.log('Snippet:', content.slice(0, 300).replace(/\s+/g, ' '));
        break;
      }
    }

    // Also check for regular HTML elements with course names (e.g. h3, h4, h5 or card classes)
    const cardClassRegex = /class=["']([^"']*(?:course|card|item)[^"']*)["']/gi;
    const classes = new Set<string>();
    while ((match = cardClassRegex.exec(html)) !== null) {
      classes.add(match[1]);
    }
    console.log('Relevant classes found:', Array.from(classes).slice(0, 10));
  } catch (err: any) {
    console.error(err);
  }
}

inspectNptelContent();
