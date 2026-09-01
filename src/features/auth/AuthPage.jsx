import { useState, useEffect, useMemo } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseConfigured } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { playHover, playTap, playSuccess } from '../../lib/useSoundEffects';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const REMEMBERED_KEY = 'habbit_remembered_email';
function getRememberedEmail() { try { return localStorage.getItem(REMEMBERED_KEY) || ''; } catch { return ''; } }
function setRememberedEmail(email) { try { localStorage.setItem(REMEMBERED_KEY, email); } catch { /* ignore */ } }
function clearRememberedEmail() { try { localStorage.removeItem(REMEMBERED_KEY); } catch { /* ignore */ } }

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['transparent', '#f97316', '#eab308', '#22c55e', '#10b981'];

/* ─── animation variants ──────────────────────────────────────────────────── */
const containerVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 48 : -48, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -48 : 48, scale: 0.98 }),
};
const fieldStagger = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.06 * i, type: 'spring', stiffness: 380, damping: 26 },
  }),
};

/* ─── Eye toggle icon ─────────────────────────────────────────────────────── */
function EyeToggle({ open, onClick }) {
  return (
    <button
      type="button"
      className="auth-eye-btn"
      onClick={onClick}
      aria-label={open ? 'Hide password' : 'Show password'}
    >
      {open ? '👁️' : '🙈'}
    </button>
  );
}

/* ─── Password strength ───────────────────────────────────────────────────── */
function StrengthBar({ strength }) {
  return (
    <div className="auth-strength-row" aria-label={`Password strength: ${strengthLabels[strength]}`}>
      {[1, 2, 3, 4].map((lvl) => (
        <motion.div
          key={lvl}
          className="auth-strength-seg"
          animate={{ backgroundColor: strength >= lvl ? strengthColors[strength] : 'rgba(255,255,255,0.08)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      ))}
      <AnimatePresence mode="wait">
        {strength > 0 && (
          <motion.span
            key={strength}
            className="auth-strength-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{ color: strengthColors[strength] }}
          >
            {strengthLabels[strength]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export function AuthPage({ mode }) {
  const { devMode, isAuthenticated, signInWithPassword, signUpWithPassword, enterAsGuest } = useAuth();
  const location = useLocation();
  const isSignUp = mode === 'sign-up';

  const remembered = useMemo(() => getRememberedEmail(), []);
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // idle|loading|success
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [direction, setDirection] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  if (isAuthenticated && !devMode) return <Navigate to={location.state?.from || '/app'} replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    playTap();
    setError('');
    setSubmitState('loading');
    try {
      if (!supabaseConfigured) throw new Error('Auth is not configured. Add Supabase credentials.');
      if (isSignUp) {
        const res = await signUpWithPassword(email, password);
        setRememberedEmail(email);
        playSuccess();
        setSubmitState('success');
        if (!res?.session) { setEmailSent(true); setResendSeconds(60); return; }
      } else {
        await signInWithPassword(email, password);
      }
      setRememberedEmail(email);
      playSuccess();
      setSubmitState('success');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
      setSubmitState('idle');
    }
  };

  const switchPath = isSignUp ? '/sign-in' : '/sign-up';
  const handleModeSwitch = () => { setDirection(isSignUp ? -1 : 1); setError(''); setPassword(''); setPasswordTouched(false); playTap(); };
  const isReturning = !isSignUp && remembered && email === remembered;

  // Email-sent screen
  if (emailSent) {
    return (
      <main className="auth-shell-v2">
        <div className="auth-ambient-blob auth-blob-1" aria-hidden="true" />
        <div className="auth-ambient-blob auth-blob-2" aria-hidden="true" />
        <motion.div
          className="auth-card-v2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="auth-success-icon" aria-hidden="true">✉️</div>
          <h1>Check your inbox</h1>
          <p>We sent a confirmation link to <strong>{email}</strong>. Tap it to activate your Wild Realm account.</p>
          <button
            type="button"
            className="auth-submit-btn"
            disabled={resendSeconds > 0}
            onClick={() => { playTap(); setResendSeconds(60); }}
          >
            {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend link'}
          </button>
          <Link to="/sign-in" className="auth-link" onClick={() => { playTap(); setEmailSent(false); }}>Back to sign in</Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="auth-shell-v2" aria-labelledby="auth-heading">
      {/* Ambient glow blobs */}
      <div className="auth-ambient-blob auth-blob-1" aria-hidden="true" />
      <div className="auth-ambient-blob auth-blob-2" aria-hidden="true" />

      {/* Back link */}
      <Link to="/" className="auth-back-link" onClick={playTap} aria-label="Back to home">
        ← Wild Realm
      </Link>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={mode}
          custom={direction}
          variants={containerVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          className="auth-card-v2"
        >
          {/* Header */}
          <motion.div variants={fieldStagger} initial="hidden" animate="show" custom={0}>
            <div className="auth-logo-mark" aria-hidden="true">🌿</div>
            <h1 id="auth-heading" className="auth-heading-v2">
              {isSignUp ? 'Create account' : isReturning ? 'Welcome back!' : 'Sign in'}
            </h1>
            <p className="auth-subheading">
              {isSignUp
                ? 'Join Wild Realm and start exploring.'
                : isReturning
                  ? 'Your path continues.'
                  : 'Sign in to your Wild Realm account.'}
            </p>
          </motion.div>

          {submitState === 'success' ? (
            <motion.div
              className="auth-success-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              role="status"
            >
              <div className="auth-success-icon">✅</div>
              <h2>{isSignUp ? 'Account created!' : 'Welcome home!'}</h2>
              <p>{isSignUp ? 'Check your email to confirm, then come back.' : 'Preparing your sanctuary…'}</p>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="auth-form-v2">
              {/* Email */}
              <motion.div className="auth-field-wrap" variants={fieldStagger} initial="hidden" animate="show" custom={1}>
                <label htmlFor="auth-email" className="auth-label">Email</label>
                <div className="auth-input-row">
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="auth-input-v2"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {isReturning && (
                    <button
                      type="button"
                      className="auth-clear-btn"
                      onClick={() => { clearRememberedEmail(); setEmail(''); playTap(); }}
                    >
                      Change
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Password */}
              <motion.div className="auth-field-wrap" variants={fieldStagger} initial="hidden" animate="show" custom={2}>
                <label htmlFor="auth-password" className="auth-label">
                  {isSignUp ? 'Create a password' : 'Password'}
                </label>
                <div className="auth-input-row">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    className="auth-input-v2"
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                  />
                  <EyeToggle open={showPassword} onClick={() => { playTap(); setShowPassword((v) => !v); }} />
                </div>
                {isSignUp && passwordTouched && password.length > 0 && (
                  <StrengthBar strength={passwordStrength} />
                )}
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    role="alert"
                    className="auth-error-msg"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div variants={fieldStagger} initial="hidden" animate="show" custom={3}>
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={submitState === 'loading' || submitState === 'success'}
                  onMouseEnter={playHover}
                >
                  {submitState === 'loading' ? 'Signing in…' : isSignUp ? 'Create account' : 'Sign in'}
                </button>
              </motion.div>
            </form>
          )}

          {/* Footer links */}
          <motion.div className="auth-footer-links" variants={fieldStagger} initial="hidden" animate="show" custom={4}>
            <Link to={switchPath} onClick={handleModeSwitch} className="auth-link" onMouseEnter={playHover}>
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Link>
            <button
              type="button"
              className="auth-guest-btn"
              onClick={() => { playTap(); enterAsGuest(); }}
              onMouseEnter={playHover}
            >
              Continue as guest
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {!supabaseConfigured && (
        <p className="auth-dev-badge" role="status">Local dev mode</p>
      )}
    </main>
  );
}
