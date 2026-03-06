import { Link } from 'react-router-dom';

export default function Signup() {
  return (
    <main className="page">
      <h1>Sign up</h1>
      <p style={{ color: '#555' }}>
        Company info, logo, Stripe/invoice, invite trainers.
      </p>
      <p style={{ marginTop: '1rem' }}>
        <Link to="/login">Already have an account? Log in</Link>
      </p>
    </main>
  );
}
