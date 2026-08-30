import { Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Icon } from '../../components/Icon';
import { NyxCat } from '../../components/NyxCat';
import { useMotionReducedPreference } from '../../lib/useMotionPreference';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <FullScreenStatus
        type="loading"
        title="Opening Gates"
        text="Accessing your Wild Realm sanctuary..."
      />
    );
  }
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  return <Outlet />;
}

export function FullScreenStatus({
  type = 'loading', // 'loading' | 'error' | 'offline'
  title = 'Sanctuary Load',
  text = 'Preparing your sanctuary...',
  onRetry,
  statusHint
}) {
  const isReduced = useMotionReducedPreference();
  const isError = type === 'error' || type === 'offline';

  // Choose the visual theme icon
  const statusIcon = isError ? 'shield' : 'compass';

  return (
    <div className={`fullscreen-ambient-loader ${isError ? 'state-error' : 'state-loading'}`} role="status" aria-live="polite">
      {/* Background ambient lighting */}
      <div className="ambient-glow-orb" />
      <div className="ambient-celestial-dust" />

      <motion.div
        className="ambient-loader-card"
        initial={isReduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Subtle decorative gold details */}
        <div className="card-celestial-borders">
          <span className="border-bracket" />
          <span className="border-line" />
          <span className="border-bracket" />
        </div>

        <div className="ambient-visual-frame">
          {/* Runic orbital ring */}
          <div className="ambient-compass-wrap">
            <motion.div
              className="ambient-compass-ring"
              animate={isReduced || isError ? {} : { rotate: 360 }}
              transition={isReduced || isError ? {} : { repeat: Infinity, duration: 25, ease: 'linear' }}
            />
            <motion.div
              className="ambient-compass-icon"
              animate={isReduced || isError ? {} : { scale: [1, 1.06, 1] }}
              transition={isReduced || isError ? {} : { repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <Icon name={statusIcon} />
            </motion.div>
          </div>

          {/* Neatly framed mascot */}
          <div className="mascot-avatar-frame">
            <NyxCat small />
          </div>
        </div>

        <div className="ambient-info-section">
          {title && <h2 className="ambient-title-text">{title}</h2>}
          <p className="ambient-subtitle-text">{text}</p>
          {statusHint && <span className="ambient-status-badge">{statusHint}</span>}
        </div>

        {/* Retry trigger */}
        {isError && onRetry && (
          <div className="ambient-action-area">
            <button
              className="ambient-action-btn"
              onClick={onRetry}
              type="button"
            >
              <span>Retry Connection</span>
              <Icon name="compass" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
