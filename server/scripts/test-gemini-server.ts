import dotenv from 'dotenv';
import path from 'path';
import { checkGeminiHealth } from '../src/server/geminiService';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  console.log('Testing server-side Gemini integration...');
  const keyExists = Boolean(process.env.GEMINI_API_KEY?.trim());
  console.log(`Server secret GEMINI_API_KEY detected: ${keyExists ? 'YES (configured)' : 'NO (missing)'}`);
  console.log(`Configured GEMINI_MODEL: ${process.env.GEMINI_MODEL || 'gemini-1.5-flash (default)'}`);

  const health = await checkGeminiHealth();
  console.log('\n--- Health Check Result ---');
  console.log(JSON.stringify(health, null, 2));

  if (!health.ok) {
    console.log('\nHealth check handled error cleanly without exposing any keys.');
  } else {
    console.log('\nHealth check succeeded! Gemini returned:', health.testResponse);
  }
}

run().catch(err => {
  console.error('Unexpected runner error:', err);
  process.exit(1);
});
