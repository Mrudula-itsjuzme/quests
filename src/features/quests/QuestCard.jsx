import { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Icon, categoryColors, categoryIcon } from '../../components/Icon';
import { playHover, playTap } from '../../lib/useSoundEffects';
import { FloatingXp } from '../../components/motion/FloatingXp';
import { springConfig } from '../../components/motion/MotionVariants';

export function ProgressBar({ value, label, compact = false }) {
  const percentage = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={`progress-wrap ${compact ? 'compact' : ''}`}>
      {label && <span>{label}</span>}
      <div className="progress-bar" aria-hidden="true">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      </div>
    </div>
  );
}

export function questProgressRatio(quest) {
  if (!quest.targetValue) return 0;
  return quest.progressValue / quest.targetValue;
}

export function questStatusLabel(quest) {
  switch (quest.status) {
    case 'completed': return 'Completed';
    case 'pending_verification': return 'Awaiting review';
    case 'rejected': return 'Needs another attempt';
    case 'abandoned': return 'Abandoned';
    case 'expired': return 'Expired';
    case 'active': return 'In progress';
    default: return quest.status;
  }
}

export function QuestRow({ quest, selected, onSelect }) {
  const ratio = questProgressRatio(quest);
  const isCompleted = quest.status === 'completed';
  const [showFloatingXp, setShowFloatingXp] = useState(false);

  // 3D subtle tilt effect for desktop mouse movement
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-50, 50], [4, -4]), { stiffness: 400, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-150, 150], [-4, 4]), { stiffness: 400, damping: 30 });

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div style={{ position: 'relative' }}>
      <FloatingXp
        xp={quest.xpReward}
        isVisible={showFloatingXp}
        onComplete={() => setShowFloatingXp(false)}
      />
      <motion.button
        type="button"
        className={`quest-row ${selected ? 'selected' : ''} ${isCompleted ? 'is-completed' : ''} ${categoryColors[quest.category] || ''}`}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.018, y: -2, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={springConfig.tactile}
        onClick={() => {
          playTap();
          if (isCompleted) setShowFloatingXp(true);
          onSelect(quest.id);
        }}
        onMouseEnter={playHover}
      >
        <span className="quest-glyph" aria-hidden="true">
          {isCompleted ? (
            <motion.span
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={springConfig.snappy}
            >
              ✓
            </motion.span>
          ) : (
            <Icon name={categoryIcon(quest.category)} />
          )}
        </span>
        <span className="quest-row-copy">
          <strong>{quest.title}</strong>
          <small>{quest.description}</small>
        </span>
        <span className="xp-pill">XP {quest.xpReward}</span>
        <span className="quest-target">
          {quest.progressValue}/{quest.targetValue} {quest.unit}
        </span>
        <ProgressBar value={ratio} compact />
      </motion.button>
    </div>
  );
}
