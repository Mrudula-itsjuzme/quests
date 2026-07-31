import { AnimatePresence, motion } from 'framer-motion';

export function FloatingXp({ xp, isVisible, onComplete }) {
  if (!isVisible) return null;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      <motion.div
        className="floating-xp-badge"
        initial={{ opacity: 0, y: 0, scale: 0.8 }}
        animate={{ opacity: 1, y: -45, scale: 1.15 }}
        exit={{ opacity: 0, y: -65, scale: 0.9 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="xp-sparkle">✦</span>
        <span>+{xp} XP</span>
      </motion.div>
    </AnimatePresence>
  );
}
