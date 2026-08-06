import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { playTap } from '../../lib/useSoundEffects';

export function CaptureButton({ onOpen }) {
  return (
    <motion.button
      type="button"
      className="world-capture-button"
      aria-label="Capture a moment"
      whileTap={{ scale: 0.88 }}
      animate={{ boxShadow: ['0 0 0 0 rgba(212,180,132,0.35)', '0 0 0 10px rgba(212,180,132,0)'] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
      onClick={() => {
        playTap();
        onOpen();
      }}
    >
      <Icon name="camera" />
    </motion.button>
  );
}
