import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  console.log('Testing with key length:', apiKey?.length);
  const ai = new GoogleGenAI({ apiKey });
  
  // Try models
  const candidates = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-pro'
  ];

  for (const m of candidates) {
    try {
      console.log(`Checking ${m}...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Hi',
      });
      console.log(` SUCCESS with ${m}! Response:`, res.text?.trim());
      break;
    } catch (e: any) {
      console.log(` Failed ${m}:`, e.message?.slice(0, 140));
    }
  }
}

listModels().catch(console.error);
