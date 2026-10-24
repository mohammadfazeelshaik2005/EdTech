import https from 'node:https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function inspectAicteApi() {
  const res = await fetch('https://internship.aicte-india.org/internships/api', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json',
    },
    // @ts-ignore
    agent: httpsAgent,
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Length:', text.length);
  try {
    const json = JSON.parse(text);
    console.log('JSON keys:', Object.keys(json));
    console.log('Sample JSON data:', JSON.stringify(json).slice(0, 500));
  } catch (e) {
    console.log('Not JSON. Snippet:', text.slice(0, 300));
  }
}

inspectAicteApi();
