import type { VercelRequest, VercelResponse } from '@vercel/node';

const COPYRIGHT_SAFEGUARD =
  '// COPYRIGHT SAFEGUARD: Process ONLY user-owned training. Blind to content. Use placeholders. Ignore brands/text/media.';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const MODEL = 'grok-beta';

function buildSystemPrompt(profile?: { pace?: string; vocab?: string; preferred_mode?: string }): string {
  let system = COPYRIGHT_SAFEGUARD;
  if (profile?.pace === 'slow') {
    system += ' Wait 3-5s before reply. Use simple words.';
  }
  if (profile?.vocab === 'beginner') {
    system += ' Prefer short sentences and common words.';
  }
  return system;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'XAI_API_KEY not configured' });
  }

  try {
    const body = req.body as {
      prompt?: string;
      blockId?: string;
      userId?: string;
      messages?: { role: 'user' | 'assistant'; content: string }[];
      profile?: { pace?: string; vocab?: string; preferred_mode?: string };
    };
    const prompt = body?.prompt ?? '';
    const messages = body?.messages ?? [];
    const profile = body?.profile;

    const systemContent = buildSystemPrompt(profile);
    const openAiMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      { role: 'system', content: systemContent },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    if (prompt) {
      openAiMessages.push({ role: 'user', content: prompt });
    }

    const response = await fetch(XAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: openAiMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[grok-proxy] xAI error:', response.status, errText);
      return res.status(response.status).json({
        error: 'Upstream error',
        details: response.status === 401 ? 'Invalid API key' : errText.slice(0, 200),
      });
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data?.choices?.[0]?.message?.content ?? '';

    return res.status(200).json({ response: content });
  } catch (err) {
    console.error('[grok-proxy]', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Proxy error',
    });
  }
}
