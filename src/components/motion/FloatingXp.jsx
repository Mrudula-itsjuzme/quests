import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMotionReducedPreference } from '../../lib/useMotionPreference';

export function FloatingXp({ xp, isVisible, onComplete }) {
  const systemReduced = useReducedMotion();
  const calm = useMotionReducedPreference();
  const reduced = systemReduced || calm;
  const complete = useRef(onComplete);
  useEffect(() => { complete.current = onComplete; }, [onComplete]);
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => complete.current?.(), 1200);
    return () => clearTimeout(timer);
  }, [isVisible, xp]);

  return (
    <AnimatePresence>
      {isVisible && <motion.div
        className="floating-xp-badge"
        role="status"
        initial={reduced ? false : { opacity: 0, y: 0, scale: 0.8 }}
        animate={{ opacity: 1, y: reduced ? 0 : -45, scale: reduced ? 1 : 1.15 }}
        exit={{ opacity: 0, y: reduced ? 0 : -65, scale: reduced ? 1 : 0.9 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="xp-sparkle">✦</span>
        <span>+{xp} XP</span>
      </motion.div>}
    </AnimatePresence>
  );
}
