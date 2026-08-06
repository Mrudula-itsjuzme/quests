import { motion } from 'framer-motion';
import { NyxCat } from '../../components/NyxCat';

export function PlayerAvatar({ title, initial }) {
  return (
    <div className="world-player" aria-hidden="true">
      {title && (
        <motion.div
          className="world-player-title"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {title}
        </motion.div>
      )}

      <motion.div
        className="world-player-companion"
        animate={{ x: [0, 6, 0], y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      >
        <NyxCat small />
      </motion.div>

      <motion.div
        className="world-player-figure"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="world-player-shadow" />
        <span className="world-player-body">
          <span className="world-player-head">
            <span className="world-player-face">{initial}</span>
          </span>
          <span className="world-player-torso" />
          <span className="world-player-arm left" />
          <span className="world-player-arm right" />
          <span className="world-player-leg left" />
          <span className="world-player-leg right" />
        </span>
      </motion.div>
    </div>
  );
}
