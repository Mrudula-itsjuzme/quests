import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { playHover, playTap } from '../../lib/useSoundEffects';

export function CaptureButton({ onOpen }) {
  return (
    <motion.button
      type="button"
      className="world-capture-button"
      aria-label="Capture a moment"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88 }}
      animate={{ boxShadow: ['0 0 0 0 rgba(212,180,132,0.35)', '0 0 0 10px rgba(212,180,132,0)'] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
      onClick={() => {
        playTap();
        onOpen();
      }}
      onMouseEnter={playHover}
    >
      <Icon name="camera" />
    </motion.button>
  );
}
