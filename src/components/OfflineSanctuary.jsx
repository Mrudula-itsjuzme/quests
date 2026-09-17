import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './Icon';

export function OfflineSanctuary() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsOffline(!navigator.onLine);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          className="offline-sanctuary-bar"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        >
          <div className="offline-sanctuary-content">
            <Icon name="feather" />
            <span>Journal Offline Mode — You can continue exploring your active path and cached entries.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
