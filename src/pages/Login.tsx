import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useAuth';
import type { Role } from '../hooks/useAuth';

function dashboardPath(role: Role): string {
  switch (role) {
    case 'org':
      return '/dashboard/org';
    case 'teacher':
      return '/dashboard/teacher';
    case 'learner':
      return '/dashboard/learner';
    default:
      return '/';
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { session, role, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (session && role) {
      navigate(dashboardPath(role), { replace: true });
    }
  }, [session, role, loading, navigate]);

  if (session && !role && !loading) {
    return (
      <main className="page">
        <section style={{ maxWidth: 400, margin: '2rem auto' }}>
          <h1>Signed in</h1>
          <p style={{ color: '#555' }}>
            No role assigned yet. Contact your org or go home.
          </p>
          <p style={{ marginTop: '1rem' }}>
            <Link to="/">Home</Link>
          </p>
        </section>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <section style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
          <p style={{ color: '#555' }}>Loading…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section style={{ maxWidth: 400, margin: '2rem auto' }}>
        <h1>Log in</h1>
        <p style={{ color: '#555', marginBottom: '1.5rem' }}>
          We’ll send you a magic link to sign in.
        </p>

        {sent ? (
          <p
            style={{
              padding: '1rem',
              background: '#E8F5E9',
              borderRadius: 12,
              color: '#2E7D32',
              marginBottom: '1rem',
            }}
          >
            Check your email for the link.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="you@company.com"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                border: '1px solid var(--border)',
                fontSize: '1rem',
                marginBottom: '1rem',
              }}
            />
            {error && (
              <p style={{ color: '#c00', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          <Link to="/">Back to home</Link>
        </p>
      </section>
    </main>
  );
}
