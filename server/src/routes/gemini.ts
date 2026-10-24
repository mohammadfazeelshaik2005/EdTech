import { Router, Request, Response } from 'express';
import {
  getServerGeminiConfig,
  checkGeminiHealth,
  createServerGeminiClient,
  generateContentWithFallback,
  sanitizeErrorMessage,
} from '../services/geminiService.js';

export const geminiRouter = Router();

/**
 * GET /api/gemini/health
 * Returns status and active model of Google Gemini API
 */
geminiRouter.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await checkGeminiHealth();
    const statusCode = result.ok ? 200 : (result.errorCode === 'MISSING_API_KEY' ? 404 : 502);
    res.status(statusCode).json(result);
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: sanitizeErrorMessage(err.message),
    });
  }
});

/**
 * POST /api/gemini/chat
 * Chat / Completion endpoint for Placement & Career Mentor Assistant
 */
geminiRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = getServerGeminiConfig();
    if (!config) {
      res.status(500).json({
        ok: false,
        errorCode: 'MISSING_API_KEY',
        error: 'GEMINI_API_KEY is not configured in server environment (.env).',
      });
      return;
    }

    const { message, systemInstruction, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ ok: false, error: 'A valid text "message" is required.' });
      return;
    }

    const ai = createServerGeminiClient(config.apiKey);
    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text || h.content || '' }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const { response, modelUsed } = await generateContentWithFallback(ai, config.model, {
      contents,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    res.status(200).json({
      ok: true,
      model: modelUsed,
      reply: response.text || '',
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: sanitizeErrorMessage(err.message),
    });
  }
});

/**
 * POST /api/gemini/assessment
 * Question generation endpoint for Mock Interviews and Placement Assessments
 */
geminiRouter.post('/assessment', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = getServerGeminiConfig();
    if (!config) {
      res.status(500).json({
        ok: false,
        errorCode: 'MISSING_API_KEY',
        error: 'GEMINI_API_KEY is not configured in server environment (.env).',
      });
      return;
    }

    const { prompt } = req.body;

    if (!prompt) {
      res.status(400).json({ ok: false, error: 'prompt is required.' });
      return;
    }

    const ai = createServerGeminiClient(config.apiKey);
    const { response, modelUsed } = await generateContentWithFallback(ai, config.model, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    res.status(200).json({
      ok: true,
      model: modelUsed,
      rawText: response.text || '',
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: sanitizeErrorMessage(err.message),
    });
  }
});

/**
 * POST /api/gemini/analyze
 * Performance analysis endpoint diagnosing student test results and roadmap
 */
geminiRouter.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = getServerGeminiConfig();
    if (!config) {
      res.status(500).json({
        ok: false,
        errorCode: 'MISSING_API_KEY',
        error: 'GEMINI_API_KEY is not configured in server environment (.env).',
      });
      return;
    }

    const { summary } = req.body;

    if (!summary) {
      res.status(400).json({ ok: false, error: 'summary is required.' });
      return;
    }

    const prompt = `You are a Senior Technical Hiring & Placement Mentor for Tier-1 technology companies.
Analyze this student's actual assessment performance data:
${JSON.stringify(summary, null, 2)}

Provide an honest, constructive diagnostic in strict JSON format:
{
  "readinessSummary": "2-3 concise sentences diagnosing their performance and key strengths/gaps without false promises",
  "actionableRoadmap": [
    "Concrete, immediate step 1",
    "Concrete, immediate step 2",
    "Concrete, immediate step 3"
  ],
  "suggestedResources": [
    { "title": "Resource name", "type": "practice", "url": "https://geeksforgeeks.org", "topic": "Relevant topic" }
  ]
}
IMPORTANT: Output valid JSON only, without markdown backticks.`;

    const ai = createServerGeminiClient(config.apiKey);
    const { response, modelUsed } = await generateContentWithFallback(ai, config.model, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    res.status(200).json({
      ok: true,
      model: modelUsed,
      analysis: response.text ? JSON.parse(response.text) : null,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: sanitizeErrorMessage(err.message),
    });
  }
});
