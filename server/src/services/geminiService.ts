import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env into process.env if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env into process.env from server directory and project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface GeminiHealthResult {
  ok: boolean;
  model: string;
  configured: boolean;
  latencyMs?: number;
  testResponse?: string;
  error?: string;
  errorCode?: 'MISSING_API_KEY' | 'INVALID_CREDENTIALS' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'UNKNOWN';
}

/**
 * Reads server-side secret strictly from process.env.GEMINI_API_KEY
 * Never exposed to browser or prefixed with VITE_
 */
export function getServerGeminiConfig(): GeminiConfig | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';

  if (!apiKey) {
    return null;
  }

  return { apiKey, model };
}

/**
 * Initializes official GoogleGenAI SDK instance securely on the server
 */
export function createServerGeminiClient(apiKey?: string): GoogleGenAI {
  const key = apiKey || getServerGeminiConfig()?.apiKey;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({ apiKey: key });
}

/**
 * Executes a Gemini model request with automated fallback if the primary model (e.g. gemini-3.8-flash)
 * encounters Google server-side 503 high demand spikes or 404 deprecations.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  params: any
): Promise<{ response: any; modelUsed: string }> {
  const fallbackChain = [
    primaryModel,
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
  ];

  // Remove duplicates
  const modelsToTry = Array.from(new Set(fallbackChain.filter(Boolean)));
  let lastError: any = null;

  for (const candidateModel of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: candidateModel,
      });
      return { response, modelUsed: candidateModel };
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err);
      // If 503 high demand, 404, or 429 per-model quota, try next candidate model
      if (
        msg.includes('503') ||
        msg.includes('404') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('high demand') ||
        msg.includes('NOT_FOUND') ||
        msg.includes('UNAVAILABLE')
      ) {
        continue;
      }
      // For auth errors or malformed payloads, throw immediately
      throw err;
    }
  }

  throw lastError;
}

/**
 * Performs a health and connectivity check with the official Gemini API.
 * Never prints or returns the API key.
 */
export async function checkGeminiHealth(): Promise<GeminiHealthResult> {
  const config = getServerGeminiConfig();
  if (!config) {
    return {
      ok: false,
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash',
      configured: false,
      errorCode: 'MISSING_API_KEY',
      error: 'GEMINI_API_KEY server secret is not set in process.env or .env file.',
    };
  }

  const startTime = Date.now();
  try {
    const ai = createServerGeminiClient(config.apiKey);
    
    // Test simple generation with automated fallback
    const { response, modelUsed } = await generateContentWithFallback(ai, config.model, {
      contents: 'Ping: reply with "PONG" only.',
      config: {
        maxOutputTokens: 10,
        temperature: 0.1,
      },
    });

    const latencyMs = Date.now() - startTime;
    const text = response.text ? response.text.trim() : '';

    return {
      ok: true,
      model: modelUsed,
      configured: true,
      latencyMs,
      testResponse: text || 'OK',
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = String(err?.message || err);
    let errorCode: GeminiHealthResult['errorCode'] = 'UNKNOWN';

    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('PERMISSION_DENIED')) {
      errorCode = 'INVALID_CREDENTIALS';
    } else if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
      errorCode = 'QUOTA_EXCEEDED';
    } else if (errorMsg.includes('FETCH_ERROR') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('timeout')) {
      errorCode = 'NETWORK_ERROR';
    }

    return {
      ok: false,
      model: config.model,
      configured: true,
      latencyMs,
      errorCode,
      error: sanitizeErrorMessage(errorMsg),
    };
  }
}

/**
 * Sanitizes errors so API keys are never leaked in error messages or logs
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return 'An unknown error occurred';
  // Strip any query parameter keys or key= patterns
  return message
    .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=REDACTED')
    .replace(/[a-zA-Z0-9_\-]{35,}/g, '[REDACTED_TOKEN]');
}
