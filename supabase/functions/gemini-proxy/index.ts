import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenAI } from 'npm:@google/genai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const modelName = Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash';

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        errorCode: 'MISSING_API_KEY',
        error: 'GEMINI_API_KEY secret is not set in Supabase secrets.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'health';

    // 1. Health check action
    if (action === 'health' || req.method === 'GET') {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: 'Ping: reply with "PONG" only.',
        config: { maxOutputTokens: 10, temperature: 0.1 },
      });
      return new Response(
        JSON.stringify({
          ok: true,
          model: modelName,
          configured: true,
          testResponse: res.text?.trim() || 'OK',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Chat or Assessment action
    const body = await req.json();

    if (action === 'chat') {
      const { message, history = [], systemInstruction } = body;
      const contents = [
        ...history.map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text || h.content || '' }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ];

      const res = await ai.models.generateContent({
        model: modelName,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      return new Response(
        JSON.stringify({ ok: true, model: modelName, reply: res.text || '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'assessment') {
      const { prompt } = body;
      const res = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      return new Response(
        JSON.stringify({ ok: true, model: modelName, rawText: res.text || '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: 'Unknown action specified' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    const rawMsg = String(err?.message || err);
    // Sanitize any key leakage
    const sanitized = rawMsg.replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=REDACTED');
    return new Response(
      JSON.stringify({ ok: false, error: sanitized }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
