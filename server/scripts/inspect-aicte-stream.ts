import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectNextData() {
  const res = await fetch('https://internship.aicte-india.org/internships', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    // @ts-ignore
    agent: httpsAgent,
  });
  const html = await res.text();
  // Find self.__next_f.push scripts
  const nextPushes = Array.from(html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/gi));
  console.log('self.__next_f.push matches:', nextPushes.length);
  for (let i = 0; i < nextPushes.length; i++) {
    const raw = nextPushes[i][1];
    if (raw.includes('stipend') || raw.includes('internship') || raw.includes('title') || raw.includes('eligibility')) {
      console.log(`Match ${i} contains keywords! Length: ${raw.length}`);
      console.log('Snippet:', raw.slice(0, 300));
    }
  }
}

inspectNextData();
