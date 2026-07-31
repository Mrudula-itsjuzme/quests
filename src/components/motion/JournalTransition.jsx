import { motion } from 'framer-motion';
import { journalPageTurn } from './MotionVariants';

export function JournalTransition({ children, className = '' }) {
  return (
    <motion.div
      className={`journal-page-transition ${className}`}
      variants={journalPageTurn}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ perspective: 1200, transformStyle: 'preserve-3d', width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
