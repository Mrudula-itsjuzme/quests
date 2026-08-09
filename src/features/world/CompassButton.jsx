import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { springConfig } from '../../components/motion/MotionVariants';

export function CompassButton({ open, onToggle }) {
  return (
    <motion.button
      type="button"
      className={`world-compass-button ${open ? 'open' : ''}`}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={springConfig.tactile}
      onClick={() => {
        playTap();
        onToggle();
      }}
      onMouseEnter={playHover}
    >
      <span className="world-compass-glow" aria-hidden="true" />
      <motion.span
        className="world-compass-icon"
        animate={{ rotate: open ? 135 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <Icon name={open ? 'plus' : 'compass'} />
      </motion.span>
    </motion.button>
  );
}
