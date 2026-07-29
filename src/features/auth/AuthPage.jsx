import { useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { supabaseConfigured } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { playHover, playTap } from '../../lib/useSoundEffects';

export function AuthPage({ mode }) {
  const { devMode, isAuthenticated, signInWithPassword, signUpWithPassword } = useAuth();
  const location = useLocation();
  const isSignUp = mode === 'sign-up';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [portalState, setPortalState] = useState('idle');

  if (isAuthenticated && !devMode) return <Navigate to={location.state?.from || '/app'} replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    playTap();
    setError('');
    setSubmitting(true);
    setPortalState('opening');
    try {
      if (!supabaseConfigured) {
        throw new Error('Authentication is not configured on this environment. Add the Supabase URL and publishable key before signing in.');
      }
      if (isSignUp) {
        await signUpWithPassword(email, password);
        setConfirmationSent(true);
        setPortalState('open');
      } else {
        await signInWithPassword(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setPortalState('idle');
    } finally {
      setSubmitting(false);
    }
  };

  const switchPath = isSignUp ? '/sign-in' : '/sign-up';

  return (
    <main className="auth-shell celestial-auth" data-portal-state={portalState}>
      <motion.section
        className="auth-experience"
        aria-labelledby="auth-title"
        initial={{ opacity: 0, y: 15, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        <div className="auth-portal" aria-hidden="true">
          <img src="/auth-celestial-aperture.png" alt="" />
          <div className="auth-portal-emblem"><Icon name="compass" /></div>
          <p>THE WAYFARER ARCHIVE</p>
        </div>

        <div className="auth-content">
          <Link className="auth-brand" to="/" aria-label="Habbit home" onClick={playTap} onMouseEnter={playHover}>
            <span className="auth-brand-mark"><Icon name="compass" /></span>
            <span>HABBIT</span>
          </Link>

          <div className="auth-copy">
            <p className="auth-kicker"><Icon name="star" /> CELESTIAL GATE <Icon name="star" /></p>
            <h1 id="auth-title">{isSignUp ? 'Begin your legend.' : 'Welcome back, Seeker.'}</h1>
            <p>{isSignUp ? 'Create your sigil and take the first step.' : 'Your path remembers where you left off.'}</p>
          </div>

          {confirmationSent ? (
            <div className="auth-success" role="status">
              <span className="auth-success-icon"><Icon name="check" /></span>
              <p className="auth-kicker">THE GATE IS OPEN</p>
              <h2>{isSignUp ? 'Check your email.' : 'Welcome home.'}</h2>
              <p>
                Confirm your account from the message we sent, then return to continue.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="auth-form celestial-form">
              <div className="auth-field">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="seeker@example.com" />
              </div>
              <div className="auth-field">
                <label htmlFor="password">Passphrase</label>
                <div className="auth-password">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="At least 8 characters"
                  />
                  <button type="button" onClick={() => { playTap(); setShowPassword((visible) => !visible); }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {!isSignUp && <button className="auth-forgot" type="button" onClick={() => { playTap(); setError('Password recovery is available when Supabase authentication is configured.'); }}>Forgot passphrase?</button>}
              {error && <p role="alert" className="form-error">{error}</p>}
              <motion.button
                type="submit"
                className="auth-submit"
                disabled={submitting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onMouseEnter={playHover}
              >
                <span>{submitting ? 'Aligning the stars…' : isSignUp ? 'Create my sigil' : 'Enter the archive'}</span>
                <Icon name={submitting ? 'star' : 'compass'} />
              </motion.button>
            </form>
          )}

          <p className="auth-switch">
            {isSignUp ? 'Already carry a sigil?' : 'New to the path?'}{' '}
            <Link to={switchPath} onClick={playTap} onMouseEnter={playHover}>{isSignUp ? 'Sign in' : 'Create an account'}</Link>
          </p>
          {!supabaseConfigured && <p className="auth-config-note" role="status">Local development identity is active. Configure Supabase environment variables to enable real account access.</p>}
        </div>
      </motion.section>
    </main>
  );
}
