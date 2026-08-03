import { motion } from 'framer-motion';
import { Icon } from '../Icon';
import { AnimatedCounter } from './AnimatedCounter';
import { playSuccess, playTap } from '../../lib/useSoundEffects';
import { useEffect } from 'react';

export function QuestSuccessModal({ quest, onClose }) {
  useEffect(() => {
    playSuccess();
  }, []);

  const xp = Number(quest?.xp ?? quest?.xpReward ?? 0);
  const bonusXp = Number(quest?.bonusXp ?? 0);
  const particles = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    x: ((index % 6) - 2.5) * 58,
    y: -70 - Math.floor(index / 6) * 52 - (index % 2) * 24,
    scale: 0.5 + (index % 4) * 0.16,
  }));

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
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="sparkle-particle"
            initial={{ opacity: 1, x: 0, y: 0, scale: particle.scale }}
            animate={{
              opacity: 0,
              x: particle.x,
              y: particle.y,
              scale: 0,
            }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: particle.id * 0.04 }}
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
        <h2>{quest?.title || 'Quest complete'}</h2>
        {quest?.description && <p className="celebration-desc">{quest.description}</p>}

        <div className="reward-badge-container">
          <div className="reward-badge">
            <Icon name="shield" />
            <span>+<AnimatedCounter value={xp} /> XP</span>
          </div>
          {bonusXp > 0 && (
            <div className="reward-badge gold-badge">
              <Icon name="star" />
              <span>+<AnimatedCounter value={bonusXp} /> Bonus XP</span>
            </div>
          )}
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
