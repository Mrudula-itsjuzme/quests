import { useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { supabaseConfigured } from '../../lib/supabase';
import { useAuth } from './AuthContext';

export function AuthPage({ mode }) {
  const { isAuthenticated, signInWithPassword, signUpWithPassword } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  if (isAuthenticated) return <Navigate to={location.state?.from || '/app'} replace />;

  if (!supabaseConfigured) {
    return (
      <main className="auth-shell">
        <section className="panel auth-card">
          <h1>Development mode</h1>
          <p className="dev-auth-banner">
            Supabase credentials are not configured. You are using a local development identity — this is not a real
            account and must never be used in production.
          </p>
        </section>
      </main>
    );
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'sign-up') {
        await signUpWithPassword(email, password);
        setConfirmationSent(true);
      } else {
        await signInWithPassword(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="panel auth-card">
        <h1>{mode === 'sign-up' ? 'Create your account' : 'Welcome back'}</h1>
        {confirmationSent ? (
          <p role="status">Check your email to confirm your account, then sign in.</p>
        ) : (
          <form onSubmit={onSubmit} className="auth-form">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            />
            {error && <p role="alert" className="form-error">{error}</p>}
            <button type="submit" className="primary-action" disabled={submitting}>
              {submitting ? 'Please wait...' : mode === 'sign-up' ? 'Sign up' : 'Sign in'}
            </button>
          </form>
        )}
        <p className="auth-switch">
          {mode === 'sign-up' ? (
            <>Already have an account? <Link to="/sign-in">Sign in</Link></>
          ) : (
            <>New here? <Link to="/sign-up">Create an account</Link></>
          )}
        </p>
      </section>
    </main>
  );
}
