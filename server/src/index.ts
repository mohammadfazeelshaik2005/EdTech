import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Node polyfill for localStorage (used for in-memory / local opportunity storage)
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => { store.set(key, String(val)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (idx: number) => Array.from(store.keys())[idx] || null,
    length: 0,
  } as Storage;
}

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { geminiRouter } from './routes/gemini.js';
import { pipelineRouter } from './routes/pipeline.js';
import { opportunitiesRouter } from './routes/opportunities.js';
import { getKolkataISOString } from './lib/deadlineUtils.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root Health Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'PathSync AI Server',
    version: '0.1.0',
    systemTimeIST: getKolkataISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Mount Routes
app.use('/api/gemini', geminiRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/opportunities', opportunitiesRouter);

// Start server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 PathSync AI Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/gemini/health`);
  console.log(`   - POST /api/gemini/chat`);
  console.log(`   - POST /api/gemini/assessment`);
  console.log(`   - POST /api/gemini/analyze`);
  console.log(`   - GET  /api/opportunities`);
  console.log(`   - POST /api/pipeline/run`);
  console.log(`   - GET  /api/pipeline/audit`);
  console.log('====================================================');
});

export default app;
