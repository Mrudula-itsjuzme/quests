import { Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Icon } from '../../components/Icon';
import { NyxCat } from '../../components/NyxCat';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullScreenStatus text="Opening your sanctuary..." />;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  return <Outlet />;
}

export function FullScreenStatus({ text = 'Preparing your sanctuary...' }) {
  return (
    <div className="fullscreen-ambient-loader" role="status" aria-live="polite">
      {/* Background radial glow */}
      <div className="ambient-glow-orb" />

      <motion.div
        className="ambient-loader-content"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="ambient-compass-wrap">
          <motion.div
            className="ambient-compass-ring"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          />
          <motion.div
            className="ambient-compass-icon"
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <Icon name="compass" />
          </motion.div>
        </div>

        <NyxCat small />

        <motion.p
          className="ambient-loader-text"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {text}
        </motion.p>
      </motion.div>
    </div>
  );
}
