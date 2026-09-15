import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { MoveRight } from 'lucide-react';
import { Icon } from '../../components/Icon';

const fadeUp = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 340, damping: 26 },
  }),
};

export function LandingPage() {
  const { isAuthenticated, enterAsGuest } = useAuth();
  if (isAuthenticated) return <Navigate to="/app" replace />;

  return (
    <main className="landing-v2">
      <motion.img
        className="landing-cinematic-bg"
        src="/assets/reference-splash.png"
        alt=""
        aria-hidden="true"
        initial={{ scale: 1.08 }}
        animate={{ scale: [1.08, 1.015, 1.04] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <div className="landing-cinematic-shade" aria-hidden="true" />

      <div className="landing-v2-inner">
        {/* Logo mark */}
        <motion.div
          className="landing-logo-wrap"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
        >
          <div className="landing-logo-icon" aria-hidden="true"><Icon name="leaf" /></div>
          <span className="landing-logo-text">Wild Realm</span>
        </motion.div>

        {/* Hero text */}
        <motion.div
          className="landing-hero-copy"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
        >
          <h1>Wild Realm</h1>
          <p>Explore. Capture. Belong.</p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="landing-cta-group"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
        >
          <Link
            className="landing-cta-primary"
            to="/welcome"
            onClick={playTap}
            onMouseEnter={playHover}
          >
            Start exploring <MoveRight aria-hidden="true" />
          </Link>
          <div className="landing-secondary-actions">
            <Link to="/sign-in" onClick={playTap} onMouseEnter={playHover}>Sign in</Link>
            <span aria-hidden="true" />
            <button type="button" onClick={() => { playTap(); enterAsGuest(); }} onMouseEnter={playHover}>Continue as guest</button>
          </div>
        </motion.div>
      </div>
      <p className="landing-motto">Nature connects us all.</p>
    </main>
  );
}
