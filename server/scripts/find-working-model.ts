import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function findSupportedGenerationModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  const models = data.models || [];
  
  const generateModels = models.filter((m: any) => 
    m.supportedGenerationMethods?.includes('generateContent')
  );

  console.log(`Found ${generateModels.length} models supporting generateContent:`);
  
  for (const gm of generateModels) {
    const modelName = gm.name.replace('models/', '');
    process.stdout.write(`Testing ${modelName}... `);
    try {
      const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hi' }] }]
        })
      });
      const testData = await testRes.json();
      if (testRes.ok && testData.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log('SUCCESS! Reply:', testData.candidates[0].content.parts[0].text.trim());
        console.log(`\n===> WORKING MODEL FOUND: "${modelName}" <===`);
        return modelName;
      } else {
        console.log(`Error ${testRes.status}:`, testData.error?.message?.slice(0, 100));
      }
    } catch (e: any) {
      console.log('Fetch error:', e.message);
    }
  }
}

findSupportedGenerationModel().catch(console.error);
