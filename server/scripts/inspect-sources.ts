import https from 'node:https';
import http from 'node:http';

interface ProbeResult {
  source: string;
  url: string;
  status: number | string;
  contentType?: string;
  contentLength?: number;
  blockedOrCaptcha?: boolean;
  snippet?: string;
  error?: string;
}

const SOURCES_TO_PROBE = [
  { name: 'NSP (National Scholarship Portal)', url: 'https://scholarships.gov.in/' },
  { name: 'UGC (University Grants Commission)', url: 'https://www.ugc.gov.in/' },
  { name: 'AICTE Internship Portal', url: 'https://internship.aicte-india.org/' },
  { name: 'ISTI Portal (India Science & Tech)', url: 'https://www.indiascienceandtechnology.gov.in/opportunities' },
  { name: 'SERB / ANRF', url: 'https://serbonline.in/SERB/HomePage' },
  { name: 'Unstop', url: 'https://unstop.com/hackathons' },
  { name: 'Devpost', url: 'https://devpost.com/hackathons' },
  { name: 'NPTEL', url: 'https://nptel.ac.in/' },
  { name: 'SWAYAM', url: 'https://swayam.gov.in/explorer' },
];

async function probeUrl(name: string, urlStr: string): Promise<ProbeResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(urlStr, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';
    const isBlocked =
      res.status === 403 ||
      res.status === 429 ||
      text.includes('cf-browser-verification') ||
      text.includes('Cloudflare') && text.includes('captcha') ||
      text.includes('Attention Required! | Cloudflare') ||
      text.includes('ShieldSquare Captcha') ||
      text.includes('Bot Protection');

    return {
      source: name,
      url: urlStr,
      status: res.status,
      contentType,
      contentLength: text.length,
      blockedOrCaptcha: isBlocked,
      snippet: text.slice(0, 400).replace(/\s+/g, ' '),
    };
  } catch (err: any) {
    return {
      source: name,
      url: urlStr,
      status: 'FETCH_ERROR',
      error: err.message,
    };
  }
}

async function main() {
  console.log('Inspecting 9 approved sources live from network...\n');
  const results: ProbeResult[] = [];
  for (const src of SOURCES_TO_PROBE) {
    console.log(`Probing: ${src.name} (${src.url})...`);
    const res = await probeUrl(src.name, src.url);
    results.push(res);
    console.log(` -> Status: ${res.status}, Length: ${res.contentLength || 0}, Blocked/Captcha: ${res.blockedOrCaptcha || false}`);
    if (res.error) console.log(` -> Error: ${res.error}`);
    // Brief pause to be respectful
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log('\n================================================================');
  console.log('LIVE PROBE RESULTS SUMMARY:');
  console.log('================================================================');
  for (const r of results) {
    console.log(`[${r.status}] ${r.source}`);
    console.log(`      URL: ${r.url}`);
    if (r.error) {
      console.log(`      Error: ${r.error}`);
    } else {
      console.log(`      Blocked/CAPTCHA: ${r.blockedOrCaptcha ? 'YES (Protected/Blocked)' : 'NO (Accessible)'}`);
      console.log(`      Snippet: ${r.snippet?.slice(0, 120)}...`);
    }
  }
}

main().catch(console.error);
