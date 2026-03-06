import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useAuth';
import { useGrok } from '../hooks/useGrok';
import { generateCertificate } from '../utils/certificate';

interface BlockRow {
  id: string;
  course_id: string;
  title: string | null;
  type: string | null;
  assets: unknown;
}

function avgWordLength(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  return words.reduce((s, w) => s + w.length, 0) / words.length;
}

function hasHesitation(text: string): boolean {
  const lower = text.toLowerCase();
  return /\b(uhh?|um|er)\b/.test(lower) || text.length > 400;
}

function isClearAnswer(text: string): boolean {
  return text.length > 20 && !hasHesitation(text);
}

const MIN_TURNS_MASTERY = 5;
const MAX_HESITATION_MASTERY = 2;
const MIN_CLARITY_RATIO = 0.8;

declare global {
  interface Window {
    SpeechRecognition?: new () => {
      start: () => void;
      stop: () => void;
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: (e: unknown) => void;
      onerror: (e: unknown) => void;
      onend: () => void;
    };
    webkitSpeechRecognition?: new () => {
      start: () => void;
      stop: () => void;
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: (e: unknown) => void;
      onerror: (e: unknown) => void;
      onend: () => void;
    };
  }
}

interface SpeechRecognitionResultEvent {
  results: ArrayLike<{ isFinal: boolean; length: number; [i: number]: { transcript: string; confidence: number } }>;
  resultIndex: number;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : undefined;
const VOICE_SILENCE_MS = 5000;
const VOICE_CONFIDENCE_SEND = 0.85;

export default function Chat() {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSession();
  const [block, setBlock] = useState<BlockRow | null>(null);
  const [blockLoading, setBlockLoading] = useState(true);
  const [blockNotFound, setBlockNotFound] = useState(false);
  const [profile, setProfile] = useState<{ pace?: string; vocab?: string; preferred_mode?: string }>({});
  const [modeChoice, setModeChoice] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [nextLoading, setNextLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [resumedSession, setResumedSession] = useState(false);
  const responseStartRef = useRef<number | null>(null);
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognitionAPI>> | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLLIElement | null>(null);

  const { messages, setMessages, loading: grokLoading, sendMessage } = useGrok(
    blockId ?? '',
    user?.id,
    profile
  );

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, resumedSession]);

  const userMessages = useMemo(
    () => messages.filter((m) => m.role === 'user').map((m) => m.content),
    [messages]
  );

  const masteryCues = useMemo(() => {
    const hesitationCount = userMessages.filter(hasHesitation).length;
    const seen = new Set<string>();
    let repeatCount = 0;
    for (const msg of userMessages) {
      const key = msg.trim().toLowerCase().slice(0, 100);
      if (seen.has(key)) repeatCount++;
      else seen.add(key);
    }
    const clarityScore = userMessages.filter(isClearAnswer).length;
    const turns = userMessages.length;
    const clarityRatio = turns > 0 ? clarityScore / turns : 0;
    const mastery =
      turns >= MIN_TURNS_MASTERY &&
      hesitationCount < MAX_HESITATION_MASTERY &&
      clarityRatio >= MIN_CLARITY_RATIO &&
      repeatCount < 2;
    return { hesitationCount, repeatCount, clarityScore, turns, mastery };
  }, [userMessages]);

  useEffect(() => {
    if (!blockId) {
      setBlockLoading(false);
      return;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(blockId)) {
      supabase
        .from('blocks')
        .select('id, course_id, title, type, assets')
        .eq('id', blockId)
        .single()
        .then((result: { data: BlockRow | null; error: unknown }) => {
          if (result.error || !result.data) {
            setBlock(null);
            setBlockNotFound(true);
          } else {
            setBlock(result.data);
            setBlockNotFound(false);
          }
          setBlockLoading(false);
        });
    } else {
      setBlock(null);
      setBlockNotFound(true);
      setBlockLoading(false);
    }
  }, [blockId]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .select('pace, vocab, preferred_mode')
      .eq('id', user.id)
      .maybeSingle()
      .then((result: { data: { pace?: string; vocab?: string; preferred_mode?: string } | null }) => {
        if (result.data) setProfile({ pace: result.data.pace ?? undefined, vocab: result.data.vocab ?? undefined, preferred_mode: result.data.preferred_mode ?? undefined });
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !blockId || !block) return;
    supabase
      .from('chat_sessions')
      .select('messages, mastery')
      .eq('user_id', user.id)
      .eq('block_id', blockId)
      .maybeSingle()
      .then((result: { data: { messages: unknown; mastery: boolean } | null; error: unknown }) => {
        if (result.error || !result.data) return;
        const raw = result.data.messages;
        const arr = Array.isArray(raw) ? raw : [];
        const loaded = arr.filter(
          (m: unknown): m is { role: 'user' | 'assistant'; content: string } =>
            typeof m === 'object' && m !== null && 'role' in m && 'content' in m
        );
        if (loaded.length > 0) {
          setMessages(loaded);
          setResumedSession(true);
        }
      });
  }, [user?.id, blockId, block, setMessages]);

  const updateProfileFromCues = useCallback(
    async (responseDelayMs: number, lastUserMessage: string, chosenMode: string | null) => {
      if (!user?.id) return;
      const updates: { pace?: string; vocab?: string; preferred_mode?: string } = {};
      if (responseDelayMs > 15_000) updates.pace = 'slow';
      if (hasHesitation(lastUserMessage)) updates.pace = 'slow';
      const avgLen = avgWordLength(lastUserMessage);
      if (avgLen > 0 && avgLen < 4) updates.vocab = 'beginner';
      if (chosenMode) updates.preferred_mode = chosenMode;
      if (Object.keys(updates).length === 0) return;
      await supabase.from('users').update(updates).eq('id', user.id);
      setProfile((p) => ({ ...p, ...updates }));
    },
    [user?.id]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || grokLoading) return;
    setInput('');
    responseStartRef.current = Date.now();
    sendMessage(text).then(() => {
      const end = Date.now();
      const delay = responseStartRef.current != null ? end - responseStartRef.current : 0;
      responseStartRef.current = null;
      updateProfileFromCues(delay, text, modeChoice);
    });
  }, [input, grokLoading, sendMessage, modeChoice, updateProfileFromCues]);

  const handleNext = useCallback(async () => {
    if (!user?.id || !block?.course_id || !blockId || !masteryCues.mastery) return;
    setNextLoading(true);
    const { data: row } = await supabase
      .from('assignments')
      .select('progress')
      .eq('user_id', user.id)
      .eq('course_id', block.course_id)
      .maybeSingle();
    const progress: string[] = Array.isArray(row?.progress) ? [...(row?.progress as string[])] : [];
    if (!progress.includes(blockId)) progress.push(blockId);
    await supabase
      .from('assignments')
      .update({ progress })
      .eq('user_id', user.id)
      .eq('course_id', block.course_id);
    setNextLoading(false);
    navigate('/dashboard/learner');
  }, [user?.id, block?.course_id, blockId, masteryCues.mastery, navigate]);

  const handleGetCertificate = useCallback(() => {
    const title = block?.title ?? blockId ?? 'Block';
    generateCertificate({
      blockTitle: title,
      learnerName: (user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? '',
      learnerEmail: user?.email ?? '',
      filename: `${title.replace(/[^a-z0-9-_]/gi, '-').slice(0, 40)}-certificate.pdf`,
    });
  }, [block?.title, blockId, user]);

  const saveSession = useCallback(async () => {
    if (!user?.id || !blockId) return;
    const payload = {
      user_id: user.id,
      block_id: blockId,
      messages: messages as unknown as Record<string, unknown>[],
      last_turn_at: new Date().toISOString(),
      mastery: masteryCues.mastery,
    };
    await supabase.from('chat_sessions').upsert(payload, {
      onConflict: 'user_id,block_id',
    });
  }, [user?.id, blockId, messages, masteryCues.mastery]);

  const handlePause = useCallback(() => {
    void saveSession();
    setToast({ message: 'Session saved. Come back anytime.', type: 'info' });
  }, [saveSession]);

  const handleVoiceToggle = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setToast({ message: 'Voice input is not supported in this browser.', type: 'error' });
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      setIsListening(false);
      return;
    }
    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (event: unknown) => {
        const e = event as SpeechRecognitionResultEvent;
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        const last = e.results[e.results.length - 1] as { isFinal: boolean; 0?: { transcript: string; confidence: number } } | undefined;
        const transcript = last?.[0]?.transcript ?? '';
        const confident = last?.isFinal && (last?.[0]?.confidence ?? 0) >= VOICE_CONFIDENCE_SEND;
        if (last.isFinal && transcript.trim()) {
          if (confident) {
            setInput('');
            responseStartRef.current = Date.now();
            sendMessage(transcript.trim()).then(() => {
              const end = Date.now();
              const delay = responseStartRef.current != null ? end - responseStartRef.current : 0;
              responseStartRef.current = null;
              updateProfileFromCues(delay, transcript.trim(), modeChoice);
            });
            rec.stop();
            setIsListening(false);
          } else {
            setInput(transcript.trim());
          }
        } else {
          setInput(transcript);
        }
      };
      rec.onerror = (event: unknown) => {
        const e = event as SpeechRecognitionErrorEventLike;
        setIsListening(false);
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          setToast({ message: 'Microphone access denied.', type: 'error' });
        } else if (e.error === 'no-speech') {
          setToast({ message: 'No speech detected. Try again.', type: 'info' });
        } else {
          setToast({ message: 'Voice error. Try again.', type: 'error' });
        }
      };
      rec.onend = () => {
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      };
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
      silenceTimeoutRef.current = setTimeout(() => {
        silenceTimeoutRef.current = null;
        rec.stop();
        setIsListening(false);
        setToast({ message: 'Listening stopped after 5s silence.', type: 'info' });
      }, VOICE_SILENCE_MS);
    } catch {
      setToast({ message: 'Could not start microphone.', type: 'error' });
    }
  }, [isListening, sendMessage, modeChoice, updateProfileFromCues]);

  if (authLoading || !user) {
    return (
      <main className="page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555' }}>Loading…</p>
      </main>
    );
  }

  if (blockLoading) {
    return (
      <main className="page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555' }}>Loading block…</p>
      </main>
    );
  }

  if (blockNotFound || !block) {
    return (
      <main className="page">
        <h1>Block not available</h1>
        <p style={{ color: '#555' }}>This block may have been removed or you don’t have access.</p>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/dashboard/learner">← Back to dashboard</Link>
        </p>
      </main>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg)',
        maxWidth: 800,
        margin: '0 auto',
      }}
    >
      <header
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Grok Chat</h1>
          <Link to="/dashboard/learner" style={{ fontSize: '0.9rem' }}>← Dashboard</Link>
        </div>
        <p style={{ margin: '0.5rem 0 0', color: '#555', fontSize: '1rem' }}>
          {block.title ?? blockId}
        </p>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['Voice', 'Sim', 'Clip'].map((m) => (
            <button
              key={m}
              type="button"
              className={modeChoice === m.toLowerCase() ? '' : 'secondary'}
              onClick={() => setModeChoice(m.toLowerCase())}
              style={{ fontSize: '0.9rem', padding: '0.4rem 0.75rem' }}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      {resumedSession && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            background: '#E3F2FD',
            borderBottom: '1px solid #BBDEFB',
            fontSize: '0.95rem',
            color: '#1565C0',
          }}
        >
          Welcome back! Continuing {block.title ?? blockId} from where you left off.
        </div>
      )}

      <ul
        style={{
          flex: 1,
          overflow: 'auto',
          listStyle: 'none',
          margin: 0,
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {messages.length === 0 && (
          <li style={{ color: '#666', fontSize: '1rem' }}>
            Voice? Sim? Clip? Ask anything about this block.
          </li>
        )}
        {messages.map((msg, i) => (
          <li
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.75rem 1rem',
              borderRadius: 12,
              background: msg.role === 'user' ? 'var(--accent)' : '#fff',
              color: msg.role === 'user' ? '#fff' : 'var(--text)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              boxShadow: msg.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {msg.content}
          </li>
        ))}
        {grokLoading && (
          <li style={{ alignSelf: 'flex-start', color: '#666', fontSize: '0.95rem' }}>…</li>
        )}
        <li ref={messagesEndRef} aria-hidden style={{ margin: 0, padding: 0, height: 0 }} />

        {masteryCues.mastery && (
          <li
            style={{
              alignSelf: 'stretch',
              marginTop: '1rem',
              padding: '1rem 1.25rem',
              background: '#E8F5E9',
              borderRadius: 12,
              border: '1px solid #C8E6C9',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, color: '#2E7D32' }}>
              Looks like you&apos;ve got this! Ready for next?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={handleNext} disabled={nextLoading} style={{ fontSize: '0.95rem' }}>
                {nextLoading ? 'Saving…' : 'Next →'}
              </button>
              <button type="button" className="secondary" onClick={handleGetCertificate} style={{ fontSize: '0.95rem' }}>
                Get Certificate
              </button>
            </div>
          </li>
        )}
      </ul>

      <footer
        style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border)',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        {toast && (
          <div
            style={{
              marginBottom: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 8,
              background: toast.type === 'error' ? '#FFEBEE' : '#E3F2FD',
              color: toast.type === 'error' ? '#C62828' : '#1565C0',
              fontSize: '0.9rem',
            }}
          >
            {toast.message}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <input
            type="text"
            placeholder="Ask Grok…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={grokLoading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: 12,
              border: '1px solid var(--border)',
              fontSize: '16px',
              minHeight: 48,
            }}
            aria-label="Message"
          />
          <button
            type="button"
            onClick={handleVoiceToggle}
            className="secondary"
            style={{
              padding: '0.75rem',
              minWidth: 48,
              ...(isListening ? { animation: 'voice-pulse 1.2s ease-in-out infinite', background: '#FFEBEE', borderColor: '#ef5350', color: '#c62828' } : {}),
            }}
            title={SpeechRecognitionAPI ? (isListening ? 'Stop listening' : 'Voice input') : 'Voice not supported in this browser'}
            aria-label={isListening ? 'Stop' : 'Voice'}
          >
            {isListening ? '⏹' : '🎙️'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={handlePause}
            style={{ padding: '0.75rem', minWidth: 48 }}
            title="Pause (save session)"
            aria-label="Pause"
          >
            ⏸
          </button>
          <button type="button" onClick={handleSend} disabled={grokLoading || !input.trim()} style={{ padding: '0.75rem 1.25rem', minHeight: 48 }}>
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
