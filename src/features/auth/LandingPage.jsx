import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { playHover, playTap } from '../../lib/useSoundEffects';

const fadeUp = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 340, damping: 26 },
  }),
};

const FEATURES = [
  { icon: '📸', label: 'Snap & Classify', desc: 'AI identifies what you capture instantly' },
  { icon: '⭐', label: 'Earn Rarity Ranks', desc: 'S → D grades — some finds are ultra-rare' },
  { icon: '🗺️', label: 'Explore Hotspots', desc: 'World map of discoveries near you' },
  { icon: '🤝', label: 'Share & Connect', desc: 'Post to community, follow fellow explorers' },
];

export function LandingPage() {
  const { isAuthenticated, enterAsGuest } = useAuth();
  if (isAuthenticated) return <Navigate to="/app" replace />;

  return (
    <main className="landing-v2">
      {/* Ambient background blobs */}
      <div className="landing-blob landing-blob-1" aria-hidden="true" />
      <div className="landing-blob landing-blob-2" aria-hidden="true" />

      <div className="landing-v2-inner">
        {/* Logo mark */}
        <motion.div
          className="landing-logo-wrap"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
        >
          <div className="landing-logo-icon" aria-hidden="true">🌿</div>
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
            Snap nature.<br />
            <span className="landing-hero-gradient">Discover its rarity.</span>
          </h1>
          <p>
            Point, shoot, and let AI classify every living thing you find.
            Earn XP, fill your collection, and share with explorers worldwide.
          </p>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          className="landing-features"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
        >
          {FEATURES.map((f) => (
            <div key={f.label} className="landing-feature-chip">
              <span className="landing-feature-icon">{f.icon}</span>
              <div>
                <strong>{f.label}</strong>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
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
            <span>🌿</span> Start Exploring
          </Link>
          <Link
            className="landing-cta-secondary"
            to="/sign-in"
            onClick={playTap}
            onMouseEnter={playHover}
          >
            Sign in
          </Link>
          <button
            type="button"
            className="landing-cta-ghost"
            onClick={() => { playTap(); enterAsGuest(); }}
            onMouseEnter={playHover}
          >
            Try as guest
          </button>
        </motion.div>
      </div>
    </main>
  );
}
