import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NyxCat } from '../../components/NyxCat';
import { useAuth } from './AuthContext';
import { playHover, playTap } from '../../lib/useSoundEffects';

export function LandingPage() {
  const { isAuthenticated, enterAsGuest } = useAuth();
  if (isAuthenticated) return <Navigate to="/app" replace />;

  return (
    <main className="landing-shell">
      <motion.section
        className="landing-hero"
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        <div className="landing-nyx"><NyxCat small /></div>
        <span className="brand-mark" aria-hidden="true">Q</span>
        <h1>HABBIT QUESTS</h1>
        <p>An enchanted personal archive for daily and weekly wellness quests. Earn XP, build streaks, and fill your journal with collectibles as you grow.</p>
        <div className="landing-actions">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link className="primary-action" to="/sign-up" onClick={playTap} onMouseEnter={playHover}>Open your journal</Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link className="ghost-action" to="/sign-in" onClick={playTap} onMouseEnter={playHover}>Sign in</Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              type="button"
              className="ghost-action guest-action-btn"
              onClick={() => {
                playTap();
                enterAsGuest();
              }}
              onMouseEnter={playHover}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Enter as Guest <span>›</span>
            </button>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}
