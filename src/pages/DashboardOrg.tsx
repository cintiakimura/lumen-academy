import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useBranding } from '../context/BrandingContext';

interface CourseRow {
  id: string;
  title: string;
  created_at: string;
}

interface AssignmentRow {
  user_id: string;
  course_id: string;
  progress: string[];
}

interface BlockRow {
  id: string;
  course_id: string;
  title: string | null;
}

interface UserRow {
  id: string;
  email: string | null;
  role: string;
}

interface CourseStats {
  courseId: string;
  title: string;
  completionPct: number;
  blockCount: number;
  assignmentCount: number;
  troubleBlocks: string[];
}

export default function DashboardOrg() {
  const { primaryColor, logoUrl, setPrimaryColor, setLogoUrl } = useBranding();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [learners, setLearners] = useState<UserRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterTeacher, setFilterTeacher] = useState<string>('');
  const [filterLearner, setFilterLearner] = useState<string>('');
  const [stats, setStats] = useState<CourseStats[]>([]);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandingSaved, setBrandingSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [coursesRes, teachersRes, learnersRes, assignmentsRes, blocksRes] = await Promise.all([
      supabase.from('courses').select('id, title, created_at').order('created_at', { ascending: false }),
      supabase.from('users').select('id, email, role').eq('role', 'teacher'),
      supabase.from('users').select('id, email, role').eq('role', 'learner'),
      supabase.from('assignments').select('user_id, course_id, progress'),
      supabase.from('blocks').select('id, course_id, title'),
    ]);

    setCourses((coursesRes.data ?? []) as CourseRow[]);
    setTeachers((teachersRes.data ?? []) as UserRow[]);
    setLearners((learnersRes.data ?? []) as UserRow[]);
    setAssignments((assignmentsRes.data ?? []) as AssignmentRow[]);
    setBlocks((blocksRes.data ?? []) as BlockRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const blockCountByCourse: Record<string, number> = {};
    blocks.forEach((b) => {
      blockCountByCourse[b.course_id] = (blockCountByCourse[b.course_id] ?? 0) + 1;
    });

    const completionByCourse: Record<string, number[]> = {};
    assignments.forEach((a) => {
      const count = blockCountByCourse[a.course_id];
      if (!count) return;
      const pct = (a.progress.length / count) * 100;
      if (!completionByCourse[a.course_id]) completionByCourse[a.course_id] = [];
      completionByCourse[a.course_id].push(pct);
    });

    const blockCompletionCount: Record<string, Record<string, number>> = {};
    assignments.forEach((a) => {
      if (!blockCompletionCount[a.course_id]) blockCompletionCount[a.course_id] = {};
      a.progress.forEach((blockId) => {
        blockCompletionCount[a.course_id][blockId] = (blockCompletionCount[a.course_id][blockId] ?? 0) + 1;
      });
    });

    const courseList = filterCourse ? courses.filter((c) => c.id === filterCourse) : courses;
    const next: CourseStats[] = courseList.map((c) => {
      const pcts = completionByCourse[c.id] ?? [];
      const avgPct = pcts.length ? pcts.reduce((s, p) => s + p, 0) / pcts.length : 0;
      const blockCount = blockCountByCourse[c.id] ?? 0;
      const courseBlocks = blocks.filter((b) => b.course_id === c.id);
      const blockCounts = blockCompletionCount[c.id] ?? {};
      const sorted = courseBlocks
        .map((b) => ({ id: b.id, title: b.title ?? b.id, count: blockCounts[b.id] ?? 0 }))
        .sort((a, b) => a.count - b.count);
      const troubleBlocks = sorted.slice(0, 3).map((x) => x.title);
      return {
        courseId: c.id,
        title: c.title,
        completionPct: Math.round(avgPct),
        blockCount,
        assignmentCount: pcts.length,
        troubleBlocks,
      };
    });

    let filtered = next;
    if (filterLearner) {
      const learnerAssignmentIds = new Set(assignments.filter((a) => a.user_id === filterLearner).map((a) => a.course_id));
      filtered = next.filter((s) => learnerAssignmentIds.has(s.courseId));
    }
    setStats(filtered);
  }, [courses, assignments, blocks, filterCourse, filterLearner]);

  const totalCourses = courses.length;
  const activeLearners = new Set(assignments.map((a) => a.user_id)).size;
  const overallPcts: number[] = [];
  const blockCountByCourse: Record<string, number> = {};
  blocks.forEach((b) => {
    blockCountByCourse[b.course_id] = (blockCountByCourse[b.course_id] ?? 0) + 1;
  });
  assignments.forEach((a) => {
    const count = blockCountByCourse[a.course_id];
    if (count) overallPcts.push((a.progress.length / count) * 100);
  });
  const avgCompletion = overallPcts.length ? Math.round(overallPcts.reduce((s, p) => s + p, 0) / overallPcts.length) : 0;

  const handleSaveBranding = useCallback(async () => {
    setBrandingSaving(true);
    setBrandingSaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBrandingSaving(false);
      return;
    }
    let logoUrlFinal = logoUrl;
    if (logoFile) {
      const path = `${user.id}/logo`;
      const { error: upErr } = await supabase.storage.from('branding').upload(path, logoFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('branding').getPublicUrl(path);
        logoUrlFinal = urlData.publicUrl;
        setLogoUrl(logoUrlFinal);
      }
    }
    await supabase
      .from('users')
      .update({ primary_color: primaryColor, logo_url: logoUrlFinal })
      .eq('id', user.id);
    setLogoFile(null);
    setBrandingSaving(false);
    setBrandingSaved(true);
  }, [primaryColor, logoUrl, logoFile, setLogoUrl]);

  return (
    <main className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
        )}
        <h1 style={{ margin: 0 }}>Org Dashboard</h1>
      </div>
      <p style={{ color: '#555', marginBottom: '1.5rem' }}>
        Courses, teachers, learners, progress overview.
      </p>
      <p style={{ marginBottom: '1.5rem' }}>
        <Link to="/">Home</Link>
      </p>

      {/* Branding */}
      <section
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Branding</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem', color: '#555' }}>
              Primary color
            </label>
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#4A90E2"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 12,
                border: '1px solid var(--border)',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem', color: '#555' }}>
              Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              style={{ fontSize: '0.9rem' }}
            />
            {logoUrl && !logoFile && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#666' }}>Current logo shown above.</p>
            )}
          </div>
          <button type="button" onClick={handleSaveBranding} disabled={brandingSaving}>
            {brandingSaving ? 'Saving…' : 'Save branding'}
          </button>
          {brandingSaved && <span style={{ color: '#2E7D32', fontSize: '0.9rem' }}>Saved.</span>}
        </div>
      </section>

      {/* Overview cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.25rem' }}>Total courses</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{totalCourses}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.25rem' }}>Active learners</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{activeLearners}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.25rem' }}>Avg completion</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{avgCompletion}%</div>
        </div>
      </section>

      {/* Filters */}
      <section style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Filters</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 12, border: '1px solid var(--border)', fontSize: '1rem' }}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 12, border: '1px solid var(--border)', fontSize: '1rem' }}
          >
            <option value="">All teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.email ?? t.id}</option>
            ))}
          </select>
          <select
            value={filterLearner}
            onChange={(e) => setFilterLearner(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 12, border: '1px solid var(--border)', fontSize: '1rem' }}
          >
            <option value="">All learners</option>
            {learners.map((l) => (
              <option key={l.id} value={l.id}>{l.email ?? l.id}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Courses table */}
      <section
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', margin: 0, padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          Courses
        </h2>
        {loading ? (
          <p style={{ padding: '1.25rem', color: '#666' }}>Loading…</p>
        ) : stats.length === 0 ? (
          <p style={{ padding: '1.25rem', color: '#666' }}>No courses match the filters.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 600 }}>Course</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600 }}>Completion %</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600 }}>Learners</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 600 }}>Trouble blocks</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.courseId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{s.title}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{s.completionPct}%</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{s.assignmentCount}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#666' }}>
                      {s.troubleBlocks.length ? s.troubleBlocks.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
