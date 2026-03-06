import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  title: string;
  created_at: string;
}

interface AssignmentWithEmail {
  user_id: string;
  course_id: string;
  progress: string[];
  assigned_at: string;
  email: string | null;
}

interface Learner {
  id: string;
  email: string | null;
}

export default function DashboardTeacher() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithEmail[]>([]);
  const [blockCount, setBlockCount] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [learnersLoading, setLearnersLoading] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setCourses((data as Course[]));
        setCoursesLoading(false);
      });
  }, []);

  const loadCourseDetail = useCallback(async (courseId: string) => {
    setDetailLoading(true);
    setSelectedCourseId(courseId);

    const [assignRes, blockRes] = await Promise.all([
      supabase.from('assignments').select('user_id, course_id, progress, assigned_at').eq('course_id', courseId),
      supabase.from('blocks').select('id').eq('course_id', courseId),
    ]);

    const progressList = (assignRes.data ?? []) as { user_id: string; course_id: string; progress: unknown; assigned_at: string }[];
    const userIds = [...new Set(progressList.map((a) => a.user_id))];
    setBlockCount(blockRes.data?.length ?? 0);

    let emails: { id: string; email: string | null }[] = [];
    if (userIds.length > 0) {
      const { data: userData } = await supabase.from('users').select('id, email').in('id', userIds);
      emails = (userData ?? []) as { id: string; email: string | null }[];
    }

    const byId = Object.fromEntries(emails.map((u) => [u.id, u.email]));
    setAssignments(
      progressList.map((a) => ({
        user_id: a.user_id,
        course_id: a.course_id,
        progress: Array.isArray(a.progress) ? (a.progress as string[]) : [],
        assigned_at: a.assigned_at,
        email: byId[a.user_id] ?? null,
      }))
    );
    setDetailLoading(false);
  }, []);

  const loadLearners = useCallback(() => {
    setLearnersLoading(true);
    supabase
      .from('users')
      .select('id, email')
      .eq('role', 'learner')
      .then(({ data, error }) => {
        if (!error && data) setLearners((data as Learner[]));
        setLearnersLoading(false);
      });
  }, []);

  const handleAssign = useCallback(async () => {
    if (!selectedCourseId || !assignEmail.trim()) return;
    setAssignError(null);
    setAssigning(true);
    const learner = learners.find((l) => l.email?.toLowerCase() === assignEmail.trim().toLowerCase());
    if (!learner) {
      setAssignError('Learner not found. Use an email from the list.');
      setAssigning(false);
      return;
    }
    const { error } = await supabase.from('assignments').insert({
      user_id: learner.id,
      course_id: selectedCourseId,
    });
    if (error) {
      if (error.code === '23505') setAssignError('Already assigned.');
      else setAssignError(error.message);
      setAssigning(false);
      return;
    }
    setAssignEmail('');
    setAssignError(null);
    await loadCourseDetail(selectedCourseId);
    setAssigning(false);
  }, [selectedCourseId, assignEmail, learners, loadCourseDetail]);

  const progressPct = (progress: string[]) =>
    blockCount > 0 ? Math.round((progress.length / blockCount) * 100) : 0;

  return (
    <main className="page">
      <h1>Teacher Dashboard</h1>
      <p style={{ color: '#555', marginBottom: '1.5rem' }}>
        My courses, upload, assign learners.
      </p>
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/upload" style={{ marginRight: '1rem' }}>Upload course</Link>
        <Link to="/">Home</Link>
      </p>

      {!selectedCourseId ? (
        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Courses</h2>
          {coursesLoading ? (
            <p style={{ color: '#666' }}>Loading…</p>
          ) : courses.length === 0 ? (
            <p style={{ color: '#666' }}>No courses yet. Upload one from the link above.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {courses.map((c) => (
                <li key={c.id} style={{ marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    className="secondary"
                    style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem' }}
                    onClick={() => loadCourseDetail(c.id)}
                  >
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <button type="button" className="secondary" onClick={() => setSelectedCourseId(null)} style={{ marginBottom: '1rem' }}>
            ← All courses
          </button>
          {detailLoading ? (
            <p style={{ color: '#666' }}>Loading…</p>
          ) : (
            <>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Learners & progress</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {assignments.map((a) => (
                  <li
                    key={a.user_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span>{a.email ?? a.user_id}</span>
                    <span style={{ color: '#555' }}>{progressPct(a.progress)}%</span>
                  </li>
                ))}
              </ul>
              {assignments.length === 0 && <p style={{ color: '#666', marginTop: '0.5rem' }}>No learners assigned yet.</p>}

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Assign learner</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Search by email (learners only).
                </p>
                <button type="button" className="secondary" onClick={loadLearners} disabled={learnersLoading} style={{ marginBottom: '0.5rem' }}>
                  {learnersLoading ? 'Loading…' : 'Load learners'}
                </button>
                {learners.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0', maxHeight: 120, overflow: 'auto' }}>
                    {learners.slice(0, 20).map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          className="secondary"
                          style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', margin: '0.125rem' }}
                          onClick={() => setAssignEmail(l.email ?? '')}
                        >
                          {l.email}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <input
                    type="email"
                    placeholder="learner@example.com"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      fontSize: '1rem',
                      minWidth: 200,
                    }}
                  />
                  <button type="button" onClick={handleAssign} disabled={assigning}>
                    {assigning ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
                {assignError && <p style={{ color: '#c00', fontSize: '0.9rem', marginTop: '0.5rem' }}>{assignError}</p>}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
