import { motion } from 'framer-motion';
import { Icon, categoryColors, categoryIcon } from '../../components/Icon';
import { playHover, playTap } from '../../lib/useSoundEffects';

export function ProgressBar({ value, label, compact = false }) {
  const percentage = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={`progress-wrap ${compact ? 'compact' : ''}`}>
      {label && <span>{label}</span>}
      <div className="progress-bar" aria-hidden="true">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
  return (
    <motion.button
      type="button"
      className={`quest-row ${selected ? 'selected' : ''} ${categoryColors[quest.category] || ''}`}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        playTap();
        onSelect(quest.id);
      }}
      onMouseEnter={playHover}
    >
      <span className="quest-glyph" aria-hidden="true">
        <Icon name={categoryIcon(quest.category)} />
      </span>
      <span className="quest-row-copy">
        <strong>{quest.title}</strong>
        <small>{quest.description}</small>
      </span>
      <span className="xp-pill">XP {quest.xpReward}</span>
      <span className="quest-target">{quest.progressValue}/{quest.targetValue} {quest.unit}</span>
      <ProgressBar value={ratio} compact />
    </motion.button>
  );
}
