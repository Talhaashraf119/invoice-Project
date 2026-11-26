import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { api, saveSession } from '../api';

// One component for both Login and Register
export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (localStorage.getItem('token')) return <Navigate to="/" />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: form });
      saveSession(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="brand"><span className="logo">IF</span> InvoiceFlow</div>
        <h1>Billing made simple for growing businesses.</h1>
        <p>Create professional invoices, manage clients and track payments — all in one secure workspace for your company.</p>
        <ul>
          <li>✓ Separate, private workspace for every company</li>
          <li>✓ Automatic invoice numbering and tax</li>
          <li>✓ Revenue and overdue tracking</li>
        </ul>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <h2>{isRegister ? 'Create your workspace' : 'Sign in'}</h2>
        <p className="muted">{isRegister ? 'Start invoicing in under a minute.' : 'Welcome back! Please enter your details.'}</p>

        {error && <div className="alert">{error}</div>}

        {isRegister && (
          <>
            <label>Company name</label>
            <input name="companyName" value={form.companyName} onChange={change} required />
            <label>Your name</label>
            <input name="name" value={form.name} onChange={change} required />
          </>
        )}
        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={change} required />
        <label>Password</label>
        <input type="password" name="password" value={form.password} onChange={change} required minLength={6} />

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        <p className="muted center">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create one'}</Link>
        </p>
      </form>
    </div>
  );
}
