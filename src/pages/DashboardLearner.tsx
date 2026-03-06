import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useAuth';

interface CourseRow {
  id: string;
  title: string;
}

interface BlockRow {
  id: string;
  course_id: string;
  title: string | null;
  type: string | null;
}

interface AssignmentRow {
  course_id: string;
  progress: string[];
}

interface CourseWithBlocks {
  course: CourseRow;
  blocks: BlockRow[];
  progress: string[];
  progressPct: number;
}

export default function DashboardLearner() {
  const { user } = useSession();
  const [data, setData] = useState<CourseWithBlocks[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: assignments } = await supabase
        .from('assignments')
        .select('course_id, progress')
        .eq('user_id', user.id);
      const rows = (assignments ?? []) as AssignmentRow[];
      const courseIds = [...new Set(rows.map((r) => r.course_id))];
      if (courseIds.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }
      const [coursesRes, blocksRes] = await Promise.all([
        supabase.from('courses').select('id, title').in('id', courseIds),
        supabase.from('blocks').select('id, course_id, title, type').in('course_id', courseIds),
      ]);
      const courses = (coursesRes.data ?? []) as CourseRow[];
      const blocks = (blocksRes.data ?? []) as BlockRow[];
      const byCourse = new Map<string, BlockRow[]>();
      blocks.forEach((b) => {
        if (!byCourse.has(b.course_id)) byCourse.set(b.course_id, []);
        byCourse.get(b.course_id)!.push(b);
      });
      const result: CourseWithBlocks[] = rows.map((a) => {
        const course = courses.find((c) => c.id === a.course_id);
        const blockList = byCourse.get(a.course_id) ?? [];
        const pct = blockList.length > 0 ? Math.round((a.progress.length / blockList.length) * 100) : 0;
        return {
          course: course ?? { id: a.course_id, title: 'Course' },
          blocks: blockList,
          progress: a.progress,
          progressPct: pct,
        };
      });
      setData(result);
      if (result.length > 0 && expandedId === null) setExpandedId(result[0].course.id);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <main className="page">
      <h1>Learner Dashboard</h1>
      <p style={{ color: '#555', marginBottom: '1.5rem' }}>
        Assigned courses, current block, history, certificates.
      </p>
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/">Home</Link>
      </p>

      {loading ? (
        <p style={{ color: '#666' }}>Loading…</p>
      ) : data.length === 0 ? (
        <p style={{ color: '#666' }}>No courses assigned yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {data.map(({ course, blocks, progress, progressPct }) => (
            <li key={course.id} style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setExpandedId((id) => (id === course.id ? null : course.id))}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  minHeight: 48,
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{expandedId === course.id ? '▼' : '▶'}</span>
                <span style={{ flex: 1 }}>{course.title}</span>
                <span style={{ color: '#666', fontWeight: 400 }}>{progressPct}%</span>
              </button>
              {expandedId === course.id && (
                <ul style={{ listStyle: 'none', padding: '0.5rem 0 0 1rem', margin: 0, borderLeft: '2px solid var(--border)', marginLeft: '0.75rem' }}>
                  {blocks.map((block) => {
                    const completed = progress.includes(block.id);
                    return (
                      <li key={block.id} style={{ marginBottom: '0.5rem' }}>
                        <Link
                          to={`/chat/${block.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: 8,
                            background: completed ? '#E8F5E9' : 'var(--bg)',
                            color: 'var(--text)',
                            textDecoration: 'none',
                            minHeight: 48,
                          }}
                        >
                          {completed ? <span aria-hidden>✓</span> : null}
                          <span>{block.title ?? block.id}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
