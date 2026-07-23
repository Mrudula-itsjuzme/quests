import { Icon, categoryColors, categoryIcon } from '../../components/Icon';

export function ProgressBar({ value, label, compact = false }) {
  return (
    <div className={`progress-wrap ${compact ? 'compact' : ''}`}>
      {label && <span>{label}</span>}
      <div className="progress-bar" aria-hidden="true">
        <div style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
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
    <button
      type="button"
      className={`quest-row ${selected ? 'selected' : ''} ${categoryColors[quest.category] || ''}`}
      onClick={() => onSelect(quest.id)}
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
    </button>
  );
}
