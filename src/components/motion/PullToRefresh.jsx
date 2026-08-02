import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { Icon } from '../Icon';
import { useQueryClient } from '@tanstack/react-query';
import { playTap } from '../../lib/useSoundEffects';

const THRESHOLD = 80;

export function PullToRefresh({ children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const controls = useAnimation();
  const y = useMotionValue(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const dy = currentY - startY;

      if (dy > 0 && container.scrollTop === 0) {
        // Prevent default browser refresh
        if (e.cancelable) e.preventDefault();
        // Add friction
        y.set(dy * 0.4);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return;
      isPulling = false;
      const currentY = y.get();

      if (currentY > THRESHOLD) {
        setIsRefreshing(true);
        playTap();
        controls.start({ y: 50, transition: { type: 'spring', stiffness: 400, damping: 25 } });
        
        // Invalidate all queries
        await queryClient.invalidateQueries();
        
        // Hold the loading state for at least 600ms for UX
        await new Promise(r => setTimeout(r, 600));
        
        setIsRefreshing(false);
        controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        y.set(0);
      } else {
        controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        y.set(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [controls, isRefreshing, queryClient, y]);

  return (
    <div className="ptr-container" ref={containerRef} style={{ overflowY: 'auto', height: '100%' }}>
      <div className="ptr-indicator">
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : 0 }}
          transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: 'linear' }}
        >
          <Icon name="refresh-cw" />
        </motion.div>
      </div>
      <motion.div animate={controls} style={{ y, minHeight: '100%' }}>
        {children}
      </motion.div>
    </div>
  );
}
