import { motion } from 'framer-motion';
import { Icon } from '../Icon';
import { AnimatedCounter } from './AnimatedCounter';
import { playSuccess, playTap } from '../../lib/useSoundEffects';
import { useEffect } from 'react';

export function QuestSuccessModal({ quest, onClose }) {
  useEffect(() => {
    playSuccess();
  }, []);

  return (
    <motion.div
      className="modal-overlay celebration-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Quest Completed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="celebration-particles">
        {[...Array(12)].map((_, i) => (
          <motion.span
            key={i}
            className="sparkle-particle"
            initial={{ opacity: 1, x: 0, y: 0, scale: Math.random() * 0.8 + 0.4 }}
            animate={{
              opacity: 0,
              x: (Math.random() - 0.5) * 360,
              y: (Math.random() - 0.5) * 360 - 80,
              scale: 0,
            }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: i * 0.04 }}
          />
        ))}
      </div>

      <motion.div
        className="celebration-card ornate-panel"
        initial={{ scale: 0.8, y: 30, rotate: -2 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.8, y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 26 }}
      >
        <div className="celebration-emblem">
          <Icon name="sun" />
        </div>
        <p className="eyebrow">QUEST ACCOMPLISHED</p>
        <h2>{quest?.title || 'Milestone Reached'}</h2>
        <p className="celebration-desc">{quest?.description || 'Your dedication leaves a mark on your adventure journal.'}</p>

        <div className="reward-badge-container">
          <div className="reward-badge">
            <Icon name="shield" />
            <span>+<AnimatedCounter value={quest?.xpReward || 150} /> XP</span>
          </div>
          <div className="reward-badge gold-badge">
            <Icon name="star" />
            <span>+<AnimatedCounter value={quest?.goldReward || 10} /> Gold</span>
          </div>
        </div>

        <button
          type="button"
          className="primary-btn continue-btn"
          onClick={() => { playTap(); onClose(); }}
        >
          Claim & Continue Path ›
        </button>
      </motion.div>
    </motion.div>
  );
}
