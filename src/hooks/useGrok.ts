import { useState, useCallback } from 'react';
import axios from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GrokProfile {
  pace?: string;
  vocab?: string;
  preferred_mode?: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function useGrok(
  blockId: string,
  userId: string | undefined,
  profile: GrokProfile | undefined,
  initialMessages?: ChatMessage[]
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !userId) return;
      const userMsg: ChatMessage = { role: 'user', content: content.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);
      const historyForApi = [...messages, userMsg];
      try {
        const url = `${API_BASE}/api/grok-proxy`;
        const { data } = await axios.post<{ response?: string }>(url, {
          prompt: content.trim(),
          blockId,
          userId,
          messages: historyForApi.map((m) => ({ role: m.role, content: m.content })),
          profile: profile
            ? {
                pace: profile.pace,
                vocab: profile.vocab,
                preferred_mode: profile.preferred_mode,
              }
            : undefined,
        });
        const assistantContent = data?.response ?? '';
        setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
      } catch (err: unknown) {
        const msg = axios.isAxiosError(err)
          ? (err.response?.data as { error?: string })?.error ?? err.message
          : err instanceof Error
            ? err.message
            : 'Request failed';
        setError(msg);
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${msg}` }]);
      } finally {
        setLoading(false);
      }
    },
    [blockId, userId, messages, profile]
  );

  return { messages, setMessages, loading, error, sendMessage };
}
