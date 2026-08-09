import { motion } from 'framer-motion';
import { NyxCat } from '../../components/NyxCat';

export function PlayerAvatar({ title }) {
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
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="world-player-shadow" />
        <svg className="world-player-svg" viewBox="0 0 60 96" aria-hidden="true">
          <ellipse className="player-cloak-glow" cx="30" cy="58" rx="24" ry="28" />
          <path
            className="player-cloak"
            d="M30 24
               C21 24 15 30 13 40
               C11 50 8 66 6 86
               C6 90 9 92 12 90
               C15 78 18 62 20 50
               C19 68 18 82 17 90
               C17 93 21 94 23 92
               C25 80 27 62 30 46
               C33 62 35 80 37 92
               C39 94 43 93 43 90
               C42 82 41 68 40 50
               C42 62 45 78 48 90
               C51 92 54 90 54 86
               C52 66 49 50 47 40
               C45 30 39 24 30 24 Z"
          />
          <circle className="player-head" cx="30" cy="14" r="12" />
          <path className="player-hood" d="M18 15 C18 6 42 6 42 15 C42 10 18 10 18 15 Z" />
        </svg>
      </motion.div>
    </div>
  );
}
