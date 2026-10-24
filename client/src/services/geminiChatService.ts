export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  userId: string;
  messages: ChatMessage[];
}

const CHAT_STORAGE_PREFIX = 'pathsync_chat_history_';

export function getStudentChatHistory(userId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStudentChatHistory(userId: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(`${CHAT_STORAGE_PREFIX}${userId}`, JSON.stringify(messages.slice(-50)));
  } catch {}
}

export function clearStudentChatHistory(userId: string): void {
  try {
    localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${userId}`);
  } catch {}
}

/**
 * Sends a message to the server-side Gemini chat endpoint.
 * Includes context history and placement/CS prep system instructions.
 */
export async function sendPlacementDoubtMessage(
  message: string,
  history: ChatMessage[],
  _userId?: string,
  studentContext?: { name?: string; branch?: string; skills?: string[] }
): Promise<{ reply: string; model: string }> {
  const contextIntro = studentContext?.name
    ? `You are mentoring student "${studentContext.name}"${studentContext.branch ? ` (studying ${studentContext.branch})` : ''}.${studentContext.skills?.length ? ` Their key skills include: ${studentContext.skills.slice(0, 8).join(', ')}.` : ''} Address them personally by name when helpful.`
    : '';

  const systemInstruction = `You are the PathSync AI Placement & Career Assistant, an expert technical mentor helping university students and job candidates prepare for campus placements, competitive engineering tests, and technical interviews. ${contextIntro}
Your expertise covers:
1. Programming languages (Python, Java, C++, JavaScript/TypeScript, SQL)
2. Data Structures & Algorithms (arrays, trees, graphs, dynamic programming, sorting, recursion)
3. Core Computer Science (Operating Systems, Database Management Systems, Computer Networks, System Design)
4. Quantitative Aptitude and Logical Reasoning (speed math, probability, permutations, puzzles)
5. Technical and Behavioral Interview preparation

Guidelines:
- Give clear, precise, technically accurate explanations with clean code examples where helpful.
- For aptitude or algorithm problems, explain the optimal approach step-by-step with Time and Space complexity.
- Maintain a supportive, encouraging, professional mentor tone.
- Never make false guarantees about hiring, but guide the student on industry best practices.
- Keep answers structured and easy to read.`;

  // Server proxy POST /api/gemini/chat
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      systemInstruction,
      history: history.map((h) => ({
        role: h.role,
        content: h.content,
      })),
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${res.status}`);
  }

  const data = await res.json();
  if (!data.ok || !data.reply) {
    throw new Error(data.error || 'Failed to receive a valid response from Gemini.');
  }

  return {
    reply: data.reply.trim(),
    model: data.model || 'Gemini',
  };
}
