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

import '../../wild-loader.css';

export function FullScreenStatus({
  type = 'loading', // 'loading' | 'error' | 'offline'
  title = 'Opening Camera',
  text = 'Preparing your session...',
  onRetry,
  statusHint
}) {
  const isReduced = useMotionReducedPreference();
  const isError = type === 'error' || type === 'offline';
  const statusIcon = isError ? 'wifi-off' : 'compass';

  return (
    <div className="wild-loader-overlay">
      {/* Dynamic Background */}
      <div className="wild-loader-bg">
        <motion.div 
          className="wild-loader-blob wild-loader-blob-1" 
          animate={isReduced ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="wild-loader-blob wild-loader-blob-2"
          animate={isReduced ? {} : { scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, -90, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        className="wild-loader-content"
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="wild-loader-artifact">
          <motion.div
            className="wild-artifact-ring wild-artifact-ring-1"
            animate={isReduced ? {} : { rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="wild-artifact-ring wild-artifact-ring-2"
            animate={isReduced ? {} : { rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="wild-artifact-ring wild-artifact-ring-3"
            animate={isReduced ? {} : { rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="wild-artifact-core">
            <Icon name={statusIcon} />
          </div>
        </div>

        <div className="wild-loader-text-group">
          <motion.h2 
            className="wild-loader-title"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {title}
          </motion.h2>
          <motion.div 
            className="wild-loader-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <span className={isError ? '' : 'wild-shimmer-text'}>{text}</span>
          </motion.div>
          {statusHint && (
             <motion.div 
               className="wild-loader-hint"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.6 }}
             >
               {statusHint}
             </motion.div>
          )}
        </div>

        {isError && onRetry && (
          <motion.div 
            className="wild-loader-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button className="wild-loader-retry-btn" onClick={onRetry} type="button">
              <span>Retry Connection</span>
              <Icon name="refresh-cw" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
