import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { AnimatedCounter } from '../../components/motion/AnimatedCounter';
import { playTap } from '../../lib/useSoundEffects';

export function WorldHud({ me, rankProgress, energy, gold, gems, onOpenNotifications }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, rankProgress)));

  return (
    <>
      <div className="world-hud world-hud-left">
        <div className="world-hud-avatar">
          <svg viewBox="0 0 44 44" className="world-xp-ring" aria-hidden="true">
            <circle cx="22" cy="22" r={radius} className="world-xp-ring-track" />
            <motion.circle
              cx="22"
              cy="22"
              r={radius}
              className="world-xp-ring-fill"
              strokeDasharray={circumference}
              initial={false}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <span className="world-hud-avatar-face">{(me?.displayName || 'S')[0].toUpperCase()}</span>
          <span className="world-hud-level">{me?.level ?? 1}</span>
        </div>
      </div>

      <div className="world-hud world-hud-right">
        <div className="world-hud-pill" title="Energy">
          <Icon name="bolt" />
          <span><AnimatedCounter value={energy.value} duration={0.5} />/{energy.max}</span>
        </div>
        <div className="world-hud-pill" title="Gold">
          <Icon name="coin" />
          <span><AnimatedCounter value={gold} duration={0.5} /></span>
        </div>
        <div className="world-hud-pill" title="Gems">
          <Icon name="gem" />
          <span><AnimatedCounter value={gems} duration={0.5} /></span>
        </div>
        <button
          type="button"
          className="world-hud-bell"
          aria-label="Notifications"
          onClick={() => { playTap(); onOpenNotifications(); }}
        >
          <Icon name="bell" />
        </button>
      </div>
    </>
  );
}
