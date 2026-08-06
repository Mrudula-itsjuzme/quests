import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { playTap } from '../../lib/useSoundEffects';

export function CompassButton({ open, onToggle }) {
  return (
    <motion.button
      type="button"
      className={`world-compass-button ${open ? 'open' : ''}`}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        playTap();
        onToggle();
      }}
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
