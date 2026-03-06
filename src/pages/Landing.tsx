import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main className="page">
      <section style={{ textAlign: 'center', paddingBlock: '3rem 2rem' }}>
        <h1>Lumen Academy</h1>
        <p style={{ fontSize: '1.125rem', color: '#555', maxWidth: '32ch', margin: '0 auto 1.5rem' }}>
          Teach without stress.
        </p>
        <Link to="/signup">
          <button>Get started</button>
        </Link>
      </section>
    </main>
  );
}
