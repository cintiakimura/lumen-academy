import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { processFile, saveCourseToSupabase } from '../utils/chunk';
import type { CourseBoxResult, ChildBlock, BlockType } from '../utils/chunk';
import { useSession } from '../hooks/useAuth';

const blockIcons: Record<BlockType, string> = {
  voice: '🎙️',
  slide: '📊',
  video: '🎬',
  podcast: '🎧',
  infographic: '📋',
};

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}:${s.toString().padStart(2, '0')}` : `${m} min`;
}

export default function Upload() {
  const { user, role } = useSession();
  const [result, setResult] = useState<CourseBoxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [childrenExpanded, setChildrenExpanded] = useState(true);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      setError(null);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      setLoading(true);
      setResult(null);
      try {
        const out = await processFile(file);
        setResult(out);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Processing failed');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
  }, []);

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;
      setLoading(true);
      setResult(null);
      try {
        const out = await processFile(file);
        setResult(out);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Processing failed');
      } finally {
        setLoading(false);
      }
      e.target.value = '';
    },
    []
  );

  const handleApproveSave = useCallback(async () => {
    if (!result || !user?.id) return;
    if (role !== 'org') {
      setSaveError('Only org can save courses. Log in as org to save.');
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const out = await saveCourseToSupabase(result, user.id);
      if (out?.courseId) {
        setSaved(true);
      } else {
        setSaveError('Save failed. Check RLS or try again.');
      }
    } catch {
      setSaveError('Save failed.');
    } finally {
      setSaving(false);
    }
  }, [result, user?.id, role]);

  return (
    <main className="page" style={{ fontSize: '16px' }}>
      <h1>CourseBox Upload</h1>
      <p style={{ color: '#555', marginBottom: '1.5rem' }}>
        Drop ZIP, PDF, video, or audio. We’ll split into 5–8 min blocks.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          background: drag ? '#E8EEF4' : '#EBEBEB',
          border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 12,
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
          minHeight: 180,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <input
          type="file"
          accept=".zip,.pdf,.mp4,.webm,.mov,.mp3,.wav,.m4a,.ogg"
          onChange={handleFileInput}
          disabled={loading}
          style={{ display: 'none' }}
          id="coursebox-file"
        />
        <label
          htmlFor="coursebox-file"
          style={{
            cursor: loading ? 'wait' : 'pointer',
            fontSize: '1.125rem',
            color: '#333',
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} aria-hidden />
              Processing…
            </span>
          ) : (
            <>
              <span style={{ display: 'block', marginBottom: '0.5rem', fontSize: '2rem' }}>
                📦
              </span>
              Drop ZIP, PDF, video, audio here — or click to choose
            </>
          )}
        </label>
      </div>

      {error && (
        <p style={{ color: '#c00', marginBottom: '1rem' }}>{error}</p>
      )}

      {result && (
        <section
          style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Preview</h2>

          <button
            type="button"
            onClick={() => setChildrenExpanded((e) => !e)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{childrenExpanded ? '▼' : '▶'}</span>
            <span>{result.parent.title}</span>
            <span style={{ marginLeft: 'auto', color: '#666', fontWeight: 400 }}>{result.children.length} blocks</span>
          </button>

          {childrenExpanded && (
            <ul style={{ listStyle: 'none', padding: '0.75rem 0 0', margin: 0, borderTop: '1px solid var(--border)' }}>
              {result.children.map((block: ChildBlock, index: number) => (
                <li
                  key={block.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0',
                    borderBottom: index < result.children.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: '1rem',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }} title={block.type}>
                    {blockIcons[block.type]}
                  </span>
                  <span style={{ flex: 1 }}>{block.title}</span>
                  <span style={{ color: '#666' }}>{formatDuration(block.duration)}</span>
                  {block.assets?.length ? (
                    <span style={{ fontSize: '0.85rem', color: '#888' }}>{block.assets.map((a) => a.label).filter(Boolean).join(', ')}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: '1.25rem' }}>
            <button
              onClick={handleApproveSave}
              disabled={saving || role !== 'org'}
              style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}
            >
              {saving ? 'Saving…' : saved ? 'Saved' : 'Approve & Save'}
            </button>
            {role !== 'org' && (
              <span style={{ marginLeft: '0.75rem', color: '#666', fontSize: '0.9rem' }}>Only org can save.</span>
            )}
            {saved && (
              <span style={{ marginLeft: '0.75rem', color: '#2e7d32' }}>Course and blocks saved.</span>
            )}
            {saveError && (
              <p style={{ marginTop: '0.5rem', color: '#c00', fontSize: '0.9rem' }}>{saveError}</p>
            )}
          </div>
        </section>
      )}

      <p style={{ marginTop: '1rem' }}>
        <Link to="/dashboard/teacher">← Back to teacher dashboard</Link>
      </p>
    </main>
  );
}
