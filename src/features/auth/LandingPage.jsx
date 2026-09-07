import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { MapPin, MoveRight } from 'lucide-react';
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
        src="/assets/wild-realm-startup-hero.png"
        alt=""
        aria-hidden="true"
        initial={{ scale: 1.08 }}
        animate={{ scale: [1.08, 1.015, 1.04] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <div className="landing-cinematic-shade" aria-hidden="true" />

      <motion.div
        className="landing-hotspot-preview"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.7, y: 12 }}
        animate={{ opacity: 1, scale: [1, 1.05, 1], y: 0 }}
        transition={{ opacity: { delay: 0.7 }, scale: { delay: 1.2, duration: 2.8, repeat: Infinity }, y: { delay: 0.7 } }}
      >
        <MapPin />
        <span><strong>Scenic overlook</strong><small>1.2 km nearby</small></span>
      </motion.div>

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
          <h1>
            Find the places<br />
            <span className="landing-hero-gradient">worth going.</span>
          </h1>
          <p>
            Discover beautiful places nearby and turn every outing into a lasting memory.
          </p>
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
            to="/sign-up"
            onClick={playTap}
            onMouseEnter={playHover}
          >
            Explore nearby <MoveRight aria-hidden="true" />
          </Link>
          <div className="landing-secondary-actions">
            <Link to="/sign-in" onClick={playTap} onMouseEnter={playHover}>Sign in</Link>
            <span aria-hidden="true" />
            <button type="button" onClick={() => { playTap(); enterAsGuest(); }} onMouseEnter={playHover}>Continue as guest</button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
