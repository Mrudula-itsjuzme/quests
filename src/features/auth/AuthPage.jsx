import { useState, useEffect, useMemo } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { supabaseConfigured } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { AuthParticles } from './AuthParticles';
import { playHover, playTap, playSuccess } from '../../lib/useSoundEffects';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const REMEMBERED_KEY = 'habbit_remembered_email';

function getRememberedEmail() {
  try { return localStorage.getItem(REMEMBERED_KEY) || ''; } catch { return ''; }
}
function setRememberedEmail(email) {
  try { localStorage.setItem(REMEMBERED_KEY, email); } catch { /* ignore */ }
}
function clearRememberedEmail() {
  try { localStorage.removeItem(REMEMBERED_KEY); } catch { /* ignore */ }
}

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score; // 0-4
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['transparent', '#e05a3a', '#e0a03a', '#8bc56c', '#eab552'];

/* ─── animation variants ──────────────────────────────────────────────────── */

const cardVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 0.97 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60, scale: 0.97 }),
};

const fieldStagger = {
  hidden: { opacity: 0, y: 18 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.08 * i, type: 'spring', stiffness: 400, damping: 28 },
  }),
};

/* ─── EyeIcon SVG ─────────────────────────────────────────────────────────── */

function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="auth-eye-icon">
      <motion.path
        d={open
          ? 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z'
          : 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.circle
        cx="12" cy="12"
        r={open ? 3.5 : 0}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        animate={{ r: open ? 3.5 : 0, opacity: open ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
      {!open && (
        <motion.line
          x1="2" y1="2" x2="22" y2="22"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </svg>
  );
}

/* ─── PasswordStrengthMeter ───────────────────────────────────────────────── */

function PasswordStrengthMeter({ strength }) {
  return (
    <div className="auth-strength" aria-label={`Password strength: ${strengthLabels[strength]}`}>
      <div className="auth-strength-bars">
        {[1, 2, 3, 4].map((level) => (
          <motion.div
            key={level}
            className="auth-strength-segment"
            animate={{
              backgroundColor: strength >= level ? strengthColors[strength] : 'rgba(255,255,255,0.06)',
              scaleX: strength >= level ? 1 : 1,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
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


/* ─── Main AuthPage ───────────────────────────────────────────────────────── */

export function AuthPage({ mode }) {
  const { devMode, isAuthenticated, signInWithPassword, signUpWithPassword, enterAsGuest } = useAuth();
  const location = useLocation();
  const isSignUp = mode === 'sign-up';

  // Remembered email
  const remembered = useMemo(() => getRememberedEmail(), []);
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | success
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [direction, setDirection] = useState(0); // for AnimatePresence direction
  const [emailSent, setEmailSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  // Redirect if already authed
  if (isAuthenticated && !devMode) return <Navigate to={location.state?.from || '/app'} replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    playTap();
    setError('');
    setSubmitState('loading');

    try {
      if (!supabaseConfigured) {
        throw new Error('Authentication is not configured. Add Supabase credentials to enable sign in.');
      }
      if (isSignUp) {
        const res = await signUpWithPassword(email, password);
        setRememberedEmail(email);
        playSuccess();
        setSubmitState('success');
        if (!res?.session) {
          setEmailSent(true);
          setResendSeconds(60);
          return;
        }
      } else {
        await signInWithPassword(email, password);
      }

      // Remember email on success
      setRememberedEmail(email);
      playSuccess();
      setSubmitState('success');

      // Let celebration play, then redirect happens via auth state change
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
      setSubmitState('idle');
    }
  };

  // Direction for mode transition
  const switchPath = isSignUp ? '/sign-in' : '/sign-up';
  const handleModeSwitch = () => {
    setDirection(isSignUp ? -1 : 1);
    setError('');
    setPassword('');
    setPasswordTouched(false);
    playTap();
  };

  const isReturning = !isSignUp && remembered && email === remembered;

  if (emailSent) {
    return (
      <main className="auth-shell auth-premium">
        <AuthParticles />
        <motion.div
          className="auth-card-container ornate-panel email-verify-card"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="auth-brand">
            <span className="brand-badge"><Icon name="feather" /></span>
            <h1>Verification Scroll Sent</h1>
            <p>We sent a confirmation link to <strong>{email}</strong>. Open the scroll to activate your sanctuary access.</p>
          </div>
          <div className="email-verify-actions">
            <button
              type="button"
              className="primary-btn"
              disabled={resendSeconds > 0}
              onClick={() => {
                playTap();
                setResendSeconds(60);
                window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'Verification link resent to your email.' }));
              }}
            >
              {resendSeconds > 0 ? `Resend scroll in ${resendSeconds}s` : 'Resend Verification Scroll'}
            </button>
            <Link to="/sign-in" className="secondary-btn-link" onClick={() => { playTap(); setEmailSent(false); }}>
              Return to Sign In ›
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mobile-auth-layout" aria-labelledby="auth-title">
      <motion.div
        key={mode}
        custom={direction}
        variants={cardVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        <div className="mobile-auth-header">
          <h1 id="auth-title">
            {isSignUp ? 'Create your space.' : isReturning ? 'Welcome back.' : 'Enter your space.'}
          </h1>
          <p>
            {isSignUp
              ? 'A personal sanctuary for your quests awaits.'
              : isReturning
                ? 'Your path remembers where you left off.'
                : 'Step into your personal quest archive.'}
          </p>
        </div>

        {submitState === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            role="status"
            style={{ textAlign: 'center', margin: '40px 0' }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
              style={{ display: 'inline-flex', padding: 24, borderRadius: '50%', background: 'var(--quest-gold-soft)', color: 'var(--quest-gold-bright)', marginBottom: 24, fontSize: '2rem' }}
            >
              <Icon name="check" />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ fontSize: '1.8rem', color: 'var(--quest-gold-bright)', marginBottom: 8 }}>
              {isSignUp ? 'Check your email.' : 'Welcome home.'}
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ color: 'var(--quest-muted)', fontSize: '1.1rem' }}>
              {isSignUp
                ? 'Confirm your account from the message we sent, then return to continue.'
                : 'Preparing your sanctuary...'}
            </motion.p>
          </motion.div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <motion.div className="floating-input-group" variants={fieldStagger} initial="hidden" animate="show" custom={0}>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                placeholder=" "
                autoComplete="email"
                onChange={(e) => { setEmail(e.target.value); }}
              />
              <label htmlFor="auth-email">Email address</label>
              {isReturning && (
                <button
                  type="button"
                  onClick={() => { clearRememberedEmail(); setEmail(''); playTap(); }}
                  style={{ position: 'absolute', right: 16, top: 22, background: 'none', border: 'none', color: 'var(--quest-gold-dim)', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Not you?
                </button>
              )}
            </motion.div>

            <motion.div className="floating-input-group" variants={fieldStagger} initial="hidden" animate="show" custom={1}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                placeholder=" "
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                onChange={(e) => { setPassword(e.target.value); }}
                onBlur={() => setPasswordTouched(true)}
              />
              <label htmlFor="auth-password">{isSignUp ? 'Create a passphrase' : 'Passphrase'}</label>
              <button
                type="button"
                onClick={() => { playTap(); setShowPassword((v) => !v); }}
                style={{ position: 'absolute', right: 16, top: 20, background: 'none', border: 'none', color: 'var(--quest-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </motion.div>

            {isSignUp && passwordTouched && password.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <PasswordStrengthMeter strength={passwordStrength} />
              </motion.div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  style={{ color: '#F44336', marginTop: -12, marginBottom: 16, fontSize: '0.9rem' }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div variants={fieldStagger} initial="hidden" animate="show" custom={isSignUp ? 2 : 3}>
              <button
                type="submit"
                className="mobile-auth-submit"
                disabled={submitState === 'loading' || submitState === 'success'}
                onMouseEnter={playHover}
              >
                {submitState === 'loading' ? 'Authenticating...' : isSignUp ? 'Begin Journey' : 'Enter'}
              </button>
            </motion.div>
          </form>
        )}

        <div className="mobile-auth-footer">
          <motion.p variants={fieldStagger} initial="hidden" animate="show" custom={isSignUp ? 3 : 4} style={{ marginBottom: 16 }}>
            <Link to={switchPath} onClick={handleModeSwitch} onMouseEnter={playHover}>
              {isSignUp ? 'Already have a space? Sign in.' : 'New to the path? Create an account.'}
            </Link>
          </motion.p>

          <motion.button
            type="button"
            variants={fieldStagger}
            initial="hidden"
            animate="show"
            custom={isSignUp ? 4 : 5}
            style={{ background: 'none', border: 'none', color: 'var(--quest-muted)', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => { playTap(); enterAsGuest(); }}
            onMouseEnter={playHover}
          >
            Enter as guest for testing
          </motion.button>
        </div>
      </motion.div>

      {!supabaseConfigured && (
        <p style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: 'var(--quest-muted)', fontSize: '0.8rem' }} role="status">
          Local development mode active.
        </p>
      )}
    </main>
  );
}
