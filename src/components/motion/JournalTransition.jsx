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
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
