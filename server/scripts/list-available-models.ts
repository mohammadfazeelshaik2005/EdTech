import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  console.log('Testing key with Google REST API list models...');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  if (data.models) {
    console.log('Available models for this key:');
    data.models.forEach((m: any) => console.log(' -', m.name));
  } else {
    console.log('Response body:', JSON.stringify(data, null, 2));
  }
}

checkApiKey().catch(console.error);
