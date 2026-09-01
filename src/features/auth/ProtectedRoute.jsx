import { Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Icon } from '../../components/Icon';
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
  title = 'Opening Camera',
  text = 'Preparing your session...',
  onRetry,
  statusHint
}) {
  const isReduced = useMotionReducedPreference();
  const isError = type === 'error' || type === 'offline';
  const statusIcon = isError ? 'wifi-off' : 'camera';

  return (
    <div className={`fullscreen-ambient-loader app-status-screen ${isError ? 'state-error' : 'state-loading'}`} role="status" aria-live="polite">
      <div className="app-status-backdrop" aria-hidden="true" />
      <motion.div
        className="ambient-loader-card app-status-card"
        initial={isReduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="ambient-visual-frame app-status-lens">
          <div className="ambient-compass-wrap">
            <motion.div
              className="ambient-compass-ring"
              animate={isReduced || isError ? {} : { scale: [1, 1.08, 1], opacity: [0.4, 0.9, 0.4] }}
              transition={isReduced || isError ? {} : { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            />
            <motion.div
              className="ambient-compass-icon"
              animate={isReduced || isError ? {} : { y: [0, -2, 0] }}
              transition={isReduced || isError ? {} : { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            >
              <Icon name={statusIcon} />
            </motion.div>
          </div>
        </div>

        <div className="ambient-info-section">
          {title && <h2 className="ambient-title-text">{title}</h2>}
          <p className="ambient-subtitle-text">{text}</p>
          {statusHint && <span className="ambient-status-badge">{statusHint}</span>}
        </div>

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
